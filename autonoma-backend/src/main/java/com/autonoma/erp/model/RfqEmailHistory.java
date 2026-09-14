package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "PP_RFQ_EMAIL_HISTORY")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RfqEmailHistory extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_ID", nullable = false)
    private RfqHead rfqHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    private AccountLedger supplier;

    @Column(name = "RECIPIENT_EMAIL", length = 255)
    private String recipientEmail;

    @Column(name = "EMAIL_SUBJECT", length = 500, nullable = false)
    private String emailSubject;

    @Column(name = "EMAIL_CONTENT", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String emailContent;

    @Column(name = "EMAIL_TO", length = 1000)
    private String emailTo;

    @Column(name = "EMAIL_CC", length = 1000)
    private String emailCc;

    @Column(name = "SENT_BY", length = 100)
    private String sentBy;

    @Column(name = "SENT_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date sentDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID")
    private StatusMaster status;

    @Column(name = "STATUS", length = 50, insertable = false, updatable = false)
    private String legacyStatus;

    @Column(name = "ATTEMPT")
    private Integer attempt = 1;

    @Column(name = "FAILURE_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String failureReason;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RfqHead getRfqHead() { return rfqHead; }
    public void setRfqHead(RfqHead rfqHead) { this.rfqHead = rfqHead; }
    public AccountLedger getSupplier() { return supplier; }
    public void setSupplier(AccountLedger supplier) { this.supplier = supplier; }
    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }
    public String getEmailSubject() { return emailSubject; }
    public void setEmailSubject(String emailSubject) { this.emailSubject = emailSubject; }
    public String getEmailContent() { return emailContent; }
    public void setEmailContent(String emailContent) { this.emailContent = emailContent; }
    public String getEmailTo() { return emailTo; }
    public void setEmailTo(String emailTo) { this.emailTo = emailTo; }
    public String getEmailCc() { return emailCc; }
    public void setEmailCc(String emailCc) { this.emailCc = emailCc; }
    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }
    public Date getSentDate() { return sentDate; }
    public void setSentDate(Date sentDate) { this.sentDate = sentDate; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public String getLegacyStatus() { return legacyStatus; }
    public void setLegacyStatus(String legacyStatus) { this.legacyStatus = legacyStatus; }
    public Integer getAttempt() { return attempt; }
    public void setAttempt(Integer attempt) { this.attempt = attempt; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
}
