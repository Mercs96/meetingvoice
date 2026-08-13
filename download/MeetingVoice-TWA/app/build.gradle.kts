// app/build.gradle.kts — Configuración del módulo app (la app Android real)
// Aquí defines el package ID, versiones, dependencias, permisos, etc.

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.meetingvoice.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.meetingvoice.app"
        minSdk = 24          // Android 7.0 — mínimo razonable hoy
        targetSdk = 34       // Android 14
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables { useSupportLibrary = true }
    }

    buildTypes {
        release {
            // IMPORTANTE: Para distribuir la app hay que firmarla.
            // Por defecto debug se firma con clave de debug (auto-generada).
            // Para release necesitas crear un keystore (ver guía PDF).
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    // Trusted Web Activity: envuelve tu PWA como app nativa
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")

    // Core KTX (extensiones Kotlin para AndroidX)
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.2")

    // Material Design (componentes UI nativos si los necesitas)
    implementation("com.google.android.material:material:1.12.0")

    // Tests (no se incluyen en el APK final)
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
