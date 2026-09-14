package com.autonoma.erp.service.purchase.comparison.engine;

import com.autonoma.erp.model.QuoteComparisonHead;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class QuoteComparisonApprovalEngine {

    public void processLock(QuoteComparisonHead comparisonHead, String userId) {
        // Find Status ID for LOCKED
        // comparisonHead.setStatusId(lockedStatusId);
        comparisonHead.setLockedBy(userId);
        comparisonHead.setLockedDate(new Date());
    }
}
