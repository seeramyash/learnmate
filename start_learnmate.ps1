$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root "venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = Join-Path $root ".venv\Scripts\python.exe"
}

if (-not (Test-Path $python)) {
    Write-Error "Virtual environment Python not found at $python"
}

$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$hhBackendDir = Join-Path $root "Her-Haven-main\chat_bot\r3f-virtual-girlfriend-backend-main"
$hhFrontendDir = Join-Path $root "Her-Haven-main\chat_bot\r3f-virtual-girlfriend-frontend-main"

$backendArgs = @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000")
$frontendArgs = @("-m", "http.server", "5500", "--bind", "127.0.0.1")

Start-Process -FilePath $python -ArgumentList $backendArgs -WorkingDirectory $backendDir
Start-Process -FilePath $python -ArgumentList $frontendArgs -WorkingDirectory $frontendDir
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "start" -WorkingDirectory $hhBackendDir
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort" -WorkingDirectory $hhFrontendDir

Write-Host "LearnMate started."
Write-Host "Backend:  http://127.0.0.1:8000/health"
Write-Host "Frontend: http://127.0.0.1:5500"
Write-Host "Her-Haven Backend: http://127.0.0.1:3333"
Write-Host "Her-Haven Frontend: http://localhost:5173"

