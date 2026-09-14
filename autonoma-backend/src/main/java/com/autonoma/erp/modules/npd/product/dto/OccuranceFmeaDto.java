package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.util.Date;

@Data
public class OccuranceFmeaDto {
    private Long id;
    @com.fasterxml.jackson.annotation.JsonProperty("probablityOfFailure")
    @com.fasterxml.jackson.annotation.JsonAlias("probabilityOfFailure")
    private String probabilityOfFailure;
    private String likelyFailureRates;
    private Integer rank;
    private Boolean status;
    private String createdBy;
    private Date createdAt;
    private String updatedBy;
    private Date updatedAt;

    public OccuranceFmeaDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProbabilityOfFailure() { return probabilityOfFailure; }
    public void setProbabilityOfFailure(String probabilityOfFailure) { this.probabilityOfFailure = probabilityOfFailure; }

    public String getLikelyFailureRates() { return likelyFailureRates; }
    public void setLikelyFailureRates(String likelyFailureRates) { this.likelyFailureRates = likelyFailureRates; }

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
