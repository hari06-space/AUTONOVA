-- ===================================================================================
-- Migration: 20260722_V1046.0__Create_NT_ESSL_Database_And_Biometric_Tables.sql
-- Module: HR / eSSL Biometric Integration (eTimeTrackLite Standard Schema)
-- Purpose: Standardize NT_ESSL database to contain standard eTimeTrackLite tables:
--          1. Employees
--          2. DeviceLogs (and monthly dynamic tables like DeviceLogs_M_YYYY)
--          3. AttendanceLogs
--          4. CHECKINOUT
--          5. USERINFO
--          6. Devices
-- ===================================================================================

-- 1. Create NT_ESSL Database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'NT_ESSL')
BEGIN
    CREATE DATABASE [NT_ESSL];
END
GO

USE [NT_ESSL];
GO

-- 2. Drop custom AUTONOMA tables if mistakenly created inside NT_ESSL
IF OBJECT_ID('dbo.HR_BIOMETRIC_ATTENDANCE', 'U') IS NOT NULL DROP TABLE dbo.HR_BIOMETRIC_ATTENDANCE;
IF OBJECT_ID('dbo.HR_DAILY_ATTENDANCE_LOG', 'U') IS NOT NULL DROP TABLE dbo.HR_DAILY_ATTENDANCE_LOG;
IF OBJECT_ID('dbo.ESSL_ATTENDANCE_LOG', 'U') IS NOT NULL DROP TABLE dbo.ESSL_ATTENDANCE_LOG;
IF OBJECT_ID('dbo.HR_ESSL_ATTENDANCE_LOGS', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_ATTENDANCE_LOGS;
IF OBJECT_ID('dbo.HR_ESSL_CHECKINOUT', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_CHECKINOUT;
IF OBJECT_ID('dbo.HR_ESSL_DEVICE_LOGS', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_DEVICE_LOGS;
IF OBJECT_ID('dbo.HR_ESSL_EMPLOYEES', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_EMPLOYEES;
IF OBJECT_ID('dbo.HR_ESSL_USERINFO', 'U') IS NOT NULL DROP TABLE dbo.HR_ESSL_USERINFO;
GO

-- 3. Create Standard eTimeTrackLite Employees Table
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

-- 4. Create Standard eTimeTrackLite DeviceLogs Table
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

-- 5. Create Standard eTimeTrackLite AttendanceLogs Table
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

-- 6. Create Standard eTimeTrackLite CHECKINOUT Table
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

-- 7. Create Standard eTimeTrackLite USERINFO Table
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

-- 8. Create Standard eTimeTrackLite Devices Table
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
