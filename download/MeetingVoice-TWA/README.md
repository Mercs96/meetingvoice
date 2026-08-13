# MeetingVoice — TWA Android

Proyecto **Android Studio** que empaqueta la PWA de MeetingVoice como una **Trusted Web Activity (TWA)**. Esto genera un APK instalable en cualquier Android, sin barra de navegador, con icono nativo y acceso al micrófono.

## Requisitos

- **Android Studio Hedgehog (2023.1.1)** o superior — gratis en https://developer.android.com/studio
- **Java JDK 17** (Android Studio lo instala automáticamente)
- Tu PWA publicada en internet por HTTPS (Vercel, Netlify, etc.)

## Instalación rápida

1. **Abre Android Studio** → "Open" → selecciona esta carpeta `MeetingVoice-TWA/`
2. Espera a que sincronice Gradle (primera vez: ~3-5 min, descarga dependencias)
3. Edita `app/src/main/AndroidManifest.xml` y reemplaza `https://tu-dominio.com` por la URL real de tu PWA (2 sitios: `DEFAULT_URL` y el `intent-filter` deep link)
4. Edita el `host` del deep link (`tu-dominio.com`) por tu dominio real
5. Conecta tu móvil por USB con depuración activada (o usa el emulador)
6. Pulsa el botón ▶️ "Run app" en Android Studio
7. ¡La app se instala y abre en tu móvil!

## Generar APK firmado para distribuir

1. En Android Studio: **Build → Generate Signed App Bundle / APK**
2. Selecciona **APK**
3. Crea un nuevo keystore (guarda la contraseña bien, sin ella no podrás actualizar la app)
4. Selecciona **release** → Finish
5. El APK estará en `app/build/outputs/apk/release/app-release.apk`
6. Pásalo a tu móvil y ábrelo → se instala como cualquier app

## Verificación de dominio (assetlinks.json)

Para que la TWA no muestre la barra de URL en Chrome, necesitas subir un archivo `assetlinks.json` a tu servidor en:

```
https://tu-dominio.com/.well-known/assetlinks.json
```

El contenido debe ser el del fichero `.well-known/assetlinks.json` de este proyecto, **pero** reemplazando `"REEMPLAZAR_CON_TU_HUELLA_SHA256"` por la huella SHA256 de tu keystore de firma.

### Cómo obtener tu huella SHA256

```bash
keytool -list -v -keystore tu-keystore.jks -alias tu-alias
# Introduce tu contraseña
# Busca la línea: SHA256: XX:XX:XX:...
# Cópiala en formato: XX:XX:XX:... (con los dos puntos)
```

## Estructura del proyecto

```
MeetingVoice-TWA/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml       ← Identidad de la app + permisos + URL
│   │   ├── java/com/meetingvoice/app/
│   │   │   └── MainActivity.kt       ← Punto de entrada, pide permiso de micrófono
│   │   └── res/
│   │       ├── drawable/             ← Iconos vectoriales (splash, launcher)
│   │       ├── mipmap-anydpi-v26/    ← Icono adaptativo Android 8+
│   │       ├── values/               ← strings.xml, colors.xml, themes.xml
│   │       ├── values-night/         ← Tema oscuro
│   │       └── xml/filepaths.xml     ← Configuración FileProvider
│   ├── build.gradle.kts              ← Dependencias y config del módulo app
│   └── proguard-rules.pro
├── .well-known/
│   └── assetlinks.json               ← Subir a tu servidor HTTPS
├── gradle/wrapper/                   ← Gradle wrapper (no necesita instalar Gradle)
├── build.gradle.kts                  ← Configuración raíz
├── settings.gradle.kts               ← Configuración de módulos
├── gradle.properties                 ← Propiedades Gradle
├── gradlew / gradlew.bat            ← Scripts wrapper
└── README.md
```

## Modificar la URL de la PWA

Abre `app/src/main/AndroidManifest.xml` y busca estas dos líneas:

```xml
<meta-data
    android:name="android.support.customtabs.trusted.DEFAULT_URL"
    android:value="https://tu-dominio.com" />  ← CAMBIA ESTO

...

<data
    android:scheme="https"
    android:host="tu-dominio.com" />  ← Y ESTO
```

## Personalizar colores

Edita `app/src/main/res/values/colors.xml`:

```xml
<color name="colorPrimary">#6366F1</color>     ← color principal
<color name="colorPrimaryDark">#4F46E5</color> ← barra de estado
<color name="colorAccent">#8B5CF6</color>      ← acento
```

Deben coincidir con `theme_color` y `background_color` del `manifest.json` de tu PWA.

## ¿Problemas?

| Error | Solución |
|-------|----------|
| "Gradle sync failed" | File → Sync Project with Gradle Files. Si persiste, revisa conexión a internet. |
| "SDK not found" | Android Studio te pedirá instalarlo. Acepta. |
| La app abre pero se ve Chrome con barra | Falta `assetlinks.json` en tu servidor, o la SHA256 no coincide. |
| "No se puede grabar audio" | Concede permiso de micrófono: Ajustes → Apps → MeetingVoice → Permisos. |
| La app se cierra al abrir | Revisa `adb logcat` en Android Studio para ver el error. |

## Licencia

MIT — libre uso, modificación y distribución.
