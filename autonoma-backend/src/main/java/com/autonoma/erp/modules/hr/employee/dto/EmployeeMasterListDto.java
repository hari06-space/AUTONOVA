package com.autonoma.erp.modules.hr.employee.dto;

import java.util.Date;

/**
 * Lightweight DTO for the Employee Master list page.
 * Contains ONLY the 18 columns rendered in the list table.
 * The full EmployeeMaster entity is 57KB+ with 100+ fields
 * and many Q1-Q46 self-assessment fields — none needed for the list.
 */
public class EmployeeMasterListDto {
    private Long id;
    private String empCode;
    private String oldEmpCode;
    private String employeeName;
    private String firstName;
    private String lastName;
    private String fatherHusbandName;
    private Long designationId;
    private String gradeCode;
    private Long departmentId;
    private Long unitId;
    private String supplierName;
    private String status;
    private Date exitDate;
    private String exitReason;
    private String exitComments;
    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;
    private String photoPath;
    private String userId;
    private String homeManagerName;
    private String businessManagerName;
    private String verticalHeadName;
    private String hrName;
    private Date dateOfJoining;
    private Date dob;
    private String personalEmail;
    private String fromWhere;

    public EmployeeMasterListDto() {
    }

    public EmployeeMasterListDto(Long id, String empCode, String oldEmpCode, String employeeName, String firstName, String lastName, String fatherHusbandName, Long designationId, String gradeCode, Long departmentId, Long unitId, String supplierName, String status, Date exitDate, String exitReason, String exitComments, String createdBy, Date createdDate, String updatedBy, Date updatedDate, String photoPath) {
        this.id = id;
        this.empCode = empCode;
        this.oldEmpCode = oldEmpCode;
        this.employeeName = employeeName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fatherHusbandName = fatherHusbandName;
        this.designationId = designationId;
        this.gradeCode = gradeCode;
        this.departmentId = departmentId;
        this.unitId = unitId;
        this.supplierName = supplierName;
        this.status = status;
        this.exitDate = exitDate;
        this.exitReason = exitReason;
        this.exitComments = exitComments;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
        this.photoPath = photoPath;
    }

    public EmployeeMasterListDto(Long id, String empCode, String oldEmpCode, String employeeName, String firstName, String lastName, String fatherHusbandName, Long designationId, String gradeCode, Long departmentId, Long unitId, String supplierName, String status, Date exitDate, String exitReason, String exitComments, String createdBy, Date createdDate, String updatedBy, Date updatedDate, String photoPath, String fromWhere) {
        this(id, empCode, oldEmpCode, employeeName, firstName, lastName, fatherHusbandName, designationId, gradeCode, departmentId, unitId, supplierName, status, exitDate, exitReason, exitComments, createdBy, createdDate, updatedBy, updatedDate, photoPath);
        this.fromWhere = fromWhere;
    }

    public EmployeeMasterListDto(Long id, String empCode, String oldEmpCode, String employeeName, String firstName, String lastName, String fatherHusbandName, Long designationId, String gradeCode, Long departmentId, Long unitId, String supplierName, String status, Date exitDate, String exitReason, String exitComments, String createdBy, Date createdDate, String updatedBy, Date updatedDate, String photoPath, String fromWhere, Date dateOfJoining, Date dob, String personalEmail) {
        this(id, empCode, oldEmpCode, employeeName, firstName, lastName, fatherHusbandName, designationId, gradeCode, departmentId, unitId, supplierName, status, exitDate, exitReason, exitComments, createdBy, createdDate, updatedBy, updatedDate, photoPath, fromWhere);
        this.dateOfJoining = dateOfJoining;
        this.dob = dob;
        this.personalEmail = personalEmail;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public String getOldEmpCode() { return oldEmpCode; }
    public void setOldEmpCode(String oldEmpCode) { this.oldEmpCode = oldEmpCode; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getFatherHusbandName() { return fatherHusbandName; }
    public void setFatherHusbandName(String fatherHusbandName) { this.fatherHusbandName = fatherHusbandName; }
    public Long getDesignationId() { return designationId; }
    public void setDesignationId(Long designationId) { this.designationId = designationId; }
    public String getGradeCode() { return gradeCode; }
    public void setGradeCode(String gradeCode) { this.gradeCode = gradeCode; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Date getExitDate() { return exitDate; }
    public void setExitDate(Date exitDate) { this.exitDate = exitDate; }
    public String getExitReason() { return exitReason; }
    public void setExitReason(String exitReason) { this.exitReason = exitReason; }
    public String getExitComments() { return exitComments; }
    public void setExitComments(String exitComments) { this.exitComments = exitComments; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getHomeManagerName() { return homeManagerName; }
    public void setHomeManagerName(String homeManagerName) { this.homeManagerName = homeManagerName; }
    public String getBusinessManagerName() { return businessManagerName; }
    public void setBusinessManagerName(String businessManagerName) { this.businessManagerName = businessManagerName; }
    public String getVerticalHeadName() { return verticalHeadName; }
    public void setVerticalHeadName(String verticalHeadName) { this.verticalHeadName = verticalHeadName; }
    private String leaveAllowed;
    private String odAllowed;
    private String permissionRequest;

    public String getLeaveAllowed() { return leaveAllowed; }
    public void setLeaveAllowed(String leaveAllowed) { this.leaveAllowed = leaveAllowed; }
    public String getOdAllowed() { return odAllowed; }
    public void setOdAllowed(String odAllowed) { this.odAllowed = odAllowed; }
    public String getPermissionRequest() { return permissionRequest; }
    public void setPermissionRequest(String permissionRequest) { this.permissionRequest = permissionRequest; }

    public String getHrName() { return hrName; }
    public void setHrName(String hrName) { this.hrName = hrName; }

    public String getFromWhere() { return fromWhere; }
    public void setFromWhere(String fromWhere) { this.fromWhere = fromWhere; }

    public Date getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(Date dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public Date getDob() { return dob; }
    public void setDob(Date dob) { this.dob = dob; }

    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }
}

