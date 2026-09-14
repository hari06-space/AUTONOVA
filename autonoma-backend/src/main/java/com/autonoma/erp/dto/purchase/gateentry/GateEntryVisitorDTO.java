package com.autonoma.erp.dto.purchase.gateentry;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GateEntryVisitorDTO {

    private Long id;
    private Long gateEntryHeadId;
    
    private String vehicleNo;
    private String vehicleType;
    private String truckSize;
    private String trailerNo;
    private String containerNo;
    private String sealNo;
    private String sealCondition;
    private String parkingLocation;
    
    private BigDecimal grossWeight;
    private BigDecimal tareWeight;
    private BigDecimal netWeight;
    private String weighbridgeSlipNo;
    
    private String driverName;
    private String driverMobile;
    private String driverLicenseNo;
    private LocalDate licenseExpiry;
    private String helperName;
    private String transportCompany;
    private String emergencyContact;
    
    private Integer activeStatus;
}
