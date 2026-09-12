$extensions = @('*.jsx','*.js','*.html','*.json','*.md','*.bat','*.vbs','*.ps1','*.css')
$searchPaths = @('frontend\src','server','frontend\index.html')

$replacements = @(
  @{ From = 'TIORAS FASHIONS'; To = 'PAVATI OS' },
  @{ From = 'TIORAS FASHION PVT LTD'; To = 'PAVATI OS PVT LTD' },
  @{ From = 'TIORAS FASHION STUDIO'; To = 'PAVATI OS STUDIO' },
  @{ From = 'TIORAS POS'; To = 'PAVATI OS' },
  @{ From = 'TIORAS RETAIL'; To = 'PAVATI OS' },
  @{ From = 'TIORAS'; To = 'PAVATI OS' },
  @{ From = 'Fashion Studio'; To = 'Powered by PAVATI OS' },
  @{ From = 'retail-pos'; To = 'pavati-os' },
  @{ From = 'Retail POS'; To = 'PAVATI OS' }
)

$files = @()
foreach ($path in $searchPaths) {
  if (Test-Path $path -PathType Leaf) {
    $files += Get-Item $path
  } else {
    foreach ($ext in $extensions) {
      $files += Get-ChildItem -Path $path -Recurse -Include $ext -ErrorAction SilentlyContinue
    }
  }
}

$changed = 0
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
  if ($null -eq $content) { continue }
  $original = $content
  foreach ($r in $replacements) {
    $content = $content -replace [regex]::Escape($r.From), $r.To
  }
  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($file.FullName)"
    $changed++
  }
}

Write-Host "Done. $changed files updated."
