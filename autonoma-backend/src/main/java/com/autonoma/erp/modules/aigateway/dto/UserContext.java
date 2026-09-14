package com.autonoma.erp.modules.aigateway.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserContext {
    private String userId;      // AD_USER_CREDENTIAL.USER_ID
    private Long empId;         // HR_EMPLOYEE.ID
    private String empCode;     // HR_EMPLOYEE.EMP_CODE
    private String role;        // AD_USER_CREDENTIAL.ROLE
    private String departmentId; // HR_DEPARTMENT.ID
    private Integer level;      // Designation level
    private String companyId;   // Tenant / Company ID
    private Long divisionId;    // Division ID

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
}
