package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.modules.platform.identity.dto.DatabaseConnectionRequestDTO;
import com.autonoma.erp.modules.platform.identity.dto.DatabaseTestResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
public class DatabaseConnectionServiceImpl implements DatabaseConnectionService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionServiceImpl.class);

    @Override
    public DatabaseTestResultDTO testConnection(DatabaseConnectionRequestDTO request) {
        validateRequest(request);

        String jdbcUrl = buildJdbcUrl(request);
        DriverManager.setLoginTimeout(30);

        try (Connection conn = DriverManager.getConnection(jdbcUrl, request.getDbUsername(), request.getDbPassword())) {
            List<String> databases = fetchDatabasesFromConnection(conn);

            logger.info("Successfully tested SQL Server connection to host: {}", request.getDbHost());

            if (databases.isEmpty()) {
                return new DatabaseTestResultDTO(true, "✔ Connection Successful (No user databases found)", databases);
            }

            return new DatabaseTestResultDTO(true, "✔ Connection Successful", databases);

        } catch (SQLException e) {
            String sanitizedError = parseSqlException(e);
            logger.warn("Database connection failed for host: {}. Error: {}", request.getDbHost(), sanitizedError);
            return new DatabaseTestResultDTO(false, sanitizedError);
        } catch (Exception e) {
            logger.error("Unexpected error during connection test for host: {}", request.getDbHost(), e);
            return new DatabaseTestResultDTO(false, "Unable to connect to database server. Please check connection parameters.");
        }
    }

    @Override
    public List<String> listDatabases(DatabaseConnectionRequestDTO request) {
        validateRequest(request);

        String jdbcUrl = buildJdbcUrl(request);
        DriverManager.setLoginTimeout(30);

        try (Connection conn = DriverManager.getConnection(jdbcUrl, request.getDbUsername(), request.getDbPassword())) {
            return fetchDatabasesFromConnection(conn);
        } catch (Exception e) {
            logger.warn("Failed to fetch databases for host: {}. Error: {}", request.getDbHost(), e.getMessage());
            return Collections.emptyList();
        }
    }

    private void validateRequest(DatabaseConnectionRequestDTO request) {
        if (request.getDbHost() == null || request.getDbHost().trim().isEmpty()) {
            throw new IllegalArgumentException("Server / Host is mandatory");
        }
        if (request.getDbPort() == null) {
            throw new IllegalArgumentException("Port is mandatory");
        }
        if (request.getDbUsername() == null || request.getDbUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is mandatory");
        }
    }

    private String buildJdbcUrl(DatabaseConnectionRequestDTO request) {
        String host = request.getDbHost().trim();
        int port = request.getDbPort();
        return String.format("jdbc:sqlserver://%s:%d;encrypt=false;trustServerCertificate=true;loginTimeout=30", host, port);
    }

    private List<String> fetchDatabasesFromConnection(Connection conn) throws SQLException {
        List<String> databases = new ArrayList<>();
        String query = "SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb') AND state_desc = 'ONLINE' ORDER BY name";
        try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                databases.add(rs.getString("name"));
            }
        } catch (SQLException e) {
            try (ResultSet rs = conn.getMetaData().getCatalogs()) {
                while (rs.next()) {
                    String cat = rs.getString("TABLE_CAT");
                    if (cat != null && !isSystemDatabase(cat)) {
                        databases.add(cat);
                    }
                }
            }
        }
        Collections.sort(databases);
        return databases;
    }

    private boolean isSystemDatabase(String name) {
        if (name == null) return true;
        String lower = name.toLowerCase().trim();
        return lower.equals("master") || lower.equals("tempdb") || lower.equals("model") || lower.equals("msdb");
    }

    private String parseSqlException(SQLException e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        String sqlState = e.getSQLState() != null ? e.getSQLState() : "";

        if (sqlState.startsWith("28") || msg.toLowerCase().contains("login failed")
                || msg.toLowerCase().contains("access denied") || msg.toLowerCase().contains("authentication")) {
            return "Invalid username or password";
        }
        if (msg.toLowerCase().contains("timed out") || msg.toLowerCase().contains("timeout") || e instanceof SQLTimeoutException) {
            return "Connection timeout";
        }
        if (msg.toLowerCase().contains("ssl") || msg.toLowerCase().contains("certificate") || msg.toLowerCase().contains("pki")) {
            return "SSL error";
        }
        if (msg.toLowerCase().contains("connection refused") || msg.toLowerCase().contains("unknown host")
                || msg.toLowerCase().contains("unreachable") || msg.toLowerCase().contains("cannot open server")) {
            return "Database server not reachable";
        }
        if (msg.toLowerCase().contains("blocked") || msg.toLowerCase().contains("port")) {
            return "Port blocked";
        }

        return "Unable to connect to database server. " + (msg.length() > 100 ? msg.substring(0, 100) + "..." : msg);
    }

    @Override
    public byte[] backupDatabase(DatabaseConnectionRequestDTO request, String backupFolder, boolean download) throws Exception {
        validateRequest(request);
        if (request.getDbName() == null || request.getDbName().trim().isEmpty()) {
            throw new IllegalArgumentException("Database Name is mandatory for backup");
        }

        String dbName = request.getDbName().trim();
        String host = request.getDbHost().trim();
        boolean isLocal = isLocalHost(host);

        String jdbcUrl = buildJdbcUrl(request);
        DriverManager.setLoginTimeout(30);

        try (Connection conn = DriverManager.getConnection(jdbcUrl, request.getDbUsername(), request.getDbPassword())) {
            
            // Resolve backup folder path on SQL Server
            String resolvedFolder = backupFolder != null ? backupFolder.trim() : "";
            if (resolvedFolder.isEmpty()) {
                // Query default backup directory from SQL Server
                resolvedFolder = getSqlServerDefaultBackupDir(conn);
                if (resolvedFolder == null || resolvedFolder.isEmpty()) {
                    // Fallback
                    resolvedFolder = isLocal ? System.getProperty("java.io.tmpdir") : "C:\\Windows\\Temp";
                }
            }

            // Ensure directory exists locally
            if (isLocal) {
                java.io.File localFolder = new java.io.File(resolvedFolder);
                if (!localFolder.exists()) {
                    localFolder.mkdirs();
                }
            }

            // Generate timestamped filename
            String timestamp = new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new java.util.Date());
            String fileName = dbName + "_" + timestamp + ".bak";
            
            // Ensure trailing slash for folder
            String sqlServerBackupPath = resolvedFolder;
            if (!sqlServerBackupPath.endsWith("\\") && !sqlServerBackupPath.endsWith("/")) {
                sqlServerBackupPath += "\\";
            }
            sqlServerBackupPath += fileName;

            // Execute SQL Server backup command
            String backupQuery = String.format("BACKUP DATABASE [%s] TO DISK = ? WITH FORMAT, INIT, NAME = ?", dbName);
            try {
                try (PreparedStatement stmt = conn.prepareStatement(backupQuery)) {
                    stmt.setString(1, sqlServerBackupPath);
                    stmt.setString(2, "Full Backup of " + dbName + " at " + timestamp);
                    stmt.execute();
                }
            } catch (SQLException e) {
                logger.warn("Backup failed on path [{}]. Attempting fallback to SQL Server default backup directory. Error: {}", sqlServerBackupPath, e.getMessage());
                
                // Fetch default backup directory
                String defaultFolder = getSqlServerDefaultBackupDir(conn);
                if (defaultFolder == null || defaultFolder.isEmpty()) {
                    defaultFolder = "C:\\Windows\\Temp"; // standard temp fallback
                }
                
                if (!defaultFolder.endsWith("\\") && !defaultFolder.endsWith("/")) {
                    defaultFolder += "\\";
                }
                sqlServerBackupPath = defaultFolder + fileName;
                
                try (PreparedStatement stmt = conn.prepareStatement(backupQuery)) {
                    stmt.setString(1, sqlServerBackupPath);
                    stmt.setString(2, "Full Backup of " + dbName + " at " + timestamp);
                    stmt.execute();
                }
            }

            logger.info("Successfully completed backup of database [{}] to path [{}]", dbName, sqlServerBackupPath);             if (download) {
                byte[] bytes = null;
                java.io.File localFile = new java.io.File(sqlServerBackupPath);
                if (localFile.exists()) {
                    bytes = java.nio.file.Files.readAllBytes(localFile.toPath());
                    try {
                        localFile.delete();
                    } catch (Exception e) {
                        logger.warn("Failed to delete local temp backup file: {}", sqlServerBackupPath, e);
                    }
                } else {
                    // Remote download: try OPENROWSET
                    try {
                        String escapedPath = sqlServerBackupPath.replace("'", "''");
                        String openRowsetQuery = "SELECT BulkColumn FROM OPENROWSET(BULK '" + escapedPath + "', SINGLE_BLOB) AS x";
                        try (Statement stmt = conn.createStatement();
                             ResultSet rs = stmt.executeQuery(openRowsetQuery)) {
                            if (rs.next()) {
                                bytes = rs.getBytes(1);
                            }
                        }
                    } catch (SQLException e) {
                        logger.warn("Failed to read remote backup file via OPENROWSET: {}. Attempting to enable Ad Hoc Distributed Queries...", e.getMessage());
                        try (Statement configStmt = conn.createStatement()) {
                            configStmt.execute("EXEC sp_configure 'show advanced options', 1; RECONFIGURE;");
                            configStmt.execute("EXEC sp_configure 'Ad Hoc Distributed Queries', 1; RECONFIGURE;");
                            
                            // Retry OPENROWSET
                            String escapedPath = sqlServerBackupPath.replace("'", "''");
                            String openRowsetQuery = "SELECT BulkColumn FROM OPENROWSET(BULK '" + escapedPath + "', SINGLE_BLOB) AS x";
                            try (Statement stmt = conn.createStatement();
                                 ResultSet rs = stmt.executeQuery(openRowsetQuery)) {
                                if (rs.next()) {
                                    bytes = rs.getBytes(1);
                                }
                            }
                        } catch (Exception ex) {
                            logger.error("Failed to read file or enable Ad Hoc Distributed Queries: {}", ex.getMessage());
                            throw new RuntimeException("Local download is not supported for remote database servers unless 'Ad Hoc Distributed Queries' component is enabled on SQL Server. Please run: \n" +
                                    "EXEC sp_configure 'show advanced options', 1; RECONFIGURE;\n" +
                                    "EXEC sp_configure 'Ad Hoc Distributed Queries', 1; RECONFIGURE;");
                        }
                    } finally {
                        // Clean up the temporary remote backup file
                        try (PreparedStatement deleteStmt = conn.prepareStatement("EXEC master.sys.xp_delete_file 0, ?")) {
                            deleteStmt.setString(1, sqlServerBackupPath);
                            deleteStmt.execute();
                            logger.info("Successfully deleted remote temp backup file: {}", sqlServerBackupPath);
                        } catch (Exception ex) {
                            logger.warn("Failed to delete remote temp backup file using xp_delete_file: {}", ex.getMessage());
                        }
                    }
                }
                
                if (bytes == null) {
                    throw new RuntimeException("Backup file was created but could not be read.");
                }
                return bytes;
            }

            return null;
        }
    }

    private boolean isLocalHost(String host) {
        if (host == null) return false;
        String h = host.trim().toLowerCase();
        if (h.equals("localhost") || h.equals("127.0.0.1") || h.equals("::1")) {
            return true;
        }
        try {
            String localHostName = java.net.InetAddress.getLocalHost().getHostName().toLowerCase();
            String localHostIp = java.net.InetAddress.getLocalHost().getHostAddress();
            return h.equals(localHostName) || h.equals(localHostIp);
        } catch (Exception e) {
            return false;
        }
    }

    private String getSqlServerDefaultBackupDir(Connection conn) {
        String query = "DECLARE @BackupDirectory NVARCHAR(512); " +
                       "EXEC master.dbo.xp_instance_regread " +
                       "    N'HKEY_LOCAL_MACHINE', " +
                       "    N'Software\\Microsoft\\MSSQLServer\\MSSQLServer', " +
                       "    N'BackupDirectory', " +
                       "    @BackupDirectory OUTPUT; " +
                       "SELECT @BackupDirectory;";
        try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
            if (rs.next()) {
                String dir = rs.getString(1);
                if (dir != null && !dir.trim().isEmpty()) {
                    return dir;
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to query SQL Server default backup directory: {}", e.getMessage());
        }
        return null;
    }
}
