-- ===================================================================================
-- Migration: 20260723_V1049.0__Standardize_NT_ESSL_eTimeTrackLite_Schema.sql
-- Module: HR / eSSL Biometric Integration (eTimeTrackLite Standard Schema)
-- Purpose: Idempotent migration to remove non-standard custom tables from NT_ESSL database
--          and ensure standard eTimeTrackLite tables (Employees, DeviceLogs, AttendanceLogs,
--          CHECKINOUT, USERINFO, Devices) exist for biometric integration.
-- ===================================================================================

-- 1. Create NT_ESSL Database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'NT_ESSL')
BEGIN
    CREATE DATABASE [NT_ESSL];
END
GO

USE [NT_ESSL];
GO

-- 2. Clean up non-standard / custom AUTONOMA tables from NT_ESSL database
IF OBJECT_ID('dbo.HR_BIOMETRIC_ATTENDANCE', 'U') IS NOT NULL DROP TABLE dbo.HR_BIOMETRIC_ATTENDANCE;
IF OBJECT_ID('dbo.HR_DAILY_ATTENDANCE_LOG', 'U') IS NOT NULL DROP TABLE dbo.HR_DAILY_ATTENDANCE_LOG;
IF OBJECT_ID('dbo.ESSL_ATTENDANCE_LOG', 'U') IS NOT NULL DROP TABLE dbo.ESSL_ATTENDANCE_LOG;
IF OBJECT_ID('dbo.HR_ESSL_ATTENDANCE_LOGS', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_ATTENDANCE_LOGS;
IF OBJECT_ID('dbo.HR_ESSL_CHECKINOUT', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_CHECKINOUT;
IF OBJECT_ID('dbo.HR_ESSL_DEVICE_LOGS', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_DEVICE_LOGS;
IF OBJECT_ID('dbo.HR_ESSL_EMPLOYEES', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_EMPLOYEES;
IF OBJECT_ID('dbo.HR_ESSL_USERINFO', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_USERINFO;
GO

-- 3. Ensure Standard eTimeTrackLite Employees Table Exists
IF OBJECT_ID('dbo.Employees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employees (
        EmployeeId INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeCode VARCHAR(50) NOT NULL,
        EmployeeName VARCHAR(100) NULL,
        EmployeeCodeInDevice VARCHAR(50) NULL,
        CompanyId INT DEFAULT 1,
        DepartmentId INT NULL,
        DesignationId INT NULL,
        CategoryId INT NULL,
        Status VARCHAR(20) DEFAULT 'Working',
        Gender VARCHAR(10) NULL,
        DOJ DATETIME NULL,
        DOB DATETIME NULL,
        CardNo VARCHAR(50) NULL
    );
END
GO

-- 4. Ensure Standard eTimeTrackLite DeviceLogs Table Exists
IF OBJECT_ID('dbo.DeviceLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DeviceLogs (
        DeviceLogId INT IDENTITY(1,1) PRIMARY KEY,
        DownloadDate DATETIME DEFAULT GETDATE(),
        DeviceId INT NULL,
        UserId VARCHAR(50) NOT NULL,
        LogDate DATETIME NOT NULL,
        Direction VARCHAR(20) NULL,
        AttnState VARCHAR(20) NULL,
        WorkCode VARCHAR(50) NULL,
        Verified INT DEFAULT 1,
        Latitude VARCHAR(50) NULL,
        Longitude VARCHAR(50) NULL,
        LocationAddress NVARCHAR(255) NULL,
        EmployeeImage NVARCHAR(500) NULL
    );
END
GO

-- 5. Ensure Standard eTimeTrackLite AttendanceLogs Table Exists
IF OBJECT_ID('dbo.AttendanceLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AttendanceLogs (
        AttendanceLogId INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeId INT NOT NULL,
        AttendanceDate DATE NOT NULL,
        InTime DATETIME NULL,
        OutTime DATETIME NULL,
        Duration DECIMAL(8,2) DEFAULT 0,
        LateBy INT DEFAULT 0,
        EarlyBy INT DEFAULT 0,
        OverTime INT DEFAULT 0,
        StatusCode VARCHAR(20) DEFAULT 'P',
        ShiftId INT NULL,
        Remarks NVARCHAR(255) NULL
    );
END
GO

-- 6. Ensure Standard eTimeTrackLite CHECKINOUT Table Exists
IF OBJECT_ID('dbo.CHECKINOUT', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CHECKINOUT (
        USERID INT NOT NULL,
        CHECKTIME DATETIME NOT NULL,
        CHECKTYPE VARCHAR(5) NULL DEFAULT 'I',
        VERIFYCODE INT NULL DEFAULT 1,
        SENSORID VARCHAR(10) NULL,
        Memoinfo NVARCHAR(100) NULL,
        WorkCode VARCHAR(20) NULL,
        sn VARCHAR(20) NULL,
        UserExtFmt INT NULL DEFAULT 0
    );
END
GO

-- 7. Ensure Standard eTimeTrackLite USERINFO Table Exists
IF OBJECT_ID('dbo.USERINFO', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.USERINFO (
        USERID INT IDENTITY(1,1) PRIMARY KEY,
        Badgenumber VARCHAR(24) NOT NULL,
        SSN VARCHAR(20) NULL,
        Name VARCHAR(40) NULL,
        Gender VARCHAR(8) NULL,
        TITLE VARCHAR(20) NULL,
        PAGER VARCHAR(20) NULL,
        BIRTHDAY DATETIME NULL,
        HIREDATE DATETIME NULL,
        street VARCHAR(40) NULL,
        CITY VARCHAR(20) NULL,
        STATE VARCHAR(2) NULL,
        ZIP VARCHAR(12) NULL,
        Oofficephone VARCHAR(20) NULL,
        VERIFYS INT NULL,
        DEFAULTDEPTID INT NULL,
        SECURITYFLAGS INT NULL,
        ATT INT NULL DEFAULT 1,
        INMODULE INT NULL DEFAULT 1,
        OVERTIME INT NULL DEFAULT 1,
        HOLIDAY INT NULL DEFAULT 1,
        DUTY INT NULL DEFAULT 1,
        PASSWORD VARCHAR(20) NULL,
        CARDNO VARCHAR(20) NULL
    );
END
GO

-- 8. Ensure Standard eTimeTrackLite Devices Table Exists
IF OBJECT_ID('dbo.Devices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Devices (
        DeviceId INT IDENTITY(1,1) PRIMARY KEY,
        DeviceFName VARCHAR(100) NOT NULL,
        DeviceSNo VARCHAR(50) NULL,
        IPAddress VARCHAR(50) NULL,
        PORT INT NULL DEFAULT 4370,
        DeviceType VARCHAR(50) DEFAULT 'ATTENDANCE',
        Status VARCHAR(20) DEFAULT 'ACTIVE'
    );
END
GO

USE [AUTONOMA];
GO

-- 9. Ensure HR_BIOMETRIC_ATTENDANCE exists in AUTONOMA main database for JPA entities
IF OBJECT_ID('dbo.HR_BIOMETRIC_ATTENDANCE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HR_BIOMETRIC_ATTENDANCE (
        ID BIGINT IDENTITY(1,1) PRIMARY KEY,
        EMP_ID BIGINT NULL,
        ATTENDANCE_DATE DATE NOT NULL,
        ESSL_IN_TIME DATETIME NULL,
        ESSL_OUT_TIME DATETIME NULL,
        IN_TIME VARCHAR(20) NULL,
        OUT_TIME VARCHAR(20) NULL,
        TOTAL_HOURS_WORKED DECIMAL(5,2) DEFAULT 0.00,
        OVERTIME_HOURS DECIMAL(5,2) DEFAULT 0.00,
        IS_LATE BIT DEFAULT 0,
        IS_EARLY_EXIT BIT DEFAULT 0,
        STATUS VARCHAR(20) DEFAULT 'ABSENT',
        REMARKS NVARCHAR(255) NULL,
        SHIFT_ID BIGINT NULL,
        PUNCH_IN VARCHAR(20) NULL,
        PUNCH_OUT VARCHAR(20) NULL,
        LATITUDE_IN DECIMAL(10,8) NULL,
        LONGITUDE_IN DECIMAL(11,8) NULL,
        LOCATION_IN NVARCHAR(255) NULL,
        LATITUDE_OUT DECIMAL(10,8) NULL,
        LONGITUDE_OUT DECIMAL(11,8) NULL,
        LOCATION_OUT NVARCHAR(255) NULL,
        DEVICE_IMAGE NVARCHAR(500) NULL,
        IS_ACTIVE BIT DEFAULT 1,
        CREATED_BY VARCHAR(50) NULL,
        CREATED_DATE DATETIME DEFAULT GETDATE(),
        UPDATED_BY VARCHAR(50) NULL,
        UPDATED_DATE DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_HR_BIOMETRIC_ATTENDANCE UNIQUE (EMP_ID, ATTENDANCE_DATE)
    );
END
GO
