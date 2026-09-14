IF DB_ID('AUTONOMA') IS NULL
BEGIN
    CREATE DATABASE AUTONOMA;
END
GO
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'nutech')
BEGIN
    CREATE LOGIN nutech WITH PASSWORD = 'SecretP@ssw0rd2026!';
END
ELSE
BEGIN
    ALTER LOGIN nutech WITH PASSWORD = 'SecretP@ssw0rd2026!';
END
GO
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'nutech')
BEGIN
    CREATE USER nutech FOR LOGIN nutech;
END
GO
ALTER ROLE db_owner ADD MEMBER nutech;
GO
PRINT 'Database AUTONOMA and user nutech initialized!';
