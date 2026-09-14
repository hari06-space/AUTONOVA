package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.util.Date;

@Data
public class SeverityFmeaDto {
    private Long id;
    private String severityEffect;
    private String customerEffect;
    private String manufacturingEffect;
    private Integer rank;
    private Boolean status;
    private String createdBy;
    private java.util.Date createdAt;
    private String updatedBy;
    private java.util.Date updatedAt;

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
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public java.util.Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.util.Date createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public java.util.Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.util.Date updatedAt) { this.updatedAt = updatedAt; }
}
