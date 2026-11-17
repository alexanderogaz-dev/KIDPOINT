import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createHash, randomBytes } from "node:crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();
const db = getFirestore();
const invitationLifetimeMs = 15 * 60 * 1000;

function requireUid(request: { auth?: { uid: string } | null }): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  return uid;
}

async function requireParent(uid: string): Promise<{ familyId: string }> {
  const user = await db.doc(`users/${uid}`).get();
  const data = user.data();
  if (!user.exists || data?.role !== "PARENT" || typeof data.familyId !== "string") {
    throw new HttpsError("permission-denied", "Se requiere un perfil de tutor vinculado a una familia.");
  }
  return { familyId: data.familyId };
}

export const createFamily = onCall(async (request) => {
  const uid = requireUid(request);
  const userRef = db.doc(`users/${uid}`);
  const familyRef = db.collection("families").doc();
  await db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    if (user.exists && user.data()?.familyId) throw new HttpsError("already-exists", "La cuenta ya pertenece a una familia.");
    tx.create(familyRef, {
      name: "Mi familia",
      countryCode: "CL",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid,
    });
    tx.set(familyRef.collection("members").doc(uid), { uid, role: "PARENT", joinedAt: FieldValue.serverTimestamp() });
    tx.set(userRef, { familyId: familyRef.id, role: "PARENT", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { familyId: familyRef.id };
});

export const createChildInvite = onCall(async (request) => {
  const uid = requireUid(request);
  const { familyId } = await requireParent(uid);
  const displayName = request.data?.displayName;
  const age = request.data?.age;
  if (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.length > 40) {
    throw new HttpsError("invalid-argument", "Nombre de perfil no válido.");
  }
  if (!Number.isInteger(age) || age < 3 || age > 18) throw new HttpsError("invalid-argument", "Edad no válida.");

  const childRef = db.collection(`families/${familyId}/children`).doc();
  const rawCode = randomBytes(24).toString("base64url");
  const codeHash = createHash("sha256").update(rawCode).digest("hex");
  const expiresAt = new Date(Date.now() + invitationLifetimeMs);
  await db.runTransaction(async (tx) => {
    tx.create(childRef, {
      displayName: displayName.trim(), age, countryCode: "CL", linkedUid: null,
      points: 0, credits: 0, createdAt: FieldValue.serverTimestamp(), createdBy: uid,
    });
    tx.create(db.doc(`childInvites/${codeHash}`), {
      familyId, childId: childRef.id, createdBy: uid, expiresAt,
      used: false, createdAt: FieldValue.serverTimestamp(),
    });
  });
  // Show this code once, share it only with the intended child/device.
  return { childId: childRef.id, inviteCode: rawCode, expiresAt: expiresAt.toISOString() };
});

export const joinAsChild = onCall(async (request) => {
  const uid = requireUid(request);
  const code = request.data?.inviteCode;
  if (typeof code !== "string" || code.length < 20 || code.length > 80) {
    throw new HttpsError("invalid-argument", "Código de invitación no válido.");
  }
  const hash = createHash("sha256").update(code).digest("hex");
  const inviteRef = db.doc(`childInvites/${hash}`);
  const userRef = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const [invite, user] = await Promise.all([tx.get(inviteRef), tx.get(userRef)]);
    const info = invite.data();
    if (!invite.exists || info?.used || !(info?.expiresAt instanceof Date) || info.expiresAt.getTime() <= Date.now()) {
      throw new HttpsError("permission-denied", "La invitación expiró o ya fue utilizada.");
    }
    if (user.exists && user.data()?.familyId) throw new HttpsError("already-exists", "La cuenta ya está vinculada.");
    const childRef = db.doc(`families/${info.familyId}/children/${info.childId}`);
    const child = await tx.get(childRef);
    if (!child.exists || child.data()?.linkedUid) throw new HttpsError("already-exists", "Este perfil ya está vinculado.");
    tx.update(inviteRef, { used: true, usedBy: uid, usedAt: FieldValue.serverTimestamp() });
    tx.update(childRef, { linkedUid: uid, linkedAt: FieldValue.serverTimestamp() });
    tx.set(userRef, { familyId: info.familyId, role: "CHILD", childId: info.childId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(db.doc(`families/${info.familyId}/members/${uid}`), { uid, role: "CHILD", childId: info.childId, joinedAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});

export const createTask = onCall(async (request) => {
  const uid = requireUid(request);
  const { familyId } = await requireParent(uid);
  const { childId, title, description = "", category, points } = request.data ?? {};
  if (typeof childId !== "string" || typeof title !== "string" || title.trim().length < 1 || title.length > 100) {
    throw new HttpsError("invalid-argument", "Datos de tarea no válidos.");
  }
  if (!Number.isInteger(points) || points < 0 || points > 1000) throw new HttpsError("invalid-argument", "Puntaje no válido.");
  if (!["HOME", "SCHOOL", "PERSONAL"].includes(category)) throw new HttpsError("invalid-argument", "Categoría no válida.");
  const childRef = db.doc(`families/${familyId}/children/${childId}`);
  const child = await childRef.get();
  if (!child.exists) throw new HttpsError("not-found", "No se encontró el perfil infantil.");
  const taskRef = db.collection(`families/${familyId}/tasks`).doc();
  await taskRef.create({
    childId, title: title.trim(), description: typeof description === "string" ? description.slice(0, 1000) : "",
    category, points, status: "PENDING", requiresApproval: true,
    createdBy: uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { taskId: taskRef.id };
});

export const submitTask = onCall(async (request) => {
  const uid = requireUid(request);
  const taskId = request.data?.taskId;
  if (typeof taskId !== "string") throw new HttpsError("invalid-argument", "Falta la tarea.");
  const user = await db.doc(`users/${uid}`).get();
  const info = user.data();
  if (!user.exists || info?.role !== "CHILD" || typeof info.familyId !== "string" || typeof info.childId !== "string") {
    throw new HttpsError("permission-denied", "Solo el perfil infantil vinculado puede entregar tareas.");
  }
  const taskRef = db.doc(`families/${info.familyId}/tasks/${taskId}`);
  await db.runTransaction(async (tx) => {
    const task = await tx.get(taskRef);
    if (!task.exists || task.data()?.childId !== info.childId) throw new HttpsError("not-found", "No se encontró la tarea asignada.");
    if (!["PENDING", "IN_PROGRESS", "REJECTED"].includes(task.data()?.status)) throw new HttpsError("failed-precondition", "La tarea no puede entregarse en su estado actual.");
    tx.update(taskRef, { status: "SUBMITTED", submittedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});

export const approveTask = onCall(async (request) => {
  const uid = requireUid(request);
  const { familyId } = await requireParent(uid);
  const taskId = request.data?.taskId;
  const approved = request.data?.approved;
  const note = request.data?.note;
  if (typeof taskId !== "string" || typeof approved !== "boolean") throw new HttpsError("invalid-argument", "Solicitud no válida.");
  const taskRef = db.doc(`families/${familyId}/tasks/${taskId}`);
  const ledgerRef = db.doc(`families/${familyId}/pointsLedger/task_${taskId}`);
  await db.runTransaction(async (tx) => {
    const task = await tx.get(taskRef);
    if (!task.exists || task.data()?.status !== "SUBMITTED") throw new HttpsError("failed-precondition", "La tarea no está esperando aprobación.");
    const data = task.data()!;
    if (approved) {
      const childRef = db.doc(`families/${familyId}/children/${data.childId}`);
      const child = await tx.get(childRef);
      if (!child.exists) throw new HttpsError("not-found", "No se encontró el perfil infantil.");
      if ((await tx.get(ledgerRef)).exists) throw new HttpsError("already-exists", "Los puntos de esta tarea ya fueron otorgados.");
      const points = data.points as number;
      tx.update(childRef, { points: FieldValue.increment(points), updatedAt: FieldValue.serverTimestamp() });
      tx.create(ledgerRef, { childId: data.childId, taskId, delta: points, reason: "TASK_APPROVED", actorUid: uid, createdAt: FieldValue.serverTimestamp() });
    }
    tx.update(taskRef, {
      status: approved ? "APPROVED" : "REJECTED",
      reviewNote: typeof note === "string" ? note.slice(0, 500) : "",
      reviewedBy: uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
});
