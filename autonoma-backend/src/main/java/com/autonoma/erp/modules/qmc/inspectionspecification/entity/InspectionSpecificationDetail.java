package com.autonoma.erp.modules.qmc.inspectionspecification.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "QMC_INSPECTION_SPECIFICATION_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class InspectionSpecificationDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SPECIFICATION_ID", nullable = false)
    @JsonIgnoreProperties("details")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private InspectionSpecification specification;

    @Column(name = "SEQUENCE_NO", nullable = false)
    private Integer sequenceNo = 1;

    @Column(name = "GROUP_HEADING", length = 200)
    private String groupHeading;

    @Column(name = "PARAMETER_NAME", length = 1000, nullable = false)
    private String parameterName;

    @Column(name = "PARAMETER_ALIAS", length = 1000)
    private String parameterAlias;

    @Column(name = "PROCESS_ID")
    private Long processId;

    @Column(name = "INSTRUMENT_ID")
    private Long instrumentId;

    @Column(name = "AQL_MASTER_ID")
    private Long aqlMasterId;

    @Column(name = "PARAMETER_TYPE", length = 50)
    private String parameterType;  // e.g. DIMENSIONAL, VISUAL, CHEMICAL

    @Column(name = "PARAMETER_CONDITION", length = 50)
    private String parameterCondition;  // e.g. MIN_MAX, MIN, MAX, VISUAL, ANGLE

    @Column(name = "UOM_CODE", length = 50)
    private String uomCode;

    @Column(name = "NOMINAL_VALUE", precision = 18, scale = 4)
    private BigDecimal nominalValue;

    @Column(name = "LOWER_TOLERANCE", precision = 18, scale = 4)
    private BigDecimal lowerTolerance;

    @Column(name = "UPPER_TOLERANCE", precision = 18, scale = 4)
    private BigDecimal upperTolerance;

    @Column(name = "MINIMUM_VALUE", precision = 18, scale = 4)
    private BigDecimal minimumValue;

    @Column(name = "MAXIMUM_VALUE", precision = 18, scale = 4)
    private BigDecimal maximumValue;

    @Column(name = "REACTION_PLAN_ID")
    private Long reactionPlanId;

    @Column(name = "CONTROL_PLAN_NAME", length = 200)
    private String controlPlanName;

    // JSON array stored as string: ["INCOMING","FINAL","PROCESS"]
    @Column(name = "INSPECTION_STAGES", length = 500)
    private String inspectionStages;

    @Column(name = "REMARKS_1", length = 500)
    private String remarks1;

    @Column(name = "REMARKS_2", length = 500)
    private String remarks2;

    @Column(name = "REMARKS_3", length = 500)
    private String remarks3;

    @Column(name = "REFERENCE_IMAGE", length = 500)
    private String referenceImage;

    @Column(name = "REFERENCE", length = 500)
    private String reference;

    @Column(name = "VISUAL_NAME", length = 500)
    private String visualName;

    @Column(name = "VISUAL_LIMIT", length = 500)
    private String visualLimit;

    @Column(name = "METHOD_NAME", length = 200)
    private String methodName;

    @Column(name = "SAMPLING", length = 200)
    private String sampling;

    @Column(name = "CONTROL", length = 200)
    private String control;

    @Column(name = "STATUS", nullable = false)
    private Long status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public InspectionSpecification getSpecification() { return specification; }
    public void setSpecification(InspectionSpecification specification) { this.specification = specification; }
    public Integer getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(Integer sequenceNo) { this.sequenceNo = sequenceNo; }
    public String getGroupHeading() { return groupHeading; }
    public void setGroupHeading(String groupHeading) { this.groupHeading = groupHeading; }
    public String getParameterName() { return parameterName; }
    public void setParameterName(String parameterName) { this.parameterName = parameterName; }
    public String getParameterAlias() { return parameterAlias; }
    public void setParameterAlias(String parameterAlias) { this.parameterAlias = parameterAlias; }
    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }
    public Long getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Long instrumentId) { this.instrumentId = instrumentId; }
    public Long getAqlMasterId() { return aqlMasterId; }
    public void setAqlMasterId(Long aqlMasterId) { this.aqlMasterId = aqlMasterId; }
    public String getParameterType() { return parameterType; }
    public void setParameterType(String parameterType) { this.parameterType = parameterType; }
    public String getParameterCondition() { return parameterCondition; }
    public void setParameterCondition(String parameterCondition) { this.parameterCondition = parameterCondition; }
    public String getUomCode() { return uomCode; }
    public void setUomCode(String uomCode) { this.uomCode = uomCode; }
    public BigDecimal getNominalValue() { return nominalValue; }
    public void setNominalValue(BigDecimal nominalValue) { this.nominalValue = nominalValue; }
    public BigDecimal getLowerTolerance() { return lowerTolerance; }
    public void setLowerTolerance(BigDecimal lowerTolerance) { this.lowerTolerance = lowerTolerance; }
    public BigDecimal getUpperTolerance() { return upperTolerance; }
    public void setUpperTolerance(BigDecimal upperTolerance) { this.upperTolerance = upperTolerance; }
    public BigDecimal getMinimumValue() { return minimumValue; }
    public void setMinimumValue(BigDecimal minimumValue) { this.minimumValue = minimumValue; }
    public BigDecimal getMaximumValue() { return maximumValue; }
    public void setMaximumValue(BigDecimal maximumValue) { this.maximumValue = maximumValue; }
    public Long getReactionPlanId() { return reactionPlanId; }
    public void setReactionPlanId(Long reactionPlanId) { this.reactionPlanId = reactionPlanId; }
    public String getControlPlanName() { return controlPlanName; }
    public void setControlPlanName(String controlPlanName) { this.controlPlanName = controlPlanName; }
    public String getInspectionStages() { return inspectionStages; }
    public void setInspectionStages(String inspectionStages) { this.inspectionStages = inspectionStages; }
    public String getRemarks1() { return remarks1; }
    public void setRemarks1(String remarks1) { this.remarks1 = remarks1; }
    public String getRemarks2() { return remarks2; }
    public void setRemarks2(String remarks2) { this.remarks2 = remarks2; }
    public String getRemarks3() { return remarks3; }
    public void setRemarks3(String remarks3) { this.remarks3 = remarks3; }
    public String getReferenceImage() { return referenceImage; }
    public void setReferenceImage(String referenceImage) { this.referenceImage = referenceImage; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getVisualName() { return visualName; }
    public void setVisualName(String visualName) { this.visualName = visualName; }
    public String getVisualLimit() { return visualLimit; }
    public void setVisualLimit(String visualLimit) { this.visualLimit = visualLimit; }
    public String getMethodName() { return methodName; }
    public void setMethodName(String methodName) { this.methodName = methodName; }
    public String getSampling() { return sampling; }
    public void setSampling(String sampling) { this.sampling = sampling; }
    public String getControl() { return control; }
    public void setControl(String control) { this.control = control; }
    public Long getStatus() { return status; }
    public void setStatus(Long status) { this.status = status; }
}
