package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "OCCURANCE_FMEA")
@Getter
@Setter
public class OccuranceFmea extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PROBABILITY_OF_FAILURE", nullable = false, unique = true, length = 100)
    private String probabilityOfFailure;

    @Column(name = "LIKELY_FAILURE_RATES", nullable = false, length = 200)
    private String likelyFailureRates;

    @Column(name = "RANK", nullable = false)
    private Integer rank;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

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
}
