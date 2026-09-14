package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "PP_RFQ_EMAIL_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RfqEmailLog {

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

    @Column(name = "EMAIL_TO", length = 250, nullable = false)
    private String emailTo;

    @Column(name = "SUBJECT", length = 250, nullable = false)
    private String subject;

    @Column(name = "SENT_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date sentDate;

    @Column(name = "STATUS", length = 50, nullable = false)
    private String status;

    @Column(name = "ERROR_MESSAGE", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    @Column(name = "MESSAGE_ID", length = 250)
    private String messageId;

    @Column(name = "IN_REPLY_TO", length = 250)
    private String inReplyTo;
}
