package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_CAPACITY")
@IdClass(ProductCapacityId.class)
@Getter
@Setter
public class ProductCapacity extends BaseAuditEntity {

    @Id
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "MODEL_NO", nullable = false, columnDefinition = "NVARCHAR(100)", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private ProductModel model;

    @Id
    @Column(name = "UOM", nullable = false, length = 20)
    private String uom; // KW, MW

    @Id
    @Column(name = "CAPACITY_VAL", nullable = false)
    private Double capacityVal;

    public ProductModel getModel() { return model; }
    public void setModel(ProductModel model) { this.model = model; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public Double getCapacityVal() { return capacityVal; }
    public void setCapacityVal(Double capacityVal) { this.capacityVal = capacityVal; }
}
