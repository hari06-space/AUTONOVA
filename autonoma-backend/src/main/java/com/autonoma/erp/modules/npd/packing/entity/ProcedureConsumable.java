package com.autonoma.erp.modules.npd.packing.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "NPD_PROCEDURE_CONSUMABLES")
@Getter
@Setter
@NoArgsConstructor
public class ProcedureConsumable extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCEDURE_HEADER_ID", nullable = false)
    private PackingProcedureHeader procedureHeader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    private ProductMaster product;

    @Column(name = "QTY", nullable = false, precision = 12, scale = 3)
    private BigDecimal qty;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PackingProcedureHeader getProcedureHeader() { return procedureHeader; }
    public void setProcedureHeader(PackingProcedureHeader procedureHeader) { this.procedureHeader = procedureHeader; }
    public ProductMaster getProduct() { return product; }
    public void setProduct(ProductMaster product) { this.product = product; }
    public BigDecimal getQty() { return qty; }
    public void setQty(BigDecimal qty) { this.qty = qty; }
}
