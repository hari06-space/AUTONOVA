package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.util.Date;

@Data
public class DetectionFmeaDto {
    private Long id;
    private String detection;
    private String criteria;
    private String detectionMethod;
    @com.fasterxml.jackson.annotation.JsonProperty("aAvail")
    private Boolean aAvail;

    @com.fasterxml.jackson.annotation.JsonProperty("bAvail")
    private Boolean bAvail;

    @com.fasterxml.jackson.annotation.JsonProperty("cAvail")
    private Boolean cAvail;
    private Integer rank;
    private Boolean status;
    private String createdBy;
    private Date createdAt;
    private String updatedBy;
    private Date updatedAt;

    public DetectionFmeaDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDetection() { return detection; }
    public void setDetection(String detection) { this.detection = detection; }

    public String getCriteria() { return criteria; }
    public void setCriteria(String criteria) { this.criteria = criteria; }

    public String getDetectionMethod() { return detectionMethod; }
    public void setDetectionMethod(String detectionMethod) { this.detectionMethod = detectionMethod; }

    public Boolean getAAvail() { return aAvail; }
    public void setAAvail(Boolean aAvail) { this.aAvail = aAvail; }

    public Boolean getBAvail() { return bAvail; }
    public void setBAvail(Boolean bAvail) { this.bAvail = bAvail; }

    public Boolean getCAvail() { return cAvail; }
    public void setCAvail(Boolean cAvail) { this.cAvail = cAvail; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
