# Estado de desarrollo

Última actualización: 2026-11-17

## Resumen

El repositorio comienza desde cero con una estructura Android mínima, modelos de dominio y backend inicial. No debe presentarse como producto completo, listo para producción o listo para publicar.

## Etapas

| Etapa | Estado | Nota |
|---|---|---|
| 1. Revisión, estructura y compilación | Parcial | Proyecto creado desde cero; no había Starter entregado para inspeccionar. No se pudo ejecutar Gradle desde esta sesión. |
| 2. Auth, familias, perfiles y seguridad | Parcial | Funciones backend de crear familia, perfil infantil e invitación temporal; app Android aún sin Auth. Reglas Firestore cerradas por defecto. |
| 3. Sincronización en tiempo real | Pendiente | Sin listeners Android ni manejo de caché/conectividad. |
| 4. Tareas, entregas y aprobaciones | Parcial | Callable Functions y transacción de aprobación con ledger idempotente por tarea. Falta UI, evidencia, fechas/repetición y pruebas de emulador. |
| 5. Puntos y créditos | Parcial | Puntos otorgados en aprobación en una transacción; créditos no implementados. |
| 6. IA educativa | Pendiente | Sin proveedor ni clave de IA. |
| 7. Tienda y canjes | Pendiente | Sin implementar. |
| 8. Supervisión Android | Pendiente | Sin permisos ni mecanismos simulados. Limitaciones documentadas. |
| 9. Notificaciones, estadísticas y logros | Pendiente | Sin implementar. |
| 10. Pruebas integrales y APK | Pendiente | No se ejecutó compilación ni pruebas en este entorno. |

## Archivos creados

- Android: Gradle, manifiesto, Activity Compose, tema, modelos y una prueba unitaria de dominio.
- Backend: Firebase Functions TypeScript, reglas Firestore e índices.
- Documentación: README, CHANGELOG y este estado.

## Configuración requerida

- Proyecto Firebase, Authentication, Firestore, Firebase CLI y `app/google-services.json` al implementar cliente Firebase.
- Node/npm para instalar y compilar Functions.
- JDK 17 y Android SDK 35 para compilar app.
- Ningún secreto real está incluido.

## Verificación real

No se ejecutaron pruebas ni compilación porque esta sesión no tiene un entorno de shell/Android/Node. No se afirma que compile o pase pruebas. El siguiente paso obligatorio es compilar `functions/` con Node 20, ejecutar Emulator Suite y correr Gradle en un entorno Android; corregir cualquier error observado.
