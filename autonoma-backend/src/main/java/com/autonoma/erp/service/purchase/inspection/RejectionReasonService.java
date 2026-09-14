package com.autonoma.erp.service.purchase.inspection;

import com.autonoma.erp.model.purchase.inspection.RejectionReason;

import java.util.List;

public interface RejectionReasonService {
    List<RejectionReason> getAllActiveReasons();
    RejectionReason createReason(String reason, String userId);
}
