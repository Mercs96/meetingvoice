# ProGuard rules — qué código no ofuscar al compilar release.
# Por defecto, para una TWA simple no necesitas tocar nada.

# Mantener clases que se usan por reflexión (raro en TWA)
-keep class com.meetingvoice.app.** { *; }

# Google Play Services / Browser Helper
-keep class com.google.androidbrowserhelper.** { *; }
