package com.autonoma.erp.modules.hr.employee.dto;

public class EmployeeEditDto {
    private Long id;
    private String empCode;
    private String employeeName;
    private Long departmentId;
    private Long designationId;

    public EmployeeEditDto(Long id, String empCode, String employeeName, Long departmentId, Long designationId) {
        this.id = id;
        this.empCode = empCode;
        this.employeeName = employeeName;
        this.departmentId = departmentId;
        this.designationId = designationId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public Long getDesignationId() { return designationId; }
    public void setDesignationId(Long designationId) { this.designationId = designationId; }
}
