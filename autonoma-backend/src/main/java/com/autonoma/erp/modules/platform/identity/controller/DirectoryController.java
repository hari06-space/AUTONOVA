package com.autonoma.erp.modules.platform.identity.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/directory")
@CrossOrigin(origins = "*")
public class DirectoryController {

    @GetMapping("/roots")
    public ResponseEntity<List<String>> getRoots(
            @RequestParam(value = "mode", defaultValue = "local") String mode,
            @RequestParam(value = "host", required = false) String host,
            @RequestParam(value = "port", required = false) Integer port,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password) {
        
        if ("database".equalsIgnoreCase(mode) && host != null && !host.trim().isEmpty()) {
            try {
                int dbPort = port != null ? port : 1433;
                List<String> dbRoots = getDatabaseRoots(host.trim(), dbPort, username, password);
                return ResponseEntity.ok(dbRoots);
            } catch (Exception e) {
                // Fallback to local roots if DB connection fails
            }
        }

        File[] roots = File.listRoots();
        List<String> rootList = new ArrayList<>();
        if (roots != null) {
            for (File root : roots) {
                rootList.add(root.getAbsolutePath());
            }
        }
        if (rootList.isEmpty()) {
            rootList.add("C:\\");
        }
        return ResponseEntity.ok(rootList);
    }

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listDirectory(
            @RequestParam("path") String path,
            @RequestParam(value = "mode", defaultValue = "local") String mode,
            @RequestParam(value = "host", required = false) String host,
            @RequestParam(value = "port", required = false) Integer port,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password) {
        
        Map<String, Object> result = new HashMap<>();

        if ("database".equalsIgnoreCase(mode) && host != null && !host.trim().isEmpty()) {
            try {
                int dbPort = port != null ? port : 1433;
                List<Map<String, String>> folders = getDatabaseDirectories(host.trim(), dbPort, username, password, path);
                
                result.put("currentPath", path);
                
                // Determine parent path for remote path (e.g. C:\Windows -> C:\)
                String parentPath = null;
                if (path.length() > 3) {
                    int lastSlash = path.lastIndexOf('\\');
                    if (lastSlash == path.length() - 1) {
                        lastSlash = path.substring(0, lastSlash).lastIndexOf('\\');
                    }
                    if (lastSlash > 0) {
                        parentPath = path.substring(0, lastSlash);
                        if (parentPath.endsWith(":")) {
                            parentPath += "\\";
                        }
                    } else if (lastSlash == 0 || (path.contains(":") && path.indexOf(':') + 2 == path.length())) {
                        // Already at root or invalid
                    } else {
                        // Single drive root level fallback
                        int colonIndex = path.indexOf(':');
                        if (colonIndex != -1) {
                            parentPath = path.substring(0, colonIndex + 2);
                        }
                    }
                }
                result.put("parentPath", parentPath);
                result.put("folders", folders);
                return ResponseEntity.ok(result);
            } catch (Exception e) {
                // Fallback to local listing if DB connection fails
            }
        }

        File current = new File(path);

        if (!current.exists() || !current.isDirectory()) {
            result.put("currentPath", path);
            result.put("parentPath", null);
            result.put("folders", Collections.emptyList());
            return ResponseEntity.ok(result);
        }

        result.put("currentPath", current.getAbsolutePath());
        result.put("parentPath", current.getParent());

        List<Map<String, String>> folders = new ArrayList<>();
        File[] files = current.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory() && !f.isHidden()) {
                    Map<String, String> folderInfo = new HashMap<>();
                    folderInfo.put("name", f.getName());
                    folderInfo.put("path", f.getAbsolutePath());
                    folders.add(folderInfo);
                }
            }
        }

        // Sort folders by name case-insensitively
        folders.sort(Comparator.comparing(m -> m.get("name").toLowerCase()));

        result.put("folders", folders);
        return ResponseEntity.ok(result);
    }

    private List<String> getDatabaseRoots(String host, int port, String username, String password) throws Exception {
        String jdbcUrl = String.format("jdbc:sqlserver://%s:%d;databaseName=master;trustServerCertificate=true;loginTimeout=3", host, port);
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(jdbcUrl, username, password);
             java.sql.Statement stmt = conn.createStatement();
             java.sql.ResultSet rs = stmt.executeQuery("EXEC master.dbo.xp_fixeddrives")) {
            List<String> drives = new ArrayList<>();
            while (rs.next()) {
                drives.add(rs.getString("drive") + ":\\");
            }
            return drives;
        }
    }

    private List<Map<String, String>> getDatabaseDirectories(String host, int port, String username, String password, String path) throws Exception {
        String jdbcUrl = String.format("jdbc:sqlserver://%s:%d;databaseName=master;trustServerCertificate=true;loginTimeout=3", host, port);
        
        String cleanPath = path;
        // Ensure trailing slash for xp_dirtree
        if (!cleanPath.endsWith("\\") && !cleanPath.endsWith("/")) {
            cleanPath += "\\";
        }
        
        String sql = "CREATE TABLE #DirectoryTree (id int identity(1,1), subdirectory nvarchar(512), depth int, isfile bit); " +
                     "INSERT #DirectoryTree (subdirectory, depth, isfile) EXEC master.sys.xp_dirtree ?, 1, 1; " +
                     "SELECT subdirectory FROM #DirectoryTree WHERE isfile = 0 ORDER BY subdirectory ASC; " +
                     "DROP TABLE #DirectoryTree;";
                     
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(jdbcUrl, username, password);
             java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, cleanPath);
            
            List<Map<String, String>> folders = new ArrayList<>();
            boolean hasResults = stmt.execute();
            while (hasResults || stmt.getUpdateCount() != -1) {
                if (hasResults) {
                    try (java.sql.ResultSet rs = stmt.getResultSet()) {
                        java.sql.ResultSetMetaData meta = rs.getMetaData();
                        boolean hasSubdir = false;
                        for (int i = 1; i <= meta.getColumnCount(); i++) {
                            if ("subdirectory".equalsIgnoreCase(meta.getColumnName(i))) {
                                hasSubdir = true;
                                break;
                            }
                        }
                        if (hasSubdir) {
                            while (rs.next()) {
                                String name = rs.getString("subdirectory");
                                Map<String, String> folderInfo = new HashMap<>();
                                folderInfo.put("name", name);
                                folderInfo.put("path", cleanPath + name);
                                folders.add(folderInfo);
                            }
                        }
                    }
                }
                hasResults = stmt.getMoreResults();
            }
            return folders;
        }
    }
}
