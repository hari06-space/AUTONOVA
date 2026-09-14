package com.autonoma.erp.modules.qmc.inspectionspecification.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class InspectionSpecificationDto {

    private Long id;
    private String specificationCode;
    private String specificationName;

    private Long itemId;
    private String itemNo;
    private String itemName;
    private String itemGroup;  // Derived from ProductMaster.itemGroup (read-only)

    // Master-level AQL Mapping (derived from Item Group or assigned)
    private Long aqlId;
    private String aqlCode;
    private String aqlName;
    private BigDecimal aqlValue;
    private String inspectionLevel;
    private String inspectionType;

    private Integer versionNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate effectiveFrom;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate effectiveTo;

    private String remarks;

    private Long status;
    private String statusName;

    private String createdBy;
    private java.util.Date createdDate;
    private String updatedBy;
    private java.util.Date updatedDate;

    // Parameter count for list view
    private Integer parameterCount;

    private List<InspectionSpecificationDetailDto> details;
}
