$ErrorActionPreference = "Stop"
$raw = git -C "D:\hamid" show ea551ae:src/app/[locale]/about/page.tsx
# git returns an array of strings (lines). Join them and encode as UTF-8 no BOM.
$text = ($raw -join "`r`n")
$bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($text)
[System.IO.File]::WriteAllBytes("D:\hamid\clean-about-raw.bin", $bytes)

$bytes = [System.IO.File]::ReadAllBytes("D:\hamid\clean-about-raw.bin")
$pat = [System.Text.Encoding]::UTF8.GetBytes('title: `')
$idx = -1
for ($i = 0; $i -lt $bytes.Length - $pat.Length; $i++) {
  $match = $true
  for ($j = 0; $j -lt $pat.Length; $j++) { if ($bytes[$i+$j] -ne $pat[$j]) { $match = $false; break } }
  if ($match) { $idx = $i; break }
}
if ($idx -ge 0) {
  $slice = $bytes[($idx+7)..($idx+40)]
  $hex = ($slice | ForEach-Object { $_.ToString("X2") }) -join ' '
  Write-Output $hex
  Write-Output "---"
  Write-Output ([System.Text.Encoding]::UTF8.GetString($slice))
} else {
  Write-Output "title: not found"
}
