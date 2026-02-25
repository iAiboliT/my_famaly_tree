Set WshShell = CreateObject("WScript.Shell")
' Get the current directory of the script
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Path to pythonw.exe in the venv (runs without console)
strPython = strPath & "\venv\Scripts\pythonw.exe"

' Path to the monitor script
strScript = strPath & "\monitor.py"

' Run the command hidden (0)
WshShell.Run chr(34) & strPython & chr(34) & " " & chr(34) & strScript & chr(34), 0
Set WshShell = Nothing
