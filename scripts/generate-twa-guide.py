"""
Genera la guía PDF: "Cómo empaquetar MeetingVoice como APK Android con TWA"
Audiencia: usuario con poca experiencia en Android Studio.
Salida: /home/z/my-project/download/GUIA-TWA-ANDROID.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Image, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# === Fuentes ===
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
pdfmetrics.registerFont(TTFont("Regular", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("Bold", FONT_BOLD))
pdfmetrics.registerFont(TTFont("Mono", FONT_MONO))

# === Colores (corporativos) ===
INDIGO = HexColor("#6366F1")
VIOLET = HexColor("#8B5CF6")
DARK = HexColor("#1F2937")
GRAY = HexColor("#6B7280")
LIGHT_BG = HexColor("#F3F4F6")
CODE_BG = HexColor("#1E293B")
CODE_TEXT = HexColor("#E2E8F0")
ACCENT_BG = HexColor("#EEF2FF")
WARN_BG = HexColor("#FEF3C7")
WARN_TEXT = HexColor("#92400E")
SUCCESS_BG = HexColor("#D1FAE5")
SUCCESS_TEXT = HexColor("#065F46")

# === Estilos ===
styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "Title", parent=styles["Title"],
    fontName="Bold", fontSize=26, leading=32,
    textColor=INDIGO, alignment=TA_LEFT, spaceAfter=8
)
style_subtitle = ParagraphStyle(
    "Subtitle", parent=styles["Normal"],
    fontName="Regular", fontSize=13, leading=18,
    textColor=GRAY, alignment=TA_LEFT, spaceAfter=20
)
style_h1 = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontName="Bold", fontSize=18, leading=22,
    textColor=INDIGO, spaceBefore=18, spaceAfter=10,
    keepWithNext=True
)
style_h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontName="Bold", fontSize=14, leading=18,
    textColor=DARK, spaceBefore=12, spaceAfter=6,
    keepWithNext=True
)
style_body = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontName="Regular", fontSize=10.5, leading=15,
    textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6
)
style_bullet = ParagraphStyle(
    "Bullet", parent=style_body,
    leftIndent=18, bulletIndent=6, spaceAfter=3
)
style_code = ParagraphStyle(
    "Code", parent=styles["Code"],
    fontName="Mono", fontSize=9, leading=12,
    textColor=CODE_TEXT, backColor=CODE_BG,
    leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=8,
    borderPadding=8
)
style_note = ParagraphStyle(
    "Note", parent=style_body,
    fontName="Regular", fontSize=10, leading=14,
    backColor=ACCENT_BG, borderColor=INDIGO, borderWidth=0,
    borderPadding=8, leftIndent=4, rightIndent=4, spaceAfter=8
)
style_warn = ParagraphStyle(
    "Warn", parent=style_body,
    fontName="Regular", fontSize=10, leading=14,
    backColor=WARN_BG, textColor=WARN_TEXT,
    borderPadding=8, leftIndent=4, rightIndent=4, spaceAfter=8
)
style_success = ParagraphStyle(
    "Success", parent=style_body,
    fontName="Regular", fontSize=10, leading=14,
    backColor=SUCCESS_BG, textColor=SUCCESS_TEXT,
    borderPadding=8, leftIndent=4, rightIndent=4, spaceAfter=8
)


def code_block(text: str) -> Paragraph:
    """Renderiza un bloque de código con fondo oscuro."""
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Preservar saltos de línea con <br/>
    escaped = escaped.replace("\n", "<br/>")
    return Paragraph(escaped, style_code)


def info_box(text: str, style=style_note) -> Paragraph:
    """Caja de información con fondo."""
    return Paragraph(text, style)


def bullets(items: list[str]) -> ListFlowable:
    """Lista con viñetas."""
    return ListFlowable(
        [ListItem(Paragraph(item, style_body), leftIndent=10) for item in items],
        bulletType="bullet", bulletColor=INDIGO, bulletFontSize=8,
        leftIndent=18, spaceBefore=2, spaceAfter=8
    )


# === Footer con número de página ===
def on_page(canvas, doc):
    canvas.saveState()
    # Línea sutil abajo
    canvas.setStrokeColor(HexColor("#E5E7EB"))
    canvas.setLineWidth(0.5)
    canvas.line(2*cm, 1.5*cm, A4[0] - 2*cm, 1.5*cm)
    # Texto izquierda
    canvas.setFont("Regular", 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(2*cm, 1.1*cm, "MeetingVoice — Guía TWA Android")
    # Número página derecha
    canvas.drawRightString(A4[0] - 2*cm, 1.1*cm, f"Página {doc.page}")
    canvas.restoreState()


# === Construcción del documento ===
def build():
    out = "/home/z/my-project/download/GUIA-TWA-ANDROID.pdf"
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="Guía TWA Android — MeetingVoice",
        author="MeetingVoice", subject="Empaquetar PWA como APK Android",
        creator="MeetingVoice"
    )
    story = []

    # === Portada ===
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph("MeetingVoice", style_title))
    story.append(Paragraph("Guía completa para empaquetar tu PWA como APK Android con Trusted Web Activity (TWA)", style_subtitle))
    story.append(Spacer(1, 0.5*cm))

    # Caja destacada
    highlight_data = [[Paragraph(
        "<font name='Bold' color='#6366F1' size='14'>100% gratuito · Sin barras de navegador · App nativa</font><br/><br/>"
        "Esta guía te explica, paso a paso, cómo convertir tu PWA ya funcional en un APK instalable en cualquier "
        "móvil Android. No necesitas aprender Kotlin ni reescribir tu app: la envolvemos con una capa nativa que "
        "abre tu web como si fuera una aplicación más del sistema.",
        ParagraphStyle("HL", fontName="Regular", fontSize=11, leading=16, textColor=DARK)
    )]]
    t = Table(highlight_data, colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT_BG),
        ("BOX", (0, 0), (-1, -1), 0, white),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    story.append(t)
    story.append(Spacer(1, 1*cm))

    # Tabla resumen
    summary_data = [
        ["Tiempo estimado", "Dificultad", "Coste", "Resultado"],
        ["30-60 min", "Baja", "0 €", "APK + AAB firmados"],
    ]
    summary_table = Table(summary_data, colWidths=[4*cm, 4*cm, 4*cm, 4*cm])
    summary_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Bold", 9),
        ("FONT", (0, 1), (-1, 1), "Regular", 11),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT_BG),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(PageBreak())

    # === Índice ===
    story.append(Paragraph("Índice", style_h1))
    story.append(bullets([
        "<b>1. ¿Qué es una TWA y por qué te conviene?</b> — Concepto y ventajas",
        "<b>2. Requisitos previos</b> — Lo que necesitas tener instalado",
        "<b>3. Estructura del proyecto</b> — Qué contiene cada archivo",
        "<b>4. Paso 1: Instalar Android Studio</b> — En Windows, Mac y Linux",
        "<b>5. Paso 2: Abrir el proyecto MeetingVoice-TWA</b> — Sincronización Gradle",
        "<b>6. Paso 3: Configurar tu URL</b> — Apuntar a tu PWA publicada",
        "<b>7. Paso 4: Probar en tu móvil o emulador</b> — Ejecutar la app",
        "<b>8. Paso 5: Generar APK firmado</b> — Para distribuir",
        "<b>9. Paso 6: Verificación de dominio</b> — assetlinks.json (CRÍTICO)",
        "<b>10. Paso 7: Instalar el APK en tu móvil</b> — Sin Play Store",
        "<b>11. Publicar en Google Play Store</b> — Si quieres llegar a todos",
        "<b>12. Solución de problemas</b> — Errores comunes",
        "<b>13. Personalización</b> — Cambiar colores, icono, nombre",
    ]))
    story.append(PageBreak())

    # === 1. Concepto ===
    story.append(Paragraph("1. ¿Qué es una TWA y por qué te conviene?", style_h1))
    story.append(Paragraph(
        "Una <b>Trusted Web Activity (TWA)</b> es una tecnología oficial de Google que permite "
        "empaquetar una Progressive Web App (PWA) como si fuera una aplicación nativa de Android. "
        "La app resultante se instala con su propio icono en el escritorio del móvil, se abre a "
        "pantalla completa sin la barra de direcciones del navegador, aparece en el menú de apps "
        "recientes y puede solicitar permisos nativos como el micrófono. Para el usuario final es "
        "indistinguible de una app nativa escrita en Kotlin o Java.",
        style_body
    ))
    story.append(Paragraph(
        "La clave de una TWA es que <b>no reescribe tu web</b>: internamente usa Chrome (en modo "
        "incógnito de UI) para renderizar tu PWA, pero lo hace de forma transparente. Esto significa "
        "que cualquier cambio que hagas en tu web se refleja automáticamente en la app, sin tener "
        "que volver a compilar o publicar un APK nuevo. Solo necesitas actualizar la PWA en tu "
        "servidor y la app mostrará la versión nueva la próxima vez que se abra.",
        style_body
    ))
    story.append(Paragraph("Ventajas frente a otras opciones", style_h2))
    story.append(bullets([
        "<b>Cero reescritura de código:</b> aprovechas todo el trabajo que ya has hecho en Next.js, React, Tailwind.",
        "<b>Una sola codebase:</b> mantienes tu web y la app Android con los mismos cambios.",
        "<b>Acceso a APIs nativas:</b> micrófono, cámara, geolocalización, notificaciones push (vía Firebase).",
        "<b>Instalación estándar:</b> el APK se instala como cualquier app, sin pasar por Chrome.",
        "<b>Google Play Store:</b> puedes publicarlo sin problema, es una técnica oficialmente soportada.",
        "<b>Coste cero:</b> las herramientas son gratuitas y open source.",
    ]))
    story.append(Paragraph("Limitaciones a tener en cuenta", style_h2))
    story.append(bullets([
        "Necesita Chrome instalado en el móvil del usuario (está en el 95% de los Android).",
        "Requiere conexión a internet para cargar la app la primera vez (luego funciona offline si tu PWA tiene service worker).",
        "Para que no aparezca la barra de URL, debes subir un archivo <font name='Mono'>assetlinks.json</font> a tu servidor.",
        "Algunas APIs nativas avanzadas (NFC, Bluetooth BLE) requieren una capa Kotlin adicional.",
    ]))

    # === 2. Requisitos ===
    story.append(Paragraph("2. Requisitos previos", style_h1))
    story.append(Paragraph(
        "Antes de empezar necesitas tener instalado Android Studio y publicado tu PWA en internet. "
        "Si todavía no has publicado tu PWA, en esta misma guía te explico cómo hacerlo gratis con Vercel.",
        style_body
    ))
    story.append(Paragraph("2.1 Instalar Android Studio", style_h2))
    story.append(Paragraph(
        "Android Studio es el IDE oficial de Google para desarrollar apps Android. Es gratuito y "
        "funciona en Windows, Mac y Linux. La instalación incluye el Android SDK, un emulador de "
        "Android, y todas las herramientas necesarias para compilar APKs.",
        style_body
    ))
    story.append(Paragraph("Descarga desde:", style_body))
    story.append(code_block("https://developer.android.com/studio"))
    story.append(Paragraph(
        "Durante la instalación, asegúrate de marcar <b>Android SDK</b> y <b>Android Virtual Device (AVD)</b>. "
        "Si tu equipo tiene menos de 8 GB de RAM, el emulador puede ir lento; en ese caso, prueba "
        "directamente en tu móvil real conectado por USB.",
        style_body
    ))
    story.append(Paragraph("2.2 Publicar tu PWA en internet (gratis, con Vercel)", style_h2))
    story.append(Paragraph(
        "Para que la TWA funcione, tu PWA tiene que estar accesible públicamente por HTTPS. La "
        "forma más rápida y gratuita es usar Vercel, que en 2 minutos te da una URL como "
        "<font name='Mono'>https://meetingvoice.vercel.app</font>.",
        style_body
    ))
    story.append(code_block(
        "# 1. Instala Vercel CLI en tu PC (solo la primera vez)\n"
        "npm i -g vercel\n\n"
        "# 2. Entra en la carpeta de tu proyecto MeetingVoice\n"
        "cd /ruta/a/MeetingVoice\n\n"
        "# 3. Publica (responde a las preguntas con Enter)\n"
        "vercel\n\n"
        "# 4. Te dará una URL como: https://meetingvoice-xxx.vercel.app\n"
        "# 5. Para producción (URL definitiva):\n"
        "vercel --prod"
    ))
    story.append(info_box(
        "<b>Alternativas gratuitas a Vercel:</b> Netlify, Cloudflare Pages, GitHub Pages. "
        "Todas ofrecen HTTPS automático y deploy desde git."
    ))

    # === 3. Estructura del proyecto ===
    story.append(PageBreak())
    story.append(Paragraph("3. Estructura del proyecto MeetingVoice-TWA", style_h1))
    story.append(Paragraph(
        "El proyecto que te he generado en <font name='Mono'>download/MeetingVoice-TWA/</font> "
        "contiene todo lo necesario para compilar un APK. Aquí te explico qué hace cada archivo:",
        style_body
    ))
    story.append(code_block(
        "MeetingVoice-TWA/\n"
        "├── app/\n"
        "│   ├── src/main/\n"
        "│   │   ├── AndroidManifest.xml    ← Identidad de la app\n"
        "│   │   ├── java/com/meetingvoice/app/\n"
        "│   │   │   └── MainActivity.kt    ← Punto de entrada (Kotlin)\n"
        "│   │   └── res/\n"
        "│   │       ├── drawable/          ← Iconos vectoriales\n"
        "│   │       ├── mipmap-anydpi-v26/ ← Icono adaptativo\n"
        "│   │       ├── values/            ← strings, colors, themes\n"
        "│   │       └── xml/filepaths.xml  ← Config FileProvider\n"
        "│   ├── build.gradle.kts           ← Dependencias del módulo\n"
        "│   └── proguard-rules.pro\n"
        "├── .well-known/\n"
        "│   └── assetlinks.json            ← Subir a tu servidor HTTPS\n"
        "├── build.gradle.kts               ← Configuración raíz\n"
        "├── settings.gradle.kts\n"
        "├── gradle.properties\n"
        "├── gradlew / gradlew.bat          ← Scripts wrapper\n"
        "└── README.md"
    ))

    story.append(Paragraph("3.1 AndroidManifest.xml — El carnet de identidad de la app", style_h2))
    story.append(Paragraph(
        "Es el archivo más importante. Define el package name único de tu app "
        "(<font name='Mono'>com.meetingvoice.app</font>), los permisos que necesita "
        "(micrófono, internet), la actividad principal que se abre al pulsar el icono y "
        "la URL de tu PWA. <b>Es el único archivo que tendrás que editar</b> para poner tu URL.",
        style_body
    ))

    story.append(Paragraph("3.2 MainActivity.kt — Punto de entrada en Kotlin", style_h2))
    story.append(Paragraph(
        "Esta clase hereda de <font name='Mono'>LauncherActivity</font> (de la librería "
        "androidbrowserhelper de Google) que se encarga de abrir Chrome de forma transparente. "
        "Antes de abrir la TWA, nuestra clase pide permiso de micrófono al usuario — sin él, la "
        "PWA no podría grabar audio. Si el usuario lo rechaza, muestra un diálogo con un botón "
        "para abrir Ajustes del sistema y activarlo manualmente.",
        style_body
    ))

    story.append(Paragraph("3.3 build.gradle.kts — Dependencias y configuración", style_h2))
    story.append(Paragraph(
        "Define la versión mínima de Android (7.0), la versión objetivo (Android 14), el "
        "package ID y las dependencias. La principal es <font name='Mono'>androidbrowserhelper</font>, "
        "de Google, que aporta toda la lógica TWA. No necesitas tocar este archivo salvo que "
        "quieras añadir librerías nativas adicionales.",
        style_body
    ))

    story.append(Paragraph("3.4 assetlinks.json — Verificación de dominio", style_h2))
    story.append(Paragraph(
        "Archivo CRÍTICO. Sin él, Chrome mostrará una barra con tu dominio encima de la app, "
        "rompiendo la ilusión de app nativa. Debes subirlo a tu servidor en la ruta "
        "<font name='Mono'>https://tu-dominio.com/.well-known/assetlinks.json</font>. Contiene "
        "tu package ID y la huella SHA256 del certificado con el que firmas el APK. Más adelante "
        "te explico cómo generarlo.",
        style_body
    ))

    # === 4. Paso 1: Instalar Android Studio ===
    story.append(PageBreak())
    story.append(Paragraph("4. Paso 1: Instalar Android Studio", style_h1))
    story.append(Paragraph(
        "Si todavía no tienes Android Studio, descárgalo de:",
        style_body
    ))
    story.append(code_block("https://developer.android.com/studio"))
    story.append(Paragraph(
        "Sigue el instalador gráfico. En Windows acepta instalar los drivers USB de Google. "
        "En Mac descomprime y arrastra a Aplicaciones. En Linux descomprime en <font name='Mono'>/opt</font> "
        "y crea un acceso directo. La primera vez que abras Android Studio te pedirá descargar "
        "el SDK de Android (unos 2 GB) — acepta los valores por defecto.",
        style_body
    ))
    story.append(info_box(
        "<b>Requisitos de hardware:</b> 8 GB de RAM (16 GB recomendados), 6 GB de disco libre, "
        "procesador de 64 bits. Funciona en Intel y Apple Silicon (M1/M2/M3) nativamente."
    ))

    # === 5. Paso 2: Abrir el proyecto ===
    story.append(Paragraph("5. Paso 2: Abrir el proyecto MeetingVoice-TWA", style_h1))
    story.append(Paragraph(
        "Copia la carpeta <font name='Mono'>MeetingVoice-TWA</font> a una ubicación fácil de "
        "encontrar (por ejemplo <font name='Mono'>C:\\Proyectos\\</font> en Windows o "
        "<font name='Mono'>~/Proyectos/</font> en Mac/Linux). Después:",
        style_body
    ))
    story.append(bullets([
        "Abre Android Studio.",
        "Pulsa <b>Open</b> (o File → Open).",
        "Selecciona la carpeta <font name='Mono'>MeetingVoice-TWA</font> (la raíz, no una subcarpeta).",
        "Pulsa <b>OK</b> y espera.",
    ]))
    story.append(Paragraph(
        "Android Studio empezará a sincronizar Gradle. La <b>primera vez tarda entre 3 y 10 minutos</b> "
        "porque descarga todas las dependencias. Verás una barra de progreso abajo. Cuando termine, "
        "aparecerá el mensaje <b>'Gradle sync finished'</b> en la esquina inferior derecha. Si te pide "
        "instalar una versión específica del SDK, acepta.",
        style_body
    ))
    story.append(info_box(
        "<b>Si la sincronización falla:</b> comprueba tu conexión a internet. Si el problema persiste, "
        "pulsa <b>File → Sync Project with Gradle Files</b>. En último caso, cierra Android Studio, "
        "borra la carpeta <font name='Mono'>.gradle</font> dentro del proyecto y vuelve a abrir."
    ))

    # === 6. Paso 3: Configurar URL ===
    story.append(PageBreak())
    story.append(Paragraph("6. Paso 3: Configurar tu URL", style_h1))
    story.append(Paragraph(
        "Ahora hay que decirle a la app dónde está publicada tu PWA. Abre el archivo "
        "<font name='Mono'>app/src/main/AndroidManifest.xml</font> y busca estas dos líneas "
        "(están en distintos puntos del archivo):",
        style_body
    ))
    story.append(code_block(
        '<meta-data\n'
        '    android:name="android.support.customtabs.trusted.DEFAULT_URL"\n'
        '    android:value="https://tu-dominio.com" />  ← CAMBIA ESTO\n'
        '\n'
        '...\n'
        '\n'
        '<data\n'
        '    android:scheme="https"\n'
        '    android:host="tu-dominio.com" />  ← Y ESTO TAMBIÉN'
    ))
    story.append(Paragraph(
        "Reemplaza <font name='Mono'>tu-dominio.com</font> por tu dominio real. Por ejemplo, "
        "si tu PWA está en <font name='Mono'>https://meetingvoice.vercel.app</font>, las líneas "
        "quedan así:",
        style_body
    ))
    story.append(code_block(
        '<meta-data\n'
        '    android:name="android.support.customtabs.trusted.DEFAULT_URL"\n'
        '    android:value="https://meetingvoice.vercel.app" />\n'
        '\n'
        '<data\n'
        '    android:scheme="https"\n'
        '    android:host="meetingvoice.vercel.app" />'
    ))
    story.append(Paragraph(
        "Guarda el archivo (Ctrl+S / Cmd+S). Android Studio puede pedirte volver a sincronizar "
        "Gradle — acepta.",
        style_body
    ))
    story.append(info_box(
        "<b>Importante:</b> la URL debe ser <b>HTTPS</b>. Las TWA no permiten HTTP salvo en "
        "modo debug y para dominios muy específicos. Vercel, Netlify y todos los hosting "
        "modernos dan HTTPS gratis."
    ))

    # === 7. Paso 4: Probar ===
    story.append(PageBreak())
    story.append(Paragraph("7. Paso 4: Probar en tu móvil o emulador", style_h1))
    story.append(Paragraph(
        "Antes de generar el APK final, vamos a probar que todo funciona. Tienes dos opciones:",
        style_body
    ))

    story.append(Paragraph("Opción A — En tu móvil Android real (recomendada)", style_h2))
    story.append(bullets([
        "En tu móvil: <b>Ajustes → Acerca del teléfono</b> → pulsa 7 veces sobre <b>Número de compilación</b>.",
        "Aparecerá el mensaje 'Ya eres desarrollador'.",
        "Vuelve atrás: <b>Ajustes → Sistema → Opciones de desarrollador</b> → activa <b>Depuración USB</b>.",
        "Conecta el móvil al PC con un cable USB (mejor el original, no uno solo de carga).",
        "En el móvil aparecerá '¿Permitir depuración USB?' → pulsa <b>Aceptar</b>.",
        "En Android Studio, arriba verás un desplegable con los dispositivos conectados. Selecciona tu móvil.",
        "Pulsa el botón verde <b>▶ Run</b> (o Mayús+F10).",
        "La app se compila (1-3 min la primera vez), se instala en tu móvil y se abre automáticamente.",
    ]))

    story.append(Paragraph("Opción B — En el emulador de Android Studio", style_h2))
    story.append(bullets([
        "En Android Studio: <b>Tools → Device Manager</b>.",
        "Pulsa <b>Create Device</b>.",
        "Elige un teléfono, por ejemplo <b>Pixel 7</b> → Next.",
        "Descarga una imagen de Android (recomendado: <b>API 34, Android 14</b>) → Next → Finish.",
        "Pulsa el botón verde <b>▶ Run</b>. La app se compila y se abre en el emulador.",
    ]))
    story.append(info_box(
        "<b>Nota sobre el emulador:</b> el micrófono virtual puede no funcionar bien. Para probar "
        "la grabación real de audio usa siempre un móvil físico. El emulador sirve para validar "
        "que la app abre, se ve bien y los permisos se piden correctamente."
    ))
    story.append(Paragraph(
        "Cuando la app se abra por primera vez, te pedirá permiso de micrófono. Pulsa <b>Permitir</b>. "
        "Verás tu PWA cargarse a pantalla completa, sin barra de direcciones. ¡Enhorabuena! Ya tienes "
        "MeetingVoice funcionando como app nativa.",
        style_body
    ))

    # === 8. Paso 5: APK firmado ===
    story.append(PageBreak())
    story.append(Paragraph("8. Paso 5: Generar APK firmado para distribuir", style_h1))
    story.append(Paragraph(
        "El APK que se genera al pulsar <b>Run</b> está firmado con una clave de debug que <b>no vale "
        "para distribuir</b>. Para tener un APK que cualquier usuario pueda instalar necesitas "
        "firmarlo con un keystore propio. Sigue estos pasos:",
        style_body
    ))
    story.append(bullets([
        "En Android Studio: menú <b>Build → Generate Signed App Bundle / APK</b>.",
        "Selecciona <b>APK</b> (no App Bundle) → Next.",
        "En <b>Key store path</b> pulsa <b>Create new</b>.",
        "Elige dónde guardar el archivo <font name='Mono'>.jks</font> (por ejemplo <font name='Mono'>C:\\Keystores\\meetingvoice.jks</font>).",
        "Rellena todos los campos: contraseña del keystore, contraseña de la clave, alias (por ejemplo <font name='Mono'>meetingvoice</font>), validez (25 años), tu nombre, organización, etc.",
        "<b>GUARDA ESTOS DATOS</b>: si pierdes la contraseña o el keystore, no podrás actualizar la app en Google Play. Haz una copia de seguridad del archivo .jks en Drive/Dropbox.",
        "Pulsa <b>OK</b> → Next.",
        "Selecciona <b>release</b> → Finish.",
        "Android Studio compila (2-3 min) y muestra un popup azul: <b>'locate'</b>. Pulsa ahí para abrir la carpeta con tu APK.",
    ]))
    story.append(Paragraph(
        "El APK estará en <font name='Mono'>app/build/outputs/apk/release/app-release.apk</font>. "
        "Este es el archivo que puedes pasar a cualquier persona para que lo instale en su móvil.",
        style_body
    ))
    story.append(info_box(
        "<b>Importante sobre el keystore:</b> genera UNO y úsalo SIEMPRE para todas las versiones "
        "de tu app. Nunca generes uno nuevo, porque Google Play no te dejará actualizar la app "
        "con un keystore distinto. Haz copia de seguridad del archivo .jks y de la contraseña en "
        "sitios seguros (1Password, KeePass, papel en una caja fuerte)."
    ))

    # === 9. assetlinks.json ===
    story.append(PageBreak())
    story.append(Paragraph("9. Paso 6: Verificación de dominio (assetlinks.json)", style_h1))
    story.append(Paragraph(
        "Si pruebas tu APK ahora, verás que Chrome muestra una barra superior con tu dominio. "
        "Para eliminarla y conseguir una experiencia 100% nativa, necesitas subir un archivo "
        "<font name='Mono'>assetlinks.json</font> a tu servidor HTTPS.",
        style_body
    ))
    story.append(Paragraph("9.1 Generar tu huella SHA256", style_h2))
    story.append(Paragraph(
        "Abre una terminal y ejecuta (sustituye la ruta por la de tu keystore):",
        style_body
    ))
    story.append(code_block(
        'keytool -list -v -keystore C:\\Keystores\\meetingvoice.jks -alias meetingvoice\n'
        '\n'
        '# Te pedirá la contraseña del keystore.\n'
        '# Busca la línea que dice:\n'
        '#   SHA256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX\n'
        '# Cópiala completa (con los dos puntos).'
    ))
    story.append(Paragraph("9.2 Crear el archivo assetlinks.json", style_h2))
    story.append(Paragraph(
        "Abre el archivo <font name='Mono'>.well-known/assetlinks.json</font> del proyecto y "
        "reemplaza <font name='Mono'>REEMPLAZAR_CON_TU_HUELLA_SHA256</font> por la huella que "
        "acabas de obtener. El archivo debe quedar así:",
        style_body
    ))
    story.append(code_block(
        '[\n'
        '  {\n'
        '    "relation": ["delegate_permission/common.handle_all_urls"],\n'
        '    "target": {\n'
        '      "namespace": "android_app",\n'
        '      "package_name": "com.meetingvoice.app",\n'
        '      "sha256_cert_fingerprints": [\n'
        '        "AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90"\n'
        '      ]\n'
        '    }\n'
        '  }\n'
        ']'
    ))
    story.append(Paragraph("9.3 Subirlo a tu servidor", style_h2))
    story.append(Paragraph(
        "El archivo debe ser accesible públicamente en esta URL EXACTA:",
        style_body
    ))
    story.append(code_block("https://tu-dominio.com/.well-known/assetlinks.json"))
    story.append(Paragraph(
        "En Next.js, colócalo en <font name='Mono'>public/.well-known/assetlinks.json</font> "
        "y se servirá automáticamente. En Vercel/Netlify funciona sin configuración adicional. "
        "Verifica abriendo la URL en el navegador — debe devolverte el JSON.",
        style_body
    ))
    story.append(info_box(
        "<b>Verificación:</b> tras subir el archivo, espera 5 minutos y reinstala tu APK. "
        "Si todo está correcto, la barra de dominio habrá desaparecido y la app se verá 100% "
        "nativa."
    ))

    # === 10. Instalar APK ===
    story.append(PageBreak())
    story.append(Paragraph("10. Paso 7: Instalar el APK en tu móvil", style_h1))
    story.append(Paragraph(
        "Una vez generado <font name='Mono'>app-release.apk</font>, puedes instalarlo en cualquier "
        "móvil Android sin necesidad de Play Store. Tienes varias formas de pasarlo al móvil:",
        style_body
    ))
    story.append(bullets([
        "<b>Email:</b> envíate el APK por Gmail. Ábrelo desde el móvil y pulsa 'Instalar'.",
        "<b>Google Drive / Dropbox:</b> súbelo, compártelo con tu cuenta, descárgalo en el móvil.",
        "<b>USB:</b> copia el archivo al almacenamiento del móvil y ábrelo desde el explorador de archivos.",
        "<b>ADB:</b> con depuración USB activa: <font name='Mono'>adb install app-release.apk</font>",
    ]))
    story.append(Paragraph(
        "La primera vez que intentes instalar un APK de origen desconocido, Android mostrará un "
        "aviso de seguridad. Esto es normal — Google solo avisa porque la app no viene de Play "
        "Store. Para permitirlo:",
        style_body
    ))
    story.append(bullets([
        "Pulsa <b>Ajustes</b> en el aviso.",
        "Activa <b>Permitir desde esta fuente</b> (o <b>Instalar apps desconocidas</b> según el fabricante).",
        "Vuelve atrás y pulsa <b>Instalar</b>.",
        "Cuando termine, pulsa <b>Abrir</b>. ¡Listo!",
    ]))
    story.append(Paragraph(
        "A partir de aquí, MeetingVoice funciona como cualquier otra app: aparece en el cajón de "
        "apps, se puede desinstalar desde Ajustes, recibe actualizaciones cuando vuelvas a "
        "instalar un APK más moderno con el mismo package ID y mayor versionCode.",
        style_body
    ))

    # === 11. Publicar en Play Store ===
    story.append(PageBreak())
    story.append(Paragraph("11. Publicar en Google Play Store (opcional)", style_h1))
    story.append(Paragraph(
        "Si quieres que cualquier persona pueda descargar tu app desde la tienda oficial de "
        "Google, estos son los pasos. El coste es de <b>25 € únicos</b> (pago una sola vez en "
        "la vida) para crear la cuenta de desarrollador.",
        style_body
    ))
    story.append(bullets([
        "Crea una cuenta en <font name='Mono'>https://play.google.com/console</font> (25 €).",
        "En Android Studio: <b>Build → Generate Signed App Bundle / APK</b> → esta vez elige <b>Android App Bundle</b>.",
        "Sube el archivo <font name='Mono'>.aab</font> a Google Play Console.",
        "Rellena la ficha de la tienda: descripción, capturas de pantalla (mínimo 2), icono 512×512, banner 1024×500, categoría, política de privacidad.",
        "Configura la firma de Play App Signing (Google te pide subir tu keystore de release una sola vez, ellos firman las versiones futuras con su clave).",
        "Sube el assetlinks.json a tu servidor (igual que en el paso 6).",
        "Envía para revisión. Google tarda entre <b>1 y 7 días</b> en aprobar.",
    ]))
    story.append(info_box(
        "<b>Política de privacidad obligatoria:</b> Google exige que tengas una URL pública con "
        "tu política de privacidad. Si tu app no recoge datos personales más allá del micrófono "
        "(que es tu caso), puedes usar generadores gratuitos como <font name='Mono'>privacypolicies.com</font>."
    ))

    # === 12. Solución de problemas ===
    story.append(PageBreak())
    story.append(Paragraph("12. Solución de problemas", style_h1))
    story.append(Paragraph(
        "Aquí tienes los errores más comunes y cómo resolverlos:",
        style_body
    ))

    problems = [
        ("Gradle sync failed",
         "Comprueba conexión a internet. Si persiste: File → Sync Project with Gradle Files. "
         "En último caso, borra la carpeta <font name='Mono'>.gradle</font> del proyecto y vuelve a abrir."),
        ("SDK not found / license not accepted",
         "Android Studio te lo dirá y ofrecerá instalarlo. Acepta. Para aceptar todas las licencias "
         "de golpe: <font name='Mono'>sdkmanager --licenses</font> en terminal."),
        ("La app abre pero se ve la barra de Chrome con mi dominio",
         "Tu assetlinks.json no está accesible o la SHA256 no coincide. Verifica abriendo en el "
         "navegador <font name='Mono'>https://tu-dominio.com/.well-known/assetlinks.json</font> — debe "
         "devolver el JSON. La SHA debe ser exactamente la del keystore con el que firmaste el APK."),
        ("No se puede grabar audio / el botón no hace nada",
         "El permiso de micrófono está denegado. Ve a Ajustes del móvil → Apps → MeetingVoice → "
         "Permisos → Micrófono → Permitir. Si el problema persiste, comprueba que estás usando "
         "Chrome (no Firefox u otro navegador)."),
        ("La app se cierra al abrirla (crash)",
         "Conecta el móvil por USB y ejecuta en terminal: <font name='Mono'>adb logcat | grep MeetingVoice</font> "
         "para ver el error exacto. Lo más común: URL mal configurada en el Manifest, o falta de "
         "Chrome instalado en el móvil."),
        ("No aparece mi móvil en el desplegable de dispositivos",
         "Comprueba que la depuración USB está activada y el cable es de datos (no solo carga). "
         "Ejecuta <font name='Mono'>adb devices</font> en terminal — debería listar tu móvil."),
        ("Error INSTALL_FAILED_UPDATE_INCOMPATIBLE",
         "Ya tienes una versión anterior instalada con un certificado distinto. Desinstala la "
         "vieja antes: <font name='Mono'>adb uninstall com.meetingvoice.app</font>."),
        ("El APK es muy grande (>10 MB)",
         "Es normal para una TWA con iconos PNG. Si quieres reducirlo, activa "
         "<font name='Mono'>isMinifyEnabled = true</font> en <font name='Mono'>build.gradle.kts</font>."),
    ]
    for prob, sol in problems:
        story.append(Paragraph(f"<b>{prob}</b>", style_h2))
        story.append(Paragraph(sol, style_body))

    # === 13. Personalización ===
    story.append(PageBreak())
    story.append(Paragraph("13. Personalización", style_h1))

    story.append(Paragraph("13.1 Cambiar el nombre de la app", style_h2))
    story.append(Paragraph(
        "Edita <font name='Mono'>app/src/main/res/values/strings.xml</font>:",
        style_body
    ))
    story.append(code_block(
        '<resources>\n'
        '    <string name="app_name">MeetingVoice</string>\n'
        '    <!-- Cámbialo por el nombre que quieras -->\n'
        '</resources>'
    ))

    story.append(Paragraph("13.2 Cambiar los colores", style_h2))
    story.append(Paragraph(
        "Edita <font name='Mono'>app/src/main/res/values/colors.xml</font>. Los colores deben "
        "coincidir con los de tu PWA (theme_color y background_color del manifest.json):",
        style_body
    ))
    story.append(code_block(
        '<resources>\n'
        '    <color name="colorPrimary">#6366F1</color>     ← color principal (violeta)\n'
        '    <color name="colorPrimaryDark">#4F46E5</color> ← barra de estado\n'
        '    <color name="colorAccent">#8B5CF6</color>      ← acento\n'
        '</resources>'
    ))

    story.append(Paragraph("13.3 Cambiar el icono de la app", style_h2))
    story.append(Paragraph(
        "Los iconos están en <font name='Mono'>app/src/main/res/drawable/</font> como XML vectorial "
        "(<font name='Mono'>ic_launcher_background.xml</font> e <font name='Mono'>ic_launcher_foreground.xml</font>). "
        "Puedes editarlos directamente o, si prefieres PNGs, sustitúyelos por imágenes en "
        "<font name='Mono'>mipmap-xxxhdpi/</font> en sus distintas resoluciones. La forma más "
        "rápida es usar <b>Image Asset Studio</b>: clic derecho en <font name='Mono'>res</font> → "
        "<b>New → Image Asset</b> → sube tu logo y Android Studio genera todas las resoluciones.",
        style_body
    ))

    story.append(Paragraph("13.4 Cambiar el package ID", style_h2))
    story.append(Paragraph(
        "Si quieres cambiar <font name='Mono'>com.meetingvoice.app</font> por tu propio dominio "
        "(por ejemplo <font name='Mono'>com.tuempresa.meetingvoice</font>):",
        style_body
    ))
    story.append(bullets([
        "Edita <font name='Mono'>app/build.gradle.kts</font>: <font name='Mono'>applicationId = \"com.tuempresa.meetingvoice\"</font>",
        "Edita <font name='Mono'>namespace = \"com.tuempresa.meetingvoice\"</font>",
        "Renombra la carpeta <font name='Mono'>java/com/meetingvoice/app/</font> a <font name='Mono'>java/com/tuempresa/meetingvoice/</font>",
        "Actualiza el <font name='Mono'>package</font> al inicio de <font name='Mono'>MainActivity.kt</font>",
        "Actualiza el <font name='Mono'>package_name</font> en <font name='Mono'>assetlinks.json</font>",
    ]))

    # === Cierre ===
    story.append(PageBreak())
    story.append(Paragraph("Resumen final", style_h1))
    story.append(Paragraph(
        "Has convertido tu PWA en una app Android instalable. Recapitulando lo que has conseguido:",
        style_body
    ))
    story.append(bullets([
        "Una app con icono propio en el cajón de aplicaciones.",
        "Sin barra de navegador, experiencia 100% nativa.",
        "Acceso al micrófono con diálogo de permisos nativo.",
        "APK distribuible por email, Drive, USB o Play Store.",
        "Todo gratis y con código abierto.",
        "Mantenimiento simplificado: actualizas la web y todos los usuarios ven la nueva versión.",
    ]))
    story.append(Spacer(1, 0.5*cm))
    story.append(info_box(
        "<b>¿Y ahora qué?</b><br/><br/>"
        "1. Personaliza icono, colores y nombre según tu marca.<br/>"
        "2. Distribuye el APK a tus usuarios (email, Drive, web de descarga).<br/>"
        "3. Si quieres más alcance, publícalo en Google Play Store.<br/>"
        "4. Si en el futuro necesitas notificaciones push o acceso a contactos nativos, podemos "
        "añadir una capa Kotlin más amplia sin reescribir la PWA.",
        style_success
    ))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        "Para cualquier duda o si te atascas en algún paso, vuelve a esta guía y revisa la "
        "sección 12 de solución de problemas. Si el problema no está listado, copia el mensaje "
        "de error exacto y pídenos ayuda.",
        style_body
    ))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"✓ PDF generado: {out}")
    print(f"  Tamaño: {os.path.getsize(out) / 1024:.1f} KB")


if __name__ == "__main__":
    build()
