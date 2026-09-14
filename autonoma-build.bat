@echo off
REM Alias for Autonoma Build
call "%~dp0Autonoma.bat" Build %*
exit /b %ERRORLEVEL%
