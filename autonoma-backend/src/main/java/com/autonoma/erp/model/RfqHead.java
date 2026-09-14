package com.autonoma.erp.model;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "PP_RFQ_HEAD")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class RfqHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "RFQ_NO", length = 50, nullable = false)
    private String rfqNo;

    @Column(name = "RFQ_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date rfqDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PR_REF_ID")
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private PurchaseRequestHead purchaseRequestHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BUYER_ID", nullable = false)
    private EmployeeMaster buyer;

    @Column(name = "CLOSING_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date closingDate;

    @Column(name = "COMMERCIAL_TERMS")
    private String commercialTerms;

    @Column(name = "INTERNAL_NOTES", length = 500)
    private String internalNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @OneToMany(mappedBy = "rfqHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<RfqDetail> details;

    @OneToMany(mappedBy = "rfqHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<RfqSupplier> suppliers;

    @OneToMany(mappedBy = "rfqHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<RfqAttachment> attachments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Date getRfqDate() { return rfqDate; }
    public void setRfqDate(Date rfqDate) { this.rfqDate = rfqDate; }
    public PurchaseRequestHead getPurchaseRequestHead() { return purchaseRequestHead; }
    public void setPurchaseRequestHead(PurchaseRequestHead purchaseRequestHead) { this.purchaseRequestHead = purchaseRequestHead; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public EmployeeMaster getBuyer() { return buyer; }
    public void setBuyer(EmployeeMaster buyer) { this.buyer = buyer; }
    public Date getClosingDate() { return closingDate; }
    public void setClosingDate(Date closingDate) { this.closingDate = closingDate; }
    public String getCommercialTerms() { return commercialTerms; }
    public void setCommercialTerms(String commercialTerms) { this.commercialTerms = commercialTerms; }
    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
    public List<RfqDetail> getDetails() { return details; }
    public void setDetails(List<RfqDetail> details) { this.details = details; }
    public List<RfqSupplier> getSuppliers() { return suppliers; }
    public void setSuppliers(List<RfqSupplier> suppliers) { this.suppliers = suppliers; }
    public List<RfqAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<RfqAttachment> attachments) { this.attachments = attachments; }
}
