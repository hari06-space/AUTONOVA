package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO;
import com.autonoma.erp.model.RfqEmailHistory;
import java.util.List;

public interface RfqEmailHistoryService {
    RfqEmailHistory logAttempt(Long rfqId, Long supplierId, String recipientEmail, 
                              String subject, String content, String ccEmail, 
                              boolean success, String failureReason, String userId);

    List<RfqEmailHistoryDTO> getHistoryByRfqId(Long rfqId);
}
