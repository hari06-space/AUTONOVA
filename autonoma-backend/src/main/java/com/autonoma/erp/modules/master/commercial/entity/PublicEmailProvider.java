package com.autonoma.erp.modules.master.commercial.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "PUBLIC_EMAIL_PROVIDER")
public class PublicEmailProvider extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DOMAIN_NAME", length = 100, nullable = false, unique = true)
    private String domainName;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Boolean activeStatus = true;
}
