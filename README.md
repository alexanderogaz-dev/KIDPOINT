# KIDPOINT

Aplicación Android para acompañar hábitos, tareas y aprendizaje infantil. El repositorio se inicia con una base Kotlin + Jetpack Compose, reglas cerradas de Firestore y Cloud Functions para flujos familiares y tareas.

> **Estado real:** este es el arranque del producto, no una app completa lista para familias ni para Google Play. No se simulan autenticación, sincronización, puntos en la interfaz ni bloqueo de aplicaciones. Consulta `DEVELOPMENT_STATUS.md` antes de usarlo.

## Requisitos

- Android Studio compatible con Android Gradle Plugin 8.7.3.
- JDK 17.
- Android SDK 35.
- Node.js 20+ y npm para Cloud Functions.
- Firebase CLI para emuladores/despliegue.

## Android

Abre el repositorio en Android Studio y sincroniza Gradle. Para compilar desde terminal con un Gradle instalado: `gradle :app:testDebugUnitTest :app:assembleDebug`.

No se versionan credenciales. Configura Firebase en un proyecto propio y agrega el archivo `app/google-services.json` desde Firebase Console al habilitar la integración Android. El plugin de Google Services aún no se aplica al módulo: se añadirá junto con Auth/Firestore Android y sus pruebas, en la etapa correspondiente. No añadas claves de IA o credenciales de servicio al APK.

## Backend Firebase

1. Crea un proyecto Firebase separado para desarrollo y configura Authentication (proveedor de correo/contraseña), Firestore y Cloud Functions.
2. Instala Firebase CLI, autentícate y selecciona el proyecto con `firebase use --add` (esto crea configuración local; no guardes identificadores sensibles si la política del proyecto lo prohíbe).
3. En `functions/`: ejecuta `npm install`, `npm run build`.
4. Ejecuta Emulator Suite para pruebas antes de desplegar; revisa `firestore.rules` y el proyecto seleccionado.
5. Despliega con `firebase deploy --only functions,firestore:rules,firestore:indexes`.

Las Functions de crear familia, crear perfil/invitación infantil, vincular cuenta infantil, crear/entregar/revisar tarea realizan verificaciones de identidad/rol y operaciones de saldo dentro de transacciones. El código de invitación se devuelve una sola vez, expira en 15 minutos, se almacena como hash y solo se puede usar una vez.

## Privacidad y control parental

El manifiesto no solicita permisos de uso, accesibilidad, administración del dispositivo ni ubicación. Android convencional no ofrece a una app ordinaria bloqueo infalible de otras apps; `UsageStatsManager` requiere autorización explícita en Ajustes y solo aporta estadísticas. Cualquier futuro control más fuerte deberá respetar Play, ser visible, consentido y documentar el modo de aprovisionamiento requerido. No bloquear llamadas de emergencia ni ajustes esenciales.

## Firma y publicación

No se incluyen claves. Para publicación, genera un keystore fuera del repositorio, guarda secretos mediante variables/secretos de CI y configura firma de release localmente. No subas el keystore ni contraseñas. La firma de publicación y revisión de políticas no están completadas.

## Documentación de avance

- `DEVELOPMENT_STATUS.md`: etapas, verificación y limitaciones.
- `CHANGELOG.md`: cambios por versión.
