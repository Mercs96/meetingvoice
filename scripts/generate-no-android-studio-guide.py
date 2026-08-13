"""
Genera una guía PDF compacta: "Cómo generar el APK de MeetingVoice en la nube con GitHub Actions"
Sin instalar Android Studio ni SDK en tu PC. Solo necesitas GitHub (gratis).
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
pdfmetrics.registerFont(TTFont("Regular", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("Bold", FONT_BOLD))
pdfmetrics.registerFont(TTFont("Mono", FONT_MONO))

INDIGO = HexColor("#6366F1")
VIOLET = HexColor("#8B5CF6")
DARK = HexColor("#1F2937")
GRAY = HexColor("#6B7280")
LIGHT_BG = HexColor("#F3F4F6")
CODE_BG = HexColor("#1E293B")
CODE_TEXT = HexColor("#E2E8F0")
ACCENT_BG = HexColor("#EEF2FF")
SUCCESS_BG = HexColor("#D1FAE5")
SUCCESS_TEXT = HexColor("#065F46")
WARN_BG = HexColor("#FEF3C7")
WARN_TEXT = HexColor("#92400E")

styles = getSampleStyleSheet()

style_title = ParagraphStyle("Title", parent=styles["Title"], fontName="Bold", fontSize=24, leading=30, textColor=INDIGO, alignment=TA_LEFT, spaceAfter=8)
style_subtitle = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="Regular", fontSize=12, leading=17, textColor=GRAY, alignment=TA_LEFT, spaceAfter=18)
style_h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Bold", fontSize=17, leading=22, textColor=INDIGO, spaceBefore=16, spaceAfter=8, keepWithNext=True)
style_h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Bold", fontSize=13, leading=17, textColor=DARK, spaceBefore=10, spaceAfter=4, keepWithNext=True)
style_body = ParagraphStyle("Body", parent=styles["Normal"], fontName="Regular", fontSize=10.5, leading=15, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6)
style_code = ParagraphStyle("Code", parent=styles["Code"], fontName="Mono", fontSize=9, leading=12, textColor=CODE_TEXT, backColor=CODE_BG, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=8, borderPadding=8)
style_note = ParagraphStyle("Note", parent=style_body, fontName="Regular", fontSize=10, leading=14, backColor=ACCENT_BG, borderPadding=8, leftIndent=4, rightIndent=4, spaceAfter=8)
style_warn = ParagraphStyle("Warn", parent=style_body, fontName="Regular", fontSize=10, leading=14, backColor=WARN_BG, textColor=WARN_TEXT, borderPadding=8, leftIndent=4, rightIndent=4, spaceAfter=8)
style_success = ParagraphStyle("Success", parent=style_body, fontName="Regular", fontSize=10, leading=14, backColor=SUCCESS_BG, textColor=SUCCESS_TEXT, borderPadding=8, leftIndent=4, rightIndent=4, spaceAfter=8)


def code_block(text):
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
    return Paragraph(escaped, style_code)


def info_box(text, style=style_note):
    return Paragraph(text, style)


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(item, style_body), leftIndent=10) for item in items],
        bulletType="bullet", bulletColor=INDIGO, bulletFontSize=8,
        leftIndent=18, spaceBefore=2, spaceAfter=8
    )


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#E5E7EB"))
    canvas.setLineWidth(0.5)
    canvas.line(2*cm, 1.5*cm, A4[0] - 2*cm, 1.5*cm)
    canvas.setFont("Regular", 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(2*cm, 1.1*cm, "MeetingVoice — Compilar APK en la nube con GitHub Actions")
    canvas.drawRightString(A4[0] - 2*cm, 1.1*cm, f"Página {doc.page}")
    canvas.restoreState()


def build():
    out = "/home/z/my-project/download/GUIA-APK-SIN-ANDROID-STUDIO.pdf"
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="Compilar APK en la nube — MeetingVoice",
        author="MeetingVoice",
        subject="Alternativa sin Android Studio usando GitHub Actions",
        creator="MeetingVoice"
    )
    story = []

    # === Portada ===
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph("MeetingVoice", style_title))
    story.append(Paragraph("Cómo compilar tu APK Android en la nube sin instalar nada — usando GitHub Actions (gratis)", style_subtitle))
    story.append(Spacer(1, 0.5*cm))

    highlight = [[Paragraph(
        "<font name='Bold' color='#6366F1' size='13'>Sin Android Studio · Sin permisos de admin · Sin instalar nada</font><br/><br/>"
        "Esta guía está pensada para usuarios que no pueden instalar Android Studio en su PC "
        "(porque no tienen permisos de administrador, falta de espacio, o policy de empresa). "
        "Aprovechamos los servidores gratuitos de GitHub para compilar el APK en la nube. "
        "Solo necesitas un navegador web y una cuenta de GitHub (gratis).",
        ParagraphStyle("HL", fontName="Regular", fontSize=11, leading=16, textColor=DARK)
    )]]
    t = Table(highlight, colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    story.append(t)
    story.append(Spacer(1, 1*cm))

    summary = [
        ["Tiempo", "Dificultad", "Coste", "Necesitas"],
        ["30-45 min", "Media-Baja", "0 €", "Cuenta GitHub"],
    ]
    st = Table(summary, colWidths=[4*cm, 4*cm, 4*cm, 4*cm])
    st.setStyle(TableStyle([
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
    story.append(st)
    story.append(PageBreak())

    # === Índice ===
    story.append(Paragraph("Índice", style_h1))
    story.append(bullets([
        "<b>1. ¿Por qué GitHub Actions?</b> — Concepto y ventajas",
        "<b>2. Crear cuenta de GitHub</b> — Si no la tienes",
        "<b>3. Preparar tu PWA publicada</b> — URL accesible por HTTPS",
        "<b>4. Subir el proyecto MeetingVoice-TWA a GitHub</b> — Paso a paso",
        "<b>5. Configurar tu URL en el Manifest</b> — Apuntar a tu PWA",
        "<b>6. Disparar el primer build</b> — Compilar APK de debug",
        "<b>7. Descargar el APK</b> — Como artifact",
        "<b>8. Firmar el APK</b> — Crear keystore y configurar secrets",
        "<b>9. Instalar el APK firmado en tu móvil</b> — Sin Play Store",
        "<b>10. Compilaciones automáticas</b> — Cada vez que cambies código",
        "<b>11. Alternativa: PWABuilder</b> — Aún más fácil, sin GitHub",
    ]))
    story.append(PageBreak())

    # === 1. Por qué GitHub Actions ===
    story.append(Paragraph("1. ¿Por qué GitHub Actions?", style_h1))
    story.append(Paragraph(
        "GitHub Actions es el sistema de integración continua (CI/CD) integrado en GitHub. "
        "Permite ejecutar código automáticamente en los servidores de GitHub cada vez que "
        "subes cambios a tu repositorio. La gran ventaja es que <b>la compilación ocurre "
        "en la nube</b>, no en tu PC — por lo que no necesitas instalar Android Studio, ni "
        "el Android SDK, ni tener permisos de administrador. GitHub te ofrece 2.000 minutos "
        "gratis al mes para proyectos privados, e <b>ilimitados para repositorios públicos</b>. "
        "Compilar un APK tarda unos 10 minutos, así que tienes margen de sobra.",
        style_body
    ))
    story.append(Paragraph("Ventajas concretas para tu situación", style_h2))
    story.append(bullets([
        "<b>Cero instalación local:</b> no tocas tu PC, no necesitas permisos.",
        "<b>Cero descargas grandes:</b> el SDK se descarga en el servidor de GitHub, no en tu equipo.",
        "<b>Reproducible:</b> cada build es idéntico, sin dependencias locales rotas.",
        "<b>Automático:</b> cada vez que cambias tu PWA, puedes regenerar el APK pulsando un botón.",
        "<b>Gratis:</b> repositorios públicos tienen minutos ilimitados.",
        "<b>Trazable:</b> los logs del build te dicen exactamente qué pasó si algo falló.",
    ]))
    story.append(info_box(
        "<b>¿Y si no quiero aprender GitHub?</b> Salta directamente a la sección 11, "
        "donde explico PWABuilder — una alternativa web aún más fácil que no requiere Git "
        "ni comandos. GitHub Actions es mejor para el largo plazo (automatización), "
        "PWABuilder es mejor para empezar rápido."
    ))

    # === 2. Crear cuenta GitHub ===
    story.append(Paragraph("2. Crear cuenta de GitHub (gratis)", style_h1))
    story.append(Paragraph(
        "Si ya tienes cuenta en GitHub, salta a la sección 3. Si no, créala en 2 minutos:",
        style_body
    ))
    story.append(bullets([
        "Ve a <font name='Mono'>https://github.com/signup</font>",
        "Introduce tu email, una contraseña y un nombre de usuario.",
        "Verifica el email con el código que te envían.",
        "¡Listo! Ya puedes crear repositorios públicos y privados.",
    ]))
    story.append(info_box(
        "<b>Plan gratuito:</b> incluye repositorios privados ilimitados y 2.000 minutos "
        "de Actions al mes. Si tus repos son públicos, los minutos son ilimitados."
    ))

    # === 3. Preparar PWA publicada ===
    story.append(PageBreak())
    story.append(Paragraph("3. Preparar tu PWA publicada", style_h1))
    story.append(Paragraph(
        "El proyecto TWA necesita apuntar a una URL pública donde tu PWA sea accesible por "
        "HTTPS. Si todavía no la has publicado, hazlo ahora. La forma más rápida y gratuita "
        "es Vercel:",
        style_body
    ))
    story.append(code_block(
        "# En tu PC, en la carpeta del proyecto MeetingVoice:\n"
        "npm i -g vercel\n"
        "vercel\n"
        "\n"
        "# Responde a las preguntas (puedes aceptar las opciones por defecto):\n"
        "# - Set up and deploy: Y\n"
        "# - Which scope: tu usuario\n"
        "# - Link to existing project: N\n"
        "# - Project name: meetingvoice (o el que quieras)\n"
        "# - In which directory: ./\n"
        "# - Override settings: N\n"
        "\n"
        "# Te dará una URL como:\n"
        "# https://meetingvoice-xxx.vercel.app\n"
        "\n"
        "# Para producción (URL definitiva estable):\n"
        "vercel --prod\n"
        "\n"
        "# URL final: https://meetingvoice.vercel.app"
    ))
    story.append(info_box(
        "<b>Anota tu URL</b>. La necesitarás en la sección 5."
    ))

    # === 4. Subir a GitHub ===
    story.append(PageBreak())
    story.append(Paragraph("4. Subir el proyecto MeetingVoice-TWA a GitHub", style_h1))
    story.append(Paragraph(
        "Tienes dos formas de hacerlo: por interfaz web (más fácil) o por línea de comandos. "
        "Te explico ambas.",
        style_body
    ))
    story.append(Paragraph("4.1 Opción fácil — Por la web de GitHub", style_h2))
    story.append(bullets([
        "Entra en <font name='Mono'>https://github.com/new</font>",
        "Repository name: <font name='Mono'>meetingvoice-twa</font>",
        "Selecciona <b>Public</b> (recomendado — minutos ilimitados)",
        "Marca <b>Add a README file</b>",
        "Pulsa <b>Create repository</b>",
        "Ahora sube los archivos del proyecto: pulsa <b>Add file → Upload files</b>",
        "Arrastra toda la carpeta <font name='Mono'>MeetingVoice-TWA</font> (excepto las carpetas ocultas <font name='Mono'>.gradle</font>, <font name='Mono'>.idea</font>)",
        "Pulsa <b>Commit changes</b>",
    ]))
    story.append(info_box(
        "<b>Importante:</b> la carpeta <font name='Mono'>.github/workflows/build-apk.yml</font> "
        "DEBE subirse — es la que define la compilación automática. Asegúrate de que se "
        "sube completa."
    ))

    story.append(Paragraph("4.2 Opción por línea de comandos (Git)", style_h2))
    story.append(code_block(
        "# En tu PC, dentro de la carpeta MeetingVoice-TWA:\n"
        "cd /ruta/a/MeetingVoice-TWA\n"
        "\n"
        "# Inicializa git (si no está ya)\n"
        "git init\n"
        "git add .\n"
        "git commit -m \"Proyecto TWA inicial\"\n"
        "\n"
        "# Conecta con tu repo de GitHub (cambia TU_USUARIO por el tuyo)\n"
        "git branch -M main\n"
        "git remote add origin https://github.com/TU_USUARIO/meetingvoice-twa.git\n"
        "git push -u origin main"
    ))

    # === 5. Configurar URL ===
    story.append(PageBreak())
    story.append(Paragraph("5. Configurar tu URL en el AndroidManifest", style_h1))
    story.append(Paragraph(
        "Una vez subido el proyecto, tienes que editar el archivo "
        "<font name='Mono'>AndroidManifest.xml</font> desde la web de GitHub para poner tu URL. "
        "No hace falta clonar el repo a tu PC, puedes editarlo online:",
        style_body
    ))
    story.append(bullets([
        "Ve a tu repo en GitHub: <font name='Mono'>https://github.com/TU_USUARIO/meetingvoice-twa</font>",
        "Navega a <font name='Mono'>app/src/main/AndroidManifest.xml</font>",
        "Pulsa el icono del lápiz ✏️ (Edit file) en la esquina superior derecha",
        "Busca estas dos líneas y reemplaza <font name='Mono'>tu-dominio.com</font> por tu URL real:",
    ]))
    story.append(code_block(
        '<meta-data\n'
        '    android:name="android.support.customtabs.trusted.DEFAULT_URL"\n'
        '    android:value="https://meetingvoice.vercel.app" />\n'
        '\n'
        '<data\n'
        '    android:scheme="https"\n'
        '    android:host="meetingvoice.vercel.app" />'
    ))
    story.append(bullets([
        "Pulsa <b>Commit changes</b> (verde, arriba a la derecha)",
        "Añade un mensaje del commit como: <font name='Mono'>Configurar URL de la PWA</font>",
        "Pulsa <b>Commit changes</b> de nuevo",
    ]))

    # === 6. Disparar build ===
    story.append(PageBreak())
    story.append(Paragraph("6. Disparar el primer build", style_h1))
    story.append(Paragraph(
        "Al hacer el commit del paso anterior, GitHub Actions debería disparar automáticamente "
        "el build. Para verlo:",
        style_body
    ))
    story.append(bullets([
        "En tu repo, pulsa la pestaña <b>Actions</b> (arriba, entre 'Projects' y 'Wiki')",
        "Verás un workflow llamado <b>Build APK (TWA)</b> en marcha (círculo amarillo girando)",
        "Pulsa encima para ver el detalle",
        "Verás el job <b>Build TWA APK</b> — pulsa encima",
        "Aparecerán los pasos: Checkout, Setup JDK, Setup Android SDK, Build...",
        "El primer build tarda <b>~10 minutos</b> (descarga el SDK de Android la primera vez)",
        "Cuando termine, aparecerá ✅ verde",
    ]))
    story.append(info_box(
        "<b>¿No se disparó el build?</b> Si has subido los archivos por la web sin incluir "
        "la carpeta <font name='Mono'>.github/workflows/</font>, no se ejecutará. Asegúrate "
        "de que el archivo <font name='Mono'>.github/workflows/build-apk.yml</font> existe "
        "en tu repo en esa ruta exacta."
    ))
    story.append(Paragraph(
        "También puedes dispararlo manualmente: pestaña <b>Actions</b> → selecciona "
        "<b>Build APK (TWA)</b> en el menú izquierdo → pulsa <b>Run workflow</b> → "
        "<b>Run workflow</b>.",
        style_body
    ))

    # === 7. Descargar APK ===
    story.append(PageBreak())
    story.append(Paragraph("7. Descargar el APK", style_h1))
    story.append(Paragraph(
        "Una vez que el build ha terminado correctamente, el APK queda guardado como un "
        "<b>artifact</b> (archivo adjunto del build) durante 30 días. Para descargarlo:",
        style_body
    ))
    story.append(bullets([
        "Ve a la pestaña <b>Actions</b> en tu repo",
        "Pulsa sobre el último run del workflow (el que tiene ✅ verde)",
        "Abajo del todo, en la sección <b>Artifacts</b>, verás <b>meetingvoice-apk</b>",
        "Pulsa encima → se descargará un ZIP",
        "Descomprime el ZIP — dentro está <font name='Mono'>app-debug.apk</font>",
    ]))
    story.append(info_box(
        "<b>APK de debug vs release:</b> el APK de debug NO está firmado con un keystore "
        "propio, está firmado con una clave de debug genérica de Android. Esto significa "
        "que <b>se puede instalar en cualquier móvil</b> (aceptando 'origen desconocido'), "
        "pero <b>no se puede subir a Google Play</b>. Para Play Store necesitas firmar con "
        "tu propio keystore — lo vemos en la sección 8."
    ))

    # === 8. Firmar el APK ===
    story.append(PageBreak())
    story.append(Paragraph("8. Firmar el APK (necesario para distribuir)", style_h1))
    story.append(Paragraph(
        "Para tener un APK que puedas distribuir libremente y que además puedas subir a "
        "Google Play, necesitas firmarlo con un <b>keystore</b> propio. El keystore es un "
        "archivo <font name='Mono'>.jks</font> que contiene tu clave criptográfica. Es "
        "<b>crítico</b> que lo guardes bien: si lo pierdes, no podrás actualizar tu app en "
        "Play Store.",
        style_body
    ))

    story.append(Paragraph("8.1 Generar tu keystore", style_h2))
    story.append(Paragraph(
        "Necesitas tener Java instalado en tu PC (si no lo tienes, descárgalo de "
        "<font name='Mono'>https://adoptium.net</font>). Abre una terminal y ejecuta:",
        style_body
    ))
    story.append(code_block(
        'keytool -genkey -v -keystore meetingvoice.jks -keyalg RSA -keysize 2048 -validity 10000 -alias meetingvoice\n'
        '\n'
        '# Te pedirá:\n'
        '# 1. Contraseña del keystore (¡apúntala!)\n'
        '# 2. Repite la contraseña\n'
        '# 3. Nombre y apellido (puede ser tu nombre)\n'
        '# 4. Unidad organizativa (puedes dejar vacío con Enter)\n'
        '# 5. Organización (puedes dejar vacío)\n'
        '# 6. Ciudad\n'
        '# 7. Estado / Provincia\n'
        '# 8. Código de país (ES para España)\n'
        '# 9. Confirma con "sí"\n'
        '\n'
        '# Se generará el archivo meetingvoice.jks en la carpeta actual\n'
        '# ¡GUÁRDALO EN UN SITIO SEGURO! Haz copia en Drive/Dropbox.'
    ))

    story.append(Paragraph("8.2 Codificar el keystore en base64", style_h2))
    story.append(Paragraph(
        "GitHub no acepta archivos binarios como secrets, así que hay que codificar el "
        "keystore en texto. En una terminal:",
        style_body
    ))
    story.append(code_block(
        '# Linux / Mac / Git Bash en Windows:\n'
        'base64 meetingvoice.jks > keystore-base64.txt\n'
        '\n'
        '# Windows PowerShell:\n'
        '[Convert]::ToBase64String([IO.File]::ReadAllBytes("meetingvoice.jks")) > keystore-base64.txt\n'
        '\n'
        '# El archivo keystore-base64.txt contendrá una cadena muy larga\n'
        '# Ábrelo con un editor de texto y cópiala entera'
    ))

    story.append(Paragraph("8.3 Configurar los secrets en GitHub", style_h2))
    story.append(bullets([
        "Ve a tu repo en GitHub",
        "Pestaña <b>Settings</b> (arriba a la derecha, solo visible si eres owner)",
        "Menú izquierdo: <b>Secrets and variables → Actions</b>",
        "Pulsa <b>New repository secret</b> y añade estos 4 secrets:",
    ]))
    secrets_data = [
        ["Nombre del secret", "Valor"],
        ["KEYSTORE_BASE64", "Contenido de keystore-base64.txt (cadena muy larga)"],
        ["KEYSTORE_PASSWORD", "La contraseña que pusiste al crear el keystore"],
        ["KEY_ALIAS", "meetingvoice (o el alias que pusiste)"],
        ["KEY_PASSWORD", "La contraseña de la clave (suele ser la misma que la del keystore)"],
    ]
    tbl = Table(secrets_data, colWidths=[5*cm, 11*cm])
    tbl.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Bold", 9),
        ("FONT", (0, 1), (-1, -1), "Mono", 9),
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT_BG),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("8.4 Disparar un nuevo build (esta vez firmado)", style_h2))
    story.append(Paragraph(
        "Con los secrets configurados, el siguiente build generará un APK firmado. Para "
        "dispararlo: pestaña <b>Actions</b> → <b>Build APK (TWA)</b> → <b>Run workflow</b>.",
        style_body
    ))
    story.append(Paragraph(
        "Cuando termine, descarga el artifact como en la sección 7. Esta vez dentro del ZIP "
        "habrá <b>dos APKs</b>: <font name='Mono'>app-debug.apk</font> (sin firmar) y "
        "<font name='Mono'>app-release.apk</font> (firmado y distribuible). <b>Usa el release</b>.",
        style_body
    ))

    # === 9. Instalar en el móvil ===
    story.append(PageBreak())
    story.append(Paragraph("9. Instalar el APK en tu móvil Android", style_h1))
    story.append(Paragraph(
        "Una vez descargado <font name='Mono'>app-release.apk</font>, puedes instalarlo en "
        "cualquier móvil Android sin necesidad de Play Store. Formas de pasarlo al móvil:",
        style_body
    ))
    story.append(bullets([
        "<b>Email:</b> envíatelo por Gmail. Ábrelo desde el móvil y pulsa 'Instalar'.",
        "<b>Google Drive / Dropbox:</b> súbelo, descárgalo en el móvil, ábrelo.",
        "<b>USB:</b> copia el archivo al almacenamiento del móvil, ábrelo desde el explorador de archivos.",
        "<b>Telegram / WhatsApp:</b> envíatelo a ti mismo en un chat privado (soporta hasta 2 GB).",
    ]))
    story.append(Paragraph(
        "La primera vez que intentes instalar un APK de origen desconocido, Android mostrará "
        "un aviso de seguridad. Para permitirlo:",
        style_body
    ))
    story.append(bullets([
        "Pulsa <b>Ajustes</b> en el aviso.",
        "Activa <b>Permitir desde esta fuente</b> (o <b>Instalar apps desconocidas</b>).",
        "Vuelve atrás y pulsa <b>Instalar</b>.",
        "Cuando termine, pulsa <b>Abrir</b>. ¡MeetingVoice ya es una app nativa en tu móvil!",
    ]))
    story.append(info_box(
        "<b>Importante sobre assetlinks.json:</b> si quieres que la app se abra SIN la barra "
        "de Chrome con tu dominio, debes subir el archivo <font name='Mono'>assetlinks.json</font> "
        "a <font name='Mono'>https://tu-dominio.com/.well-known/assetlinks.json</font>. "
        "El contenido debe incluir la huella SHA256 de tu keystore. Cómo obtenerla: "
        "<font name='Mono'>keytool -list -v -keystore meetingvoice.jks -alias meetingvoice</font> "
        "y copia la línea SHA256.",
        style_warn
    ))

    # === 10. Compilaciones automáticas ===
    story.append(PageBreak())
    story.append(Paragraph("10. Compilaciones automáticas", style_h1))
    story.append(Paragraph(
        "Una vez configurado, cada vez que hagas un commit en tu rama principal, GitHub "
        "Actions compilará automáticamente un APK nuevo. Esto significa que si cambias el "
        "icono, los colores, o la URL de tu PWA, basta con hacer commit y esperar ~10 min "
        "para tener el nuevo APK listo en la sección Actions.",
        style_body
    ))
    story.append(bullets([
        "Cambia algo en el código (icono, color, URL, etc.)",
        "Haz commit y push: <font name='Mono'>git add . && git commit -m \"Nuevo icono\" && git push</font>",
        "Espera a que termine el build (~10 min)",
        "Descarga el nuevo APK desde Actions",
        "Instálalo encima del anterior (Android lo reemplazará)",
    ]))
    story.append(info_box(
        "<b>Límites gratuitos:</b> repositorios públicos = minutos ilimitados. Repositorios "
        "privados = 2.000 minutos/mes. Un build de TWA consume ~10 minutos, así que en un "
        "repo privado podrías hacer ~200 builds al mes. Suficiente para iterar."
    ))

    # === 11. PWABuilder ===
    story.append(PageBreak())
    story.append(Paragraph("11. Alternativa: PWABuilder (aún más fácil)", style_h1))
    story.append(Paragraph(
        "Si GitHub Actions te parece demasiado técnico, hay una alternativa web que es "
        "<b>incluso más fácil</b>: <b>PWABuilder</b>, una herramienta oficial de Microsoft "
        "que genera el APK desde una web sin que tengas que tocar Git ni comandos.",
        style_body
    ))
    story.append(Paragraph("11.1 Pasos", style_h2))
    story.append(bullets([
        "Publica tu PWA en Vercel/Netlify (ver sección 3).",
        "Ve a <font name='Mono'>https://www.pwabuilder.com</font>",
        "Pega tu URL → pulsa <b>Start</b>",
        "PWABuilder analiza tu PWA y muestra una puntuación",
        "En la sección <b>Android</b> → pulsa <b>Options</b>",
        "Configura: Package ID, nombre, etc.",
        "Marca <b>New signing key</b> (PWABuilder la crea por ti)",
        "Pulsa <b>Generate</b>",
        "Descarga el ZIP — dentro está el APK firmado",
    ]))
    story.append(Paragraph("11.2 Comparativa rápida", style_h2))
    comp_data = [
        ["Aspecto", "PWABuilder", "GitHub Actions"],
        ["Dificultad", "⭐ Muy fácil", "⭐⭐⭐ Media"],
        ["Tiempo primer APK", "5 min", "30-45 min"],
        ["Requiere Git", "No", "Sí"],
        ["Requiere GitHub", "No", "Sí"],
        ["Automático en updates", "No (manual)", "Sí (en cada commit)"],
        ["Coste", "0€", "0€"],
        ["Mejor para", "Empezar rápido", "Mantenimiento a largo plazo"],
    ]
    ct = Table(comp_data, colWidths=[4.5*cm, 5.75*cm, 5.75*cm])
    ct.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "Bold", 9),
        ("FONT", (0, 1), (-1, -1), "Regular", 10),
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT_BG),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
    ]))
    story.append(ct)
    story.append(Spacer(1, 0.4*cm))

    # === Cierre ===
    story.append(Paragraph("Recomendación final", style_h2))
    story.append(info_box(
        "<b>Si tienes prisa</b> → usa <b>PWABuilder</b>. En 5 minutos tienes APK, sin GitHub "
        "ni comandos.<br/><br/>"
        "<b>Si quieres automatizar</b> a largo plazo → configura <b>GitHub Actions</b> una "
        "vez, y luego cada cambio se compila solo.<br/><br/>"
        "<b>Lo mejor de los dos mundos</b>: empieza con PWABuilder para validar que tu PWA "
        "funciona como app, y cuando vayas a iterar (cambiar icono, colores, etc.) migra "
        "a GitHub Actions para tener builds automáticos.",
        style_success
    ))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(
        "Con cualquiera de las dos opciones obtendrás un APK instalable en cualquier móvil "
        "Android, sin necesidad de permisos de administrador en tu PC, y sin coste alguno. "
        "El siguiente paso sería publicar en Google Play Store (25 € únicos) si quieres "
        "llegar a usuarios que no conocen tu app — pero eso ya es totalmente opcional.",
        style_body
    ))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"✓ PDF generado: {out}")
    print(f"  Tamaño: {os.path.getsize(out) / 1024:.1f} KB")


if __name__ == "__main__":
    build()
