package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.BackendErrorLog;
import com.autonoma.erp.repository.admin.BackendErrorLogRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BackendErrorLoggerService {

    @Autowired
    private BackendErrorLogRepository backendErrorLogRepository;

    @Autowired
    private DataSource dataSource;

    @Async
    public void logError(Throwable ex, String httpMethod, String requestPath, String username, Integer responseStatus, String controllerName, String controllerPackage) {
        try {
            // Dynamic stack trace scanning fallback for controller identification
            if (controllerPackage == null || controllerPackage.isEmpty()) {
                for (StackTraceElement element : ex.getStackTrace()) {
                    if (element.getClassName().startsWith("com.autonoma.erp.controller.")) {
                        controllerPackage = element.getClassName();
                        int lastDot = element.getClassName().lastIndexOf('.');
                        controllerName = lastDot != -1 ? element.getClassName().substring(lastDot + 1) : element.getClassName();
                        break;
                    }
                }
            }

            // 1. Determine Module Name
            String moduleName = determineModuleName(requestPath, controllerPackage);

            // 2. Extract Exception Details
            String exceptionType = ex.getClass().getName();
            String errorMessage = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            ex.printStackTrace(pw);
            String errorStack = sw.toString();

            // 3. Extract SQL Table & Field Details (if identifiable)
            String[] sqlDetails = extractSqlDetails(ex);
            String sqlTableName = sqlDetails[0];
            String sqlFieldName = sqlDetails[1];

            // 4. Save Log via raw JDBC to avoid Hibernate 6 + SQL Server getGeneratedKeys() incompatibility
            String insertSql = "INSERT INTO AD_BACKEND_ERROR_LOG " +
                    "(module_name, api_endpoint, exception_type, error_message, error_stack, username, timestamp, " +
                    "sql_table_name, sql_field_name, http_method, request_path, server_response_status) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setString(1, truncate(moduleName, 255));
                ps.setString(2, truncate(requestPath, 500));
                ps.setString(3, truncate(exceptionType, 500));
                ps.setString(4, errorMessage);
                ps.setString(5, errorStack);
                ps.setString(6, username != null ? username : "ANONYMOUS");
                ps.setTimestamp(7, new java.sql.Timestamp(new Date().getTime()));
                ps.setString(8, truncate(sqlTableName, 255));
                ps.setString(9, truncate(sqlFieldName, 255));
                ps.setString(10, truncate(httpMethod, 20));
                ps.setString(11, truncate(requestPath, 500));
                ps.setObject(12, responseStatus);
                ps.executeUpdate();
            }

        } catch (Throwable t) {
            // Critical Safety Rule: Logging failures must NEVER break the main application flow.
            System.err.println("[CRITICAL] Failed to asynchronously save backend error log: " + t.getMessage());
            t.printStackTrace();
        }
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return null;
        return value.length() > maxLen ? value.substring(0, maxLen) : value;
    }

    private String determineModuleName(String path, String controllerPackage) {
        // Option 1: Parse from Request Path
        if (path != null && !path.isEmpty()) {
            String cleanPath = path.toLowerCase();
            if (cleanPath.startsWith("/api/")) {
                String subPath = cleanPath.substring(5);
                int slashIdx = subPath.indexOf('/');
                String moduleCandidate = slashIdx != -1 ? subPath.substring(0, slashIdx) : subPath;
                if (!moduleCandidate.isEmpty() && !moduleCandidate.equals("admin") && !moduleCandidate.equals("master")) {
                    return moduleCandidate.toUpperCase();
                } else if (moduleCandidate.equals("admin")) {
                    return "ADMIN";
                } else if (moduleCandidate.equals("master")) {
                    return "MASTER";
                }
            }
        }

        // Option 2: Parse from Controller Package Structure
        if (controllerPackage != null && !controllerPackage.isEmpty()) {
            String lowerPkg = controllerPackage.toLowerCase();
            if (lowerPkg.contains(".qms")) return "QMS";
            if (lowerPkg.contains(".admin")) return "ADMIN";
            if (lowerPkg.contains(".master")) return "MASTER";
            if (lowerPkg.contains(".purchase")) return "PURCHASE";
            if (lowerPkg.contains(".sales")) return "SALES";
            if (lowerPkg.contains(".inventory")) return "INVENTORY";
            if (lowerPkg.contains(".finance")) return "FINANCE";
        }

        return "SYSTEM";
    }

    private String[] extractSqlDetails(Throwable t) {
        String tableName = "UNKNOWN_TABLE";
        String fieldName = "UNKNOWN_FIELD";

        Throwable current = t;
        while (current != null) {
            // 1. Check if it's a Jakarta Validation ConstraintViolationException
            if (current instanceof ConstraintViolationException) {
                ConstraintViolationException cve = (ConstraintViolationException) current;
                if (cve.getConstraintViolations() != null && !cve.getConstraintViolations().isEmpty()) {
                    ConstraintViolation<?> violation = cve.getConstraintViolations().iterator().next();
                    tableName = violation.getRootBeanClass().getSimpleName().toUpperCase();
                    fieldName = violation.getPropertyPath().toString().toUpperCase();
                    break;
                }
            }

            String msg = current.getMessage();
            if (msg != null) {
                // Pattern A: H2 Unique Index violation
                // e.g., Unique index or primary key violation: "public.UK_xxx ON public.TABLE_NAME(FIELD1)"
                Pattern pUnique = Pattern.compile("ON\\s+(?:PUBLIC\\.)?([A-Za-z0-9_]+)\\s*\\(([^)]+)\\)", Pattern.CASE_INSENSITIVE);
                Matcher mUnique = pUnique.matcher(msg);
                if (mUnique.find()) {
                    tableName = mUnique.group(1).toUpperCase();
                    fieldName = mUnique.group(2).replaceAll("\\s+", "").toUpperCase();
                    break;
                }

                // Pattern B: H2 NULL not allowed violation
                // e.g., NULL not allowed for column "NAME"; SQL statement: ... table: SM_CUSTOMER_MASTER
                if (msg.contains("NULL not allowed for column")) {
                    Pattern pCol = Pattern.compile("NULL not allowed for column\\s+\"([A-Za-z0-9_]+)\"", Pattern.CASE_INSENSITIVE);
                    Matcher mCol = pCol.matcher(msg);
                    if (mCol.find()) {
                        fieldName = mCol.group(1).toUpperCase();
                    }
                    Pattern pTab = Pattern.compile("table:\\s*([A-Za-z0-9_]+)", Pattern.CASE_INSENSITIVE);
                    Matcher mTab = pTab.matcher(msg);
                    if (mTab.find()) {
                        tableName = mTab.group(1).toUpperCase();
                    }
                    if (!"UNKNOWN_TABLE".equals(tableName) || !"UNKNOWN_FIELD".equals(fieldName)) {
                        break;
                    }
                }

                // Pattern C: H2 Referential Integrity (Foreign Key) violation
                // e.g., PUBLIC.SM_CUSTOMER_MASTER FOREIGN KEY(COMPANY_ID) REFERENCES ...
                Pattern pFK = Pattern.compile("(?:PUBLIC\\.)?([A-Za-z0-9_]+)\\s+FOREIGN\\s+KEY\\s*\\(([^)]+)\\)", Pattern.CASE_INSENSITIVE);
                Matcher mFK = pFK.matcher(msg);
                if (mFK.find()) {
                    tableName = mFK.group(1).toUpperCase();
                    fieldName = mFK.group(2).replaceAll("\\s+", "").toUpperCase();
                    break;
                }

                // Pattern D: Generic SQL Server / standard SQL constraints
                // e.g., The INSERT statement conflicted with the FOREIGN KEY constraint "...". The conflict occurred in database "...", table "dbo.SM_CUSTOMER_MASTER", column 'COMPANY_ID'.
                Pattern pGenFK = Pattern.compile("table\\s+\"?[a-zA-Z0-9_.]*\\.?([A-Za-z0-9_]+)\"?,\\s+column\\s+'([A-Za-z0-9_]+)'", Pattern.CASE_INSENSITIVE);
                Matcher mGenFK = pGenFK.matcher(msg);
                if (mGenFK.find()) {
                    tableName = mGenFK.group(1).toUpperCase();
                    fieldName = mGenFK.group(2).toUpperCase();
                    break;
                }

                // Pattern E: Cannot insert the value NULL into column 'NAME', table 'dbo.SM_CUSTOMER_MASTER'
                Pattern pGenNull = Pattern.compile("column\\s+'([A-Za-z0-9_]+)',\\s+table\\s+'[a-zA-Z0-9_.]*\\.?([A-Za-z0-9_]+)'", Pattern.CASE_INSENSITIVE);
                Matcher mGenNull = pGenNull.matcher(msg);
                if (mGenNull.find()) {
                    fieldName = mGenNull.group(1).toUpperCase();
                    tableName = mGenNull.group(2).toUpperCase();
                    break;
                }
            }

            current = current.getCause();
        }

        return new String[] { tableName, fieldName };
    }
}
