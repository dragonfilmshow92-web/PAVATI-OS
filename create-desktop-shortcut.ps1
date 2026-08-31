$wsh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "Tioras POS.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "c:\Users\dell\erpnext\retail-pos\launch-desktop-app.vbs"
$shortcut.WorkingDirectory = "c:\Users\dell\erpnext\retail-pos"
$shortcut.IconLocation = "c:\Users\dell\erpnext\retail-pos\client\app-icon.ico"
$shortcut.Description = "Tioras Fashion Studio & Retail POS OS"
$shortcut.Save()
Write-Host "Desktop shortcut created successfully at: $shortcutPath"
