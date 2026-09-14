package com.autonoma.erp.dto.purchase.gateentry;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class GateEntryListDTO {

    private Long id;
    private String gateEntryNo;
    private LocalDate gateEntryDate;
    private String gatePassType;
    private String entryType;
    
    private String supplierName;
    private String transporterName;
    
    private LocalDateTime arrivalTime;
    
    private String gateNo;
    private String vehicleNo;
    
    private Long statusId;
    private String statusName;
}
