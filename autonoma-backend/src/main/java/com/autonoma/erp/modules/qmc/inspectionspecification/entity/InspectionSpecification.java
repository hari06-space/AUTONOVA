package com.autonoma.erp.modules.qmc.inspectionspecification.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "QMC_INSPECTION_SPECIFICATION")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class InspectionSpecification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SPECIFICATION_CODE", length = 50, nullable = false, unique = true)
    private String specificationCode;

    @Column(name = "SPECIFICATION_NAME", length = 200, nullable = false)
    private String specificationName;

    @Column(name = "ITEM_ID", nullable = false)
    private Long itemId;

    @Column(name = "VERSION_NO", nullable = false)
    private Integer versionNo = 1;

    @Column(name = "EFFECTIVE_FROM")
    private LocalDate effectiveFrom;

    @Column(name = "EFFECTIVE_TO")
    private LocalDate effectiveTo;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "STATUS", nullable = false)
    private Long status;

    @Column(name = "DIVISION")
    private Long divisionId;

    @Column(name = "AQL_ID")
    private Long aqlId;

    @OneToMany(mappedBy = "specification", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("specification")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OrderBy("sequenceNo ASC")
    private List<InspectionSpecificationDetail> details = new ArrayList<>();

    public void addDetail(InspectionSpecificationDetail detail) {
        details.add(detail);
        detail.setSpecification(this);
    }

    public void clearDetails() {
        this.details.forEach(d -> d.setSpecification(null));
        this.details.clear();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSpecificationCode() { return specificationCode; }
    public void setSpecificationCode(String specificationCode) { this.specificationCode = specificationCode; }
    public String getSpecificationName() { return specificationName; }
    public void setSpecificationName(String specificationName) { this.specificationName = specificationName; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Integer getVersionNo() { return versionNo; }
    public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getStatus() { return status; }
    public void setStatus(Long status) { this.status = status; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public Long getAqlId() { return aqlId; }
    public void setAqlId(Long aqlId) { this.aqlId = aqlId; }
    public List<InspectionSpecificationDetail> getDetails() { return details; }
    public void setDetails(List<InspectionSpecificationDetail> details) { this.details = details; }
}
