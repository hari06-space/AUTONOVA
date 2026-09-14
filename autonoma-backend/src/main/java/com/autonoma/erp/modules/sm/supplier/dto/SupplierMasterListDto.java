package com.autonoma.erp.modules.sm.supplier.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierMasterListDto {
    private Long id;
    private String gstNo;
    private String supplierCode;
    private String supplierName;
    private String supplierPrintName;
    private String shortName;
    private String address;
    private String emailId;
    private String mobileNo;
    private String city;
    private String state;
    private String country;
    private String status;
    private String createdBy;
    private java.time.LocalDateTime createdDate;
    private String updatedBy;
    private java.time.LocalDateTime updatedDate;
}
