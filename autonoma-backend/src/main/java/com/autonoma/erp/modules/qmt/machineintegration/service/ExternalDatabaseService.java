package com.autonoma.erp.modules.qmt.machineintegration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.FileWriter;
import java.io.IOException;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExternalDatabaseService {
    private static final Logger log = LoggerFactory.getLogger(ExternalDatabaseService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Connection getConnection(String dbType, String host, int port, String database, String username, String password) throws SQLException {
        String url;
        if ("MS SQL Server".equalsIgnoreCase(dbType)) {
            url = String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=true;trustServerCertificate=true;", host, port, database);
        } else if ("MySQL".equalsIgnoreCase(dbType)) {
            url = String.format("jdbc:mysql://%s:%d/%s?useSSL=false&allowPublicKeyRetrieval=true", host, port, database);
        } else if ("PostgreSQL".equalsIgnoreCase(dbType)) {
            url = String.format("jdbc:postgresql://%s:%d/%s", host, port, database);
        } else if ("Oracle".equalsIgnoreCase(dbType)) {
            url = String.format("jdbc:oracle:thin:@%s:%d:%s", host, port, database);
        } else {
            throw new IllegalArgumentException("Unsupported DB Type: " + dbType);
        }
        return DriverManager.getConnection(url, username, password);
    }

    public boolean testConnection(String dbType, String host, int port, String database, String username, String password) {
        try (Connection conn = getConnection(dbType, host, port, database, username, password)) {
            try (Statement stmt = conn.createStatement()) {
                String testQuery = "Oracle".equalsIgnoreCase(dbType) ? "SELECT 1 FROM DUAL" : "SELECT 1";
                try (ResultSet rs = stmt.executeQuery(testQuery)) {
                    return rs.next();
                }
            }
        } catch (SQLException e) {
            log.error("Test connection failed: {}", e.getMessage());
            return false;
        }
    }

    public List<String> getTables(String dbType, String host, int port, String database, String username, String password) {
        List<String> tables = new ArrayList<>();
        try (Connection conn = getConnection(dbType, host, port, database, username, password)) {
            DatabaseMetaData dbmd = conn.getMetaData();
            String catalog = null;
            String schemaPattern = null;
            if ("MS SQL Server".equalsIgnoreCase(dbType)) {
                catalog = database;
                schemaPattern = "dbo";
            } else if ("MySQL".equalsIgnoreCase(dbType)) {
                catalog = database;
            } else if ("PostgreSQL".equalsIgnoreCase(dbType)) {
                schemaPattern = "public";
            } else if ("Oracle".equalsIgnoreCase(dbType)) {
                schemaPattern = username.toUpperCase();
            }
            try (ResultSet rs = dbmd.getTables(catalog, schemaPattern, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    tables.add(rs.getString("TABLE_NAME"));
                }
            }
            if (tables.isEmpty()) {
                try (ResultSet rs = dbmd.getTables(null, null, "%", new String[]{"TABLE"})) {
                    while (rs.next()) {
                        tables.add(rs.getString("TABLE_NAME"));
                    }
                }
            }
        } catch (SQLException e) {
            log.error("Failed to fetch tables: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch tables: " + e.getMessage());
        }
        return tables;
    }

    /**
     * Returns all column names from the specified table in the external machine DB.
     */
    public List<String> getTableColumns(String dbType, String host, int port, String database, String username, String password, String tableName) {
        List<String> columns = new ArrayList<>();
        try (Connection conn = getConnection(dbType, host, port, database, username, password)) {
            String query;
            if ("MySQL".equalsIgnoreCase(dbType) || "PostgreSQL".equalsIgnoreCase(dbType)) {
                query = "SELECT * FROM " + tableName + " LIMIT 0";
            } else if ("Oracle".equalsIgnoreCase(dbType)) {
                query = "SELECT * FROM " + tableName + " WHERE ROWNUM <= 0";
            } else {
                query = "SELECT TOP 0 * FROM " + tableName;
            }
            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                ResultSetMetaData meta = pstmt.getMetaData();
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    columns.add(meta.getColumnName(i));
                }
            }
        } catch (SQLException e) {
            log.error("Failed to fetch table columns: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch table columns: " + e.getMessage());
        }
        return columns;
    }

    /**
     * Reads data from the external DB. If readColumns is provided (non-empty), uses those columns in order.
     * Otherwise falls back to SELECT TOP 10 *.
     */
    public List<Map<String, Object>> readData(String dbType, String host, int port, String database, String username,
                                              String password, String tableName, List<String> readColumns) {
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection conn = getConnection(dbType, host, port, database, username, password)) {
            String colClause = (readColumns != null && !readColumns.isEmpty())
                    ? String.join(", ", readColumns)
                    : "*";
            String query = "SELECT TOP 10 " + colClause + " FROM " + tableName + " ORDER BY 1 DESC";

            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                try (ResultSet rs = pstmt.executeQuery()) {
                    ResultSetMetaData meta = rs.getMetaData();
                    int columnCount = meta.getColumnCount();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            row.put(meta.getColumnName(i), rs.getObject(i));
                        }
                        result.add(row);
                    }
                }
            }
        } catch (SQLException e) {
            log.error("Failed to read external data: {}", e.getMessage());
            throw new RuntimeException("Failed to read external data: " + e.getMessage());
        }
        return result;
    }

    /**
     * Sends data to the external machine DB table using dynamic INSERT from a Map payload.
     * Returns a result description string.
     */
    public String sendDataToTable(String dbType, String host, int port, String database, String username,
                                  String password, String targetTable, Map<String, Object> payload) {
        try (Connection conn = getConnection(dbType, host, port, database, username, password)) {
            StringBuilder columns = new StringBuilder();
            StringBuilder values = new StringBuilder();
            List<Object> paramValues = new ArrayList<>();

            for (Map.Entry<String, Object> entry : payload.entrySet()) {
                if (columns.length() > 0) {
                    columns.append(", ");
                    values.append(", ");
                }
                columns.append(entry.getKey());
                values.append("?");
                paramValues.add(entry.getValue());
            }

            String query = "INSERT INTO " + targetTable + " (" + columns + ") VALUES (" + values + ")";
            try (PreparedStatement pstmt = conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) {
                for (int i = 0; i < paramValues.size(); i++) {
                    pstmt.setObject(i + 1, paramValues.get(i));
                }
                int rows = pstmt.executeUpdate();
                if (rows == 0) throw new SQLException("Creating record failed, no rows affected.");
                try (ResultSet keys = pstmt.getGeneratedKeys()) {
                    return keys.next() ? "Inserted ID: " + keys.getObject(1) : "Inserted " + rows + " row(s)";
                }
            }
        } catch (SQLException e) {
            log.error("Failed to send data to DB table: {}", e.getMessage());
            throw new RuntimeException("Failed to send data to DB table: " + e.getMessage());
        }
    }

    /**
     * Sends a list of records (as JSON) to an HTTP API endpoint.
     */
    public String sendDataToApi(String apiUrl, List<Map<String, Object>> data) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(data, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            return "API Response (" + response.getStatusCodeValue() + "): " + (response.getBody() != null ? response.getBody() : "OK");
        } catch (Exception e) {
            log.error("Failed to send data to API: {}", e.getMessage());
            throw new RuntimeException("Failed to send data to API: " + e.getMessage());
        }
    }

    /**
     * Writes a list of records as a JSON array to a file at the given server-side path.
     */
    public String writeDataToFile(List<Map<String, Object>> data, String filePath) {
        try {
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);
            try (FileWriter fw = new FileWriter(filePath, false)) {
                fw.write(json);
            }
            return "Written " + data.size() + " record(s) to file: " + filePath;
        } catch (IOException e) {
            log.error("Failed to write data to file: {}", e.getMessage());
            throw new RuntimeException("Failed to write data to file: " + e.getMessage());
        }
    }

    /**
     * Runs a custom SQL query against the EXTERNAL machine DB (for READ jobs).
     */
    public List<Map<String, Object>> runQueryOnExternal(String dbType, String host, int port, String database,
                                                         String username, String password, String sql) {
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection conn = getConnection(dbType, host, port, database, username, password)) {
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = pstmt.executeQuery()) {
                    ResultSetMetaData meta = rs.getMetaData();
                    int columnCount = meta.getColumnCount();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            row.put(meta.getColumnName(i), rs.getObject(i));
                        }
                        result.add(row);
                    }
                }
            }
        } catch (SQLException e) {
            log.error("Failed to run query on external DB: {}", e.getMessage());
            throw new RuntimeException("Failed to run query on external DB: " + e.getMessage());
        }
        return result;
    }

    // Legacy: kept for backward compatibility - single map payload to external table
    public String sendData(String dbType, String host, int port, String database, String username, String password,
                           String writeMode, String targetDestination, Map<String, Object> payload) {
        if ("API".equalsIgnoreCase(writeMode)) {
            List<Map<String, Object>> list = new ArrayList<>();
            list.add(payload);
            return sendDataToApi(targetDestination, list);
        } else {
            return sendDataToTable(dbType, host, port, database, username, password, targetDestination, payload);
        }
    }
}
