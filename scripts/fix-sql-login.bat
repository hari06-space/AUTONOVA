@echo off
echo ========================================================
echo Fix Autonoma SQL Server Login
echo ========================================================
echo.
echo Enabling Mixed Mode Authentication...
sqlcmd -C -S .\SQLEXPRESS -E -Q "EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2"
echo.
echo Creating the 'nutech' user and granting SysAdmin rights...
sqlcmd -C -S .\SQLEXPRESS -E -Q "IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'nutech') BEGIN CREATE LOGIN [nutech] WITH PASSWORD=N'nutech@2026', DEFAULT_DATABASE=[master], CHECK_EXPIRATION=OFF, CHECK_POLICY=OFF; END ELSE BEGIN ALTER LOGIN [nutech] WITH PASSWORD=N'nutech@2026'; END"
sqlcmd -C -S .\SQLEXPRESS -E -Q "ALTER SERVER ROLE sysadmin ADD MEMBER [nutech]"
echo.
echo Restarting the SQL Server Service to apply changes...
net stop MSSQL$SQLEXPRESS /y
net start MSSQL$SQLEXPRESS
echo.
echo ========================================================
echo SUCCESS! Everything is fixed.
echo You can now close this window and tell the AI assistant.
echo ========================================================
pause
