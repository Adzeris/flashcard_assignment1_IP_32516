Set-Location -Path "$PSScriptRoot\backend"
if (Test-Path ".\venv\Scripts\Activate.ps1") { . .\venv\Scripts\Activate.ps1 }
python -m uvicorn main:app --reload --reload-dir .
