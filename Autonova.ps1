param(
    [string]$Command = "Build"
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot
$FrontendDir = Join-Path $RootDir "autonoma-frontend"
$BackendDir = Join-Path $RootDir "autonoma-backend"
$StaticDir = Join-Path $BackendDir "src\main\resources\static"
$FrontendDistDir = Join-Path $FrontendDir "dist"
$BackendTargetDir = Join-Path $BackendDir "target"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Autonova Build System - Frontend + Backend Build" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if ($Command -and $Command -ine "build") {
    Write-Host "[ERROR] Unknown command argument: $Command" -ForegroundColor Red
    Write-Host "Usage: Autonova Build" -ForegroundColor Yellow
    exit 1
}

# 1. Clean & Build Frontend
Write-Host "[1/3] Step 1: Cleaning & Building Frontend (autonoma-frontend)..." -ForegroundColor Yellow
Set-Location $FrontendDir

if (Test-Path $FrontendDistDir) {
    Write-Host "Cleaning previous frontend dist directory..."
    Remove-Item -Path $FrontendDistDir -Recurse -Force -ErrorAction SilentlyContinue
}

try {
    cmd.exe /c "npm run build"
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "[ERROR] Frontend build failed!" -ForegroundColor Red
    Write-Host "Stopping build process. Backend build will NOT execute." -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendDistDir)) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "[ERROR] Frontend dist directory was not generated!" -ForegroundColor Red
    Write-Host "Expected path: $FrontendDistDir" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Frontend build completed successfully." -ForegroundColor Green
Write-Host ""

# 2. Clean & Copy Frontend Dist to Backend Static
Write-Host "[2/3] Step 2: Cleaning & Syncing Frontend dist to Backend static resources..." -ForegroundColor Yellow
Write-Host "Target: $StaticDir"

if (Test-Path $StaticDir) {
    Write-Host "Cleaning existing backend static directory..."
    Remove-Item -Path $StaticDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $StaticDir -Force | Out-Null

Write-Host "Copying fresh frontend dist contents..."
Copy-Item -Path "$FrontendDistDir\*" -Destination $StaticDir -Recurse -Force
Write-Host "[SUCCESS] Fresh Frontend dist copied to backend static resources." -ForegroundColor Green
Write-Host ""

# 3. Clean & Build Backend
Write-Host "[3/3] Step 3: Cleaning & Building Backend (autonoma-backend)..." -ForegroundColor Yellow
Set-Location $BackendDir

# Safely stop any running Java processes holding locks on target directory / error.log
try {
    Get-Process -Name "javaw", "java" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*jdk*" -or $_.CommandLine -like "*autonoma*" -or $_.CommandLine -like "*Autonova.jar*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
} catch {}

# Explicitly delete target folder before fresh build generation
if (Test-Path $BackendTargetDir) {
    Write-Host "Deleting existing backend target folder..." -ForegroundColor Cyan
    Remove-Item -Path $BackendTargetDir -Recurse -Force -ErrorAction SilentlyContinue
}

try {
    if (Get-Command "mvn" -ErrorAction SilentlyContinue) {
        cmd.exe /c "mvn clean package -DskipTests"
    } else {
        cmd.exe /c "mvnw.cmd clean package -DskipTests"
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Backend Maven build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "[ERROR] Backend Maven build failed!" -ForegroundColor Red
    Write-Host "Tip: If target folder is locked, please ensure backend server (java.exe) is stopped." -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] Autonova Complete Build Successful!" -ForegroundColor Green
Write-Host "Final JAR output: $BackendDir\target\Autonova.jar" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Set-Location $RootDir
exit 0
