# Executa o Flask a partir da pasta backend do LifeOSV7
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "backend")
if (-not $env:FIREBASE_CREDENTIALS) {
  $env:FIREBASE_CREDENTIALS = "serviceAccountKey.json"
}
python main.py
