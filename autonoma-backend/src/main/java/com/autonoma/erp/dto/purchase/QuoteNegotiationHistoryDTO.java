package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class QuoteNegotiationHistoryDTO {
    private Long id;
    private Long negotiationId;
    private Date actionDate;
    private String actionType;
    private String userId;
    private String remarks;
}
