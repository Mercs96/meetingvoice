# Guía: Cómo empaquetar MeetingVoice como APK instalable en Android

Tu app **MeetingVoice** ya es una PWA instalable desde Chrome. Para tener un **APK descargable** que cualquier usuario pueda instalar en su móvil Android (sin pasar por Chrome), sigue una de estas opciones.

---

## Requisitos previos (ya cumplidos)

Tu PWA ya tiene todo lo que Android exige:
- ✅ `manifest.json` con iconos PNG (192×192 y 512×512, regulares + maskable)
- ✅ Service Worker funcional con caché offline
- ✅ HTTPS (el servidor de producción lo proporciona)
- ✅ App responsive y mobile-first
- ✅ Start URL válida y scope definido

---

## Opción A — PWABuilder (la más fácil, recomendada)

PWABuilder es una herramienta gratuita de Microsoft que genera un APK Android firmado desde tu PWA en 5 minutos.

### Paso 1 — Publica tu PWA en Internet

La PWA tiene que estar accesible públicamente por HTTPS. Opciones gratuitas:

**Vercel (recomendada, gratis):**
```bash
# En tu PC, dentro del proyecto:
npm i -g vercel
vercel
# Sigue las instrucciones, obtendrás una URL tipo:
# https://meetingvoice.vercel.app
```

**Alternativas:** Netlify, Cloudflare Pages, GitHub Pages (todas gratis).

### Paso 2 — Ve a PWABuilder

1. Abre https://www.pwabuilder.com en tu navegador
2. Pega la URL pública de tu PWA (ej: `https://meetingvoice.vercel.app`)
3. Pulsa **"Start"**
4. PWABuilder analizará tu PWA y mostrará una puntuación

### Paso 3 — Genera el APK Android

1. En la sección **"Android"**, pulsa **"Options"**
2. Configura:
   - **Package ID**: `com.tuempresa.meetingvoice` (tu identificador único)
   - **App name**: MeetingVoice
   - **Short name**: MeetingVoice
   - **Version**: 1.0.0
   - **Signing key**: crea una nueva o sube la tuya (necesaria para Play Store)
   - **Display mode**: Standalone
3. Pulsa **"Generate"**
4. Descarga el ZIP que contiene:
   - `meetingvoice.apk` — APK instalable directamente
   - `meetingvoice.aab` — App Bundle para Google Play Store
   - `assetlinks.json` — para verificar el dominio

### Paso 4 — Instala el APK en tu móvil

1. Transfiere el `.apk` a tu móvil Android (por email, Drive, USB, etc.)
2. En el móvil, abre el archivo `.apk`
3. Si aparece "Por seguridad, tu teléfono no permite instalar apps de origen desconocido":
   - Pulsa **"Ajustes"**
   - Activa **"Permitir desde esta fuente"**
   - Vuelve atrás y pulsa **"Instalar"**
4. ¡Listo! Ya tienes MeetingVoice como app nativa en tu Android.

---

## Opción B — Bubblewrap CLI (más control)

Si prefieres hacerlo desde tu PC con la herramienta oficial de Google.

### Paso 1 — Instala los requisitos

**Java JDK 17:**
```bash
# Ubuntu / Debian
sudo apt install openjdk-17-jdk

# Mac
brew install openjdk@17

# Windows: descarga desde https://adoptium.net
```

**Android SDK** (opcional, solo si quieres compilar tú):
- Instala Android Studio: https://developer.android.com/studio
- O instala solo las cmdline-tools: https://developer.android.com/tools

**Bubblewrap:**
```bash
npm i -g @bubblewrap/cli
```

### Paso 2 — Inicializa el proyecto

```bash
cd /ruta/a/tu/proyecto
bubblewrap init --manifest=https://tu-dominio.com/manifest.json
```

Te preguntará:
- **Application name**: MeetingVoice
- **Short name**: MeetingVoice
- **Package ID**: com.tuempresa.meetingvoice
- **Signing key info**: rellena los datos (los necesitarás para actualizar la app en el futuro)

Esto genera una carpeta `twa/` con todo el proyecto Android.

### Paso 3 — Construye el APK

```bash
cd twa
bubblewrap build
```

El proceso:
1. Descarga las dependencias de Android
2. Compila el proyecto
3. Genera `app-release-signed.apk`

### Paso 4 — Instala en tu móvil

```bash
# Conecta el móvil por USB con depuración activada:
bubblewrap install
# O copia manualmente el APK y ábrelo en el móvil
```

---

## Opción C — Publicar en Google Play Store

Si quieres que cualquiera pueda descargarla desde la tienda oficial:

### Requisitos
1. **Cuenta de Google Play Console**: 25€ (pago único de por vida) — https://play.google.com/console
2. **APK o AAB firmado**: generado con PWABuilder o Bubblewrap
3. **`assetlinks.json`** subido a tu servidor en:
   `https://tu-dominio.com/.well-known/assetlinks.json`
   (PWABuilder te lo da hecho — evita que aparezca la barra de Chrome en la app)

### Pasos
1. Sube el `.aab` a Google Play Console
2. Rellena la ficha de la tienda (descripción, capturas, categoría)
3. Completa la política de privacidad (obligatoria)
4. Envía para revisión (1-7 días)
5. ¡Publicada!

---

## Recomendaciones finales

| Tu situación | Opción recomendada |
|--------------|-------------------|
| Quiero un APK ya, sin complicaciones | **PWABuilder** |
| Quiero control total y scripted | **Bubblewrap** |
| Quiero llegar a todos los usuarios | **Play Store** |
| Solo yo / uso interno | **PWA desde Chrome** (sin APK) |

---

## Notas técnicas importantes

### Sobre la transcripción
La app usa la **Web Speech API** del navegador. En Android funciona en:
- ✅ Chrome (recomendado)
- ✅ Edge
- ✅ Samsung Internet
- ⚠️ Firefox (limitado)
- ❌ WebView puro (por eso el TWA usa Chrome internamente)

Cuando empaquetas como TWA/APK, internamente usa Chrome → la transcripción funcionará correctamente.

### Sobre el micrófono
El primer uso pedirá permiso. Los usuarios deben aceptar. Si lo rechazan, pueden activarlo después en:
**Ajustes del móvil → Apps → MeetingVoice → Permisos → Micrófono → Permitir**

### Sobre el SMTP y privacidad
- La contraseña SMTP se guarda solo en el dispositivo (en la base SQLite local).
- Los correos se envían directamente desde el móvil al servidor SMTP.
- Ningún dato pasa por servidores intermedios.

### Actualizaciones
- **PWA pura**: las actualizaciones se aplican automáticamente al abrir la app.
- **APK TWA**: necesitas regenerar y reinstalar el APK, o publicar versión nueva en Play Store.

---

## ¿Necesitas ayuda?

Si te atascas en algún paso, dime cuál y te ayudo a resolverlo. Las opciones más comunes son:

- "No sé publicar mi PWA en internet" → te guío por Vercel
- "PWABuilder me da error" → revisamos el manifest juntos
- "Quiero añadir funcionalidad nativa extra (notificaciones, etc.)" → añadimos un plugin
- "Quiero migrar a Kotlin nativo puro" → te genero el proyecto Android Studio
