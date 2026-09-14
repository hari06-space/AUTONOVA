package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "SALES_QUOTATION_HEADER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class SmQuotation extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "QUOTATION_NO", length = 50)
    private String quotationNo;

    @Column(name = "QUOTATION_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date quotationDate;

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @Column(name = "RFQ_MODE", length = 50)
    private String rfqMode;

    @Column(name = "REQUEST_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date requestDate;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;
    
    @Column(name = "VERIFY_REJ_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String verifyRejComments;

    @Column(name = "QUOTATION_STATUS")
    private Long quotationStatus;

    @Transient
    private String quotationStatusName;

    @Transient
    private Boolean needsVerification;

    @Transient
    private String currency;

    @Transient
    private Double exchangeRate;

    @Transient
    private List<SalesAttachmentPath> attachments;

    @Column(name = "STATUS")
    private Boolean status;

    @Column(name = "CONTACT_ID")
    private Long contactId;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "QUOTATION_ID")
    private List<SmQuotationDetail> parts;
}
