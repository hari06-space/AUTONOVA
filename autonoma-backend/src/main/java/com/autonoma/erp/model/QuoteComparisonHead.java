package com.autonoma.erp.model;

import com.autonoma.erp.enums.SelectionType;
import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "PP_QUOTE_COMPARISON_HEAD")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuoteComparisonHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "COMPARISON_NO", nullable = false, length = 50)
    private String comparisonNo;

    @Column(name = "VERSION", nullable = false)
    private Integer version = 1;

    @Column(name = "COMPARISON_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date comparisonDate;

    @Column(name = "RFQ_ID", nullable = false)
    private Long rfqId;

    @Column(name = "STATUS_ID", nullable = false)
    private Long statusId;

    @Column(name = "SNAPSHOT_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date snapshotDate;

    @Column(name = "SNAPSHOT_BY")
    private String snapshotBy;

    @Column(name = "SOURCE_RFQ_VERSION")
    private Integer sourceRfqVersion;

    @Column(name = "SOURCE_NEGOTIATION_VERSION")
    private Integer sourceNegotiationVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "SELECTION_TYPE", length = 50)
    private SelectionType selectionType;

    @Column(name = "OVERALL_RECOMMENDED_SUPPLIER_ID")
    private Long overallRecommendedSupplierId;

    @Column(name = "OVERALL_SELECTED_SUPPLIER_ID")
    private Long overallSelectedSupplierId;

    @Column(name = "IS_MANUAL_OVERRIDE")
    private Boolean isManualOverride = false;

    @Column(name = "OVERRIDE_REASON", length = 1000)
    private String overrideReason;

    @Column(name = "OVERRIDE_BY")
    private String overrideBy;

    @Column(name = "OVERRIDE_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date overrideDate;

    @Column(name = "APPROVAL_REMARKS", length = 1000)
    private String approvalRemarks;

    @Column(name = "LOCKED_BY")
    private String lockedBy;

    @Column(name = "LOCKED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lockedDate;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

    @Column(name = "APPROVAL_VERSION")
    private Integer approvalVersion;

    @Column(name = "APPROVAL_SEQUENCE")
    private Integer approvalSequence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getComparisonNo() { return comparisonNo; }
    public void setComparisonNo(String comparisonNo) { this.comparisonNo = comparisonNo; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Date getComparisonDate() { return comparisonDate; }
    public void setComparisonDate(Date comparisonDate) { this.comparisonDate = comparisonDate; }
    public Long getRfqId() { return rfqId; }
    public void setRfqId(Long rfqId) { this.rfqId = rfqId; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public Date getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(Date snapshotDate) { this.snapshotDate = snapshotDate; }
    public String getSnapshotBy() { return snapshotBy; }
    public void setSnapshotBy(String snapshotBy) { this.snapshotBy = snapshotBy; }
    public Integer getSourceRfqVersion() { return sourceRfqVersion; }
    public void setSourceRfqVersion(Integer sourceRfqVersion) { this.sourceRfqVersion = sourceRfqVersion; }
    public Integer getSourceNegotiationVersion() { return sourceNegotiationVersion; }
    public void setSourceNegotiationVersion(Integer sourceNegotiationVersion) { this.sourceNegotiationVersion = sourceNegotiationVersion; }
    public SelectionType getSelectionType() { return selectionType; }
    public void setSelectionType(SelectionType selectionType) { this.selectionType = selectionType; }
    public Long getOverallRecommendedSupplierId() { return overallRecommendedSupplierId; }
    public void setOverallRecommendedSupplierId(Long overallRecommendedSupplierId) { this.overallRecommendedSupplierId = overallRecommendedSupplierId; }
    public Long getOverallSelectedSupplierId() { return overallSelectedSupplierId; }
    public void setOverallSelectedSupplierId(Long overallSelectedSupplierId) { this.overallSelectedSupplierId = overallSelectedSupplierId; }
    public Boolean getIsManualOverride() { return isManualOverride; }
    public void setIsManualOverride(Boolean isManualOverride) { this.isManualOverride = isManualOverride; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public String getOverrideBy() { return overrideBy; }
    public void setOverrideBy(String overrideBy) { this.overrideBy = overrideBy; }
    public Date getOverrideDate() { return overrideDate; }
    public void setOverrideDate(Date overrideDate) { this.overrideDate = overrideDate; }
    public String getApprovalRemarks() { return approvalRemarks; }
    public void setApprovalRemarks(String approvalRemarks) { this.approvalRemarks = approvalRemarks; }
    public String getLockedBy() { return lockedBy; }
    public void setLockedBy(String lockedBy) { this.lockedBy = lockedBy; }
    public Date getLockedDate() { return lockedDate; }
    public void setLockedDate(Date lockedDate) { this.lockedDate = lockedDate; }
    public Integer getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Integer activeStatus) { this.activeStatus = activeStatus; }
    public Integer getApprovalVersion() { return approvalVersion; }
    public void setApprovalVersion(Integer approvalVersion) { this.approvalVersion = approvalVersion; }
    public Integer getApprovalSequence() { return approvalSequence; }
    public void setApprovalSequence(Integer approvalSequence) { this.approvalSequence = approvalSequence; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
}
