package com.ohana.chargingplay

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.RingtoneManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.View
import android.view.WindowManager
import android.view.animation.Animation
import android.view.animation.LinearInterpolator
import android.view.animation.RotateAnimation
import androidx.appcompat.app.AppCompatActivity
import com.ohana.chargingplay.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var isFullAlertPlayed = false

    // Real-time battery hardware receiver
    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                val plugged = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1)

                val batteryPct = if (level >= 0 && scale > 0) {
                    (level * 100) / scale
                } else {
                    50
                }

                val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL ||
                        plugged > 0

                val isFull = status == BatteryManager.BATTERY_STATUS_FULL || batteryPct >= 100

                updateUI(batteryPct, isCharging, isFull, plugged)
            }
        }
    }

    // Receiver to auto-close when charger is disconnected
    private val powerDisconnectReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_POWER_DISCONNECTED) {
                // CHARGER UNPLUGGED: Auto Exit immediately!
                finishAndRemoveTask()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 14+ Turn Screen On & Show When Locked
        setupWindowFlags()

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Immersive full-screen (Hide status bar and navigation bar)
        hideSystemUI()

        // Start rotating animation ring
        startRotatingAnimation()

        // Register power disconnect receiver
        val disconnectFilter = IntentFilter(Intent.ACTION_POWER_DISCONNECTED)
        registerReceiver(powerDisconnectReceiver, disconnectFilter)

        // Close button if user wants to exit manually
        binding.btnClose.setOnClickListener {
            finishAndRemoveTask()
        }
    }

    override fun onResume() {
        super.onResume()
        // Register genuine hardware real-time battery listener
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        registerReceiver(batteryReceiver, filter)
    }

    override fun onPause() {
        super.onPause()
        try {
            unregisterReceiver(batteryReceiver)
        } catch (e: Exception) {}
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(powerDisconnectReceiver)
        } catch (e: Exception) {}
    }

    private fun setupWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        // ALWAYS KEEP SCREEN AWAKE WHILE CHARGING!
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
    }

    private fun updateUI(percent: Int, isCharging: Boolean, isFull: Boolean, pluggedType: Int) {
        // JUMBO BATTERY PERCENTAGE
        binding.tvPercentage.text = "$percent"

        // Charging Type details
        val chargeTypeStr = when (pluggedType) {
            BatteryManager.BATTERY_PLUGGED_AC -> "AC FAST CHARGING"
            BatteryManager.BATTERY_PLUGGED_USB -> "USB CHARGING"
            BatteryManager.BATTERY_PLUGGED_WIRELESS -> "WIRELESS CHARGING"
            else -> if (isCharging) "CHARGING" else "NOT CHARGING"
        }

        if (isFull) {
            binding.tvStatus.text = "FULLY CHARGED (100%)"
            binding.tvStatus.setTextColor(getColor(R.color.solar_amber))
            if (!isFullAlertPlayed) {
                playFullAlert()
                isFullAlertPlayed = true
            }
        } else if (isCharging) {
            binding.tvStatus.text = chargeTypeStr
            binding.tvStatus.setTextColor(getColor(R.color.neon_green))
        } else {
            binding.tvStatus.text = "NOT CHARGING"
            binding.tvStatus.setTextColor(getColor(R.color.electric_red))
        }
    }

    private fun startRotatingAnimation() {
        val rotate = RotateAnimation(
            0f, 360f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        ).apply {
            duration = 6000
            repeatCount = Animation.INFINITE
            interpolator = LinearInterpolator()
        }
        binding.ivSpinRing.startAnimation(rotate)
    }

    private fun playFullAlert() {
        try {
            val notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val r = RingtoneManager.getRingtone(applicationContext, notification)
            r.play()

            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(500)
            }
        } catch (e: Exception) {}
    }
}
