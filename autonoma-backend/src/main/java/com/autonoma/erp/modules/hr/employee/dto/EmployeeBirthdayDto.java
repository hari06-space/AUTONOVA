package com.autonoma.erp.modules.hr.employee.dto;

import java.util.Date;

public class EmployeeBirthdayDto {
    private Long id;
    private String empCode;
    private String employeeName;
    private String photoPath;
    private Date birthDate;
    private String departmentName;
    private String designationName;
    private String status;

    public EmployeeBirthdayDto() {
    }

    public EmployeeBirthdayDto(Long id, String empCode, String employeeName, String photoPath, Date birthDate, String departmentName, String designationName, String status) {
        this.id = id;
        this.empCode = empCode;
        this.employeeName = employeeName;
        this.photoPath = photoPath;
        this.birthDate = birthDate;
        this.departmentName = departmentName;
        this.designationName = designationName;
        this.status = status;
    }

    public EmployeeBirthdayDto(Long id, String empCode, String employeeName, String photoPath, java.sql.Date birthDate, String departmentName, String designationName, String status) {
        this.id = id;
        this.empCode = empCode;
        this.employeeName = employeeName;
        this.photoPath = photoPath;
        this.birthDate = birthDate != null ? new Date(birthDate.getTime()) : null;
        this.departmentName = departmentName;
        this.designationName = designationName;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getPhotoPath() {
        return photoPath;
    }

    public void setPhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }

    public Date getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(Date birthDate) {
        this.birthDate = birthDate;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getDesignationName() {
        return designationName;
    }

    public void setDesignationName(String designationName) {
        this.designationName = designationName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
