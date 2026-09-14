package com.autonoma.erp.modules.platform.datamigration.service;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DynamicMigrationDbService {

    @Autowired
    private JdbcTemplate defaultJdbcTemplate;

    // Cache DataSources to prevent exhaustion, keyed by connection string
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private String buildUrl(String ip, String dbName) {
        String db = (dbName != null && !dbName.trim().isEmpty()) ? dbName : "master";
        return String.format("jdbc:sqlserver://%s:1433;databaseName=%s;trustServerCertificate=true;sendStringParametersAsUnicode=true;loginTimeout=3", ip, db);
    }

    public JdbcTemplate getDynamicTemplate(String ip, String username, String password, String dbName) {
        if (ip == null || ip.trim().isEmpty()) {
            return defaultJdbcTemplate;
        }

        String url = buildUrl(ip, dbName);
        String cacheKey = url + "|" + username + "|" + (password != null ? password : "");

        DataSource ds = dataSourceCache.computeIfAbsent(cacheKey, k -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(url);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            config.setMaximumPoolSize(5); // Keep small for migration
            config.setConnectionTimeout(3000); // 3 seconds timeout instead of 30s
            config.setValidationTimeout(1000);
            return new HikariDataSource(config);
        });

        return new JdbcTemplate(ds);
    }

    public List<String> getDatabases(String ip, String username, String password) {
        JdbcTemplate template = getDynamicTemplate(ip, username, password, "master");
        return template.queryForList("SELECT name FROM sys.databases WHERE state_desc = 'ONLINE' AND database_id > 4", String.class);
    }

    public List<String> getDirectories(String ip, String username, String password, String path) {
        JdbcTemplate template = getDynamicTemplate(ip, username, password, "master");
        
        if (path == null || path.trim().isEmpty()) {
            // Return list of drives
            List<Map<String, Object>> drives = template.queryForList("EXEC master.dbo.xp_fixeddrives");
            List<String> driveNames = new ArrayList<>();
            for (Map<String, Object> drive : drives) {
                driveNames.add(drive.get("drive") + ":\\");
            }
            return driveNames;
        } else {
            // Ensure trailing slash for xp_dirtree
            if (!path.endsWith("\\") && !path.endsWith("/")) {
                path += "\\";
            }
            
            String sql = "CREATE TABLE #DirectoryTree (id int identity(1,1), subdirectory nvarchar(512), depth int, isfile bit); " +
                         "INSERT #DirectoryTree (subdirectory, depth, isfile) EXEC master.sys.xp_dirtree ?, 1, 1; " +
                         "SELECT subdirectory FROM #DirectoryTree WHERE isfile = 0 ORDER BY subdirectory ASC; " +
                         "DROP TABLE #DirectoryTree;";
                         
            return template.queryForList(sql, String.class, path);
        }
    }
}
