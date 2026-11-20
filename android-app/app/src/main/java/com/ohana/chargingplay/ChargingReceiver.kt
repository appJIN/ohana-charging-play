package com.ohana.chargingplay

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class ChargingReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_POWER_CONNECTED -> {
                // CHARGER CONNECTED: Launch MainActivity immediately!
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    )
                }
                context.startActivity(launchIntent)
            }
            Intent.ACTION_POWER_DISCONNECTED -> {
                // Broadcast handled by MainActivity to close/exit
            }
            Intent.ACTION_BOOT_COMPLETED -> {
                // Ensure receivers are active on device boot
            }
        }
    }
}
