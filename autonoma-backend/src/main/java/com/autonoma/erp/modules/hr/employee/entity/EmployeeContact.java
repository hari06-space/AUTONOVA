package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_CONTACT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "MOBILE", length = 20)
    private String mobile;

    @Column(name = "ALTERNATE_MOBILE", length = 20)
    private String alternateMobile;

    // Permanent Address
    @Column(name = "PERM_ADDRESS1", length = 500)
    private String address;

    @Column(name = "PERM_CITY", length = 100)
    private String city;

    @Column(name = "PERM_STATE", length = 100)
    private String state;

    @Column(name = "PERM_COUNTRY", length = 100)
    private String country;

    @Column(name = "PERM_PIN_CODE", length = 20)
    private String pincode;

    // Communication Address
    @Column(name = "COMM_ADDRESS1", length = 500)
    private String commAddress;

    @Column(name = "COMM_CITY", length = 100)
    private String commCity;

    @Column(name = "COMM_STATE", length = 100)
    private String commState;

    @Column(name = "COMM_COUNTRY", length = 100)
    private String commCountry;

    @Column(name = "COMM_PIN_CODE", length = 20)
    private String commPincode;

    @Column(name = "IS_ACTIVE")
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
        if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        this.updatedBy = null;
        this.createdDate = new Date();
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
    }

    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getAlternateMobile() { return alternateMobile; }
    public void setAlternateMobile(String alternateMobile) { this.alternateMobile = alternateMobile; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public String getCommAddress() { return commAddress; }
    public void setCommAddress(String commAddress) { this.commAddress = commAddress; }
    public String getCommCity() { return commCity; }
    public void setCommCity(String commCity) { this.commCity = commCity; }
    public String getCommState() { return commState; }
    public void setCommState(String commState) { this.commState = commState; }
    public String getCommCountry() { return commCountry; }
    public void setCommCountry(String commCountry) { this.commCountry = commCountry; }
    public String getCommPincode() { return commPincode; }
    public void setCommPincode(String commPincode) { this.commPincode = commPincode; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

