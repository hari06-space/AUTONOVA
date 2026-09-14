package com.autonoma.erp.modules.hr.holiday.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Date;
import java.util.Locale;

@Entity
@Table(name = "HR_HOLIDAY_MASTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrHolidayMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "HOLIDAY_ID")
    private Long holidayId;

    @Column(name = "HOLIDAY_NAME", nullable = false, length = 200)
    private String holidayName;

    public String getHolidayName() { return holidayName; }

    @Column(name = "HOLIDAY_DATE")
    private LocalDate holidayDate;

    @Column(name = "FROM_DATE")
    private LocalDate fromDate;

    @Column(name = "HOLIDAY_DAY", length = 20)
    private String holidayDay;

    @Column(name = "HOLIDAY_YEAR", length = 4)
    private String holidayYear;

    @Column(name = "HOLIDAY_TYPE", nullable = false, length = 50)
    private String holidayType;

    @Column(name = "APPLICABLE_TO", length = 50)
    private String applicableTo;

    @Column(name = "APPLICABLE_REFS", columnDefinition = "NVARCHAR(MAX)")
    private String applicableRefs;

    public LocalDate getHolidayDate() { return holidayDate; }
    public void setHolidayDate(LocalDate holidayDate) { this.holidayDate = holidayDate; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public String getApplicableTo() { return applicableTo; }
    public void setApplicableTo(String applicableTo) { this.applicableTo = applicableTo; }
    public String getApplicableRefs() { return applicableRefs; }
    public void setApplicableRefs(String applicableRefs) { this.applicableRefs = applicableRefs; }
    public Boolean getIsOptional() { return isOptional; }

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "IS_OPTIONAL")
    private Boolean isOptional = false;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

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

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;
        this.createdDate = new Date();
        if (this.isOptional == null)
            this.isOptional = false;
        if (this.isActive == null)
            this.isActive = true;
        if (this.applicableTo == null || this.applicableTo.trim().isEmpty())
            this.applicableTo = "ALL";
        if (this.fromDate != null && this.holidayDate == null)
            this.holidayDate = this.fromDate;
        deriveDayAndYear();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
        if (this.fromDate != null)
            this.holidayDate = this.fromDate;
        deriveDayAndYear();
    }

    private void deriveDayAndYear() {
        LocalDate refDate = this.fromDate != null ? this.fromDate : this.holidayDate;
        if (refDate != null) {
            this.holidayDay = refDate.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase();
            this.holidayYear = String.valueOf(refDate.getYear());
        }
    }

    public Long getHolidayId() { return holidayId; }
    public void setHolidayId(Long holidayId) { this.holidayId = holidayId; }
    public void setHolidayName(String holidayName) { this.holidayName = holidayName; }
    public String getHolidayDay() { return holidayDay; }
    public void setHolidayDay(String holidayDay) { this.holidayDay = holidayDay; }
    public String getHolidayYear() { return holidayYear; }
    public void setHolidayYear(String holidayYear) { this.holidayYear = holidayYear; }
    public String getHolidayType() { return holidayType; }
    public void setHolidayType(String holidayType) { this.holidayType = holidayType; }
    public void setIsOptional(Boolean isOptional) { this.isOptional = isOptional; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}
