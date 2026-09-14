package com.autonoma.erp.modules.npd.packing.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.asset.entity.AssetMaster;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "NPD_PROCEDURE_TOOLS")
@Getter
@Setter
@NoArgsConstructor
public class ProcedureTool extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCEDURE_HEADER_ID", nullable = false)
    private PackingProcedureHeader procedureHeader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSET_ID", nullable = false)
    private AssetMaster asset;

    @Column(name = "QTY", nullable = false, precision = 12, scale = 3)
    private BigDecimal qty;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PackingProcedureHeader getProcedureHeader() { return procedureHeader; }
    public void setProcedureHeader(PackingProcedureHeader procedureHeader) { this.procedureHeader = procedureHeader; }
    public AssetMaster getAsset() { return asset; }
    public void setAsset(AssetMaster asset) { this.asset = asset; }
    public BigDecimal getQty() { return qty; }
    public void setQty(BigDecimal qty) { this.qty = qty; }
}
