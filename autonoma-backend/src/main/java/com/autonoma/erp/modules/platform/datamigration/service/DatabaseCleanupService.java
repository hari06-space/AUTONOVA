package com.autonoma.erp.modules.platform.datamigration.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DatabaseCleanupService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final List<String> PROTECTED_TABLES = Arrays.asList(
            "BOS_MODULES",
            "BOS_SUB_MODULES",
            "BOS_PAGES",
            "AD_COMPANY_CREDENTIAL",
            "AD_DIVISION");

    @Transactional
    public void clearTransactionData() {
        try {
            // 1. Disable all foreign key constraints and triggers
            jdbcTemplate.execute("EXEC sp_MSforeachtable \"ALTER TABLE ? NOCHECK CONSTRAINT all\"");
            jdbcTemplate.execute("EXEC sp_MSforeachtable \"ALTER TABLE ? DISABLE TRIGGER all\"");

            // 2. Get all base tables
            List<String> allTables = jdbcTemplate.queryForList(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'",
                    String.class);

            // 3. Filter out protected tables
            List<String> targetTables = allTables.stream()
                    .filter(t -> !PROTECTED_TABLES.stream().anyMatch(p -> p.equalsIgnoreCase(t)))
                    .collect(Collectors.toList());

            // 4. Iterate and execute conditional deletes in multiple passes to handle any residual FK issues
            int MAX_PASSES = 5;
            for (int pass = 1; pass <= MAX_PASSES; pass++) {
                boolean anyError = false;
                for (String table : targetTables) {
                    String sql;
                    if (table.equalsIgnoreCase("AD_USER_CREDENTIAL")) {
                        sql = "DELETE FROM [" + table + "] WHERE USER_LEVEL < 5 OR USER_LEVEL IS NULL";
                    } else if (table.equalsIgnoreCase("AD_USER_DIVISION_MAPPING")) {
                        sql = "DELETE FROM [" + table
                                + "] WHERE USER_ID NOT IN (SELECT USER_ID FROM AD_USER_CREDENTIAL WHERE USER_LEVEL = 5)";
                    } else {
                        sql = "DELETE FROM [" + table + "]";
                    }

                    try {
                        int rows = jdbcTemplate.update(sql);
                        if (rows > 0) {
                            System.out.println("Pass " + pass + " - Cleaned table: " + table + " (" + rows + " rows)");
                        }
                    } catch (Exception e) {
                        anyError = true;
                        if (pass == MAX_PASSES) {
                            System.err.println("Error cleaning table: " + table + " - " + e.getMessage());
                        }
                    }
                }
                if (!anyError) break;
            }

        } finally {
            // 5. Re-enable all foreign key constraints (NO CHECK for existing data to
            // prevent orphaned row errors)
            // Using CHECK CONSTRAINT without WITH CHECK means it enables it for future
            // inserts but doesn't validate current data.
            // This is safer since we might have deleted a parent row while retaining a
            // child row (user_level 5).
            try {
                jdbcTemplate.execute("EXEC sp_MSforeachtable \"ALTER TABLE ? CHECK CONSTRAINT all\"");
                jdbcTemplate.execute("EXEC sp_MSforeachtable \"ALTER TABLE ? ENABLE TRIGGER all\"");
            } catch (Exception e) {
                System.err.println("Failed to re-enable constraints and triggers: " + e.getMessage());
            }
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        String query = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?";
        Integer count = jdbcTemplate.queryForObject(query, new Object[] { tableName, columnName }, Integer.class);
        return count != null && count > 0;
    }

    @Transactional
    public String dropAllTables() {
        String sql = "DECLARE @sql NVARCHAR(MAX) = '';\n" +
                "\n" +
                "-- Drop foreign keys first\n" +
                "SELECT @sql += \n" +
                "'ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' +\n" +
                "OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];' + CHAR(13)\n" +
                "FROM sys.foreign_keys;\n" +
                "\n" +
                "EXEC sp_executesql @sql;\n" +
                "\n" +
                "-- Drop tables except required tables\n" +
                "SET @sql = '';\n" +
                "\n" +
                "SELECT @sql += \n" +
                "'DROP TABLE [' + SCHEMA_NAME(schema_id) + '].[' + name + '];' + CHAR(13)\n" +
                "FROM sys.tables\n" +
                "WHERE name NOT IN\n" +
                "(\n" +
                "    'BOS_MODULES',\n" +
                "    'BOS_PAGES',\n" +
                "    'BOS_USER_PAGE_AUTH',\n" +
                "    'AD_COMPANY_CREDENTIAL',\n" +
                "    'AD_DIVISION',\n" +
                "    'AD_USER_COMPANY_MAPPING',\n" +
                "    'AD_USER_CREDENTIAL',\n" +
                "    'AD_USER_DIVISION_MAPPING'\n" +
                ");\n" +
                "\n" +
                "EXEC sp_executesql @sql;";
        try {
            jdbcTemplate.execute(sql);
            return "Successfully dropped all non-essential tables and constraints.";
        } catch (Exception e) {
            throw new RuntimeException("Failed to drop tables: " + e.getMessage());
        }
    }

    public String createAllTables() {
        try {
            org.flywaydb.core.Flyway flyway = org.flywaydb.core.Flyway.configure()
                    .dataSource(jdbcTemplate.getDataSource())
                    .locations("classpath:dbscripts")
                    .baselineOnMigrate(true)
                    .load();
            flyway.migrate();
            return "Successfully recreated all tables using Flyway migrations.";
        } catch (Exception e) {
            throw new RuntimeException("Failed to recreate tables: " + e.getMessage());
        }
    }
}
