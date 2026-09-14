package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_BIRTHDAY_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBirthdayLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "BIRTHDAY_YEAR", nullable = false)
    private Integer birthdayYear;

    @Column(name = "POPUP_SHOWN", nullable = false)
    private Boolean popupShown = true;

    @Column(name = "SHOWN_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date shownDate = new Date();

    @Column(name = "LOGIN_SESSION", length = 100)
    private String loginSession;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
        if (this.shownDate == null) {
            this.shownDate = new Date();
        }
        if (this.popupShown == null) {
            this.popupShown = true;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Integer getBirthdayYear() { return birthdayYear; }
    public void setBirthdayYear(Integer birthdayYear) { this.birthdayYear = birthdayYear; }
    public Boolean getPopupShown() { return popupShown; }
    public void setPopupShown(Boolean popupShown) { this.popupShown = popupShown; }
    public Date getShownDate() { return shownDate; }
    public void setShownDate(Date shownDate) { this.shownDate = shownDate; }
    public String getLoginSession() { return loginSession; }
    public void setLoginSession(String loginSession) { this.loginSession = loginSession; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}
