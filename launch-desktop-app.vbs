Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\dell\erpnext\retail-pos"
WshShell.Run "cmd /c ""c:\Users\dell\erpnext\retail-pos\launch-desktop-app.bat""", 0, False
