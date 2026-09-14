package com.autonoma.erp.modules.inventory.transaction.service;

import com.autonoma.erp.modules.inventory.transaction.dto.CurrentStockReportDto;
import com.autonoma.erp.modules.inventory.transaction.dto.ItemTransactionDto;
import com.autonoma.erp.modules.inventory.transaction.dto.StockLedgerReportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ItemTransactionService {
    
    ItemTransactionDto createTransaction(ItemTransactionDto dto);
    
    ItemTransactionDto postTransaction(Long id);
    
    ItemTransactionDto cancelTransaction(Long id);
    
    ItemTransactionDto getTransactionById(Long id);
    
    Page<ItemTransactionDto> getAllTransactions(Long divisionId, Pageable pageable);
    
    Page<CurrentStockReportDto> getCurrentStockReport(Long productId, String inventoryType, Pageable pageable);
    
    List<StockLedgerReportDto> getStockLedgerReport(Long divisionId, Long productId, LocalDate startDate, LocalDate endDate);
    
    Page<ItemTransactionDto> getRejectionStockReport(Long divisionId, Pageable pageable);
    
    Page<ItemTransactionDto> getStockMovementReport(Long divisionId, LocalDate startDate, LocalDate endDate, Pageable pageable);
}
