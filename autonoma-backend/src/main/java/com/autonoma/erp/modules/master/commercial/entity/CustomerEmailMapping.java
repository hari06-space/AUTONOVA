package com.autonoma.erp.modules.master.commercial.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "CUSTOMER_EMAIL_MAPPING")
public class CustomerEmailMapping extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CUSTOMER_ID", nullable = false)
    @JsonBackReference
    @ToString.Exclude
    private AccountLedger customer;

    @Column(name = "EMAIL_ADDRESS", length = 255, nullable = false, unique = true)
    private String emailAddress;

    @Column(name = "IS_PRIMARY", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Boolean activeStatus = true;
}
