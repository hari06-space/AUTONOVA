package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "SALES_QUOTATION_DETAIL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class SmQuotationDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "QUOTATION_ID", insertable = false, updatable = false)
    private Long quotationId;

    @Column(name = "PART_NO_ID")
    private Long partNoId;

    @Transient
    private String partNo;

    @Transient
    private String name;

    @Transient
    private String hsnCode;

    @Transient
    private String uom;

    @Transient
    private BigDecimal unitRate;

    @Column(name = "QTY", precision = 12, scale = 2)
    private BigDecimal qty;

    @Column(name = "AMOUNT", precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "DIS_TYPE", length = 20)
    private String disType;

    @Column(name = "DISCOUNT", precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(name = "FRIGHT_AMOUNT", precision = 12, scale = 2)
    private BigDecimal frightAmount;

    @Column(name = "FRIGHT_PER", precision = 12, scale = 2)
    private BigDecimal frightPer;

    @Column(name = "TOTAL_VALUE", precision = 12, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "CAPACITY", precision = 12, scale = 2)
    private BigDecimal capacity;

    @Column(name = "ADDITIONAL_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String additionalComments;

    @Column(name = "WARRENTY", length = 50)
    private String warrenty;

    @Column(name = "LEAD_TIME_TYPE", length = 50)
    private String leadTimeType;

    @Column(name = "LEAD_TIME_DAYS")
    private Long leadTimeDays;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "APPROVAL_STATUS")
    private Boolean approvalStatus;

    @Column(name = "STATUS")
    private Boolean status;
}
