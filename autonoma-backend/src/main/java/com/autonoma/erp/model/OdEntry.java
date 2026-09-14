package com.autonoma.erp.model;

import jakarta.persistence.*;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_OD_DETAILS")
@Access(AccessType.FIELD)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OdEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "OD_NUMBER", nullable = false, unique = true, length = 100)
    private String odNumber;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    public String getEmployeeName() {
        return this.employee != null ? this.employee.getEmployeeName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("employeeCode")
    public String getEmployeeCode() {
        return this.employee != null ? this.employee.getEmpCode() : null;
    }

    @Column(name = "OD_FROM_DATE_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date odFromDateTime;

    @Column(name = "OD_TO_DATE_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date odToDateTime;

    @Column(name = "VISIT_TYPE", length = 50)
    private String visitType; // 'Customer', 'Vendor', 'Others'

    @Column(name = "VEHICLE_TYPE", length = 50)
    private String vehicleType; // 'Bike', 'Car'

    @Column(name = "PURPOSE_OF_OD", length = 1000)
    private String purposeOfOd;

    @Column(name = "FROM_LOCATION", length = 200)
    private String fromLocation;

    @Column(name = "TO_LOCATION", length = 200)
    private String toLocation;

    @Column(name = "DISTANCE", precision = 10, scale = 2)
    private BigDecimal distance;

    public Long getEmployeeId() { return employeeId; }
    public Date getOdFromDateTime() { return odFromDateTime; }
    public Date getOdToDateTime() { return odToDateTime; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getFromLocation() { return fromLocation; }
    public void setFromLocation(String fromLocation) { this.fromLocation = fromLocation; }
    public String getToLocation() { return toLocation; }
    public void setToLocation(String toLocation) { this.toLocation = toLocation; }
    public BigDecimal getDistance() { return distance; }
    public void setDistance(BigDecimal distance) { this.distance = distance; }

    @Column(name = "FROM_WHERE", length = 25)
    private String fromWhere;

    @Transient
    private Object documents;

    @Transient
    private String filePaths;

    public Long getId() { return id; }
    public String getOdNumber() { return odNumber; }
    public void setOdNumber(String odNumber) { this.odNumber = odNumber; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public void setOdFromDateTime(Date odFromDateTime) { this.odFromDateTime = odFromDateTime; }
    public void setOdToDateTime(Date odToDateTime) { this.odToDateTime = odToDateTime; }
    public String getVisitType() { return visitType; }
    public void setVisitType(String visitType) { this.visitType = visitType; }
    public String getPurposeOfOd() { return purposeOfOd; }
    public void setPurposeOfOd(String purposeOfOd) { this.purposeOfOd = purposeOfOd; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public void setCreatedBy(String createdBy) {}
    public void setCreatedDate(Date createdDate) {}
    public void setUpdatedBy(String updatedBy) {}
    public void setUpdatedDate(Date updatedDate) {}
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public void setVerifiedDate(Date verifiedDate) { this.verifiedDate = verifiedDate; }

    @Column(name = "STATUS_ID")
    private Long statusId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS_ID", insertable = false, updatable = false)
    private StatusMaster statusMaster;

    @Column(name = "VERIFIED_BY", length = 50)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedDate;

    @Column(name = "REJECTION_REASON", length = 1000)
    private String rejectionReason;

    @com.fasterxml.jackson.annotation.JsonProperty("verifiedRemarks")
    public String getVerifiedRemarks() {
        return this.rejectionReason;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("verifiedRemarks")
    public void setVerifiedRemarks(String remarks) {
        this.rejectionReason = remarks;
    }

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

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
        if (this.updatedDate == null) {
            this.updatedDate = new Date();
        }
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            try {
                String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                if (currentUserId != null && !currentUserId.trim().isEmpty()) {
                    this.createdBy = currentUserId;
                    this.updatedBy = currentUserId;
                }
            } catch (Exception e) {
                // SecurityUtils may not be available in all JPA contexts
            }
        }
        if (this.updatedBy == null || this.updatedBy.trim().isEmpty()) {
            this.updatedBy = this.createdBy;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = new Date();
        if (this.updatedBy == null || this.updatedBy.trim().isEmpty()) {
            try {
                String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                if (currentUserId != null && !currentUserId.trim().isEmpty()) {
                    this.updatedBy = currentUserId;
                }
            } catch (Exception e) {
                // SecurityUtils may not be available in all JPA contexts
            }
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return this.createdDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() {
        return this.createdBy;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() {
        return this.updatedDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedUser")
    public String getUpdatedUser() {
        return this.updatedBy;
    }

    public String getFromWhere() {
        return this.fromWhere;
    }

    public void setFromWhere(String fromWhere) {
        this.fromWhere = fromWhere;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("whereFrom")
    public String getWhereFrom() {
        return this.fromWhere;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("whereFrom")
    public void setWhereFrom(String whereFrom) {
        this.fromWhere = whereFrom;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusMaster != null && statusMaster.getName() != null) {
            return statusMaster.getName();
        }
        return null;
    }

    public Object getDocuments() {
        return documents;
    }

    public void setDocuments(Object documents) {
        this.documents = documents;
    }

    public String getFilePaths() {
        return filePaths;
    }

    public void setFilePaths(String filePaths) {
        this.filePaths = filePaths;
    }

    @PostLoad
    public void loadAttachments() {
        if (this.id != null) {
            try {
                com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository attachmentRepo = 
                    com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository.class);
                if (attachmentRepo != null) {
                    java.util.List<com.autonoma.erp.modules.induction.entity.HrAttachmentPath> paths = 
                        attachmentRepo.findAllByPageCodeAndRefIdAndDocType("HA1330", this.id, "OD_ATTACHMENT");
                    if (paths != null && !paths.isEmpty()) {
                        java.util.StringJoiner sj = new java.util.StringJoiner(",");
                        java.util.List<java.util.Map<String, Object>> docList = new java.util.ArrayList<>();
                        for (com.autonoma.erp.modules.induction.entity.HrAttachmentPath p : paths) {
                            if (p.getPath() != null) {
                                sj.add(p.getPath());
                                java.util.Map<String, Object> docMap = new java.util.HashMap<>();
                                docMap.put("id", p.getId());
                                docMap.put("name", p.getFileName());
                                docMap.put("fileName", p.getFileName());
                                docMap.put("serverFileName", p.getPath());
                                docMap.put("isServer", true);
                                docList.add(docMap);
                            }
                        }
                        this.filePaths = sj.toString();
                        this.documents = docList;
                    }
                }
            } catch (Exception e) {
                // Ignore Context issues during boot / testing
            }
        }
    }
}
