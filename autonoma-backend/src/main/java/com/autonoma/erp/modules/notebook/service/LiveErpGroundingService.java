package com.autonoma.erp.modules.notebook.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Fetches live ERP data for linked notebook sources to ground Gemini answers
 * in real-time business data (employees, machines, customers, QMS, tickets).
 *
 * This is BOS Notebook's unique superpower over standalone tools like NotebookLM:
 * AI answers are grounded in live SQL Server data, not just uploaded documents.
 */
@Service
public class LiveErpGroundingService {

    @Autowired
    private DataSource dataSource;

    private static final int MAX_ROWS = 50; // Safety limit per live query

    // ─── Main Grounding Method ─────────────────────────────────────────────────

    /**
     * Given a notebook source with linked ERP entity IDs, fetch live data
     * and return formatted context text for Gemini.
     */
    public String fetchLiveContext(
            Long linkedEmployeeId,
            Long linkedMachineId,
            Long linkedCustomerId,
            Integer linkedTicketId) {

        StringBuilder context = new StringBuilder();

        if (linkedEmployeeId != null) {
            context.append(fetchEmployeeContext(linkedEmployeeId));
        }
        if (linkedMachineId != null) {
            context.append(fetchMachineContext(linkedMachineId));
        }
        if (linkedCustomerId != null) {
            context.append(fetchCustomerContext(linkedCustomerId));
        }
        if (linkedTicketId != null) {
            context.append(fetchTicketContext(linkedTicketId));
        }

        return context.toString();
    }

    // ─── Employee Live Data ────────────────────────────────────────────────────

    String fetchEmployeeContext(Long empId) {
        String sql = """
            SELECT e.EMPLOYEE_NAME, e.EMP_CODE,
                   (SELECT TOP 1 d.DESIGNATION_NAME FROM HR_DESIGNATION d WITH (NOLOCK) INNER JOIN HR_EMPLOYEE_ORGANIZATION o WITH (NOLOCK) ON o.DESIGNATION_ID = d.ID WHERE o.EMPLOYEE_ID = e.ID) AS DESIGNATION,
                   (SELECT TOP 1 dept.DEPARTMENT_NAME FROM HR_DEPARTMENT dept WITH (NOLOCK) INNER JOIN HR_EMPLOYEE_ORGANIZATION o WITH (NOLOCK) ON o.DEPARTMENT_ID = dept.ID WHERE o.EMPLOYEE_ID = e.ID) AS DEPARTMENT,
                   (SELECT TOP 1 s.DATE_OF_JOINING FROM HR_EMPLOYEE_SCHEDULING s WITH (NOLOCK) WHERE s.EMPLOYEE_ID = e.ID) AS DATE_OF_JOIN,
                   e.STATUS AS EMP_STATUS,
                   ISNULL((SELECT SUM(lm.EL + lm.CL + lm.SL + lm.AL + lm.PL) FROM HR_LEAVE_MASTER lm WITH (NOLOCK) WHERE lm.EMPLOYEE_ID = e.ID AND lm.STATUS = 1), 0) AS LEAVE_BALANCE,
                   ISNULL((SELECT COUNT(*) FROM HR_DAILY_ATTENDANCE att WITH (NOLOCK) 
                           WHERE att.EMP_ID = e.ID 
                             AND MONTH(att.ATTENDANCE_DATE) = MONTH(GETDATE()) 
                             AND YEAR(att.ATTENDANCE_DATE) = YEAR(GETDATE()) 
                             AND att.STATUS = 'PRESENT'), 0) AS PRESENT_DAYS_THIS_MONTH
            FROM HR_EMPLOYEE e WITH (NOLOCK)
            WHERE e.ID = ?
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, empId);
            return "--- Live Employee Data (ID: " + empId + ") ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Employee data unavailable for empId=" + empId + ": " + e.getMessage());
            return "--- Employee Data [temporarily unavailable] ---\n";
        }
    }

    // ─── Machine Live Data ────────────────────────────────────────────────────

    String fetchMachineContext(Long machineId) {
        String sql = """
            SELECT m.MACHINE_NAME, m.MACHINE_CODE, m.MACHINE_TYPE,
                   m.LOCATION, m.STATUS,
                   m.LAST_MAINTENANCE_DATE, m.NEXT_MAINTENANCE_DATE
            FROM QMT_ASSET_MASTER m WITH (NOLOCK)
            WHERE m.ID = ?
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, machineId);
            return "--- Live Machine Data (ID: " + machineId + ") ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Machine data unavailable for machineId=" + machineId + ": " + e.getMessage());
            return "--- Machine Data [temporarily unavailable] ---\n";
        }
    }

    // ─── Customer Live Data ───────────────────────────────────────────────────

    String fetchCustomerContext(Long customerId) {
        String sql = """
            SELECT c.LEDGER_NAME as CUSTOMER_NAME, c.CODE as CUSTOMER_CODE, NULL as CONTACT_PERSON,
                   c.MOBILE_NO as PHONE, c.MAIL_ID as EMAIL, c.CITY, 
                   CASE WHEN c.IS_ACTIVE = 1 THEN 'Active' ELSE 'Inactive' END as ACTIVE_STATUS,
                   (SELECT COUNT(*) FROM TICKET_TRACEABILITY_CENTER t WITH (NOLOCK)
                    WHERE t.CUSTOMER_ID = c.ID AND t.STATUS NOT IN ('CLOSED','RESOLVED')) AS OPEN_TICKETS
            FROM FA_ACCOUNT_LEDGER c WITH (NOLOCK)
            WHERE c.IS_CUSTOMER = 1 AND c.ID = ?
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, customerId);
            return "--- Live Customer Data (ID: " + customerId + ") ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Customer data unavailable for customerId=" + customerId + ": " + e.getMessage());
            return "--- Customer Data [temporarily unavailable] ---\n";
        }
    }

    // ─── Ticket / Support Context ─────────────────────────────────────────────

    String fetchTicketContext(Integer ticketId) {
        String sql = """
            SELECT t.TICKET_NO, t.SUBJECT, t.DESCRIPTION,
                   t.STATUS, t.PRIORITY, t.CREATED_DATE,
                   t.ASSIGNED_TO, t.RESOLUTION
            FROM TICKET_TRACEABILITY_CENTER t WITH (NOLOCK)
            WHERE t.ROW_ID = ?
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ticketId);
            return "--- Live Ticket Data (ID: " + ticketId + ") ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Ticket data unavailable for ticketId=" + ticketId + ": " + e.getMessage());
            return "--- Ticket Data [temporarily unavailable] ---\n";
        }
    }

    public String fetchCurrentUserContext(Long empId) {
        if (empId == null) return "";
        return fetchEmployeeContext(empId) + "\n" + fetchChecklistsContext(empId);
    }

    String fetchChecklistsContext(Long empId) {
        String sql = """
            SELECT m.SEQ_NO AS CHECKLIST_CODE, m.CHECKING_POINT AS TITLE,
                   m.DESCRIPTION, a.ASSIGNED_DATE, a.CHECKLIST_DATE,
                   s.NAME AS STATUS, a.REMARKS
            FROM QMS_CHECKLIST_ASSIGNMENT a WITH (NOLOCK)
            INNER JOIN QMS_CHECKLIST_MASTER m WITH (NOLOCK) ON a.CHECKLIST_ID = m.ID
            LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON a.STATUS_ID = s.ID
            WHERE a.ASSIGNED_TO = ?
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, String.valueOf(empId));
            return "--- Live Assigned QMS Checklists ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Checklist data unavailable for empId=" + empId + ": " + e.getMessage());
            return "--- Assigned QMS Checklists [temporarily unavailable] ---\n";
        }
    }

    // ─── Utility: ResultSet → readable text ───────────────────────────────────

    private String queryToText(PreparedStatement ps) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (ResultSet rs = ps.executeQuery()) {
            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();
            int rowCount = 0;
            while (rs.next() && rowCount < MAX_ROWS) {
                if (rowCount > 0) {
                    sb.append("---\n");
                }
                for (int i = 1; i <= cols; i++) {
                    String col = meta.getColumnLabel(i);
                    String val = rs.getString(i);
                    if (val != null && !val.isBlank()) {
                        sb.append(col).append(": ").append(val).append("\n");
                    }
                }
                rowCount++;
            }
            if (sb.length() == 0) {
                sb.append("[No data found]\n");
            }
        }
        return sb.toString();
    }

    public String fetchDepartmentEmployees(String departmentName) {
        String sql = """
            SELECT e.EMPLOYEE_NAME, e.EMP_CODE, d.DESIGNATION_NAME
            FROM HR_EMPLOYEE e WITH (NOLOCK)
            INNER JOIN HR_EMPLOYEE_ORGANIZATION o WITH (NOLOCK) ON e.ID = o.EMPLOYEE_ID
            INNER JOIN HR_DEPARTMENT dept WITH (NOLOCK) ON o.DEPARTMENT_ID = dept.ID
            LEFT JOIN HR_DESIGNATION d WITH (NOLOCK) ON o.DESIGNATION_ID = d.ID
            WHERE dept.DEPARTMENT_NAME LIKE ? AND e.STATUS = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE') AND (e.IS_ACTIVE = 1 OR e.IS_ACTIVE IS NULL)
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%" + departmentName + "%");
            return "--- Live Employees in " + departmentName + " Department ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Department employees unavailable for dept=" + departmentName + ": " + e.getMessage());
            return "--- Department Employees [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyChecklistsSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM QMS_CHECKLIST_MASTER WITH (NOLOCK)) as MASTER_CHECKLIST_TEMPLATES_COUNT,
              (SELECT COUNT(*) FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK)) as ACTIVE_ASSIGNED_CHECKLISTS_COUNT,
              (SELECT COUNT(*) FROM QMS_CHECKLIST_CLOSED WITH (NOLOCK)) as CLOSED_CHECKLISTS_HISTORICAL_COUNT,
              ((SELECT COUNT(*) FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK)) + 
               (SELECT COUNT(*) FROM QMS_CHECKLIST_CLOSED WITH (NOLOCK))) as TOTAL_CHECKLISTS_GENERATED_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide QMS Checklists Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company checklists summary unavailable: " + e.getMessage());
            return "--- Company-Wide QMS Checklists Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyEmployeeSummary() {
        StringBuilder sb = new StringBuilder("--- Live Company-Wide Employee Headcount Summary ---\n");
        
        String statsSql = """
            SELECT 
              (SELECT COUNT(*) FROM HR_EMPLOYEE WITH (NOLOCK)) AS TOTAL_EMPLOYEES_COUNT,
              (SELECT COUNT(*) FROM HR_EMPLOYEE WITH (NOLOCK) WHERE STATUS = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE')) AS ACTIVE_EMPLOYEES_COUNT,
              (SELECT COUNT(*) FROM HR_DEPARTMENT WITH (NOLOCK)) AS TOTAL_DEPARTMENTS_COUNT,
              (SELECT COUNT(*) FROM HR_DESIGNATION WITH (NOLOCK)) AS TOTAL_DESIGNATIONS_COUNT
            """;
            
        String deptSql = """
            SELECT d.DEPARTMENT_NAME, COUNT(*) AS ACTIVE_EMP_COUNT
            FROM HR_EMPLOYEE e WITH (NOLOCK)
            JOIN HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) ON e.ID = eo.EMPLOYEE_ID
            JOIN HR_DEPARTMENT d WITH (NOLOCK) ON d.ID = eo.DEPARTMENT_ID
            WHERE e.STATUS IN (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'ACTIVE') OR e.IS_ACTIVE = 1
            GROUP BY d.DEPARTMENT_NAME
            ORDER BY ACTIVE_EMP_COUNT DESC
            """;
            
        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(statsSql)) {
                sb.append(queryToText(ps)).append("\n");
            }
            try (PreparedStatement ps = conn.prepareStatement(deptSql)) {
                sb.append("--- Active Employees by Department ---\n");
                sb.append(queryToText(ps)).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company employee summary error: " + e.getMessage());
            return "--- Company-Wide Employee Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyLeaveSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM HR_LEAVE_MASTER WITH (NOLOCK) WHERE STATUS = 1) AS ACTIVE_LEAVE_PROFILES_COUNT,
              (SELECT COUNT(*) FROM HR_LEAVE_REQUEST WITH (NOLOCK) WHERE STATUS = 'Pending' OR STATUS = 'PENDING') AS PENDING_LEAVE_REQUESTS_COUNT,
              (SELECT COUNT(*) FROM HR_LEAVE_REQUEST WITH (NOLOCK) WHERE MONTH(START_DATE) = MONTH(GETDATE()) AND YEAR(START_DATE) = YEAR(GETDATE())) AS LEAVE_REQUESTS_THIS_MONTH_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Leave Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company leave summary error: " + e.getMessage());
            return "--- Company-Wide Leave Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyAttendanceSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM HR_DAILY_ATTENDANCE WITH (NOLOCK) 
               WHERE CONVERT(date, ATTENDANCE_DATE) = CONVERT(date, GETDATE()) AND STATUS = 'PRESENT') AS PRESENT_TODAY_COUNT,
              (SELECT COUNT(*) FROM HR_DAILY_ATTENDANCE WITH (NOLOCK) 
               WHERE CONVERT(date, ATTENDANCE_DATE) = CONVERT(date, GETDATE()) AND STATUS = 'ABSENT') AS ABSENT_TODAY_COUNT,
              (SELECT COUNT(*) FROM HR_DAILY_ATTENDANCE WITH (NOLOCK) 
               WHERE MONTH(ATTENDANCE_DATE) = MONTH(GETDATE()) AND YEAR(ATTENDANCE_DATE) = YEAR(GETDATE()) AND STATUS = 'PRESENT') AS TOTAL_PRESENT_DAYS_THIS_MONTH_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Attendance Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company attendance summary error: " + e.getMessage());
            return "--- Company-Wide Attendance Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyMachineSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM QMT_ASSET_MASTER WITH (NOLOCK)) AS TOTAL_MACHINES_COUNT,
              (SELECT COUNT(*) FROM QMT_ASSET_MASTER WITH (NOLOCK) WHERE STATUS = 'Active' OR STATUS = 'ACTIVE') AS ACTIVE_MACHINES_COUNT,
              (SELECT COUNT(*) FROM QMT_ASSET_MASTER WITH (NOLOCK) WHERE STATUS = 'Maintenance' OR STATUS = 'MAINTENANCE') AS MAINTENANCE_MACHINES_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Machine Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company machine summary error: " + e.getMessage());
            return "--- Company-Wide Machine Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyCustomerSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM FA_ACCOUNT_LEDGER WITH (NOLOCK) WHERE IS_CUSTOMER = 1) AS TOTAL_CUSTOMERS_COUNT,
              (SELECT COUNT(*) FROM FA_ACCOUNT_LEDGER WITH (NOLOCK) WHERE IS_CUSTOMER = 1 AND (IS_ACTIVE = 1 OR IS_ACTIVE IS NULL)) AS ACTIVE_CUSTOMERS_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Customer Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company customer summary error: " + e.getMessage());
            return "--- Company-Wide Customer Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanySupplierSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM VND_VENDOR WITH (NOLOCK)) AS TOTAL_SUPPLIERS_COUNT,
              (SELECT COUNT(*) FROM VND_VENDOR WITH (NOLOCK) WHERE STATUS = 'Active' OR STATUS = 'ACTIVE') AS ACTIVE_SUPPLIERS_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Supplier Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company supplier summary error: " + e.getMessage());
            return "--- Company-Wide Supplier Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyInventorySummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM NPD_PRODUCT_MASTER WITH (NOLOCK)) AS TOTAL_PRODUCTS_COUNT,
              (SELECT COUNT(*) FROM NPD_PRODUCT_MASTER WITH (NOLOCK) WHERE STATUS = 'ACTIVE' AND IS_ACTIVE = 1) AS ACTIVE_PRODUCTS_COUNT,
              (SELECT SUM(STOCK_QTY) FROM NPD_PRODUCT_MASTER WITH (NOLOCK)) AS TOTAL_STOCK_QTY_SUM
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Inventory Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company inventory summary error: " + e.getMessage());
            return "--- Company-Wide Inventory Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanySalesSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM SALES_QUOTATION_HEADER WITH (NOLOCK)) AS TOTAL_QUOTATIONS_COUNT,
              (SELECT COUNT(*) FROM SALES_QUOTATION_HEADER WITH (NOLOCK) WHERE QUOTATION_STATUS = 24) AS APPROVED_QUOTATIONS_COUNT,
              (SELECT ISNULL(SUM(0), 0) FROM SALES_QUOTATION_HEADER WITH (NOLOCK)) AS TOTAL_QUOTATIONS_VAL_SUM
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Sales Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company sales summary error: " + e.getMessage());
            return "--- Company-Wide Sales Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanySupportSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM TICKET_TRACEABILITY_CENTER WITH (NOLOCK)) AS TOTAL_TICKETS_COUNT,
              (SELECT COUNT(*) FROM TICKET_TRACEABILITY_CENTER WITH (NOLOCK) WHERE STATUS != 'CLOSED' AND STATUS != 'RESOLVED') AS OPEN_TICKETS_COUNT,
              (SELECT COUNT(*) FROM TICKET_TRACEABILITY_CENTER WITH (NOLOCK) WHERE PRIORITY = 'HIGH' OR PRIORITY = 'URGENT') AS HIGH_PRIORITY_TICKETS_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide Support Ticket Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company support summary error: " + e.getMessage());
            return "--- Company-Wide Support Ticket Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchCompanyAuditSummary() {
        String sql = """
            SELECT 
              (SELECT COUNT(*) FROM QMS_AUDIT_SCHEDULE WITH (NOLOCK)) AS TOTAL_AUDITS_SCHEDULED_COUNT,
              (SELECT COUNT(*) FROM QMS_AUDIT_SCHEDULE WITH (NOLOCK) WHERE STATUS = 'APPROVED' OR STATUS = 'Approved') AS APPROVED_AUDITS_COUNT,
              (SELECT COUNT(*) FROM QMS_AUDIT_SCHEDULE WITH (NOLOCK) WHERE AUDIT_DATE >= GETDATE()) AS UPCOMING_AUDITS_COUNT
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Company-Wide QMS Audit Summary ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Company audit summary error: " + e.getMessage());
            return "--- Company-Wide QMS Audit Summary [temporarily unavailable] ---\n";
        }
    }

    public String fetchLeaveBalance(Long empId) {
        String sql = """
            SELECT lm.EL, lm.CL, lm.SL, lm.AL, lm.PL,
                   (lm.EL + lm.CL + lm.SL + lm.AL + lm.PL) AS TOTAL_BALANCE
            FROM HR_LEAVE_MASTER lm WITH (NOLOCK)
            WHERE lm.EMPLOYEE_ID = ? AND lm.STATUS = 1
            """;
            
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, empId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return String.format(
                        "--- Live Leave Balance (Emp ID: %d) ---\n" +
                        "Casual Leave (CL): %.1f\n" +
                        "Sick Leave (SL): %.1f\n" +
                        "Earned Leave (EL): %.1f\n" +
                        "Annual Leave (AL): %.1f\n" +
                        "Privilege Leave (PL): %.1f\n" +
                        "Total Balance: %.1f\n",
                        empId,
                        rs.getDouble("CL"),
                        rs.getDouble("SL"),
                        rs.getDouble("EL"),
                        rs.getDouble("AL"),
                        rs.getDouble("PL"),
                        rs.getDouble("TOTAL_BALANCE")
                    );
                } else {
                    return "--- Leave Balance [No active leave master found for Emp ID: " + empId + "] ---\n";
                }
            }
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error querying leave balance: " + e.getMessage());
            return "--- Leave Balance [temporarily unavailable] ---\n";
        }
    }

    public String fetchAttendanceStats(Long empId) {
        String sql = """
            SELECT COUNT(*) AS PRESENT_DAYS
            FROM HR_DAILY_ATTENDANCE att WITH (NOLOCK)
            WHERE att.EMP_ID = ? 
              AND MONTH(att.ATTENDANCE_DATE) = MONTH(GETDATE()) 
              AND YEAR(att.ATTENDANCE_DATE) = YEAR(GETDATE()) 
              AND att.STATUS = 'PRESENT'
            """;
            
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, empId);
            try (ResultSet rs = ps.executeQuery()) {
                int presentDays = 0;
                if (rs.next()) {
                    presentDays = rs.getInt("PRESENT_DAYS");
                }
                return String.format(
                    "--- Live Attendance Statistics (Emp ID: %d) ---\n" +
                    "Present Days This Month: %d\n" +
                    "Status: Active\n",
                    empId, presentDays
                );
            }
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error: " + e.getMessage());
            return "--- Attendance Data [temporarily unavailable] ---\n";
        }
    }

    public boolean isCompanyWide(Map<String, Object> parameters) {
        Object queryObj = parameters.get("query");
        String queryStr = queryObj != null ? queryObj.toString().toLowerCase() : "";
        
        Object scopeObj = parameters.get("scope");
        String scopeStr = scopeObj != null ? scopeObj.toString() : "";
        
        return "COMPANY".equals(scopeStr) 
            || queryStr.contains("company") 
            || queryStr.contains("total") 
            || queryStr.contains("how many") 
            || queryStr.contains("in number") 
            || queryStr.contains("count")
            || queryStr.contains("overall")
            || queryStr.contains("all checklist")
            || queryStr.contains("all employees")
            || queryStr.contains("all staff")
            || queryStr.contains("all leave")
            || queryStr.contains("all attendance")
            || queryStr.contains("all machines")
            || queryStr.contains("all customers")
            || queryStr.contains("all suppliers")
            || queryStr.contains("all inventory")
            || queryStr.contains("all products")
            || queryStr.contains("all sales")
            || queryStr.contains("all quotations")
            || queryStr.contains("all tickets")
            || queryStr.contains("all support")
            || queryStr.contains("all audits")
            || queryStr.contains("left employee")
            || queryStr.contains("resigned")
            || queryStr.contains("inactive employee")
            || queryStr.contains("ex-employee")
            || queryStr.contains("former employee")
            || queryStr.contains("who all")
            || queryStr.contains("who is in")
            || queryStr.contains("who are in")
            || queryStr.contains("list of")
            || queryStr.contains("employees in")
            || queryStr.contains("staff in")
            || queryStr.contains("dept")
            || queryStr.contains("department")
            || queryStr.contains("yaru yaru")
            || queryStr.contains("yaru irukanga")
            || queryStr.contains("yar yar")
            || queryStr.contains("yargal")
            || queryStr.contains("yaru")
            || queryStr.contains("yar ")
            || queryStr.contains("irukanga")
            || queryStr.contains("iruka")
            || queryStr.contains("யாரு")
            || queryStr.contains("யார்");
    }

    // ─── Checklist Analytics Grounding Methods ────────────────────────────────

    /**
     * Returns pending (open) checklists summary for the company.
     * Grouped by department/assignee with overdue flag.
     */
    public String fetchPendingChecklistsSummary() {
        String sql = """
            SELECT 
                ISNULL(d.DEPARTMENT_NAME, 'Unassigned') AS DEPARTMENT,
                COUNT(*) AS PENDING_COUNT,
                SUM(CASE WHEN DATEDIFF(DAY, ca.ASSIGNED_DATE, GETDATE()) > 7 THEN 1 ELSE 0 END) AS OVERDUE_COUNT
            FROM QMS_CHECKLIST_ASSIGNMENT ca WITH (NOLOCK)
            LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON ca.STATUS_ID = s.ID
            LEFT JOIN HR_EMPLOYEE emp WITH (NOLOCK) ON ca.ASSIGNED_TO = CAST(emp.ID AS NVARCHAR(100))
            LEFT JOIN HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) ON emp.ID = eo.EMPLOYEE_ID
            LEFT JOIN HR_DEPARTMENT d WITH (NOLOCK) ON d.ID = eo.DEPARTMENT_ID
            WHERE s.NAME IN ('OPEN', 'PENDING', 'IN_PROGRESS') OR ca.STATUS_ID IN (1, 2)
            GROUP BY d.DEPARTMENT_NAME
            ORDER BY PENDING_COUNT DESC
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            StringBuilder sb = new StringBuilder("--- Pending Checklists by Department ---\n");
            int totalPending = 0, totalOverdue = 0, rows = 0;
            while (rs.next()) {
                rows++;
                int pending = rs.getInt("PENDING_COUNT");
                int overdue = rs.getInt("OVERDUE_COUNT");
                totalPending += pending;
                totalOverdue += overdue;
                sb.append(String.format("Department: %-30s | Pending: %4d | Overdue: %4d\n",
                    rs.getString("DEPARTMENT"), pending, overdue));
            }
            if (rows == 0) return "--- Pending Checklists: None found ---\n";
            sb.append(String.format("TOTAL: Pending=%d | Overdue=%d\n", totalPending, totalOverdue));
            return sb.toString();
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error fetching pending checklists: " + e.getMessage());
            return "--- Pending Checklist Data [temporarily unavailable] ---\n";
        }
    }

    /**
     * Returns completed checklists summary — this month vs last month.
     */
    public String fetchCompletedChecklistsSummary() {
        String sql = """
            SELECT 
                SUM(CASE WHEN MONTH(ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE)) = MONTH(GETDATE()) 
                          AND YEAR(ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE)) = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS THIS_MONTH,
                SUM(CASE WHEN MONTH(ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE)) = MONTH(DATEADD(MONTH,-1,GETDATE())) 
                          AND YEAR(ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE)) = YEAR(DATEADD(MONTH,-1,GETDATE())) THEN 1 ELSE 0 END) AS LAST_MONTH,
                COUNT(*) AS TOTAL_COMPLETED
            FROM QMS_CHECKLIST_CLOSED ca WITH (NOLOCK)
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return String.format(
                    "--- Completed Checklists Summary ---\n" +
                    "This Month:   %d\nLast Month:   %d\nTotal Closed: %d\n",
                    rs.getInt("THIS_MONTH"), rs.getInt("LAST_MONTH"), rs.getInt("TOTAL_COMPLETED")
                );
            }
            return "--- Completed Checklists: No data ---\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error fetching completed checklists: " + e.getMessage());
            return "--- Completed Checklist Data [temporarily unavailable] ---\n";
        }
    }

    /**
     * Full checklist analytics: overdue count, avg closure days, top department,
     * most active auditor, monthly trend.
     */
    public String fetchChecklistAnalytics() {
        StringBuilder result = new StringBuilder("--- Checklist Analytics Report ---\n");

        // 1. Overall stats
        String statsSql = """
            SELECT 
                (SELECT COUNT(*) FROM QMS_CHECKLIST_ASSIGNMENT ca WITH (NOLOCK)) +
                (SELECT COUNT(*) FROM QMS_CHECKLIST_CLOSED cc WITH (NOLOCK)) AS TOTAL,
                (SELECT COUNT(*) FROM QMS_CHECKLIST_ASSIGNMENT ca WITH (NOLOCK)
                 LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON ca.STATUS_ID = s.ID
                 WHERE s.NAME IN ('OPEN', 'PENDING', 'IN_PROGRESS') OR ca.STATUS_ID IN (1, 2)) AS PENDING,
                (SELECT COUNT(*) FROM QMS_CHECKLIST_CLOSED cc WITH (NOLOCK)) AS COMPLETED,
                (SELECT COUNT(*) FROM QMS_CHECKLIST_ASSIGNMENT ca WITH (NOLOCK)
                 LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON ca.STATUS_ID = s.ID
                 WHERE (s.NAME IN ('OPEN', 'PENDING', 'IN_PROGRESS') OR ca.STATUS_ID IN (1, 2))
                   AND DATEDIFF(DAY, ca.ASSIGNED_DATE, GETDATE()) > 7) AS OVERDUE,
                (SELECT AVG(DATEDIFF(DAY, cc.ASSIGNED_DATE, ISNULL(cc.UPDATED_DATE, cc.CREATED_DATE))) 
                 FROM QMS_CHECKLIST_CLOSED cc WITH (NOLOCK) 
                 WHERE cc.ASSIGNED_DATE IS NOT NULL) AS AVG_CLOSURE_DAYS
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(statsSql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                result.append(String.format(
                    "Total:       %d\nPending:     %d\nCompleted:   %d\nOverdue:     %d\nAvg Closure: %s days\n\n",
                    rs.getInt("TOTAL"), rs.getInt("PENDING"),
                    rs.getInt("COMPLETED"), rs.getInt("OVERDUE"),
                    rs.getString("AVG_CLOSURE_DAYS") != null ? rs.getString("AVG_CLOSURE_DAYS") : "N/A"
                ));
            }
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error fetching overall analytics: " + e.getMessage());
            result.append("[Stats unavailable]\n");
        }

        // 2. Department breakdown
        String deptSql = """
            SELECT TOP 5 ISNULL(d.DEPARTMENT_NAME,'Unassigned') AS DEPT, COUNT(*) AS CNT
            FROM QMS_CHECKLIST_ASSIGNMENT ca WITH (NOLOCK)
            LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON ca.STATUS_ID = s.ID
            LEFT JOIN HR_EMPLOYEE emp WITH (NOLOCK) ON ca.ASSIGNED_TO = CAST(emp.ID AS NVARCHAR(100))
            LEFT JOIN HR_EMPLOYEE_ORGANIZATION eo WITH (NOLOCK) ON emp.ID = eo.EMPLOYEE_ID
            LEFT JOIN HR_DEPARTMENT d WITH (NOLOCK) ON d.ID = eo.DEPARTMENT_ID
            WHERE s.NAME IN ('OPEN','PENDING','IN_PROGRESS') OR ca.STATUS_ID IN (1, 2)
            GROUP BY d.DEPARTMENT_NAME ORDER BY CNT DESC
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(deptSql);
             ResultSet rs = ps.executeQuery()) {
            result.append("Top Departments by Pending Checklists:\n");
            while (rs.next()) {
                result.append(String.format("  %-30s %d\n", rs.getString("DEPT"), rs.getInt("CNT")));
            }
            result.append("\n");
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error fetching department analytics: " + e.getMessage());
            result.append("[Department data unavailable]\n");
        }

        return result.toString();
    }

    /**
     * Returns personal pending checklists assigned to an employee.
     */
    public String fetchMyPendingChecklists(Long empId) {
        String sql = """
            SELECT TOP 10 
                cl.CHECKING_POINT AS CHECKLIST_NAME,
                ca.ASSIGNED_DATE,
                ca.CHECKLIST_DATE AS DUE_DATE,
                s.NAME AS STATUS,
                DATEDIFF(DAY, ca.ASSIGNED_DATE, GETDATE()) AS DAYS_OPEN
            FROM QMS_CHECKLIST_ASSIGNMENT ca WITH (NOLOCK)
            JOIN QMS_CHECKLIST_MASTER cl WITH (NOLOCK) ON cl.ID = ca.CHECKLIST_ID
            LEFT JOIN AD_STATUS_MASTER s WITH (NOLOCK) ON ca.STATUS_ID = s.ID
            WHERE ca.ASSIGNED_TO = ?
              AND (s.NAME IN ('OPEN','PENDING','IN_PROGRESS') OR ca.STATUS_ID IN (1, 2))
            ORDER BY ca.ASSIGNED_DATE ASC
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, String.valueOf(empId));
            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder sb = new StringBuilder("--- My Pending Checklists ---\n");
                int count = 0;
                while (rs.next()) {
                    count++;
                    sb.append(String.format("[%d] %s | Status: %s | Due: %s | Open: %s days\n",
                        count, rs.getString("CHECKLIST_NAME"),
                        rs.getString("STATUS"), rs.getString("DUE_DATE"),
                        rs.getString("DAYS_OPEN")));
                }
                if (count == 0) return "--- No pending checklists assigned to you ---\n";
                return sb.toString();
            }
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error fetching personal pending checklists: " + e.getMessage());
            return "--- Pending Checklist Data [temporarily unavailable] ---\n";
        }
    }

    /**
     * Returns personal completed checklists for an employee.
     */
    public String fetchMyCompletedChecklists(Long empId) {
        String sql = """
            SELECT TOP 10 
                cl.CHECKING_POINT AS CHECKLIST_NAME,
                ca.ASSIGNED_DATE,
                ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE) AS CLOSED_DATE,
                DATEDIFF(DAY, ca.ASSIGNED_DATE, ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE)) AS DAYS_TAKEN
            FROM QMS_CHECKLIST_CLOSED ca WITH (NOLOCK)
            JOIN QMS_CHECKLIST_MASTER cl WITH (NOLOCK) ON cl.ID = ca.CHECKLIST_ID
            WHERE ca.ASSIGNED_TO = ?
            ORDER BY ISNULL(ca.UPDATED_DATE, ca.CREATED_DATE) DESC
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, String.valueOf(empId));
            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder sb = new StringBuilder("--- My Completed Checklists ---\n");
                int count = 0;
                while (rs.next()) {
                    count++;
                    sb.append(String.format("[%d] %s | Closed: %s | Took: %s days\n",
                        count, rs.getString("CHECKLIST_NAME"),
                        rs.getString("CLOSED_DATE"), rs.getString("DAYS_TAKEN")));
                }
                if (count == 0) return "--- No completed checklists found ---\n";
                return sb.toString();
            }
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error fetching completed checklists: " + e.getMessage());
            return "--- Completed Checklist Data [temporarily unavailable] ---\n";
        }
    }

    /**
     * Returns list of employees who have resigned or left the company.
     */
    public String fetchLeftEmployees() {
        String sql = """
            SELECT e.EMPLOYEE_NAME, e.EMP_CODE, e.STATUS AS EMP_STATUS,
                   (SELECT TOP 1 d.DESIGNATION_NAME FROM HR_DESIGNATION d WITH (NOLOCK) INNER JOIN HR_EMPLOYEE_ORGANIZATION o WITH (NOLOCK) ON o.DESIGNATION_ID = d.ID WHERE o.EMPLOYEE_ID = e.ID) AS DESIGNATION,
                   (SELECT TOP 1 dept.DEPARTMENT_NAME FROM HR_DEPARTMENT dept WITH (NOLOCK) INNER JOIN HR_EMPLOYEE_ORGANIZATION o WITH (NOLOCK) ON o.DEPARTMENT_ID = dept.ID WHERE o.EMPLOYEE_ID = e.ID) AS DEPARTMENT
            FROM HR_EMPLOYEE e WITH (NOLOCK)
            WHERE e.STATUS NOT IN ('Active', 'ACTIVE') OR e.IS_ACTIVE = 0
            """;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return "--- Live Left/Resigned Employees List ---\n" + queryToText(ps) + "\n";
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Left employees list error: " + e.getMessage());
            return "--- Left/Resigned Employees List [temporarily unavailable] ---\n";
        }
    }

    public Long resolveEmpIdFromQuery(String query) {
        if (query == null || query.isBlank()) return null;
        String lowerQuery = query.toLowerCase();
        
        String sql = "SELECT ID, EMPLOYEE_NAME, EMP_CODE FROM HR_EMPLOYEE WITH (NOLOCK) WHERE STATUS = 'Active' OR STATUS = 'ACTIVE'";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
             
             Long bestMatchId = null;
             int longestMatchLen = 0;
             
             while (rs.next()) {
                 Long id = rs.getLong("ID");
                 String name = rs.getString("EMPLOYEE_NAME");
                 String code = rs.getString("EMP_CODE");
                 
                 if (code != null && !code.isBlank() && lowerQuery.contains(code.toLowerCase())) {
                     return id; // Exact code match is highest priority
                 }
                 
                 if (name != null && !name.isBlank()) {
                     String nameLower = name.toLowerCase().trim();
                     // Direct match
                     if (lowerQuery.contains(nameLower) && nameLower.length() > longestMatchLen) {
                         bestMatchId = id;
                         longestMatchLen = nameLower.length();
                         continue;
                     }
                     
                     // Token-based matching (e.g., "SIVARAMAN R" -> "sivaraman")
                     String[] tokens = nameLower.split("\\s+");
                     for (String token : tokens) {
                         if (token.length() >= 4 && lowerQuery.contains(token)) {
                             if (token.length() > longestMatchLen) {
                                 bestMatchId = id;
                                 longestMatchLen = token.length();
                             }
                         }
                     }
                 }
             }
             return bestMatchId;
        } catch (Exception e) {
            System.err.println("[BOS-AI][LiveERP] Error resolving employee ID from query: " + e.getMessage());
            return null;
        }
    }
}
