package com.autonoma.erp.modules.finance.service;

import com.autonoma.erp.modules.finance.dto.FinanceOutstandingReportDTO;
import com.autonoma.erp.modules.finance.dto.OutstandingBalanceDTO;
import com.autonoma.erp.modules.finance.entity.FinanceOutstanding;
import com.autonoma.erp.modules.finance.entity.FinanceTransaction;
import com.autonoma.erp.modules.finance.repository.FinanceOutstandingRepository;
import com.autonoma.erp.modules.finance.repository.FinanceTransactionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceReportServiceImpl implements FinanceReportService {

    private final FinanceTransactionRepository transactionRepository;
    private final FinanceOutstandingRepository outstandingRepository;
    private final FinancePostingService postingService;

    // --- TRANSACTION REPORT ---
    
    private Specification<FinanceTransaction> buildTransactionSpec(
            Date fromDate, Date toDate, String transType, Long partyId, String vrNo, String partyBillNo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transDate"), toDate));
            }
            if (transType != null && !transType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("transType"), transType));
            }
            if (partyId != null) {
                predicates.add(cb.equal(root.get("partyId"), partyId));
            }
            if (vrNo != null && !vrNo.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("vrNo")), "%" + vrNo.toLowerCase() + "%"));
            }
            if (partyBillNo != null && !partyBillNo.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("partyBillNo")), "%" + partyBillNo.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FinanceTransaction> getTransactionReport(
            Date fromDate, Date toDate, String transType, Long partyId, String vrNo, String partyBillNo, Pageable pageable) {
        Specification<FinanceTransaction> spec = buildTransactionSpec(fromDate, toDate, transType, partyId, vrNo, partyBillNo);
        return transactionRepository.findAll(spec, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTransactionSummary(
            Date fromDate, Date toDate, String transType, Long partyId, String vrNo, String partyBillNo) {
        Specification<FinanceTransaction> spec = buildTransactionSpec(fromDate, toDate, transType, partyId, vrNo, partyBillNo);
        List<FinanceTransaction> allMatches = transactionRepository.findAll(spec);
        
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        
        for (FinanceTransaction tx : allMatches) {
            if (tx.getDrAmt() != null) totalDebit = totalDebit.add(tx.getDrAmt());
            if (tx.getCrAmt() != null) totalCredit = totalCredit.add(tx.getCrAmt());
        }
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalTransactions", allMatches.size());
        summary.put("totalDebit", totalDebit);
        summary.put("totalCredit", totalCredit);
        summary.put("netAmount", totalDebit.subtract(totalCredit)); // Adjust as per convention
        
        return summary;
    }

    // --- OUTSTANDING REPORT ---

    private Specification<FinanceOutstanding> buildOutstandingSpec(
            Date asOnDate, Long partyId, String billNo, Date dueDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (asOnDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transDate"), asOnDate));
            }
            if (partyId != null) {
                predicates.add(cb.equal(root.get("partyId"), partyId));
            }
            if (billNo != null && !billNo.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("partyBillNo")), "%" + billNo.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FinanceOutstandingReportDTO> getOutstandingReport(
            Date asOnDate, Long partyId, String billNo, Date dueDate, String status, Pageable pageable) {
        Specification<FinanceOutstanding> spec = buildOutstandingSpec(asOnDate, partyId, billNo, dueDate);
        Page<FinanceOutstanding> entities = outstandingRepository.findAll(spec, pageable);
        
        List<FinanceOutstandingReportDTO> dtoList = new ArrayList<>();
        
        for (FinanceOutstanding entity : entities) {
            OutstandingBalanceDTO balDto = postingService.calculateOutstanding(entity.getId());
            FinanceOutstandingReportDTO dto = new FinanceOutstandingReportDTO(entity, balDto.getSettledAmount(), balDto.getBalanceAmount());
            
            // Post-query filter for dynamic status if requested
            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
                if (dto.getStatus().equalsIgnoreCase(status)) {
                    dtoList.add(dto);
                }
            } else {
                dtoList.add(dto);
            }
        }
        
        // Note: Post-query filtering breaks pure Pageable totalElements if status is used heavily. 
        // For strict large datasets, status would need to be materialized or queried via join on trans.
        // In this ERP setup with runtime calculation constraint, we do it in Java layer for the Page.
        return new PageImpl<>(dtoList, pageable, entities.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getOutstandingSummary(Date asOnDate, Long partyId, String billNo, Date dueDate, String status) {
        Specification<FinanceOutstanding> spec = buildOutstandingSpec(asOnDate, partyId, billNo, dueDate);
        List<FinanceOutstanding> entities = outstandingRepository.findAll(spec);
        
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal overdueAmount = BigDecimal.ZERO;
        BigDecimal dueToday = BigDecimal.ZERO;
        Set<Long> partyIds = new HashSet<>();
        
        Date today = new Date();
        
        for (FinanceOutstanding entity : entities) {
            OutstandingBalanceDTO balDto = postingService.calculateOutstanding(entity.getId());
            FinanceOutstandingReportDTO dto = new FinanceOutstandingReportDTO(entity, balDto.getSettledAmount(), balDto.getBalanceAmount());
            
            boolean matchStatus = true;
            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
                matchStatus = dto.getStatus().equalsIgnoreCase(status);
            }
            
            if (matchStatus && dto.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
                totalOutstanding = totalOutstanding.add(dto.getBalanceAmount());
                if (dto.getPartyId() != null) partyIds.add(dto.getPartyId());
                
                if (dto.getStatus().equals("OVERDUE")) {
                    overdueAmount = overdueAmount.add(dto.getBalanceAmount());
                }
                
                if (dto.getDueDate() != null && isSameDay(dto.getDueDate(), today)) {
                    dueToday = dueToday.add(dto.getBalanceAmount());
                }
            }
        }
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOutstanding", totalOutstanding);
        summary.put("overdueAmount", overdueAmount);
        summary.put("dueToday", dueToday);
        summary.put("totalParties", partyIds.size());
        
        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAgingSummary(Date asOnDate, Long partyId, String billNo, Date dueDate, String status) {
        Specification<FinanceOutstanding> spec = buildOutstandingSpec(asOnDate, partyId, billNo, dueDate);
        List<FinanceOutstanding> entities = outstandingRepository.findAll(spec);
        
        BigDecimal current = BigDecimal.ZERO;
        BigDecimal days30 = BigDecimal.ZERO;
        BigDecimal days60 = BigDecimal.ZERO;
        BigDecimal days90 = BigDecimal.ZERO;
        BigDecimal daysOver90 = BigDecimal.ZERO;
        
        for (FinanceOutstanding entity : entities) {
            OutstandingBalanceDTO balDto = postingService.calculateOutstanding(entity.getId());
            FinanceOutstandingReportDTO dto = new FinanceOutstandingReportDTO(entity, balDto.getSettledAmount(), balDto.getBalanceAmount());
            
            boolean matchStatus = true;
            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
                matchStatus = dto.getStatus().equalsIgnoreCase(status);
            }
            
            if (matchStatus && dto.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
                if (dto.getStatus().equals("OVERDUE") && dto.getDueDate() != null) {
                    long diffInMillis = new Date().getTime() - dto.getDueDate().getTime();
                    long days = diffInMillis / (1000 * 60 * 60 * 24);
                    
                    if (days <= 30) days30 = days30.add(dto.getBalanceAmount());
                    else if (days <= 60) days60 = days60.add(dto.getBalanceAmount());
                    else if (days <= 90) days90 = days90.add(dto.getBalanceAmount());
                    else daysOver90 = daysOver90.add(dto.getBalanceAmount());
                } else {
                    current = current.add(dto.getBalanceAmount());
                }
            }
        }
        
        Map<String, Object> aging = new HashMap<>();
        aging.put("current", current);
        aging.put("days30", days30);
        aging.put("days60", days60);
        aging.put("days90", days90);
        aging.put("daysOver90", daysOver90);
        
        return aging;
    }
    
    private boolean isSameDay(Date date1, Date date2) {
        Calendar cal1 = Calendar.getInstance();
        Calendar cal2 = Calendar.getInstance();
        cal1.setTime(date1);
        cal2.setTime(date2);
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }
}
