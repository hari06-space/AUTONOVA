package com.autonoma.erp.modules.finance.service;

import com.autonoma.erp.modules.finance.dto.FinanceOutstandingReportDTO;
import com.autonoma.erp.modules.finance.entity.FinanceOutstanding;
import com.autonoma.erp.modules.finance.entity.FinanceTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Date;
import java.util.Map;

public interface FinanceReportService {
    
    // Transactions
    Page<FinanceTransaction> getTransactionReport(
            Date fromDate, Date toDate, String transType, Long partyId, String vrNo, String partyBillNo, Pageable pageable);
    
    Map<String, Object> getTransactionSummary(
            Date fromDate, Date toDate, String transType, Long partyId, String vrNo, String partyBillNo);

    // Outstanding
    Page<FinanceOutstandingReportDTO> getOutstandingReport(
            Date asOnDate, Long partyId, String billNo, Date dueDate, String status, Pageable pageable);
            
    Map<String, Object> getOutstandingSummary(
            Date asOnDate, Long partyId, String billNo, Date dueDate, String status);
            
    Map<String, Object> getAgingSummary(
            Date asOnDate, Long partyId, String billNo, Date dueDate, String status);
}
