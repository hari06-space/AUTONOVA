@echo off
REM Alias for Autonova Build
call "%~dp0Autonova.bat" Build %*
exit /b %ERRORLEVEL%
