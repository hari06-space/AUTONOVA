@echo off
setlocal

REM Source directory for legacy AUDIT attachments
set SOURCE_DIR=D:\ERPCommon-NuTech\erpimage\AUDIT

REM Target directory in the new ERP uploads folder
REM This assumes the script is run from the `scripts` directory
set TARGET_DIR=..\uploads\MASTER\QMS\Audit\Audit Criteria

echo =======================================================
echo Migrating Audit Criteria attachments
echo From: %SOURCE_DIR%
echo To:   %TARGET_DIR%
echo =======================================================

REM Check if source exists
if not exist "%SOURCE_DIR%" (
    echo Error: Source directory "%SOURCE_DIR%" does not exist.
    exit /b 1
)

REM Create target directory if it doesn't exist
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
    echo Created directory "%TARGET_DIR%"
)

REM Copy files
xcopy "%SOURCE_DIR%\*" "%TARGET_DIR%\" /E /I /Y

if %ERRORLEVEL% EQU 0 (
    echo =======================================================
    echo Migration completed successfully!
    echo =======================================================
) else (
    echo =======================================================
    echo Error occurred during file copy.
    echo =======================================================
)

endlocal
pause
