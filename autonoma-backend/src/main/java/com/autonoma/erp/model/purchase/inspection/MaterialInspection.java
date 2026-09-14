package com.autonoma.erp.model.purchase.inspection;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.qmc.aql.entity.AqlMaster;
import com.autonoma.erp.modules.qmc.inspectionspecification.entity.InspectionSpecificationDetail;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "QMC_MATERIAL_INSPECTION")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class MaterialInspection extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUALITY_INSPECTION_ID", nullable = false)
    @JsonIgnoreProperties("testReports")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QualityInspection qualityInspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SPEC_PARAMETER_ID")
    private InspectionSpecificationDetail specParameter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AQL_ID")
    private AqlMaster aql;

    @Column(name = "MIN_VAL", precision = 12, scale = 2)
    private BigDecimal minVal;

    @Column(name = "MAX_VAL", precision = 12, scale = 2)
    private BigDecimal maxVal;

    @Column(name = "OBSERVATION")
    private String observation;

    @Column(name = "RESULT")
    private String result;
}
