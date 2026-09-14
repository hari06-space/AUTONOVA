package com.autonoma.erp.modules.qmc.aql.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "QMC_AQL_MASTER")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class AqlMaster extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "AQL_CODE", length = 50, nullable = false, unique = true)
    private String aqlCode;

    @Column(name = "AQL_NAME", length = 100, nullable = false)
    private String aqlName;

    @Column(name = "INSPECTION_LEVEL", length = 50, nullable = false)
    private String inspectionLevel;

    @Column(name = "INSPECTION_TYPE", length = 50, nullable = false)
    private String inspectionType;

    @Column(name = "AQL_VALUE", precision = 10, scale = 3, nullable = false)
    private BigDecimal aqlValue;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "STATUS")
    private Long status;

    @OneToMany(mappedBy = "aqlMaster", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("aqlMaster")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<AqlSamplingRule> samplingRules = new ArrayList<>();
    
    public void addSamplingRule(AqlSamplingRule rule) {
        samplingRules.add(rule);
        rule.setAqlMaster(this);
    }
    
    public void removeSamplingRule(AqlSamplingRule rule) {
        samplingRules.remove(rule);
        rule.setAqlMaster(null);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAqlCode() { return aqlCode; }
    public void setAqlCode(String aqlCode) { this.aqlCode = aqlCode; }
    public String getAqlName() { return aqlName; }
    public void setAqlName(String aqlName) { this.aqlName = aqlName; }
    public String getInspectionLevel() { return inspectionLevel; }
    public void setInspectionLevel(String inspectionLevel) { this.inspectionLevel = inspectionLevel; }
    public String getInspectionType() { return inspectionType; }
    public void setInspectionType(String inspectionType) { this.inspectionType = inspectionType; }
    public BigDecimal getAqlValue() { return aqlValue; }
    public void setAqlValue(BigDecimal aqlValue) { this.aqlValue = aqlValue; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getStatus() { return status; }
    public void setStatus(Long status) { this.status = status; }
    public List<AqlSamplingRule> getSamplingRules() { return samplingRules; }
    public void setSamplingRules(List<AqlSamplingRule> samplingRules) { this.samplingRules = samplingRules; }
}
