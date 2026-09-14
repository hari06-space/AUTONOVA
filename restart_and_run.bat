@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo Restarting Autonoma SQL Server Docker Container...
echo ========================================================
docker restart autonoma-sqlserver
if %ERRORLEVEL% neq 0 (
    echo Failed to restart Docker container. Make sure Docker is running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo Waiting for SQL Server to become ready...
echo ========================================================
:wait_loop
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo SQL Server is starting up... Please wait...
    ping -n 3 127.0.0.1 >nul
    goto wait_loop
)
echo SQL Server is online and ready!

echo.
echo ========================================================
echo Ensuring Databases AUTONOMA, ERPDb_NUTECH and login nutech exist...
echo ========================================================
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AUTONOMA') CREATE DATABASE AUTONOMA; IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ERPDb_NUTECH') CREATE DATABASE ERPDb_NUTECH;"
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'nutech') CREATE LOGIN nutech WITH PASSWORD = 'Secure@2026', DEFAULT_DATABASE = AUTONOMA; ELSE ALTER LOGIN nutech WITH PASSWORD = 'Secure@2026';"
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "USE AUTONOMA; IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'nutech') BEGIN CREATE USER nutech FOR LOGIN nutech; ALTER ROLE db_owner ADD MEMBER nutech; END"
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "USE ERPDb_NUTECH; IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'nutech') BEGIN CREATE USER nutech FOR LOGIN nutech; ALTER ROLE db_owner ADD MEMBER nutech; END"
if %ERRORLEVEL% neq 0 (
    echo Warning: Failed to ensure database or login existence.
)

echo.
echo ========================================================
echo Starting Backend Application...
echo ========================================================
if exist "C:\Users\RANJITH\jdk-21\jdk-21.0.3+9" (
    set "JAVA_HOME=C:\Users\RANJITH\jdk-21\jdk-21.0.3+9"
) else if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
) else if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
) else if exist "C:\Program Files\Android\Android Studio\jbr" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
) else (
    echo Error: JDK 21 not found at C:\Users\RANJITH\jdk-21\jdk-21.0.3+9, Eclipse Adoptium or Android Studio.
    pause
    exit /b 1
)
set SPRING_DATASOURCE_USERNAME=nutech
set SPRING_DATASOURCE_PASSWORD=nutech@2026
set SPRING_SECONDARY_DATASOURCE_USERNAME=nutech
set SPRING_SECONDARY_DATASOURCE_PASSWORD=nutech@2026

cd autonoma-backend
call mvnw.cmd spring-boot:run
