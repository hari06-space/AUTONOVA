package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "DETECTION_FMEA")
@Getter
@Setter
public class DetectionFmea extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "DETECTION", nullable = false, unique = true, length = 100)
    private String detection;

    @Column(name = "CRITERIA", nullable = false, length = 200)
    private String criteria;

    @Column(name = "DETECTION_METHOD", nullable = false, length = 200)
    private String detectionMethod;

    @Column(name = "A_AVAIL", nullable = false)
    @JsonProperty("aAvail")
    private Boolean aAvail = false;

    @Column(name = "B_AVAIL", nullable = false)
    @JsonProperty("bAvail")
    private Boolean bAvail = false;

    @Column(name = "C_AVAIL", nullable = false)
    @JsonProperty("cAvail")
    private Boolean cAvail = false;

    @Column(name = "RANK", nullable = false)
    private Integer rank;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

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
}
