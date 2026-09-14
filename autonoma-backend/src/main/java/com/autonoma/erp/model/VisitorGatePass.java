package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "OM_VISITOR_GATE_PASS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VisitorGatePass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long id;

    @Column(name = "VISITOR_NAME", length = 255)
    private String visitorName;

    @Column(name = "ISD_CODE", length = 10)
    private String isdCode;

    @Column(name = "MOBILE_NO", length = 20)
    private String mobileNo;

    @Column(name = "ADDRESS", columnDefinition = "NVARCHAR(MAX)")
    private String address;

    @Column(name = "PERSON_TO_MEET", length = 255)
    private String personToMeet;

    @Column(name = "PURPOSE", length = 255)
    private String purpose;

    @Column(name = "IN_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date inTime;

    @Column(name = "OUT_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date outTime;

    @Column(name = "GATE_PASS_NO", length = 50)
    private String gatePassNo;

    @Column(name = "GATE_PASS_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date gatePassDate;

    /** 0 = OPEN, 1 = APPROVED, 2 = REJECTED, 3 = CANCELLED, 4 = CLOSED */
    @Column(name = "STATUS")
    private Integer status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS", insertable = false, updatable = false)
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    @Column(name = "FOOD_ALLOWANCE", length = 100)
    private String foodAllowance;

    @Column(name = "KIT", length = 100)
    private String kit;

    @Column(name = "PERSON_NAME", length = 200)
    private String personName;

    @Column(name = "NO_OF_PERSONS")
    private Integer noOfPersons;

    @Column(name = "VISITOR_TYPE", length = 100)
    private String visitorType;

    @Column(name = "FOOD_CATEGORY", length = 100)
    private String foodCategory;

    @Column(name = "NORMAL_FOOD", length = 100)
    private String normalFood;

    @Column(name = "FILE_NAME", columnDefinition = "NVARCHAR(MAX)")
    private String fileName;

    @Column(name = "VENDOR_CODE", length = 50)
    private String vendorCode;

    @Column(name = "EMAIL_ID", length = 100)
    private String emailId;

    @Column(name = "VISITOR_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date visitorDate;

    @Column(name = "NEW_VENDOR", length = 100)
    private String newVendor;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "CANCEL_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String cancelReason;

    @Column(name = "CAPTURE_FILE_NAME", columnDefinition = "NVARCHAR(MAX)")
    private String captureFileName;

    @Column(name = "GATE_PASS_TYPE", length = 100)
    private String gatePassType;

    public Long getId() {
        return id;
    }

    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public String getVisitorType() {
        return visitorType;
    }

    public void setVisitorType(String visitorType) {
        this.visitorType = visitorType;
    }

    public String getIsdCode() {
        return isdCode;
    }

    public void setIsdCode(String isdCode) {
        this.isdCode = isdCode;
    }

    public String getMobileNo() {
        return mobileNo;
    }

    public void setMobileNo(String mobileNo) {
        this.mobileNo = mobileNo;
    }

    public String getEmailId() {
        return emailId;
    }

    public void setEmailId(String emailId) {
        this.emailId = emailId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getVendorCode() {
        return vendorCode;
    }

    public void setVendorCode(String vendorCode) {
        this.vendorCode = vendorCode;
    }

    public String getNewVendor() {
        return newVendor;
    }

    public void setNewVendor(String newVendor) {
        this.newVendor = newVendor;
    }

    public String getPersonToMeet() {
        return personToMeet;
    }

    public void setPersonToMeet(String personToMeet) {
        this.personToMeet = personToMeet;
    }

    public String getPersonName() {
        return personName;
    }

    public void setPersonName(String personName) {
        this.personName = personName;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getPurposeComments() {
        return purposeComments;
    }

    public void setPurposeComments(String purposeComments) {
        this.purposeComments = purposeComments;
    }

    public String getFoodAllowance() {
        return foodAllowance;
    }

    public void setFoodAllowance(String foodAllowance) {
        this.foodAllowance = foodAllowance;
    }

    public String getFoodCategory() {
        return foodCategory;
    }

    public void setFoodCategory(String foodCategory) {
        this.foodCategory = foodCategory;
    }

    public String getNormalFood() {
        return normalFood;
    }

    public void setNormalFood(String normalFood) {
        this.normalFood = normalFood;
    }

    public String getKit() {
        return kit;
    }

    public void setKit(String kit) {
        this.kit = kit;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public String getGatePassType() {
        return gatePassType;
    }

    public void setGatePassType(String gatePassType) {
        this.gatePassType = gatePassType;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Date getInTime() {
        return inTime;
    }

    public void setInTime(Date inTime) {
        this.inTime = inTime;
    }

    public Date getOutTime() {
        return outTime;
    }

    public void setOutTime(Date outTime) {
        this.outTime = outTime;
    }

    public Date getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(Date checkInTime) {
        this.checkInTime = checkInTime;
    }

    public Date getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(Date checkOutTime) {
        this.checkOutTime = checkOutTime;
    }

    public Integer getNoOfPersons() {
        return noOfPersons;
    }

    public String getCheckInImg() {
        return checkInImg;
    }

    public void setCheckInImg(String checkInImg) {
        this.checkInImg = checkInImg;
    }

    public String getCheckOutImg() {
        return checkOutImg;
    }

    public void setCheckOutImg(String checkOutImg) {
        this.checkOutImg = checkOutImg;
    }

    public String getCheckInBy() {
        return checkInBy;
    }

    public void setCheckInBy(String checkInBy) {
        this.checkInBy = checkInBy;
    }

    public String getCheckOutBy() {
        return checkOutBy;
    }

    public void setCheckOutBy(String checkOutBy) {
        this.checkOutBy = checkOutBy;
    }

    public void setNoOfPersons(Integer noOfPersons) {
        this.noOfPersons = noOfPersons;
    }

    public Date getVisitorDate() {
        return visitorDate;
    }

    public void setVisitorDate(Date visitorDate) {
        this.visitorDate = visitorDate;
    }

    public void setGatePassDate(Date gatePassDate) {
        this.gatePassDate = gatePassDate;
    }

    public void setGatePassNo(String gatePassNo) {
        this.gatePassNo = gatePassNo;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    @Column(name = "CHECK_IN_IMG", columnDefinition = "NVARCHAR(MAX)")
    private String checkInImg;

    @Column(name = "CHECK_OUT_IMG", columnDefinition = "NVARCHAR(MAX)")
    private String checkOutImg;

    @Column(name = "CHECK_IN_BY", length = 50)
    private String checkInBy;

    @Column(name = "CHECK_OUT_BY", length = 50)
    private String checkOutBy;

    @Column(name = "CHECK_IN_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date checkInTime;

    @Column(name = "CHECK_OUT_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date checkOutTime;

    @Column(name = "PURPOSE_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String purposeComments;

    // ── Audit columns (match SQL: CREATED_BY / UPDATED_BY) ───────────────────
    @com.fasterxml.jackson.annotation.JsonProperty("createdBy")
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @com.fasterxml.jackson.annotation.JsonProperty("updatedBy")
    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    // ── Lifecycle hooks ───────────────────────────────────────────────────────
    @PrePersist
    protected void onCreate() {
        String userId = null;
        try {
            userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }
        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() != null) {
            if (userId == null || userId.trim().isEmpty()) {
                throw new RuntimeException("Session expired or user not logged in. Please relogin.");
            }
            this.createdBy = userId;
        }
        this.updatedBy = null;
        this.createdDate = new Date();
        if (this.status == null) {
            this.status = 0; // 0 = OPEN
        }
    }

    @PreUpdate
    protected void onUpdate() {
        String userId = null;
        try {
            userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }
        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() != null) {
            if (userId == null || userId.trim().isEmpty()) {
                throw new RuntimeException("Session expired or user not logged in. Please relogin.");
            }
            this.updatedBy = userId;
        }
        this.updatedDate = new Date();
    }

    // ── JSON helpers (frontend uses string-based fields) ─────────────────────
    /** Expose status name dynamically from AD_STATUS_MASTER table */
    @com.fasterxml.jackson.annotation.JsonProperty("statusLabel")
    public String getStatusLabel() {
        if (statusObj != null && statusObj.getName() != null && !statusObj.getName().isBlank()) {
            return statusObj.getName();
        }
        return "N/A";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("statusName")
    public String getStatusName() {
        if (statusObj != null && statusObj.getName() != null && !statusObj.getName().isBlank()) {
            return statusObj.getName();
        }
        return null;
    }

    public Date getCreatedDate() {
        return this.createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public Date getUpdatedDate() {
        return this.updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return this.createdDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() {
        return this.updatedDate;
    }
}
