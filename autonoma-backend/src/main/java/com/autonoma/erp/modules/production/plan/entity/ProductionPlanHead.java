/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Entity for Production Plan Head (PP_PRODUCTION_PLAN_HEAD)
*/
package com.autonoma.erp.modules.production.plan.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "PP_PRODUCTION_PLAN_HEAD")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionPlanHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PLAN_NO")
    private Long planNo;

    @Column(name = "PLAN_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date planDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PRODUCT_ID")
    private ProductMaster product;

    @Column(name = "SOURCE_TYPE", nullable = false, length = 50)
    private String sourceType; // SALES_ORDER, SALES_SCHEDULE, INVENTORY, ROL, MANUAL

    @Column(name = "SOURCE_ID")
    private Long sourceId;

    @Column(name = "SOURCE_NO", length = 50)
    private String sourceNo;

    @Column(name = "DIVISION_ID")
    private Long divisionId;

    @Column(name = "PRIORITY", length = 20)
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status; // DRAFT, REVIEW, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @OneToMany(mappedBy = "productionPlanHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<ProductionPlanTrans> transactions = new ArrayList<>();
}
