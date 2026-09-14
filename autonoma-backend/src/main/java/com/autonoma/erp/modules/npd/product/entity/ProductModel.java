package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.npd.oem.entity.ProductOem;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_MODEL")
@Getter
@Setter
public class ProductModel extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "OEM_SHORT_NAME", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private ProductOem oem;

    @Id
    @org.hibernate.annotations.Nationalized
    @Column(name = "MODEL_NO", length = 100, nullable = false)
    private String modelNo;

    @Column(name = "ROTOR_DIAMETER", nullable = false)
    private Double rotorDiameter = 0.0;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @Override
    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        super.onCreate();
        if (this.status == null) {
            this.status = true;
        }
    }

    public ProductOem getOem() { return oem; }
    public void setOem(ProductOem oem) { this.oem = oem; }
    public String getModelNo() { return modelNo; }
    public void setModelNo(String modelNo) { this.modelNo = modelNo; }
    public Double getRotorDiameter() { return rotorDiameter; }
    public void setRotorDiameter(Double rotorDiameter) { this.rotorDiameter = rotorDiameter; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
