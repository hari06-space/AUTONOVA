package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "SM_ADDITIONAL_CHARGES")
@Getter
@Setter
public class SmAdditionalCharges extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CHARGES", length = 300)
    private String charges;

    @Column(name = "CALCULATION_TYPE", length = 20)
    private String calculationType;

    @Column(name = "STATUS")
    private Boolean status = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCharges() { return charges; }
    public void setCharges(String charges) { this.charges = charges; }
    public String getCalculationType() { return calculationType; }
    public void setCalculationType(String calculationType) { this.calculationType = calculationType; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
