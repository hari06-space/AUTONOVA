package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PP_RFQ_SUPPLIER")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class RfqSupplier extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_REF_ID", nullable = false)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private RfqHead rfqHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private AccountLedger supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_STATUS_ID")
    private StatusMaster supplierStatus;

    @Column(name = "EMAIL_SENT", nullable = false)
    private Boolean emailSent = false;

    @Column(name = "THREAD_MESSAGE_ID", length = 250)
    private String threadMessageId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RfqHead getRfqHead() { return rfqHead; }
    public void setRfqHead(RfqHead rfqHead) { this.rfqHead = rfqHead; }
    public AccountLedger getSupplier() { return supplier; }
    public void setSupplier(AccountLedger supplier) { this.supplier = supplier; }
    public StatusMaster getSupplierStatus() { return supplierStatus; }
    public void setSupplierStatus(StatusMaster supplierStatus) { this.supplierStatus = supplierStatus; }
    public Boolean getEmailSent() { return emailSent; }
    public void setEmailSent(Boolean emailSent) { this.emailSent = emailSent; }
    public String getThreadMessageId() { return threadMessageId; }
    public void setThreadMessageId(String threadMessageId) { this.threadMessageId = threadMessageId; }
}
