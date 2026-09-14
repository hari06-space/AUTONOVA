package com.autonoma.erp.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(1)
public class SqlMigrationRunner implements org.springframework.beans.factory.InitializingBean, CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private boolean migrated = false;
    private final java.util.Set<String> executedScriptsCache = new java.util.HashSet<>();

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    private static final Set<String> SQL_SERVER_SKIP_SCRIPTS = new HashSet<>(Arrays.asList(
            "20260512_V4.4__Global_Column_Lowercasing_Standardization.sql"));

    public SqlMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        synchronized (this) {
            if (!migrated) {
                runMigrations(this.jdbcTemplate);
                migrated = true;
            }
        }
    }

    @Override
    public void run(String... args) throws Exception {
        synchronized (this) {
            if (!migrated) {
                runMigrations(this.jdbcTemplate);
                migrated = true;
            }
        }
    }

    public void runMigrations(JdbcTemplate targetJdbcTemplate) throws Exception {
        System.out.println("======================================");
        System.out.println("SQL MIGRATION STARTED FOR DYNAMIC TEMPLATE (SQL SERVER)");
        System.out.println("======================================");



        createMigrationTables(targetJdbcTemplate);
        enableReadCommittedSnapshotIfSqlServer(targetJdbcTemplate);

        try {
            List<String> list = targetJdbcTemplate.queryForList("SELECT SCRIPT_NAME FROM ERP_EXECUTED_SCRIPTS",
                    String.class);
            if (list != null) {
                this.executedScriptsCache.addAll(list);
            }
        } catch (Exception e) {
            System.err.println("Failed to populate executedScriptsCache: " + e.getMessage());
        }

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        // Phase 1: Retrieve and sort legacy scripts from dbscripts/*.sql
        Resource[] legacyResources = resolver.getResources("classpath:dbscripts/*.sql");


        List<Resource> sortedLegacy = Arrays.stream(legacyResources)
                .sorted((r1, r2) -> compareMigrationFiles(r1.getFilename(), r2.getFilename()))
                .collect(Collectors.toList());

        // Phase 2: Retrieve and sort new standardization scripts from
        // dbscripts/v_next/*.sql
        Resource[] newResources = new Resource[0];
        try {
            newResources = resolver.getResources("classpath:dbscripts/v_next/*.sql");
        } catch (Exception e) {
            // v_next folder might not exist in target classpath if completely empty
        }
        List<Resource> sortedNew = Arrays.stream(newResources)
                .sorted((r1, r2) -> compareMigrationFiles(r1.getFilename(), r2.getFilename()))
                .collect(Collectors.toList());

        // Execute Phase 1: Legacy scripts
        for (Resource resource : sortedLegacy) {
            executeMigrationFile(targetJdbcTemplate, resource);
        }

        // Execute Phase 2: v_next scripts
        for (Resource resource : sortedNew) {
            executeMigrationFile(targetJdbcTemplate, resource);
        }

        // Restore any renamed tables to their canonical names
        restoreRenamedTables(targetJdbcTemplate);

        // Ensure audit user foreign keys
        ensureAuditUserForeignKeys(targetJdbcTemplate);
        System.out.println("======================================");
        System.out.println("SQL MIGRATION COMPLETED FOR DYNAMIC TEMPLATE");
        System.out.println("======================================");

        if (cacheManager != null) {
            try {
                for (String cacheName : cacheManager.getCacheNames()) {
                    org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                    if (cache != null) {
                        cache.clear();
                    }
                }
                System.out.println("CACHES CLEARED AFTER DATABASE MIGRATION COMPLETION");
            } catch (Exception e) {
                System.err.println("Failed to clear cache after migrations: " + e.getMessage());
            }
        }
    }

    private void ensureAuditUserForeignKeys(JdbcTemplate targetJdbcTemplate) {
        // System.out.println(
        // "[Self-Healing] Running automated foreign key constraints generation for
        // CREATED_BY / UPDATED_BY...");

        // // Self-Healing: Seed SUPER BOSS user if missing
        // try {
        // String userTable = "AD_USER_CREDENTIAL";
        // try {
        // targetJdbcTemplate.execute("SELECT 1 FROM AD_USER_CREDENTIALS");
        // userTable = "AD_USER_CREDENTIALS";
        // } catch (Exception e) {
        // // fall back to AD_USER_CREDENTIAL
        // }

        // Integer count = targetJdbcTemplate.queryForObject(
        // "SELECT COUNT(*) FROM " + userTable + " WHERE USER_ID = 'SUPER BOSS'",
        // Integer.class);
        // if (count == null || count == 0) {
        // System.out.println("[Self-Healing] Seeding missing 'SUPER BOSS' user into " +
        // userTable);
        // targetJdbcTemplate.update(
        // "INSERT INTO " + userTable
        // + " (USER_ID, EMP_ID, PASSWORD, CREATED_BY, CREATED_DATE, STATUS, USER_LEVEL,
        // IS_ACTIVE) "
        // +
        // "VALUES ('SUPER BOSS', NULL, 'PqN+VbHvF4NpV9r1y//5Zw==', 'System', ?, 1, 5,
        // 1)",
        // new java.util.Date());
        // }

        // Integer sysCount = targetJdbcTemplate.queryForObject(
        // "SELECT COUNT(*) FROM " + userTable + " WHERE USER_ID = 'SYSTEM'",
        // Integer.class);
        // if (sysCount == null || sysCount == 0) {
        // System.out.println("[Self-Healing] Seeding missing 'SYSTEM' user into " +
        // userTable);
        // targetJdbcTemplate.update(
        // "INSERT INTO " + userTable
        // + " (USER_ID, EMP_ID, PASSWORD, CREATED_BY, CREATED_DATE, STATUS, USER_LEVEL,
        // IS_ACTIVE) "
        // +
        // "VALUES ('SYSTEM', NULL, 'PqN+VbHvF4NpV9r1y//5Zw==', 'System', ?, 1, 5, 1)",
        // new java.util.Date());
        // }

        // Integer sysLowerCount = targetJdbcTemplate.queryForObject(
        // "SELECT COUNT(*) FROM " + userTable + " WHERE USER_ID = 'system'",
        // Integer.class);
        // if (sysLowerCount == null || sysLowerCount == 0) {
        // System.out.println("[Self-Healing] Seeding missing 'system' user into " +
        // userTable);
        // targetJdbcTemplate.update(
        // "INSERT INTO " + userTable
        // + " (USER_ID, EMP_ID, PASSWORD, CREATED_BY, CREATED_DATE, STATUS, USER_LEVEL,
        // IS_ACTIVE) "
        // +
        // "VALUES ('system', NULL, 'PqN+VbHvF4NpV9r1y//5Zw==', 'System', ?, 1, 5, 1)",
        // new java.util.Date());
        // }

        // Integer sysCapCount = targetJdbcTemplate.queryForObject(
        // "SELECT COUNT(*) FROM " + userTable + " WHERE USER_ID = 'System'",
        // Integer.class);
        // if (sysCapCount == null || sysCapCount == 0) {
        // System.out.println("[Self-Healing] Seeding missing 'System' user into " +
        // userTable);
        // targetJdbcTemplate.update(
        // "INSERT INTO " + userTable
        // + " (USER_ID, EMP_ID, PASSWORD, CREATED_BY, CREATED_DATE, STATUS, USER_LEVEL,
        // IS_ACTIVE) "
        // +
        // "VALUES ('System', 0, 'PqN+VbHvF4NpV9r1y//5Zw==', 'System', ?, 1, 5, 1)",
        // new java.util.Date());
        // }

        // try {
        // Integer divCount = targetJdbcTemplate.queryForObject(
        // "SELECT COUNT(*) FROM AD_USER_DIVISION_MAPPING WHERE user_id = 'SUPER BOSS'
        // AND division_id = 1",
        // Integer.class);
        // if (divCount == null || divCount == 0) {
        // targetJdbcTemplate.update(
        // "INSERT INTO AD_USER_DIVISION_MAPPING (user_id, division_id, created_by,
        // created_date) VALUES ('SUPER BOSS', 1, 'SUPER BOSS', ?)",
        // new java.util.Date());
        // }
        // } catch (Exception e) {
        // }
        // } catch (Exception e) {
        // System.err.println("[Self-Healing] Failed to seed 'SUPER BOSS' user: " +
        // e.getMessage());
        // }

        // // Self-Healing: Copy default company profile logo and background images
        // try {
        // String rootPathStr = "BOS_DOCUMENTS";
        // try {
        // String dbPath = targetJdbcTemplate.queryForObject(
        // "SELECT TOP 1 DIRECTORY_PATH FROM AD_COMPANY_CREDENTIAL WHERE id = 1",
        // String.class);
        // if (dbPath != null && !dbPath.trim().isEmpty()) {
        // rootPathStr = dbPath.trim();
        // }
        // } catch (Exception e) {
        // }

        // String os = System.getProperty("os.name").toLowerCase();
        // java.nio.file.Path bosDocs;
        // if (!os.contains("win") && rootPathStr.matches("^[A-Za-z]:[/\\\\].*")) {
        // String stripped = rootPathStr.replaceFirst("^[A-Za-z]:[/\\\\]+", "");
        // stripped = stripped.replace("\\\\", "/").replace("\\", "/");
        // bosDocs = java.nio.file.Paths.get(stripped).toAbsolutePath().normalize();
        // } else {
        // rootPathStr = rootPathStr.replace("\\\\",
        // java.io.File.separator).replace("\\", java.io.File.separator);
        // bosDocs = java.nio.file.Paths.get(rootPathStr).toAbsolutePath().normalize();
        // }

        // java.nio.file.Path companyProfileDir = bosDocs.resolve("Company Profile");
        // if (!java.nio.file.Files.exists(companyProfileDir)) {
        // java.nio.file.Files.createDirectories(companyProfileDir);
        // }

        // java.nio.file.Path targetLogo = companyProfileDir.resolve("logo.png");
        // if (!java.nio.file.Files.exists(targetLogo)) {
        // java.nio.file.Path sourceLogo = java.nio.file.Paths
        // .get("../autonoma-frontend/src/assets/images/logo.png").toAbsolutePath().normalize();
        // if (java.nio.file.Files.exists(sourceLogo)) {
        // java.nio.file.Files.copy(sourceLogo, targetLogo,
        // java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        // System.out.println("[Self-Healing] Copied logo.png to Company Profile
        // directory");
        // } else {
        // try (java.io.InputStream is =
        // SqlMigrationRunner.class.getResourceAsStream("/static/logo.png")) {
        // if (is != null) {
        // java.nio.file.Files.copy(is, targetLogo,
        // java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        // System.out.println(
        // "[Self-Healing] Copied logo.png from classpath to Company Profile
        // directory");
        // }
        // }
        // }
        // }

        // java.nio.file.Path targetBg = companyProfileDir.resolve("login-bg.jpg");
        // if (!java.nio.file.Files.exists(targetBg)) {
        // java.nio.file.Path sourceBg = java.nio.file.Paths
        // .get("../autonoma-frontend/src/assets/images/boss_login_bg.png").toAbsolutePath().normalize();
        // if (java.nio.file.Files.exists(sourceBg)) {
        // java.nio.file.Files.copy(sourceBg, targetBg,
        // java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        // System.out.println(
        // "[Self-Healing] Copied boss_login_bg.png as login-bg.jpg to Company Profile
        // directory");
        // }
        // }
        // } catch (Exception e) {
        // System.err.println("[Self-Healing] Failed to copy default images: " +
        // e.getMessage());
        // }

        // try {
        // targetJdbcTemplate.execute((java.sql.Connection conn) -> {
        // java.sql.DatabaseMetaData meta = conn.getMetaData();
        // String quote = meta.getIdentifierQuoteString();
        // if (quote == null || quote.trim().isEmpty()) {
        // quote = "";
        // }

        // // 1. Get all user tables
        // List<String> userTables = new java.util.ArrayList<>();
        // try (java.sql.ResultSet rs = meta.getTables(null, null, null, new String[] {
        // "TABLE" })) {
        // while (rs.next()) {
        // String tableName = rs.getString("TABLE_NAME");
        // String tableSchem = rs.getString("TABLE_SCHEM");
        // if (tableSchem != null && (tableSchem.equalsIgnoreCase("INFORMATION_SCHEMA")
        // || tableSchem.equalsIgnoreCase("sys"))) {
        // continue;
        // }
        // userTables.add(tableName);
        // }
        // }

        // // 2. Scan columns for CREATED_BY / UPDATED_BY
        // List<java.util.Map<String, Object>> columns = new java.util.ArrayList<>();
        // for (String tableName : userTables) {
        // if (tableName.equalsIgnoreCase("AD_USER_CREDENTIAL")
        // || tableName.equalsIgnoreCase("AD_USER_CREDENTIALS")
        // || tableName.equalsIgnoreCase("AD_COMPANY_CREDENTIAL")
        // || tableName.equalsIgnoreCase("AD_USER_COMPANY_MAPPING")) {
        // continue;
        // }
        // try (java.sql.ResultSet rs = meta.getColumns(null, null, tableName, null)) {
        // while (rs.next()) {
        // String columnName = rs.getString("COLUMN_NAME");
        // String isNullable = rs.getString("IS_NULLABLE");
        // if ("CREATED_BY".equalsIgnoreCase(columnName)
        // || "UPDATED_BY".equalsIgnoreCase(columnName)) {
        // java.util.Map<String, Object> colMap = new java.util.HashMap<>();
        // colMap.put("table_name", tableName);
        // colMap.put("column_name", columnName);
        // colMap.put("is_nullable",
        // "YES".equalsIgnoreCase(isNullable) || "TRUE".equalsIgnoreCase(isNullable));
        // columns.add(colMap);
        // }
        // }
        // }
        // }

        // System.out.println("[Self-Healing] Found " + columns.size() + " audit columns
        // to check.");

        // // 3. Process each column
        // for (java.util.Map<String, Object> col : columns) {
        // String tableName = (String) col.get("table_name");
        // String columnName = (String) col.get("column_name");
        // boolean isNullable = (Boolean) col.get("is_nullable");
        // boolean isCreatedBy = "CREATED_BY".equalsIgnoreCase(columnName);

        // String quotedTable = quote + tableName + quote;
        // String quotedColumn = quote + columnName + quote;
        // String constraintName = "FK_" + tableName + "_" + columnName;

        // // Check if FK already exists pointing to AD_USER_CREDENTIAL(USER_ID)
        // String actualFkName = null;
        // try (java.sql.ResultSet rs = meta.getImportedKeys(null, null, tableName)) {
        // while (rs.next()) {
        // String fkCol = rs.getString("FKCOLUMN_NAME");
        // String pkTab = rs.getString("PKTABLE_NAME");
        // String pkCol = rs.getString("PKCOLUMN_NAME");
        // if (columnName.equalsIgnoreCase(fkCol)
        // && "AD_USER_CREDENTIAL".equalsIgnoreCase(pkTab)
        // && "USER_ID".equalsIgnoreCase(pkCol)) {
        // actualFkName = rs.getString("FK_NAME");
        // break;
        // }
        // }
        // } catch (Exception ex) {
        // // ignore and proceed
        // }

        // // We want CREATED_BY to be NOT NULL (isNullable == false).
        // // We want UPDATED_BY to be NULL (isNullable == true).
        // boolean nullabilityMatches = (isCreatedBy && !isNullable) || (!isCreatedBy &&
        // isNullable);

        // if (actualFkName == null || !nullabilityMatches) {
        // System.out.println("[Self-Healing] Aligning audit column: " + tableName + "."
        // + columnName
        // + " (Current nullable: " + isNullable + ", Target nullable: " + !isCreatedBy
        // + ", FK exists: " + (actualFkName != null) + ")");

        // // Drop existing constraint if any
        // if (actualFkName != null) {
        // try {
        // targetJdbcTemplate.execute("ALTER TABLE " + quotedTable + " DROP CONSTRAINT "
        // + quote
        // + actualFkName + quote);
        // } catch (Exception ex) {
        // System.err.println("[Self-Healing] Failed to drop constraint: " +
        // actualFkName + " -> "
        // + ex.getMessage());
        // }
        // } else {
        // try {
        // targetJdbcTemplate.execute("ALTER TABLE " + quotedTable + " DROP CONSTRAINT "
        // + quote
        // + constraintName + quote);
        // } catch (Exception ex) {
        // }
        // }

        // // Clean nulls/blanks
        // if (isCreatedBy) {
        // try {
        // targetJdbcTemplate.execute(
        // "UPDATE " + quotedTable + " " +
        // "SET " + quotedColumn + " = 'SUPER BOSS' " +
        // "WHERE " + quotedColumn + " IS NULL OR LTRIM(RTRIM(" + quotedColumn
        // + ")) = ''");
        // } catch (Exception ex) {
        // System.err.println("[Self-Healing] Failed to clean nulls/blanks in CREATED_BY
        // for "
        // + tableName + ": " + ex.getMessage());
        // }
        // } else {
        // try {
        // targetJdbcTemplate.execute(
        // "UPDATE " + quotedTable + " " +
        // "SET " + quotedColumn + " = NULL " +
        // "WHERE " + quotedColumn + " IS NOT NULL AND LTRIM(RTRIM(" + quotedColumn
        // + ")) = ''");
        // } catch (Exception ex) {
        // }
        // }

        // // Clean orphans to 'SUPER BOSS'
        // try {
        // targetJdbcTemplate.execute(
        // "UPDATE " + quotedTable + " " +
        // "SET " + quotedColumn + " = 'SUPER BOSS' " +
        // "WHERE " + quotedColumn + " IS NOT NULL " +
        // " AND " + quotedColumn + " NOT IN (SELECT " + quote + "USER_ID" + quote
        // + " FROM " + quote + "AD_USER_CREDENTIAL" + quote + ")");
        // } catch (Exception ex) {
        // System.err.println(
        // "[Self-Healing] Failed to clean orphans on " + tableName + ": " +
        // ex.getMessage());
        // }

        // // Alter column nullability and length
        // String nullability = isCreatedBy ? "NOT NULL" : "NULL";
        // String alterColumnSql = "ALTER TABLE " + quotedTable + " ALTER COLUMN " +
        // quotedColumn
        // + " NVARCHAR(50) " + nullability;

        // try {
        // targetJdbcTemplate.execute(alterColumnSql);
        // } catch (Exception ex) {
        // System.err.println("[Self-Healing] Failed to alter column nullability for " +
        // tableName
        // + "." + columnName + ": " + ex.getMessage());
        // if (isCreatedBy) {
        // try {
        // String fallbackAlter = "ALTER TABLE " + quotedTable + " ALTER COLUMN "
        // + quotedColumn + " NVARCHAR(50) NULL";
        // targetJdbcTemplate.execute(fallbackAlter);
        // } catch (Exception ex2) {
        // }
        // }
        // }

        // // Set default constraint for CREATED_BY
        // if (isCreatedBy) {
        // try {
        // String findDefaultSql = "SELECT df.name FROM sys.default_constraints df " +
        // "INNER JOIN sys.columns c ON df.parent_object_id = c.object_id AND
        // df.parent_column_id = c.column_id "
        // +
        // "WHERE df.parent_object_id = OBJECT_ID(?) AND c.name = 'CREATED_BY'";
        // List<String> dfNames = targetJdbcTemplate.queryForList(findDefaultSql,
        // String.class,
        // tableName);
        // for (String dfName : dfNames) {
        // targetJdbcTemplate.execute("ALTER TABLE " + quotedTable + " DROP CONSTRAINT "
        // + quote + dfName + quote);
        // }
        // targetJdbcTemplate.execute(
        // "ALTER TABLE " + quotedTable + " ADD CONSTRAINT " + quote + "DF_" + tableName
        // + "_CREATED_BY" + quote + " DEFAULT 'SUPER BOSS' FOR " + quotedColumn);
        // } catch (Exception ex) {
        // System.err.println("[Self-Healing] Failed to set default constraint on SQL
        // Server: "
        // + ex.getMessage());
        // }
        // }

        // // Create constraint
        // try {
        // String addFkSql = "ALTER TABLE " + quotedTable + " " +
        // "ADD CONSTRAINT " + quote + constraintName + quote + " " +
        // "FOREIGN KEY (" + quotedColumn + ") " +
        // "REFERENCES " + quote + "AD_USER_CREDENTIAL" + quote + " (" + quote +
        // "USER_ID"
        // + quote + ")";
        // targetJdbcTemplate.execute(addFkSql);
        // System.out.println("[Self-Healing] Successfully created constraint " +
        // constraintName);
        // } catch (Exception ex) {
        // System.err.println("[Self-Healing] Failed to create constraint " +
        // constraintName + ": "
        // + ex.getMessage());
        // }
        // }
        // }
        // return null;
        // });
        // } catch (Exception e) {
        // System.err.println("[Self-Healing] Error ensuring audit user foreign keys: "
        // + e.getMessage());
        // e.printStackTrace();
        // }
    }

    private void executeMigrationFile(JdbcTemplate targetJdbcTemplate, Resource resource) {
        String fileName = resource.getFilename();

        if (SQL_SERVER_SKIP_SCRIPTS.contains(fileName)) {
            if (!isAlreadyExecuted(targetJdbcTemplate, fileName)) {
                markAsExecuted(targetJdbcTemplate, fileName);
            }
            System.out.println("COMPLETED (SQL SERVER SKIP) : " + fileName);
            return;
        }

        try {
            if (isAlreadyExecuted(targetJdbcTemplate, fileName)) {
                return;
            }

            System.out.println("EXECUTING : " + fileName);

            String sql = readSqlFile(resource);
            sql = removeUseStatements(sql);

            try {
                String url = resource.getURL().toString();
                boolean shouldTranslate = !url.contains("/v_next/") && !fileName.contains("Database_Consolidated.sql");
                if (shouldTranslate) {
                    int vIndex = fileName.indexOf("_V");
                    if (vIndex != -1) {
                        StringBuilder sb = new StringBuilder();
                        for (int i = vIndex + 2; i < fileName.length(); i++) {
                            char c = fileName.charAt(i);
                            if (Character.isDigit(c)) {
                                sb.append(c);
                            } else {
                                break;
                            }
                        }
                        if (sb.length() > 0) {
                            try {
                                int ver = Integer.parseInt(sb.toString());
                                if (ver >= 315) {
                                    shouldTranslate = false;
                                }
                            } catch (NumberFormatException ignored) {
                            }
                        }
                    }
                }
                if (shouldTranslate) {
                    sql = translateTablesForLegacySqlServer(sql);
                }
            } catch (Exception e) {
                // Ignore URL resolution failure
            }

            List<String> batches = Arrays.asList(sql.split("(?im)^\\s*GO\\s*$"));

            targetJdbcTemplate.execute((java.sql.Connection con) -> {
                try (java.sql.Statement stmt = con.createStatement()) {
                    for (String batch : batches) {
                        if (batch == null || batch.trim().isEmpty()) {
                            continue;
                        }
                        try {
                            stmt.execute(batch);
                        } catch (java.sql.SQLException se) {
                            int errCode = se.getErrorCode();
                            if (errCode == 2627 || errCode == 2601 || errCode == 2714 || errCode == 2705
                                    || errCode == 1913 || errCode == 1779 || errCode == 1505 || errCode == 544
                                    || errCode == 8101 || errCode == 5074 || errCode == 4922 || errCode == 245
                                    || errCode == 206 || errCode == 8114 || errCode == 207 || errCode == 512
                                    || errCode == 208 || errCode == 515 || errCode == 4924 || errCode == 15224
                                    || errCode == 3725 || errCode == 3727 || errCode == 3728 || errCode == 0
                                    || errCode == 1750 || errCode == 1769 || errCode == 1770 || errCode == 1785
                                    || se.getMessage().contains("already in use as a object name")
                                    || se.getMessage().contains("duplicate that is not permitted") || errCode == 1778
                                    || errCode == 1776) {
                                System.out.println(
                                        "GRACEFULLY IGNORED SQL SERVER ERROR (" + errCode + "): " + se.getMessage());
                                try {
                                    if (!con.getAutoCommit()) {
                                        con.rollback();
                                    }
                                } catch (Exception re) {
                                }
                                continue;
                            }
                            System.err.println(
                                    "##############################################################################");
                            System.err.println(
                                    "#                      DATABASE MIGRATION BATCH ERROR                        #");
                            System.err.println(
                                    "##############################################################################");
                            System.err.println("# FILE: " + fileName);
                            System.err.println("# ERROR: " + se.getMessage() + " (Code: " + errCode + ")");
                            System.err.println("# BATCH: " + batch);
                            System.err.println(
                                    "##############################################################################");
                            try {
                                if (!con.getAutoCommit()) {
                                    con.rollback();
                                }
                            } catch (Exception re) {
                            }
                        }
                    }
                } finally {
                    try (java.sql.Statement cleanStmt = con.createStatement()) {
                        cleanStmt.execute("IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;");
                    } catch (Exception ce) {
                    }
                }
                return null;
            });

            markAsExecuted(targetJdbcTemplate, fileName);
            System.out.println("COMPLETED : " + fileName);

            if (fileName.contains("Database_Consolidated")) {
                ensureAuditUserForeignKeys(targetJdbcTemplate);
            }

        } catch (Exception e) {
            System.err.println("##############################################################################");
            System.err.println("#                      DATABASE MIGRATION FILE FAILED                        #");
            System.err.println("##############################################################################");
            System.err.println("# FILE: " + fileName);
            System.err.println("# ERROR: " + e.getMessage());
            System.err.println("##############################################################################");
            e.printStackTrace(System.err);

            insertFailedScript(targetJdbcTemplate, fileName, e.getMessage());
            System.err.println("WARNING: Database migration failed on script: " + fileName
                    + ". Skipping script and continuing startup.");
        }
    }

    private void createMigrationTables(JdbcTemplate targetJdbcTemplate) {
        boolean isH2 = false;
        try (java.sql.Connection conn = targetJdbcTemplate.getDataSource().getConnection()) {
            String dbUrl = conn.getMetaData().getURL();
            if (dbUrl != null && dbUrl.contains("jdbc:h2:")) {
                isH2 = true;
            }
        } catch (Exception e) {
        }

        if (isH2) {
            targetJdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS ERP_EXECUTED_SCRIPTS (
                            ID BIGINT AUTO_INCREMENT PRIMARY KEY,
                            SCRIPT_NAME VARCHAR(500) UNIQUE,
                            EXECUTED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """);

            targetJdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS ERP_FAILED_SCRIPTS (
                            ID BIGINT AUTO_INCREMENT PRIMARY KEY,
                            SCRIPT_NAME VARCHAR(500),
                            ERROR_MESSAGE VARCHAR(MAX),
                            FAILED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """);
        } else {
            targetJdbcTemplate.execute("""
                        IF OBJECT_ID('ERP_EXECUTED_SCRIPTS', 'U') IS NULL
                        BEGIN
                            CREATE TABLE ERP_EXECUTED_SCRIPTS (
                                ID BIGINT IDENTITY(1,1) PRIMARY KEY,
                                SCRIPT_NAME NVARCHAR(500) UNIQUE,
                                EXECUTED_AT DATETIME DEFAULT GETDATE()
                            )
                        END
                    """);

            targetJdbcTemplate.execute("""
                        IF OBJECT_ID('ERP_FAILED_SCRIPTS', 'U') IS NULL
                        BEGIN
                            CREATE TABLE ERP_FAILED_SCRIPTS (
                                ID BIGINT IDENTITY(1,1) PRIMARY KEY,
                                SCRIPT_NAME NVARCHAR(500),
                                ERROR_MESSAGE NVARCHAR(MAX),
                                FAILED_AT DATETIME DEFAULT GETDATE()
                            )
                        END
                    """);
        }
    }

    private void enableReadCommittedSnapshotIfSqlServer(JdbcTemplate targetJdbcTemplate) {
        try {
            targetJdbcTemplate.execute((java.sql.Connection con) -> {
                try {
                    String dbDriver = con.getMetaData().getDriverName();
                    if (dbDriver != null && dbDriver.toLowerCase().contains("sql server")) {
                        try (java.sql.Statement stmt = con.createStatement();
                             java.sql.ResultSet rs = stmt.executeQuery("SELECT DB_NAME() AS curr_db, is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME()")) {
                            if (rs.next()) {
                                String dbName = rs.getString("curr_db");
                                boolean rcsiOn = rs.getBoolean("is_read_committed_snapshot_on");
                                if (!rcsiOn && dbName != null && !dbName.trim().isEmpty()) {
                                    System.out.println("[SQL SERVER CONFIG] Enabling READ_COMMITTED_SNAPSHOT ON for database: " + dbName);
                                    try (java.sql.Statement alterStmt = con.createStatement()) {
                                        alterStmt.execute("ALTER DATABASE [" + dbName + "] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;");
                                        System.out.println("[SQL SERVER CONFIG] Successfully enabled READ_COMMITTED_SNAPSHOT for database: " + dbName);
                                    }
                                } else {
                                    System.out.println("[SQL SERVER CONFIG] READ_COMMITTED_SNAPSHOT is already ENABLED for database: " + dbName);
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("[SQL SERVER CONFIG] Note: Auto-enabling READ_COMMITTED_SNAPSHOT skipped/failed: " + e.getMessage());
                }
                return null;
            });
        } catch (Exception e) {
            System.err.println("[SQL SERVER CONFIG] Execution check error: " + e.getMessage());
        }
    }

    private boolean isAlreadyExecuted(JdbcTemplate targetJdbcTemplate, String fileName) {
        if (this.executedScriptsCache.contains(fileName)) {
            return true;
        }

        // Custom rename mapping for duplicates resolved
        java.util.Map<String, String> renameMapping = new java.util.HashMap<>();
        renameMapping.put("20260604_V78.1__Add_Missing_IsActive_To_Checklist_Assignment.sql",
                "20260604_V78.0__Add_Missing_IsActive_To_Checklist_Assignment.sql");
        renameMapping.put("20260528_V55.1__Add_Task_Prefix_To_Prefix_Credentials.sql",
                "20260528_V55.0__Add_Task_Prefix_To_Prefix_Credentials.sql");
        renameMapping.put("20260528_V56.1__Rename_Support_Ticket_To_Task_Management.sql",
                "20260528_V56.0__Rename_Support_Ticket_To_Task_Management.sql");
        renameMapping.put("20260604_V79.1__Fix_Qms_Audit_Type_Renaming.sql",
                "20260604_V79.0__Fix_Qms_Audit_Type_Renaming.sql");

        if (renameMapping.containsKey(fileName)) {
            String oldName = renameMapping.get(fileName);
            if (this.executedScriptsCache.contains(oldName)) {
                try {
                    markAsExecuted(targetJdbcTemplate, fileName);
                } catch (Exception e) {
                }
                return true;
            }
        }

        if (fileName != null && fileName.matches("^\\d{8}_.*")) {
            String suffixName = fileName.substring(9); // strip YYYYMMDD_ (9 chars)
            if (this.executedScriptsCache.contains(suffixName)) {
                try {
                    markAsExecuted(targetJdbcTemplate, fileName);
                } catch (Exception e) {
                }
                return true;
            }
        }

        return false;
    }

    private void markAsExecuted(JdbcTemplate targetJdbcTemplate, String fileName) {
        targetJdbcTemplate.update(
                "INSERT INTO ERP_EXECUTED_SCRIPTS (SCRIPT_NAME) VALUES (?)",
                fileName);
        this.executedScriptsCache.add(fileName);
    }

    private void insertFailedScript(JdbcTemplate targetJdbcTemplate, String fileName, String errorMessage) {
        targetJdbcTemplate.update(
                "INSERT INTO ERP_FAILED_SCRIPTS (SCRIPT_NAME, ERROR_MESSAGE) VALUES (?, ?)",
                fileName,
                errorMessage);
    }

    private String readSqlFile(Resource resource) throws Exception {
        return new BufferedReader(
                new InputStreamReader(
                        resource.getInputStream(),
                        StandardCharsets.UTF_8))
                .lines().collect(Collectors.joining("\n"));
    }

    private String removeUseStatements(String sql) {
        return sql.replaceAll("(?im)^\\s*USE\\s+[\\[\\]a-zA-Z0-9_]+;?\\s*$", "");
    }

    private void renameTableIfExists(JdbcTemplate targetJdbcTemplate, String oldTable, String newTable) {
        try {
            Integer countOld = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.objects WHERE object_id = OBJECT_ID('" + oldTable + "') AND type = 'U'",
                    Integer.class);
            Integer countNew = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.objects WHERE object_id = OBJECT_ID('" + newTable + "') AND type = 'U'",
                    Integer.class);
            if (countOld != null && countOld > 0 && (countNew == null || countNew == 0)) {
                targetJdbcTemplate.execute("EXEC sp_rename '" + oldTable + "', '" + newTable + "'");
            }
        } catch (Exception e) {
        }
    }

    private void renameColumnIfExists(JdbcTemplate targetJdbcTemplate, String tableName, String oldCol, String newCol) {
        try {
            Integer tableCount = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.objects WHERE object_id = OBJECT_ID('" + tableName + "') AND type = 'U'",
                    Integer.class);
            if (tableCount == null || tableCount == 0) {
                return;
            }
            Integer oldColCount = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('" + tableName + "') AND name = '"
                            + oldCol + "'",
                    Integer.class);
            Integer newColCount = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('" + tableName + "') AND name = '"
                            + newCol + "'",
                    Integer.class);
            if (oldColCount != null && oldColCount > 0 && (newColCount == null || newColCount == 0)) {
                targetJdbcTemplate
                        .execute("EXEC sp_rename '" + tableName + "." + oldCol + "', '" + newCol + "', 'COLUMN'");
            }
        } catch (Exception e) {
        }
    }

    private void dropConstraintIfExists(JdbcTemplate targetJdbcTemplate, String tableName, String constraintName) {
        try {
            Integer count = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.foreign_keys WHERE name = ? AND parent_object_id = OBJECT_ID(?)",
                    Integer.class,
                    constraintName,
                    tableName);
            if (count != null && count > 0) {
                targetJdbcTemplate.execute("ALTER TABLE " + tableName + " DROP CONSTRAINT " + constraintName);
            }
        } catch (Exception e) {
        }
    }

    private void restoreRenamedTables(JdbcTemplate targetJdbcTemplate) {
        try {
            boolean hasConsolidated = false;
            try {
                Integer consolidatedCount = targetJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME LIKE '%Database_Consolidated%'",
                        Integer.class);
                hasConsolidated = consolidatedCount != null && consolidatedCount > 0;
            } catch (Exception e) {
            }

            // 1. Restore User Module Table Name
            Integer v002Executed = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME LIKE '%V002__User_Module%'",
                    Integer.class);
            if (hasConsolidated || (v002Executed != null && v002Executed > 0)) {
                renameTableBackIfExist(targetJdbcTemplate, "AD_DIVISION_MASTER", "AD_DIVISION");
            }

            // 2. Restore HR Master Table Name
            Integer v003Executed = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME LIKE '%V003__HR_Master_Module%'",
                    Integer.class);
            if (hasConsolidated || (v003Executed != null && v003Executed > 0)) {
                renameTableBackIfExist(targetJdbcTemplate, "HR_DEPARTMENT_MASTER", "HR_DEPARTMENT");
                renameTableBackIfExist(targetJdbcTemplate, "HR_DESIGNATION_MASTER", "HR_DESIGNATION");
                renameTableBackIfExist(targetJdbcTemplate, "HR_LEVEL_MASTER", "HR_LEVEL");
                renameTableBackIfExist(targetJdbcTemplate, "HR_EMPLOYEE_TYPE_MASTER", "HR_EMPLOYEE_TYPE");
            }

            // 3. Restore Employee Table Name
            Integer v004Executed = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME LIKE '%V004__Employee_Module%'",
                    Integer.class);
            if (hasConsolidated || (v004Executed != null && v004Executed > 0)) {
                renameTableBackIfExist(targetJdbcTemplate, "HR_EMPLOYEE_MASTER", "HR_EMPLOYEE");
                renameTableBackIfExist(targetJdbcTemplate, "HR_EMPLOYEE_PERSONAL_DETAIL", "HR_EMPLOYEE_PERSONAL");
                renameTableBackIfExist(targetJdbcTemplate, "hrm_employee_contact", "HR_EMPLOYEE_CONTACT");
                renameTableBackIfExist(targetJdbcTemplate, "EMPLOYEE_MANAGER_MAPPING", "HR_EMPLOYEE_MANAGER_MAPPING");
            }

            // 4. Restore Induction/Interview Tables Name
            Integer v005Executed = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME LIKE '%V005__Induction_Module%'",
                    Integer.class);
            if (hasConsolidated || (v005Executed != null && v005Executed > 0)) {
                renameTableBackIfExist(targetJdbcTemplate, "IND_INDUCTION_MASTER", "HR_INDUCTION");
                renameTableBackIfExist(targetJdbcTemplate, "IND_INDUCTION_ASSIGNMENT", "HR_INDUCTION_ASSIGNMENT");
                renameTableBackIfExist(targetJdbcTemplate, "IND_INDUCTION_TRAINING_DETAIL", "HR_INDUCTION_TRAINING");
                renameTableBackIfExist(targetJdbcTemplate, "IND_INTERVIEW_MASTER", "HR_INTERVIEW");
                renameTableBackIfExist(targetJdbcTemplate, "hr_induction_round_master", "HR_INDUCTION_ROUND");
                renameTableBackIfExist(targetJdbcTemplate, "IND_VERIFICATION_CRITERIA", "HR_VERIFICATION_CRITERIA");
                renameTableBackIfExist(targetJdbcTemplate, "IND_EMAIL_CONTENT", "HR_EMAIL_CONTENT");
            }

            // 5. Restore Customer/Supplier Table Name
            Integer v006Executed = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME LIKE '%V006__Sales_Vendor_Module%'",
                    Integer.class);
            if (hasConsolidated || (v006Executed != null && v006Executed > 0)) {
                renameTableBackIfExist(targetJdbcTemplate, "SM_CUSTOMER_MASTER", "SLS_CUSTOMER");
                renameTableBackIfExist(targetJdbcTemplate, "SM_CUSTOMER_ADDRESS", "SLS_CUSTOMER_ADDRESS");
                renameTableBackIfExist(targetJdbcTemplate, "SM_SUPPLIER_MASTER", "VND_VENDOR");
                renameTableBackIfExist(targetJdbcTemplate, "SM_VENDOR_CUSTOMER_MASTER", "VND_CUSTOMER_MAPPING");
                renameTableBackIfExist(targetJdbcTemplate, "SM_CUSTOMER_POTENTIAL", "SLS_CUSTOMER_POTENTIAL");
            }

            // 6. Restore QMS tables to match JPA Entities
            renameTableBackIfExist(targetJdbcTemplate, "QMS_CHECKLIST", "QMS_CHECKLIST_MASTER");
            renameTableBackIfExist(targetJdbcTemplate, "QMS_MEETING", "QMS_MEETING_MASTER");
            renameTableBackIfExist(targetJdbcTemplate, "QMS_MOM", "QMS_MOM_MASTER");
        } catch (Exception e) {
            System.err.println("Failed to restore renamed tables: " + e.getMessage());
        }
    }

    private void renameTableBackIfExist(JdbcTemplate targetJdbcTemplate, String oldName, String newName) {
        try {
            Integer oldExists = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.objects WHERE object_id = OBJECT_ID('" + oldName + "') AND type = 'U'",
                    Integer.class);
            Integer newExists = targetJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.objects WHERE object_id = OBJECT_ID('" + newName + "') AND type = 'U'",
                    Integer.class);
            if (oldExists != null && oldExists > 0 && (newExists == null || newExists == 0)) {
                System.out.println("Renaming " + oldName + " back to " + newName + "...");
                targetJdbcTemplate.execute("EXEC sp_rename '" + oldName + "', '" + newName + "';");
            }
        } catch (Exception e) {
            System.err.println("Failed to rename " + oldName + " to " + newName + ": " + e.getMessage());
        }
    }

    private int compareMigrationFiles(String f1, String f2) {
        if (f1 == null || f2 == null)
            return 0;

        java.util.regex.Pattern prefixPattern = java.util.regex.Pattern.compile("^(\\d{8})_(.*)$");
        java.util.regex.Matcher m1 = prefixPattern.matcher(f1);
        java.util.regex.Matcher m2 = prefixPattern.matcher(f2);

        if (m1.matches() && m2.matches()) {
            String date1 = m1.group(1);
            String date2 = m2.group(1);
            int dateCmp = date1.compareTo(date2);
            if (dateCmp != 0) {
                return dateCmp;
            }
            f1 = m1.group(2);
            f2 = m2.group(2);
        } else if (m1.matches()) {
            return -1;
        } else if (m2.matches()) {
            return 1;
        }

        java.util.regex.Pattern versionPattern = java.util.regex.Pattern.compile("^(?:V|v)(\\d+(?:\\.\\d+)*)__(.*)$");
        java.util.regex.Matcher v1 = versionPattern.matcher(f1);
        java.util.regex.Matcher v2 = versionPattern.matcher(f2);

        if (v1.matches() && v2.matches()) {
            String verStr1 = v1.group(1);
            String verStr2 = v2.group(1);
            if (!verStr1.equals(verStr2)) {
                try {
                    String[] parts1 = verStr1.split("\\.");
                    String[] parts2 = verStr2.split("\\.");
                    int minLen = Math.min(parts1.length, parts2.length);
                    for (int i = 0; i < minLen; i++) {
                        int p1 = Integer.parseInt(parts1[i]);
                        int p2 = Integer.parseInt(parts2[i]);
                        if (p1 != p2) {
                            return Integer.compare(p1, p2);
                        }
                    }
                    if (parts1.length != parts2.length) {
                        return Integer.compare(parts1.length, parts2.length);
                    }
                } catch (NumberFormatException e) {
                    int verCmp = verStr1.compareToIgnoreCase(verStr2);
                    if (verCmp != 0)
                        return verCmp;
                }
            }
        }

        return f1.compareToIgnoreCase(f2);
    }

    private String translateTablesForLegacySqlServer(String sql) {
        if (sql == null)
            return null;

        sql = sql.replaceAll("(?i)\\bSLS_CUSTOMER_ADDRESS(?!_MASTER)\\b", "SM_CUSTOMER_ADDRESS");
        sql = sql.replaceAll("(?i)\\bSLS_CUSTOMER_POTENTIAL(?!_MASTER)\\b", "SM_CUSTOMER_POTENTIAL");
        sql = sql.replaceAll("(?i)\\bSLS_CUSTOMER(?!_ADDRESS|_POTENTIAL|_MASTER)\\b", "SM_CUSTOMER_MASTER");

        sql = sql.replaceAll("(?i)\\bVND_CUSTOMER_MAPPING(?!_MASTER)\\b", "SM_VENDOR_CUSTOMER_MASTER");
        sql = sql.replaceAll("(?i)\\bVND_VENDOR(?!_MASTER)\\b", "SM_SUPPLIER_MASTER");

        sql = sql.replaceAll("(?i)\\bHR_INDUCTION_TRAINING(?!_DETAIL)\\b", "IND_INDUCTION_TRAINING_DETAIL");
        sql = sql.replaceAll("(?i)\\bHR_INTERVIEW(?!_MASTER)\\b", "IND_INTERVIEW_MASTER");
        sql = sql.replaceAll("(?i)\\bHR_INDUCTION_ROUND(?!_MASTER)\\b", "hr_induction_round_master");
        sql = sql.replaceAll("(?i)\\bHR_VERIFICATION_CRITERIA(?!_MASTER)\\b", "IND_VERIFICATION_CRITERIA");
        sql = sql.replaceAll("(?i)\\bHR_EMAIL_CONTENT(?!_MASTER)\\b", "IND_EMAIL_CONTENT");
        sql = sql.replaceAll(
                "(?i)\\bHR_INDUCTION(?!_ROUND|_TRAINING|_ASSIGNMENT|_MASTER|_DEPARTMENT|_LEVEL|_REASSIGNMENT)\\b",
                "IND_INDUCTION_MASTER");

        sql = sql.replaceAll("(?i)\\bHR_EMPLOYEE(?!_MASTER|_PERSONAL|_CONTACT|_MANAGER_MAPPING|_TYPE)\\b",
                "HR_EMPLOYEE_MASTER");
        sql = sql.replaceAll("(?i)\\bHR_LEVEL(?!_MASTER)\\b", "HR_LEVEL_MASTER");
        sql = sql.replaceAll("(?i)\\bHR_DEPARTMENT(?!_MASTER)\\b", "HR_DEPARTMENT_MASTER");
        sql = sql.replaceAll("(?i)\\bHR_DESIGNATION(?!_MASTER)\\b", "HR_DESIGNATION_MASTER");
        sql = sql.replaceAll("(?i)\\bHR_EMPLOYEE_TYPE(?!_MASTER)\\b", "HR_EMPLOYEE_TYPE_MASTER");
        sql = sql.replaceAll("(?i)\\bAD_DIVISION(?!_MASTER)\\b", "AD_DIVISION_MASTER");
        sql = sql.replaceAll("(?i)\\bHR_EMPLOYEE_PERSONAL(?!_DETAIL)\\b", "HR_EMPLOYEE_PERSONAL_DETAIL");
        sql = sql.replaceAll("(?i)\\bHR_EMPLOYEE_CONTACT(?!_MASTER)\\b", "hrm_employee_contact");
        sql = sql.replaceAll("(?i)\\bHR_EMPLOYEE_MANAGER_MAPPING(?!_MASTER)\\b", "EMPLOYEE_MANAGER_MAPPING");

        return sql;
    }

    private void ensureQmsChecklistClosedTable(JdbcTemplate targetJdbcTemplate) {
        try {
            targetJdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS QMS_CHECKLIST_CLOSED (" +
                            "  id BIGINT IDENTITY(1,1) PRIMARY KEY, " +
                            "  checklist_id BIGINT, " +
                            "  assigned_to VARCHAR(100), " +
                            "  assigned_by VARCHAR(100), " +
                            "  assigned_date TIMESTAMP, " +
                            "  status_id BIGINT, " +
                            "  remarks VARCHAR(500), " +
                            "  checklist_date DATE, " +
                            "  carry_forward_count INT DEFAULT 0, " +
                            "  assign_type VARCHAR(50), " +
                            "  verified_by VARCHAR(100), " +
                            "  verified_date TIMESTAMP, " +
                            "  verified_comments VARCHAR(2000), " +
                            "  frequency VARCHAR(50) NOT NULL, " +
                            "  active BOOLEAN DEFAULT TRUE, " +
                            "  created_by VARCHAR(100), " +
                            "  created_date TIMESTAMP, " +
                            "  updated_by VARCHAR(100), " +
                            "  updated_date TIMESTAMP" +
                            ")");
            System.out.println("[Self-Healing] H2: Ensured QMS_CHECKLIST_CLOSED table exists.");
        } catch (Exception e) {
            System.out.println("Error creating QMS_CHECKLIST_CLOSED table: " + e.getMessage());
        }
    }

    private String addDefaultToNumericColumns(String sql) {
        if (sql == null) {
            return null;
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "\\b(INT|BIGINT|DOUBLE|FLOAT)\\b",
                java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = pattern.matcher(sql);
        StringBuilder sb = new StringBuilder();
        int lastEnd = 0;

        while (matcher.find()) {
            int start = matcher.start();
            int end = matcher.end();

            String before = sql.substring(Math.max(0, start - 30), start);
            String after = sql.substring(end, Math.min(sql.length(), end + 50));

            boolean isCastOrConvert = before.matches("(?is).*\\bAS\\s+")
                    || before.matches("(?is).*\\bCONVERT\\s*\\(\\s*");
            boolean alreadyHasDefaultOrIdentity = after
                    .matches("(?is)^\\s*(?:IDENTITY|DEFAULT|PRIMARY|KEY|REFERENCES|AS|GENERATED|\\().*")
                    || after.matches("(?is)^[^,\\n]*\\b(DEFAULT|IDENTITY|PRIMARY|KEY|REFERENCES|AS|GENERATED)\\b.*");

            int quoteCount = 0;
            for (int i = 0; i < start; i++) {
                if (sql.charAt(i) == '\'') {
                    quoteCount++;
                }
            }
            boolean inStringLiteral = (quoteCount % 2 != 0);

            if (!isCastOrConvert && !alreadyHasDefaultOrIdentity && !inStringLiteral) {
                sb.append(sql, lastEnd, end);
                sb.append(" DEFAULT 0");
                lastEnd = end;
            }
        }
        sb.append(sql.substring(lastEnd));
        return sb.toString();
    }
}