package com.autonoma.erp.dto.purchase.gateentry;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class GateEntryHeadDTO {

    private Long id;
    private Long divisionId;
    
    private String gateEntryNo;
    private LocalDate gateEntryDate;
    private String gatePassType;
    private String entryType;
    
    private Long supplierId;
    private String supplierName;
    private Long transporterId;
    private String transporterName;
    private String transportMode;
    private String vehicleNo;
    private String lrNo;
    private LocalDate lrDate;
    
    // Time Tracking KPIs
    private LocalDateTime expectedArrivalTime;
    private LocalDateTime arrivalTime;
    private LocalDateTime securityCheckStart;
    private LocalDateTime securityCheckEnd;
    private LocalDateTime storesInspectionStart;
    private LocalDateTime storesInspectionEnd;
    private LocalDateTime grnCreatedTime;
    private LocalDateTime exitTime;
    
    private String gateNo;
    private String securityOfficerId;
    private String securityOfficerName;
    private Long departmentId;
    private String departmentName;
    
    private String remarks;
    
    private Long statusId;
    private String statusName;
    private Integer approvalVersion;
    private Integer approvalSequence;
    
    private Integer activeStatus;
    
    private List<GateEntryTransDTO> transactions = new ArrayList<>();
    private List<GateEntryVisitorDTO> visitors = new ArrayList<>();
    private List<GateEntrySourceDTO> sources = new ArrayList<>();
    private List<GateEntryAttachmentDTO> attachments = new ArrayList<>();
    private List<java.util.Map<String, Object>> logs = new ArrayList<>();
}
