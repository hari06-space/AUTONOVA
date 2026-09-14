package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "SEVERITY_FMEA")
@Getter
@Setter
public class SeverityFmea extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SEVERITY_EFFECT", nullable = false, unique = true, length = 100)
    private String severityEffect;

    @Column(name = "CUSTOMER_EFFECT", nullable = false, length = 200)
    private String customerEffect;

    @Column(name = "MANUFACTURING_EFFECT", nullable = false, length = 200)
    private String manufacturingEffect;

    @Column(name = "RANK", nullable = false)
    private Integer rank;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSeverityEffect() { return severityEffect; }
    public void setSeverityEffect(String severityEffect) { this.severityEffect = severityEffect; }
    public String getCustomerEffect() { return customerEffect; }
    public void setCustomerEffect(String customerEffect) { this.customerEffect = customerEffect; }
    public String getManufacturingEffect() { return manufacturingEffect; }
    public void setManufacturingEffect(String manufacturingEffect) { this.manufacturingEffect = manufacturingEffect; }
    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
