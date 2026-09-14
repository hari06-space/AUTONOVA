package com.autonoma.erp.modules.qmc.inspectionspecification.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class InspectionSpecificationDetailDto {

    private Long id;
    private Long specificationId;
    private Integer sequenceNo;

    private String groupHeading;
    private String parameterName;
    private String parameterAlias;

    private Long processId;
    private String processName;     // Derived from NPD_PROCESS for display

    private Long instrumentId;
    private String instrumentName;  // Derived from NPD_PRODUCT_MASTER

    private Long aqlMasterId;
    private String aqlCode;         // Derived from QMC_AQL_MASTER for display
    private String aqlName;         // Derived for display
    private String aqlInspectionLevel;
    private String aqlInspectionType;
    private BigDecimal aqlValue;
    private Integer samplingRuleCount;

    private String parameterType;       // e.g. DIMENSIONAL, VISUAL, CHEMICAL
    private String parameterCondition;  // e.g. MIN_MAX, MIN, MAX, VISUAL, ANGLE

    private String uomCode;   // FK to MST_UOM.UOM_CODE
    private String uomName;   // Derived: MST_UOM.UOM_DESCRIPTION

    private BigDecimal nominalValue;
    private BigDecimal lowerTolerance;
    private BigDecimal upperTolerance;
    private BigDecimal minimumValue;
    private BigDecimal maximumValue;

    private Long reactionPlanId;
    private String reactionPlanName;  // Derived from NPD_REACTION_PLAN for display

    private String controlPlanName;

    // JSON string: ["INCOMING","FINAL","PROCESS"]
    private String inspectionStages;

    private String remarks1;
    private String remarks2;
    private String remarks3;

    private String referenceImage;

    private Long status;
    private String statusName;
}
