package com.autonoma.erp;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;

public class DbAuditRunner {
    private static final String DB_URL = "jdbc:sqlserver://192.168.1.121:1433;databaseName=MIG_2906;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive";
    private static final String DB_USER = "nutech";
    private static final String DB_PASSWORD = "nutech@2026";

    public static void main(String[] args) {
        System.out.println("Starting SQL Server SOP Compliance Database Audit...");
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            System.out.println("Connection established successfully.");
            
            PrintWriter out = new PrintWriter(new FileWriter("database_audit_results.txt"));
            out.println("==================================================");
            out.println("DATABASE SOP COMPLIANCE AUDIT RESULTS");
            out.println("Generated on: " + new java.util.Date());
            out.println("==================================================");

            // Get all user tables
            List<String> tables = new ArrayList<>();
            DatabaseMetaData metaData = conn.getMetaData();
            try (ResultSet rs = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    if (!tableName.startsWith("sys") && !tableName.startsWith("trace_") && !tableName.startsWith("MS")) {
                        tables.add(tableName);
                    }
                }
            }
            Collections.sort(tables);

            out.println("\nTotal Base Tables Found: " + tables.size());
            out.println("Tables: " + tables);

            // 1. Table Naming Validation
            out.println("\n--- 1. Table Naming Validation ---");
            for (String table : tables) {
                boolean isUpper = table.equals(table.toUpperCase());
                boolean hasPrefix = table.contains("_");
                String prefix = hasPrefix ? table.substring(0, table.indexOf("_")) : "";
                boolean validPrefix = Arrays.asList("HR", "QMS", "SM", "AD", "NPD", "SYS", "FLW", "DATABASECHANGELOG", "DATABASECHANGELOGLOCK").contains(prefix) 
                        || table.startsWith("FLYWAY_") || table.equals("SPRING_SESSION") || table.equals("SPRING_SESSION_ATTRIBUTES");
                
                out.printf("Table: %s | Uppercase: %b | HasPrefix: %b | ValidPrefix(%s): %b%n", 
                        table, isUpper, hasPrefix, prefix, validPrefix);
            }

            // 2. Audit Column Validation
            out.println("\n--- 2. Audit Column & Order Validation ---");
            for (String table : tables) {
                if (table.equals("DATABASECHANGELOG") || table.equals("DATABASECHANGELOGLOCK") || table.startsWith("SPRING_SESSION")) {
                    continue;
                }
                
                List<String> cols = new ArrayList<>();
                Map<String, String> colTypes = new HashMap<>();
                Map<String, Integer> colPositions = new HashMap<>();
                
                try (ResultSet rs = metaData.getColumns(null, null, table, null)) {
                    while (rs.next()) {
                        String colName = rs.getString("COLUMN_NAME");
                        String typeName = rs.getString("TYPE_NAME");
                        int size = rs.getInt("COLUMN_SIZE");
                        int nullable = rs.getInt("NULLABLE");
                        int position = rs.getInt("ORDINAL_POSITION");
                        
                        cols.add(colName);
                        colTypes.put(colName, typeName + "(" + size + ") Nullable: " + nullable);
                        colPositions.put(colName, position);
                    }
                }

                // Check for standard audit columns
                String[] expectedAudit = {"CREATED_BY", "CREATED_DATE", "UPDATED_BY", "UPDATED_DATE"};
                String[] altAudit = {"CREATED_BY", "CREATED_AT", "UPDATED_BY", "UPDATED_AT"};
                
                boolean hasStd = true;
                boolean hasAlt = true;
                for (String ea : expectedAudit) {
                    if (!cols.contains(ea)) hasStd = false;
                }
                for (String aa : altAudit) {
                    if (!cols.contains(aa)) hasAlt = false;
                }

                out.println("Table: " + table);
                if (hasStd) {
                    out.println("  Audit columns present: Standard (CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE)");
                    // Order check
                    int p1 = colPositions.get("CREATED_BY");
                    int p2 = colPositions.get("CREATED_DATE");
                    int p3 = colPositions.get("UPDATED_BY");
                    int p4 = colPositions.get("UPDATED_DATE");
                    if (p2 == p1 + 1 && p3 == p2 + 1 && p4 == p3 + 1) {
                        out.println("  Audit columns Order: Compliant (consecutive)");
                    } else {
                        out.printf("  Audit columns Order Deviation: CREATED_BY(%d), CREATED_DATE(%d), UPDATED_BY(%d), UPDATED_DATE(%d)%n", p1, p2, p3, p4);
                    }
                } else if (hasAlt) {
                    out.println("  Audit columns present: Standard Alternate (CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT)");
                    int p1 = colPositions.get("CREATED_BY");
                    int p2 = colPositions.get("CREATED_AT");
                    int p3 = colPositions.get("UPDATED_BY");
                    int p4 = colPositions.get("UPDATED_AT");
                    if (p2 == p1 + 1 && p3 == p2 + 1 && p4 == p3 + 1) {
                        out.println("  Audit columns Order: Compliant (consecutive)");
                    } else {
                        out.printf("  Audit columns Order Deviation: CREATED_BY(%d), CREATED_AT(%d), UPDATED_BY(%d), UPDATED_AT(%d)%n", p1, p2, p3, p4);
                    }
                } else {
                    out.println("  Audit columns: MISSING or incomplete! Columns found: " + cols);
                }
            }

            // 3. Primary Key Validation
            out.println("\n--- 3. Primary Key Validation ---");
            for (String table : tables) {
                List<String> pks = new ArrayList<>();
                try (ResultSet rs = metaData.getPrimaryKeys(null, null, table)) {
                    while (rs.next()) {
                        pks.add(rs.getString("COLUMN_NAME"));
                    }
                }
                out.printf("Table: %s | PKs: %s%n", table, pks);
            }

            // 4. Foreign Key Validation & Orphan Record Count
            out.println("\n--- 4. Foreign Keys & Orphan Auditing ---");
            for (String table : tables) {
                if (table.equals("DATABASECHANGELOG") || table.equals("DATABASECHANGELOGLOCK") || table.startsWith("SPRING_SESSION")) {
                    continue;
                }
                
                out.println("Table: " + table);
                try (ResultSet rs = metaData.getImportedKeys(null, null, table)) {
                    boolean foundFk = false;
                    while (rs.next()) {
                        foundFk = true;
                        String fkName = rs.getString("FK_NAME");
                        String fkColumn = rs.getString("FKCOLUMN_NAME");
                        String pkTable = rs.getString("PKTABLE_NAME");
                        String pkColumn = rs.getString("PKCOLUMN_NAME");
                        
                        // Count orphans
                        int orphanCount = 0;
                        String checkOrphanSql = String.format(
                                "SELECT COUNT(*) FROM [%s] t LEFT JOIN [%s] p ON t.[%s] = p.[%s] WHERE t.[%s] IS NOT NULL AND p.[%s] IS NULL",
                                table, pkTable, fkColumn, pkColumn, fkColumn, pkColumn
                        );
                        try (Statement stmt = conn.createStatement();
                             ResultSet rsOrphan = stmt.executeQuery(checkOrphanSql)) {
                            if (rsOrphan.next()) {
                                orphanCount = rsOrphan.getInt(1);
                            }
                        } catch (Exception ex) {
                            // Ignored if query fails due to syntax/mapping
                        }
                        
                        out.printf("  FK: %s (%s -> %s.%s) | Orphans: %d%n", fkName, fkColumn, pkTable, pkColumn, orphanCount);
                    }
                    if (!foundFk) {
                        out.println("  No defined Foreign Keys.");
                    }
                }
            }

            // 5. Reference Data Validation (Storing name instead of ID)
            out.println("\n--- 5. Potential Reference Data Violations (Storing Names instead of IDs) ---");
            for (String table : tables) {
                // Ignore standard master tables or configuration tables
                if (table.endsWith("_MASTER") || table.equals("HR_DEPARTMENT") || table.equals("HR_DESIGNATION") || table.equals("HR_GRADE") || table.equals("HR_EMPLOYEE_TYPE") || table.equals("BOS_CREDENTIAL")) {
                    continue;
                }
                
                try (ResultSet rs = metaData.getColumns(null, null, table, null)) {
                    while (rs.next()) {
                        String colName = rs.getString("COLUMN_NAME");
                        String typeName = rs.getString("TYPE_NAME");
                        if ((colName.endsWith("_NAME") || colName.endsWith("NAME")) 
                                && !colName.equals("CREATED_BY") && !colName.equals("UPDATED_BY")
                                && !colName.equals("FILE_NAME") && !colName.equals("ORIGINAL_FILE_NAME") && !colName.equals("TASK_NAME")
                                && !colName.equals("MEETING_NAME") && !colName.equals("CHECKLIST_NAME")) {
                            
                            // Check if there is data in it
                            int count = 0;
                            try (Statement stmt = conn.createStatement();
                                 ResultSet countRs = stmt.executeQuery("SELECT COUNT(*) FROM [" + table + "] WHERE [" + colName + "] IS NOT NULL")) {
                                if (countRs.next()) {
                                    count = countRs.getInt(1);
                                }
                            } catch (Exception e) {}
                            
                            out.printf("Table: %s | Column: %s | Type: %s | Non-null count: %d%n", table, colName, typeName, count);
                        }
                    }
                }
            }

            // 6. Data Auditing: CREATED_BY / UPDATED_BY content analysis
            out.println("\n--- 6. CREATED_BY & UPDATED_BY Data Quality Audit ---");
            for (String table : tables) {
                if (table.equals("DATABASECHANGELOG") || table.equals("DATABASECHANGELOGLOCK") || table.startsWith("SPRING_SESSION")) {
                    continue;
                }
                
                boolean hasCreatedBy = false;
                boolean hasUpdatedBy = false;
                try (ResultSet rs = metaData.getColumns(null, null, table, null)) {
                    while (rs.next()) {
                        String colName = rs.getString("COLUMN_NAME");
                        if (colName.equalsIgnoreCase("CREATED_BY")) hasCreatedBy = true;
                        if (colName.equalsIgnoreCase("UPDATED_BY")) hasUpdatedBy = true;
                    }
                }

                if (hasCreatedBy) {
                    out.println("Table: " + table + " | CREATED_BY Distinct Values:");
                    try (Statement stmt = conn.createStatement();
                         ResultSet valRs = stmt.executeQuery("SELECT DISTINCT [CREATED_BY] FROM [" + table + "]")) {
                        while (valRs.next()) {
                            out.println("  - " + valRs.getString(1));
                        }
                    } catch (Exception e) {
                        out.println("  Failed to query distinct CREATED_BY values.");
                    }
                }
                if (hasUpdatedBy) {
                    out.println("Table: " + table + " | UPDATED_BY Distinct Values:");
                    try (Statement stmt = conn.createStatement();
                         ResultSet valRs = stmt.executeQuery("SELECT DISTINCT [UPDATED_BY] FROM [" + table + "]")) {
                        while (valRs.next()) {
                            out.println("  - " + valRs.getString(1));
                        }
                    } catch (Exception e) {
                        out.println("  Failed to query distinct UPDATED_BY values.");
                    }
                }
            }

            // 7. Multi-Value Storage (Comma-separated values audit)
            out.println("\n--- 7. Comma Separated Values Audit ---");
            for (String table : tables) {
                if (table.equals("DATABASECHANGELOG") || table.equals("DATABASECHANGELOGLOCK") || table.startsWith("SPRING_SESSION")) {
                    continue;
                }
                
                try (ResultSet rs = metaData.getColumns(null, null, table, null)) {
                    while (rs.next()) {
                        String colName = rs.getString("COLUMN_NAME");
                        String typeName = rs.getString("TYPE_NAME");
                        
                        // Check columns that might hold string arrays or comma-separated lists
                        if (typeName.contains("char") || typeName.contains("text")) {
                            String checkCsvSql = String.format("SELECT COUNT(*) FROM [%s] WHERE [%s] LIKE '%%,%%'", table, colName);
                            int csvCount = 0;
                            try (Statement stmt = conn.createStatement();
                                 ResultSet csvRs = stmt.executeQuery(checkCsvSql)) {
                                if (csvRs.next()) {
                                    csvCount = csvRs.getInt(1);
                                }
                            } catch (Exception e) {}
                            
                            if (csvCount > 0) {
                                out.printf("CSV Violations | Table: %s | Column: %s | Type: %s | Rows Containing Comma: %d%n", 
                                        table, colName, typeName, csvCount);
                            }
                        }
                    }
                }
            }

            // 8. JSON Attachment collections audit
            out.println("\n--- 8. JSON Attachment / File Arrays Audit ---");
            for (String table : tables) {
                if (table.equals("DATABASECHANGELOG") || table.equals("DATABASECHANGELOGLOCK") || table.startsWith("SPRING_SESSION")) {
                    continue;
                }
                
                try (ResultSet rs = metaData.getColumns(null, null, table, null)) {
                    while (rs.next()) {
                        String colName = rs.getString("COLUMN_NAME");
                        String typeName = rs.getString("TYPE_NAME");
                        
                        if (typeName.contains("char") || typeName.contains("text")) {
                            String checkJsonSql = String.format("SELECT COUNT(*) FROM [%s] WHERE [%s] LIKE '%%[%%' AND [%s] LIKE '%%]%%'", table, colName, colName);
                            int jsonCount = 0;
                            try (Statement stmt = conn.createStatement();
                                 ResultSet jsonRs = stmt.executeQuery(checkJsonSql)) {
                                if (jsonRs.next()) {
                                    jsonCount = jsonRs.getInt(1);
                                }
                            } catch (Exception e) {}
                            
                            if (jsonCount > 0) {
                                out.printf("JSON Array Violations | Table: %s | Column: %s | Type: %s | Rows Containing JSON Arrays: %d%n", 
                                        table, colName, typeName, jsonCount);
                            }
                        }
                    }
                }
            }

            // 9. Null values in Mandatory Columns
            out.println("\n--- 9. Null Values in Mandatory Fields Audit ---");
            for (String table : tables) {
                if (table.equals("DATABASECHANGELOG") || table.equals("DATABASECHANGELOGLOCK") || table.startsWith("SPRING_SESSION")) {
                    continue;
                }
                
                try (ResultSet rs = metaData.getColumns(null, null, table, null)) {
                    while (rs.next()) {
                        String colName = rs.getString("COLUMN_NAME");
                        int nullable = rs.getInt("NULLABLE");
                        
                        // Check if a nullable column actually contains empty or null values when it shouldn't
                        if (nullable == 1) {
                            String checkNullSql = String.format("SELECT COUNT(*) FROM [%s] WHERE [%s] IS NULL", table, colName);
                            int nullCount = 0;
                            try (Statement stmt = conn.createStatement();
                                 ResultSet nullRs = stmt.executeQuery(checkNullSql)) {
                                if (nullRs.next()) {
                                    nullCount = nullRs.getInt(1);
                                }
                            } catch (Exception e) {}
                            
                            // Let's get total row count
                            int totalCount = 0;
                            try (Statement stmt = conn.createStatement();
                                 ResultSet totRs = stmt.executeQuery("SELECT COUNT(*) FROM [" + table + "]")) {
                                if (totRs.next()) {
                                    totalCount = totRs.getInt(1);
                                }
                            } catch (Exception e) {}
                            
                            out.printf("Table: %s | Column: %s | Null Count: %d / %d%n", table, colName, nullCount, totalCount);
                        }
                    }
                }
            }

            out.close();
            System.out.println("Audit results written to database_audit_results.txt successfully.");
        } catch (Exception e) {
            System.err.println("Fatal Error during DB audit runner execution: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
