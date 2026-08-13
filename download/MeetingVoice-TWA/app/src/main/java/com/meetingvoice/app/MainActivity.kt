package com.meetingvoice.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.androidbrowserhelper.trusted.LauncherActivity

/**
 * MainActivity — Punto de entrada de la app Android.
 *
 * Hereda de `LauncherActivity` (de la librería androidbrowserhelper de Google),
 * que abre la PWA dentro de una Trusted Web Activity (TWA).
 *
 * Antes de abrir la TWA, pedimos permiso de micrófono — sin él, la PWA
 * no podrá grabar audio.
 *
 * Flujo:
 *  1. onCreate → comprueba permiso de micrófono
 *  2. Si no tiene permiso → lo pide
 *  3. Si lo tiene → super.onCreate() abre la TWA en Chrome
 *  4. Si el usuario rechaza → muestra diálogo con explicación + botón a Ajustes
 */
class MainActivity : LauncherActivity() {

    companion object {
        private const val REQUEST_MIC_PERMISSION = 1001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Si no tiene permiso de micrófono, lo pedimos ANTES de abrir la TWA.
        if (!hasMicPermission()) {
            requestMicPermission()
            // No llamamos a super.onCreate todavía; se llamará en onRequestPermissionsResult
        } else {
            super.onCreate(savedInstanceState)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        when (requestCode) {
            REQUEST_MIC_PERMISSION -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // Permiso concedido → ahora sí abrimos la TWA
                    super.onCreate(null)
                    // Forzamos re-arranque del flujo de LauncherActivity
                    val intent = Intent(this, MainActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                    finish()
                } else {
                    // Permiso denegado → mostrar diálogo
                    showPermissionDeniedDialog()
                }
            }
        }
    }

    private fun hasMicPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestMicPermission() {
        if (ActivityCompat.shouldShowRequestPermissionRationale(
                this,
                Manifest.permission.RECORD_AUDIO
            )
        ) {
            // El usuario ya rechazó una vez → mostramos explicación antes de volver a pedir
            AlertDialog.Builder(this)
                .setTitle(R.string.app_name)
                .setMessage(R.string.permission_mic_rationale)
                .setPositiveButton("Permitir") { _, _ ->
                    ActivityCompat.requestPermissions(
                        this,
                        arrayOf(Manifest.permission.RECORD_AUDIO),
                        REQUEST_MIC_PERMISSION
                    )
                }
                .setNegativeButton("Cancelar") { _, _ ->
                    showPermissionDeniedDialog()
                }
                .setCancelable(false)
                .show()
        } else {
            // Primera vez → pedir directamente
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                REQUEST_MIC_PERMISSION
            )
        }
    }

    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.app_name)
            .setMessage(R.string.permission_mic_denied)
            .setPositiveButton("Abrir Ajustes") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", packageName, null)
                }
                startActivity(intent)
                finish()
            }
            .setNegativeButton("Salir") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }
}
