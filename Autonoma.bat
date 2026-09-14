@echo off
setlocal enabledelayedexpansion

REM Set root directory based on script location
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "FRONTEND_DIR=%ROOT_DIR%\autonoma-frontend"
set "BACKEND_DIR=%ROOT_DIR%\autonoma-backend"
set "STATIC_DIR=%BACKEND_DIR%\src\main\resources\static"
set "FRONTEND_DIST=%FRONTEND_DIR%\dist"
set "BACKEND_TARGET=%BACKEND_DIR%\target"

echo ========================================================
echo   Autonoma Build System - Frontend + Backend Build
echo ========================================================
echo.

REM Command argument check (e.g., Autonoma Build)
if not "%~1"=="" (
    if /i not "%~1"=="build" (
        echo [ERROR] Unknown command argument: %~1
        echo Usage: Autonoma Build
        exit /b 1
    )
)

echo [1/3] Step 1: Cleaning & Building Frontend (autonoma-frontend)...
cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to navigate to frontend directory: %FRONTEND_DIR%
    exit /b 1
)

if exist "%FRONTEND_DIST%" (
    echo Cleaning previous frontend dist directory...
    rd /s /q "%FRONTEND_DIST%"
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Frontend build failed with exit code %ERRORLEVEL%!
    echo Stopping build process. Backend build will NOT execute.
    echo ========================================================
    exit /b %ERRORLEVEL%
)

if not exist "%FRONTEND_DIST%" (
    echo.
    echo ========================================================
    echo [ERROR] Frontend dist directory was not generated!
    echo Expected path: %FRONTEND_DIST%
    echo Stopping build process. Backend build will NOT execute.
    echo ========================================================
    exit /b 1
)

echo [SUCCESS] Frontend build completed successfully.
echo.

echo [2/3] Step 2: Cleaning & Syncing Frontend dist to Backend static resources...
echo Target: %STATIC_DIR%

if exist "%STATIC_DIR%" (
    echo Cleaning existing backend static directory...
    rd /s /q "%STATIC_DIR%"
)

mkdir "%STATIC_DIR%"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to create static directory: %STATIC_DIR%
    exit /b 1
)

echo Copying fresh frontend dist contents...
xcopy /e /i /y /h "%FRONTEND_DIST%\*" "%STATIC_DIR%\"
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Failed to copy frontend dist files to backend static directory!
    echo Stopping build process. Backend build will NOT execute.
    echo ========================================================
    exit /b %ERRORLEVEL%
)

echo [SUCCESS] Fresh Frontend dist copied to backend static resources.
echo.

echo [3/3] Step 3: Cleaning & Building Backend (autonoma-backend)...
cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to navigate to backend directory: %BACKEND_DIR%
    exit /b 1
)

REM Safely stop running java/javaw processes to release file locks
taskkill /F /IM javaw.exe >nul 2>&1
timeout /t 1 /nobreak >nul 2>&1

REM Explicitly delete target folder before fresh build generation
if exist "%BACKEND_TARGET%" (
    echo Deleting existing backend target folder...
    rd /s /q "%BACKEND_TARGET%" >nul 2>&1
)

where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call mvn clean package -DskipTests
) else (
    call mvnw.cmd clean package -DskipTests
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Backend Maven build failed with exit code %ERRORLEVEL%!
    echo Tip: If target folder is locked, please ensure backend server (java.exe) is stopped.
    echo ========================================================
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo [SUCCESS] Autonoma Complete Build Successful!
echo Final JAR output: %BACKEND_DIR%\target\Autonoma.jar
echo ========================================================
exit /b 0
