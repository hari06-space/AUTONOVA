/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Entity for Production Plan Transaction (PP_PRODUCTION_PLAN_TRANS)
*/
package com.autonoma.erp.modules.production.plan.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.bom.entity.BomMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "PP_PRODUCTION_PLAN_TRANS")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProductionPlanTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PLAN_TRANS_NO")
    private Long planTransNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PLAN_NO", nullable = false)
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ProductionPlanHead productionPlanHead;

    @Column(name = "PARENT_TRANS_NO")
    private Long parentTransNo;

    @Column(name = "SOURCE_LINE_ID")
    private Long sourceLineId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    private ProductMaster product;

    @Column(name = "ITEM_TYPE", length = 50)
    private String itemType; // FINISHED_GOOD, SUB_ASSEMBLY, RAW_MATERIAL, COMPONENT, BOUGHT_OUT

    @Column(name = "REQUIREMENT_TYPE", nullable = false, length = 30)
    private String requirementType; // PRODUCTION, PROCUREMENT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOM_ID")
    private BomMaster bom;

    @Column(name = "BOM_VERSION_ID")
    private Long bomVersionId;

    @Column(name = "BOM_LEVEL", nullable = false)
    @Builder.Default
    private Integer bomLevel = 0;

    @Column(name = "GROSS_QTY", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal grossQty = BigDecimal.ZERO;

    @Column(name = "STOCK_QTY", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal stockQty = BigDecimal.ZERO;

    @Column(name = "WIP_QTY", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal wipQty = BigDecimal.ZERO;

    @Column(name = "OPEN_PRODUCTION_QTY", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal openProductionQty = BigDecimal.ZERO;

    @Column(name = "NET_QTY", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal netQty = BigDecimal.ZERO;

    @Column(name = "UOM", length = 20)
    private String uom;

    @Column(name = "REQUIRED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date requiredDate;

    @Column(name = "STATUS", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED

    @Transient
    @Builder.Default
    private List<ProductionPlanTrans> childTransactions = new ArrayList<>();
}
