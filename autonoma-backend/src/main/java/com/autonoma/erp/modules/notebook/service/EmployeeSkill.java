package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EmployeeSkill implements BosEntitySkill {

    @Autowired
    private LiveErpGroundingService groundingService;

    @Override
    public SkillManifest manifest() {
        return new SkillManifest(
            "EMPLOYEE",
            "EMPLOYEE",
            List.of("HR_EMPLOYEE_MASTER", "HR_ATTENDANCE_DAILY", "HR_LEAVE_BALANCE",
                    "HR_EMPLOYEE_PERSONAL", "HR_EMPLOYEE_ORGANIZATION"),
            List.of(OperationType.COUNT, OperationType.SEARCH, OperationType.DETAIL,
                    OperationType.SUMMARY, OperationType.LIST, OperationType.PENDING),
            PermissionScope.SELF,
            List.of(
                "payslip", "pay slip", "attendance summary", "leave balance", "leave request",
                "headcount", "employee count", "staff count",
                "employee", "staff", "worker", "personnel",
                "leave", "attendance", "salary", "payroll"
            ),
            List.of(
                "how many employees are there",
                "my leave balance",
                "who is on leave today",
                "am I present today",
                "attendance this month",
                "headcount by department"
            )
        );
    }

    @Override
    public ToolResult execute(ToolRequest request) {
        boolean hasModule = request.permissionContext().canAccessModule("EMPLOYEE")
                         || request.permissionContext().canAccessModule("LEAVE")
                         || request.permissionContext().canAccessModule("ATTENDANCE")
                         || request.permissionContext().isPrivileged();

        if (!hasModule) {
            return ToolResult.denied("EMPLOYEE", "Employee Master");
        }

        String queryStr = request.query().toLowerCase();
        boolean isCompanyWide = groundingService.isCompanyWide(request.parameters());
        boolean canViewCompany = request.permissionContext().canViewCompanyData()
                                 || request.permissionContext().isPrivileged();
        boolean canViewOthers = request.permissionContext().canViewOthersPersonalData()
                                || request.permissionContext().isPrivileged();

        if (request.operation() == OperationType.COUNT) {
            if (queryStr.contains("leave")) {
                return ToolResult.of("EMPLOYEE", "COUNT", "Company Leave Summary",
                    groundingService.fetchCompanyLeaveSummary());
            } else if (queryStr.contains("attendance")) {
                return ToolResult.of("EMPLOYEE", "COUNT", "Company Attendance Summary",
                    groundingService.fetchCompanyAttendanceSummary());
            } else {
                if (!canViewCompany) {
                    return ToolResult.denied("EMPLOYEE", "Company-wide Employee Data (requires manager access)");
                }
                return ToolResult.of("EMPLOYEE", "COUNT", "Company Employee Headcount",
                    groundingService.fetchCompanyEmployeeSummary());
            }
        }

        // Leave routing
        if (queryStr.contains("leave")) {
            if (isCompanyWide && canViewCompany) {
                return ToolResult.of("EMPLOYEE", "LIST", "Company Leave Summary",
                    groundingService.fetchCompanyLeaveSummary());
            }
            Long empId = resolveEmpId(request);
            if (empId == null) return ToolResult.noData("EMPLOYEE", "LEAVE");

            boolean isSelf = empId.equals(request.permissionContext().empId());
            if (!isSelf && !canViewOthers) {
                return ToolResult.denied("EMPLOYEE", "Other Employee Leave Data");
            }
            return ToolResult.of("EMPLOYEE", "DETAIL", "Employee Leave Balance",
                groundingService.fetchLeaveBalance(empId));
        }

        // Attendance routing
        if (queryStr.contains("attendance")) {
            if (isCompanyWide && canViewCompany) {
                return ToolResult.of("EMPLOYEE", "LIST", "Company Attendance Summary",
                    groundingService.fetchCompanyAttendanceSummary());
            }
            Long empId = resolveEmpId(request);
            if (empId == null) return ToolResult.noData("EMPLOYEE", "ATTENDANCE");

            boolean isSelf = empId.equals(request.permissionContext().empId());
            if (!isSelf && !canViewOthers) {
                return ToolResult.denied("EMPLOYEE", "Other Employee Attendance Data");
            }
            return ToolResult.of("EMPLOYEE", "DETAIL", "Attendance Statistics",
                groundingService.fetchAttendanceStats(empId));
        }

        if (queryStr.contains("left") || queryStr.contains("resign") || queryStr.contains("inactive")) {
            if (canViewCompany) {
                return ToolResult.of("EMPLOYEE", "LIST", "Left/Resigned Employees",
                    groundingService.fetchLeftEmployees());
            } else {
                return ToolResult.denied("EMPLOYEE", "Left/Resigned Employees List");
            }
        }

        // Department-specific listing check
        String deptMentioned = null;
        for (String dept : java.util.List.of(
            "admin", "production", "quality", "purchase", "accounts",
            "product development", "maintenance", "assembly", "stores",
            "operations", "logistics", "top management", "planning",
            "management representative", "business development",
            "sales & marketing", "design & development", "strategic procurement",
            "hra", "qms"
        )) {
            if (queryStr.contains(dept)) {
                deptMentioned = dept;
                break;
            }
        }

        if (deptMentioned != null && (
            queryStr.contains("list") || queryStr.contains("who") || queryStr.contains("member") || 
            queryStr.contains("staff") || queryStr.contains("employee") || queryStr.contains("people") || 
            queryStr.contains("person") || queryStr.contains("yaru") || queryStr.contains("yar") || 
            queryStr.contains("oozhiyar") || queryStr.contains("paniyaalar") || queryStr.contains("iruka") || 
            queryStr.contains("irukanga") || queryStr.contains("யாரு") || queryStr.contains("யார்")
        )) {
            if (canViewCompany) {
                return ToolResult.of("EMPLOYEE", "LIST", "Department Employees",
                    groundingService.fetchDepartmentEmployees(deptMentioned.toUpperCase()));
            } else {
                return ToolResult.denied("EMPLOYEE", "Department Employee List");
            }
        }

        // Default: employee profile / headcount
        if (isCompanyWide && canViewCompany) {
            return ToolResult.of("EMPLOYEE", "LIST", "Company Employee Summary",
                groundingService.fetchCompanyEmployeeSummary());
        }

        Long empId = resolveEmpId(request);
        if (empId == null) return ToolResult.noData("EMPLOYEE", "DETAIL");
        return ToolResult.of("EMPLOYEE", "DETAIL", "Employee Profile",
            groundingService.fetchEmployeeContext(empId));
    }

    private Long resolveEmpId(ToolRequest request) {
        String query = request.parameters().getOrDefault("query", "").toString();
        Long resolvedId = groundingService.resolveEmpIdFromQuery(query);
        if (resolvedId != null) {
            return resolvedId;
        }
        Object v = request.parameters().get("empId");
        if (v == null && request.permissionContext() != null) v = request.permissionContext().empId();
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (Exception e) { return null; }
    }
}
