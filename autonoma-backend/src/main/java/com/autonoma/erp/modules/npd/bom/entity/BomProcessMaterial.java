package com.autonoma.erp.modules.npd.bom.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "NPD_BOM_PROCESS_MATERIAL")
@Getter
@Setter
@NoArgsConstructor
public class BomProcessMaterial extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @JsonIgnore
    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOM_PROCESS_ID", nullable = false)
    private BomProcess bomProcess;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCESS_ID")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductProcess process;

    @Column(name = "SEQ_NO", nullable = false)
    private Integer seqNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductMaster product;

    @Column(name = "DIVISION")
    private Integer division;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INPUT_PRODUCT_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductMaster inputProduct;

    @Column(name = "QUANTITY", precision = 18, scale = 4, nullable = false)
    private BigDecimal quantity;

    @Column(name = "CONSUMPTION_QTY", precision = 18, scale = 4)
    private BigDecimal consumptionQty;

    @Column(name = "FINISH_QTY", precision = 18, scale = 4, nullable = false)
    private BigDecimal finishQty;

    @Column(name = "UOM", length = 50, nullable = false)
    private String uom;

    @Column(name = "SCRAP_PERCENTAGE", precision = 5, scale = 2)
    private BigDecimal scrapPercentage = BigDecimal.ZERO;

    @Column(name = "BACKFLUSH", nullable = false)
    private Boolean backflush = true;

    @Column(name = "IS_ALTERNATE", nullable = false)
    private Boolean isAlternate = false;

    @Column(name = "PRIMARY_ITEM_NO", length = 50)
    private String primaryItemNo;

    @Column(name = "ALT_PRIORITY")
    private Integer altPriority;

    @Column(name = "REMARKS", length = 255)
    private String remarks;

    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (this.scrapPercentage == null) this.scrapPercentage = BigDecimal.ZERO;
        if (this.backflush == null) this.backflush = true;
        if (this.isAlternate == null) this.isAlternate = false;
    }
}
