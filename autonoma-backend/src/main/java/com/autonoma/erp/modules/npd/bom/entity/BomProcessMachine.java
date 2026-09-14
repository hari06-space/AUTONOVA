package com.autonoma.erp.modules.npd.bom.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import com.autonoma.erp.modules.qmt.entity.Machine;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "NPD_BOM_PROCESS_MACHINE")
@Getter
@Setter
@NoArgsConstructor
public class BomProcessMachine extends BaseAuditEntity {

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

    @Column(name = "SEQ_NO")
    private Integer seqNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductMaster product;

    @Column(name = "DIVISION")
    private Integer division;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MACHINE_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Machine machine;

    @Column(name = "CAPACITY", length = 100)
    private String capacity;

    @Column(name = "EFFICIENCY", precision = 5, scale = 2)
    private BigDecimal efficiency;

    @Column(name = "IS_PRIMARY", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "SETUP_TIME", precision = 10, scale = 2)
    private BigDecimal setupTime = BigDecimal.ZERO;

    @Column(name = "CYCLE_TIME", precision = 10, scale = 2)
    private BigDecimal cycleTime = BigDecimal.ZERO;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (this.isPrimary == null) this.isPrimary = false;
        if (this.status == null) this.status = true;
    }
}
