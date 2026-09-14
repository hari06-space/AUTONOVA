package com.autonoma.erp.dto;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class OrgPositionDTO {
    private Long id;
    private String positionTitle;
    private Long departmentId;
    private Long parentPositionId;
    private String secondaryParentIds;
    private List<String> secondaryParentTitles = new ArrayList<>();
    private Long assignedEmployeeId;
    private String status;

    // Joined Employee Details
    private String firstName;
    private String lastName;
    private String employeeName;
    private String empCode;
    private String designationId;
    private String departmentName;
    private String photo;
    private Boolean isExited = false;

    private List<OrgPositionDTO> children = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getParentPositionId() { return parentPositionId; }
    public void setParentPositionId(Long parentPositionId) { this.parentPositionId = parentPositionId; }
    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public String getDesignationId() { return designationId; }
    public void setDesignationId(String designationId) { this.designationId = designationId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public Boolean getIsExited() { return isExited; }
    public void setIsExited(Boolean isExited) { this.isExited = isExited; }
    public List<OrgPositionDTO> getChildren() { return children; }
    public void setChildren(List<OrgPositionDTO> children) { this.children = children; }
}
