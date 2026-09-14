package com.autonoma.erp.model;

import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.math.BigDecimal;

@Entity
@Table(name = "PP_PURCHASE_REQUEST_TRANS")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PR_REF_ID", nullable = false)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private PurchaseRequestHead purchaseRequestHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "UOM", length = 20, nullable = false)
    private String uom;

    @Column(name = "PRICE", nullable = false, precision = 12, scale = 4)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "REQ_QTY", nullable = false, precision = 12, scale = 4)
    private BigDecimal reqQty = BigDecimal.ZERO;

    @Column(name = "REQ_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date reqDate;

    @Column(name = "AMOUNT", nullable = false, precision = 12, scale = 4)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "REMARKS", length = 250)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "APPROVER_ID")
    private EmployeeMaster approver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID")
    private StatusMaster approvalStatus;

    @Column(name = "APPROVED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PurchaseRequestHead getPurchaseRequestHead() { return purchaseRequestHead; }
    public void setPurchaseRequestHead(PurchaseRequestHead purchaseRequestHead) { this.purchaseRequestHead = purchaseRequestHead; }
    public ProductMaster getItem() { return item; }
    public void setItem(ProductMaster item) { this.item = item; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getReqQty() { return reqQty; }
    public void setReqQty(BigDecimal reqQty) { this.reqQty = reqQty; }
    public Date getReqDate() { return reqDate; }
    public void setReqDate(Date reqDate) { this.reqDate = reqDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public EmployeeMaster getApprover() { return approver; }
    public void setApprover(EmployeeMaster approver) { this.approver = approver; }
    public StatusMaster getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(StatusMaster approvalStatus) { this.approvalStatus = approvalStatus; }
    public StatusMaster getStatus() { return approvalStatus; }
    public void setStatus(StatusMaster status) { this.approvalStatus = status; }
    public Date getApprovedDate() { return approvedDate; }
    public void setApprovedDate(Date approvedDate) { this.approvedDate = approvedDate; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
}
