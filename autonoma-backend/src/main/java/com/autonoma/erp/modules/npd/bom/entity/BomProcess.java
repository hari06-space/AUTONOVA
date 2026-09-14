package com.autonoma.erp.modules.npd.bom.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.hr.asset.entity.AssetGroup;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "NPD_BOM_PROCESS")
@Getter
@Setter
@NoArgsConstructor
public class BomProcess extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @JsonIgnore
    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOM_ID", nullable = false)
    private BomMaster bomMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductMaster product;

    @Column(name = "DIVISION")
    private Integer division;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "SEQ_NO", nullable = false)
    private Integer seqNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCESS_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductProcess process;

    @Column(name = "WORK_CENTER", length = 150)
    private String workCenter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MACHINE_GROUP_ID")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AssetGroup machineGroup;

    @Column(name = "AUTO_GIR")
    private Boolean autoGir = false;

    @Column(name = "AUTO_QC")
    private Boolean autoQc = false;

    @Column(name = "PROCESS_COST", precision = 15, scale = 2)
    private BigDecimal processCost = BigDecimal.ZERO;

    @Column(name = "SETUP_TIME", precision = 10, scale = 2)
    private BigDecimal setupTime = BigDecimal.ZERO;

    @Column(name = "CYCLE_TIME", precision = 10, scale = 2)
    private BigDecimal cycleTime = BigDecimal.ZERO;

    @Column(name = "NORMS_PER_HRS", precision = 12, scale = 4)
    private BigDecimal normsPerHrs;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "bomProcess", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BomProcessMaterial> materials = new ArrayList<>();

    @OneToMany(mappedBy = "bomProcess", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BomProcessMachine> machines = new ArrayList<>();

    @OneToMany(mappedBy = "bomProcess", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BomProcessTool> tools = new ArrayList<>();



    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (this.isActive == null) this.isActive = true;
    }
}
