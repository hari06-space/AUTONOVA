package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import java.util.Date;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;

@Entity
@Table(name = "HR_EMPLOYEE_ORGANIZATION")
public class EmployeeOrganization {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "CATEGORY_ID")
    private Long categoryId;

    @Column(name = "EMP_LEVEL_ID")
    private Long empLevelId;

    @Column(name = "EMPLOYEE_TYPE_ID")
    private Long employeeTypeId;

    @Column(name = "GRADE_CODE", length = 50)
    private String gradeCode;

    @Column(name = "UNIT_ID")
    private Long unitId;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @Column(name = "DESIGNATION_ID")
    private Long designationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DESIGNATION_ID", insertable = false, updatable = false)
    private Designation designation;

    @Column(name = "VERTICAL_HEAD", length = 100)
    private String verticalHead;

    @Column(name = "HR_MANAGER", length = 100)
    private String hrManager;

    @Column(name = "OFFICE_MAIL", length = 100)
    private String officeMail;

    @Column(name = "OFFICE_MAIL_PASSWORD", length = 100)
    private String officeMailPassword;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @Transient
    private transient boolean isResolving = false;
    public EmployeeOrganization() {
    }

    public EmployeeOrganization(Long employeeId, EmployeeMaster employee, Long categoryId, Long empLevelId,
            Long employeeTypeId, String gradeCode, Long unitId, Long departmentId, Long designationId,
            String verticalHead, String hrManager, String officeMail, String officeMailPassword, String createdBy,
            Date createdDate, String updatedBy, Date updatedDate) {
        this.employeeId = employeeId;
        this.employee = employee;
        this.categoryId = categoryId;
        this.empLevelId = empLevelId;
        this.employeeTypeId = employeeTypeId;
        this.gradeCode = gradeCode;
        this.unitId = unitId;
        this.departmentId = departmentId;
        this.designationId = designationId;
        this.verticalHead = verticalHead;
        this.hrManager = hrManager;
        this.officeMail = officeMail;
        this.officeMailPassword = officeMailPassword;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeMaster getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeMaster employee) {
        this.employee = employee;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Long getEmpLevelId() {
        return empLevelId;
    }

    public void setEmpLevelId(Long empLevelId) {
        this.empLevelId = empLevelId;
    }

    public Long getEmployeeTypeId() {
        return employeeTypeId;
    }

    public void setEmployeeTypeId(Long employeeTypeId) {
        this.employeeTypeId = employeeTypeId;
    }

    public String getGradeCode() {
        return gradeCode;
    }

    public void setGradeCode(String gradeCode) {
        this.gradeCode = gradeCode;
    }

    public Long getUnitId() {
        return unitId;
    }

    public void setUnitId(Long unitId) {
        this.unitId = unitId;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getDesignationId() {
        return designationId;
    }

    public void setDesignationId(Long designationId) {
        this.designationId = designationId;
    }

    public String getVerticalHead() {
        return verticalHead;
    }

    public void setVerticalHead(String verticalHead) {
        this.verticalHead = verticalHead;
    }

    public String getHrManager() {
        return hrManager;
    }

    public void setHrManager(String hrManager) {
        this.hrManager = hrManager;
    }

    public String getOfficeMail() {
        return officeMail;
    }

    public void setOfficeMail(String officeMail) {
        this.officeMail = officeMail;
    }

    public String getOfficeMailPassword() {
        return officeMailPassword;
    }

    public void setOfficeMailPassword(String officeMailPassword) {
        this.officeMailPassword = officeMailPassword;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Designation getDesignation() {
        return designation;
    }

    public void setDesignation(Designation designation) {
        this.designation = designation;
    }

    private void autoResolveEmpLevelId() {
        if (isResolving) return;
        if (this.empLevelId == null && this.designationId != null) {
            try {
                isResolving = true;
                com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository designationRepo =
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository.class);
                com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository designationLevelRepo =
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository.class);

                if (designationRepo != null && designationLevelRepo != null) {
                    java.util.Optional<com.autonoma.erp.modules.hr.orgstructure.entity.Designation> desigOpt = designationRepo.findById(this.designationId);
                    if (desigOpt != null) {
                        desigOpt.ifPresent(desig -> {
                            String subCatLvl = desig.getSubCategoryLevel();
                            if (subCatLvl != null && !subCatLvl.trim().isEmpty()) {
                                java.util.Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlOpt = designationLevelRepo.findByLevel(subCatLvl.trim());
                                if (lvlOpt != null) {
                                    lvlOpt.ifPresent(lvl -> {
                                        this.empLevelId = lvl.getRowId();
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (Exception e) {
                System.err.println("[EmployeeOrganization] Failed to auto-resolve empLevelId: " + e.getMessage());
            } finally {
                isResolving = false;
            }
        }
    }

    @PrePersist
    protected void onCreate() {
        autoResolveEmpLevelId();
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        autoResolveEmpLevelId();
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }
}

