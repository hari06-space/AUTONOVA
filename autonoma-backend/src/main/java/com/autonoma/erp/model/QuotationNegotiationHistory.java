package com.autonoma.erp.model;

import com.autonoma.erp.model.BaseAuditEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;
import java.util.Date;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "PP_QUOTATION_NEGOTIATION_HISTORY")
public class QuotationNegotiationHistory extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NEGOTIATION_HEAD_ID", nullable = false)
    private QuotationNegotiationHead negotiationHead;

    @Column(name = "ACTION_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date actionDate;

    @Column(name = "ACTION_TYPE", length = 100, nullable = false)
    private String actionType;

    @Column(name = "USER_ID", length = 50, nullable = false)
    private String userId;

    @Column(name = "REMARKS", length = 4000)
    private String remarks;
}
