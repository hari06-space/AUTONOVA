package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "SALES_QUOTATION_FOLLOW_UP_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class SmQuotationFollowUp extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "QUOTATION_ID", nullable = false)
    private Long quotationId;

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @Column(name = "PART_ID")
    private Long partId;

    @Column(name = "FOLLOW_MODE", length = 50)
    private String followMode;

    @Column(name = "FOLLOW_TYPE", length = 50)
    private String followType;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "FOLLOW_UP_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date followUpDate;

    @Column(name = "ATTACHMENT_PATH", columnDefinition = "NVARCHAR(MAX)")
    private String attachmentPath;

    @Column(name = "STATUS")
    private Boolean status;
}
