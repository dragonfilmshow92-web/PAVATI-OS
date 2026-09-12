$wsh = New-Object -ComObject WScript.Shell
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    "C:\Users\dell\Desktop",
    "C:\Users\dell\OneDrive\Desktop"
) | Select-Object -Unique

foreach ($desktop in $desktopPaths) {
    if (Test-Path $desktop) {
        $oldShortcut = Join-Path $desktop "PAVATI OS.lnk"
        if (Test-Path $oldShortcut) {
            Remove-Item $oldShortcut -Force -ErrorAction SilentlyContinue
        }

        $shortcutPath = Join-Path $desktop "PAVATI OS.lnk"
        $shortcut = $wsh.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "c:\Users\dell\erpnext\retail-pos\launch-desktop-app.vbs"
        $shortcut.WorkingDirectory = "c:\Users\dell\erpnext\retail-pos"
        $shortcut.IconLocation = "c:\Users\dell\erpnext\retail-pos\client\app-icon.ico"
        $shortcut.Description = "PAVATI OS - Enterprise Retail Point of Sale"
        $shortcut.Save()
        Write-Host "Desktop shortcut created successfully at: $shortcutPath"
    }
}
