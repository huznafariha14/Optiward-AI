# MediTrack AI — Automated Development Runner Script
# Configured for windows portable environment execution

$ErrorActionPreference = "Stop"

# Clear terminal screen
Clear-Host

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "        🏥 MEDITRACK AI: REAL-TIME HOSPITAL PORTAL        " -ForegroundColor Cyan -Bold
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Configuring portable developer paths..." -ForegroundColor DarkGray

# Prepend portable Node.js to environment PATH
$NodeDir = "d:\Antigravity_Proj\node-portable\node-v20.12.2-win-x64"
if (Test-Path $NodeDir) {
    $env:PATH = "$NodeDir;$env:PATH"
    Write-Host "✔ Portable Node.js v20.12.2 set in execution PATH." -ForegroundColor Green
} else {
    Write-Host "⚠ Portable Node.js directory not found. Standard system path will be used." -ForegroundColor Yellow
}

# Verify Node and NPM executable
try {
    $nodeVer = node -v
    $npmVer = npm -v
    Write-Host "✔ Node Version: $nodeVer | NPM Version: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "✖ Node.js was not found in PATH or environment. Cannot launch application." -ForegroundColor Red
    Exit 1
}

# Helper to check if a Port is already listening
function Test-PortActive($Port) {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# Verify ports are clear
Write-Host "`nChecking address binding buffers..." -ForegroundColor DarkGray
if (Test-PortActive 5000) {
    Write-Host "⚠ WARNING: Port 5000 is already in use on this machine." -ForegroundColor Yellow
    Write-Host "Attempting to locate and release active listener..." -ForegroundColor DarkGray
    try {
        $portProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
        if ($portProcess) {
            Stop-Process -Id $portProcess -Force
            Write-Host "✔ Released port 5000 (PID $portProcess)." -ForegroundColor Green
        }
    } catch {
        Write-Host "✖ Failed to release Port 5000 automatically. Please terminate active listeners." -ForegroundColor Red
    }
}
if (Test-PortActive 5173) {
    Write-Host "⚠ WARNING: Port 5173 (Vite default) is already in use." -ForegroundColor Yellow
    try {
        $portProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
        if ($portProcess) {
            Stop-Process -Id $portProcess -Force
            Write-Host "✔ Released port 5173 (PID $portProcess)." -ForegroundColor Green
        }
    } catch { }
}

Write-Host "`nBooting application servers..." -ForegroundColor Cyan

# 1. Launch Express Backend Server in Background Job
Write-Host "Starting Express API Backend (Port 5000)..." -ForegroundColor DarkGray
$ServerJob = Start-Job -ScriptBlock {
    $env:PATH = $using:env:PATH
    Set-Location "d:\Antigravity_Proj\MediTrack\server"
    node server.js
}

# 2. Launch Vite React Frontend Server in Background Job
Write-Host "Starting Vite React Frontend (Port 5173)..." -ForegroundColor DarkGray
$ClientJob = Start-Job -ScriptBlock {
    $env:PATH = $using:env:PATH
    Set-Location "d:\Antigravity_Proj\MediTrack\client"
    npm run dev
}

# Bounded wait for booting
Start-Sleep -Seconds 4

# Verify background jobs are running
$serverState = Get-Job -Id $ServerJob.Id
$clientState = Get-Job -Id $ClientJob.Id

if ($serverState.State -eq "Failed" -or $clientState.State -eq "Failed") {
    Write-Host "`n✖ Failed to boot servers in the background. Job dump:" -ForegroundColor Red
    Receive-Job -Job $ServerJob
    Receive-Job -Job $ClientJob
    Stop-Job * -ErrorAction SilentlyContinue
    Exit 1
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "       ✔ APPLICATION BOOTSTRAP COMPLETED SUCCESSFULLY     " -ForegroundColor Green -Bold
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "    ✦ Backend Server API  : http://localhost:5000" -ForegroundColor Cyan
Write-Host "    ✦ Frontend Dashboard  : http://localhost:5173" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Opening MediTrack AI Portal in your web browser..." -ForegroundColor DarkGray

# Open default browser
Start-Process "http://localhost:5173"

Write-Host "`nPress ANY key to gracefully terminate servers and exit..." -ForegroundColor Yellow

# Wait for keypress
[void][System.Console]::ReadKey($true)

Write-Host "`nStopping background clinical engines..." -ForegroundColor DarkGray
Stop-Job -Job $ServerJob -ErrorAction SilentlyContinue
Stop-Job -Job $ClientJob -ErrorAction SilentlyContinue
Remove-Job -Job $ServerJob -ErrorAction SilentlyContinue
Remove-Job -Job $ClientJob -ErrorAction SilentlyContinue

Write-Host "✔ Servers terminated cleanly. Goodbye!" -ForegroundColor Green
