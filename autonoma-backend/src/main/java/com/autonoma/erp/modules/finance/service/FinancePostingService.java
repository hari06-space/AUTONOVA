package com.autonoma.erp.modules.finance.service;

import com.autonoma.erp.modules.finance.dto.FinancePostingDTO;
import com.autonoma.erp.modules.finance.dto.OutstandingBalanceDTO;

public interface FinancePostingService {
    
    /**
     * Posts an invoice to the finance ledger and creates an outstanding bill record.
     * Must be idempotent.
     */
    void postInvoice(FinancePostingDTO dto);
    
    /**
     * Posts a payment against a specific outstanding bill.
     * Validates overpayment according to business rules.
     */
    void postPayment(FinancePostingDTO dto, Long billOutstandingId);
    
    /**
     * Posts an advance or on-account payment without a specific bill link.
     */
    void postOnAccountPayment(FinancePostingDTO dto);
    
    /**
     * Dynamically calculates the outstanding balance for a given bill.
     */
    OutstandingBalanceDTO calculateOutstanding(Long billOutstandingId);
}
