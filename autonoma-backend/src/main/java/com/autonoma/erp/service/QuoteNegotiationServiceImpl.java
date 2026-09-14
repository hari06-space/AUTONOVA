package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.*;
import com.autonoma.erp.model.*;
import com.autonoma.erp.repository.purchase.QuotationNegotiationRepository;
import com.autonoma.erp.repository.purchase.QuotationNegotiationTransRepository;
import com.autonoma.erp.repository.purchase.QuotationNegotiationHistoryRepository;
import com.autonoma.erp.repository.QuotationHeadRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class QuoteNegotiationServiceImpl implements QuoteNegotiationService {

    @Autowired
    private QuotationNegotiationRepository repository;
    
    @Autowired
    private QuotationNegotiationTransRepository transRepository;

    @Autowired
    private QuotationNegotiationHistoryRepository historyRepository;

    @Autowired
    private QuotationHeadRepository quotationRepository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<QuoteNegotiationListDTO> getAllNegotiations(Long divisionId) {
        String sql = "SELECT n.ID, n.NEGOTIATION_NO, n.NEGOTIATION_DATE, " +
                     "q.ID AS QUOTATION_ID, q.QUOTATION_NO, " +
                     "r.ID AS RFQ_ID, r.RFQ_NO, " +
                     "p.ID AS PR_ID, p.PR_NO, " +
                     "v.ID AS SUPPLIER_ID, v.LEDGER_NAME AS SUPPLIER_NAME, " +
                     "e.ID AS BUYER_ID, e.EMPLOYEE_NAME AS BUYER_NAME, " +
                     "n.ORIGINAL_TOTAL, n.NEGOTIATED_TOTAL, " +
                     "sm.ID AS STATUS_ID, sm.NAME AS STATUS_NAME, " +
                     "n.TOTAL_SAVINGS, n.NEGOTIATION_REMARKS, " +
                     "CASE " +
                     "WHEN EXISTS (SELECT 1 FROM PP_PURCHASE_ORDER_SOURCE pos JOIN PP_PURCHASE_ORDER_HEAD po ON pos.PO_HEAD_ID = po.ID WHERE po.ACTIVE_STATUS = 1 AND (" +
                     "  (pos.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND pos.SOURCE_HEAD_ID = q.ID) OR " +
                     "  (pos.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND pos.SOURCE_HEAD_ID IN (SELECT c.ID FROM PP_QUOTE_COMPARISON_HEAD c WHERE c.RFQ_ID = r.ID))" +
                     ")) THEN 'PO Issued' " +
                     "WHEN EXISTS (SELECT 1 FROM PP_QUOTE_COMPARISON_HEAD c WHERE c.RFQ_ID = r.ID) THEN 'Comparison Done' " +
                     "WHEN EXISTS (SELECT 1 FROM PP_QUOTATION_NEGOTIATION_HEAD n2 WHERE n2.QUOTATION_ID = q.ID AND n2.STATUS_ID = (SELECT ID FROM AD_STATUS_MASTER WHERE NAME = 'OPEN')) THEN 'Under Negotiation' " +
                     "ELSE 'Pending' END AS TRACKING_STATUS " +
                     "FROM PP_QUOTATION_NEGOTIATION_HEAD n " +
                     "JOIN PP_QUOTATION_HEAD q ON n.QUOTATION_ID = q.ID " +
                     "JOIN PP_RFQ_HEAD r ON q.RFQ_REF_ID = r.ID " +
                     "LEFT JOIN PP_PURCHASE_REQUEST_HEAD p ON r.PR_REF_ID = p.ID " +
                     "JOIN FA_ACCOUNT_LEDGER v ON n.SUPPLIER_ID = v.ID " +
                     "JOIN HR_EMPLOYEE e ON n.BUYER_ID = e.ID " +
                     "JOIN AD_STATUS_MASTER sm ON n.STATUS_ID = sm.ID " +
                     "WHERE n.DIVISION = ? " +
                     "ORDER BY n.ID DESC";

        return jdbcTemplate.query(sql, new Object[]{divisionId}, (rs, rowNum) -> {
            QuoteNegotiationListDTO dto = new QuoteNegotiationListDTO();
            dto.setId(rs.getLong("ID"));
            dto.setNegotiationNo(rs.getString("NEGOTIATION_NO"));
            dto.setNegotiationDate(rs.getDate("NEGOTIATION_DATE"));
            dto.setQuotationId(rs.getLong("QUOTATION_ID"));
            dto.setQuotationNo(rs.getString("QUOTATION_NO"));
            dto.setRfqId(rs.getLong("RFQ_ID"));
            dto.setRfqNo(rs.getString("RFQ_NO"));
            if (rs.getObject("PR_ID") != null) {
                dto.setPrId(rs.getLong("PR_ID"));
                dto.setPrNo(rs.getString("PR_NO"));
            }
            dto.setSupplierId(rs.getLong("SUPPLIER_ID"));
            dto.setSupplierName(rs.getString("SUPPLIER_NAME"));
            dto.setBuyerId(rs.getLong("BUYER_ID"));
            dto.setBuyerName(rs.getString("BUYER_NAME"));
            dto.setOriginalAmount(rs.getBigDecimal("ORIGINAL_TOTAL"));
            dto.setNegotiatedAmount(rs.getBigDecimal("NEGOTIATED_TOTAL"));
            dto.setStatusId(rs.getLong("STATUS_ID"));
            dto.setStatusName(rs.getString("STATUS_NAME"));
            dto.setSavings(rs.getBigDecimal("TOTAL_SAVINGS"));
            dto.setNegotiationRemarks(rs.getString("NEGOTIATION_REMARKS"));
            dto.setTrackingStatus(rs.getString("TRACKING_STATUS"));
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteNegotiationHeadDTO getNegotiationById(Long id) {
        return repository.findById(id).map(this::mapToDTO).orElseThrow(() -> new BusinessException("Negotiation not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteNegotiationHeadDTO getNegotiationByQuotationId(Long quotationId) {
        // Return latest negotiation if it exists
        List<QuotationNegotiationHead> negotiations = repository.findByQuotationHeadId(quotationId);
        if (negotiations != null && !negotiations.isEmpty()) {
            // Get highest round
            QuotationNegotiationHead latest = negotiations.stream()
                .max((a, b) -> a.getNegotiationRound().compareTo(b.getNegotiationRound()))
                .orElse(null);
            return mapToDTO(latest);
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteNegotiationHeadDTO initializeNegotiation(Long quotationId, Long buyerId) {
        QuotationHead quotation = quotationRepository.findById(quotationId)
            .orElseThrow(() -> new BusinessException("Quotation not found for ID: " + quotationId));
        
        QuoteNegotiationHeadDTO dto = new QuoteNegotiationHeadDTO();
        dto.setQuotationId(quotationId);
        dto.setQuotationNo(quotation.getQuotationNo());
        dto.setRfqId(quotation.getRfqHead().getId());
        dto.setRfqNo(quotation.getRfqHead().getRfqNo());
        dto.setSupplierId(quotation.getSupplier().getId());
        dto.setSupplierName(quotation.getSupplier().getLedgerName());
        dto.setDivisionId(quotation.getDivision().getId());
        
        com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster buyer = employeeRepository.findById(buyerId)
            .orElseGet(() -> employeeRepository.findAll().stream().findFirst()
            .orElseThrow(() -> new BusinessException("Invalid Buyer ID")));
        dto.setBuyerId(buyer.getId());
        dto.setBuyerName(buyer.getEmployeeName());
        
        List<QuotationNegotiationHead> existing = repository.findByQuotationHeadId(quotation.getId());
        int round = 1;
        if (existing != null && !existing.isEmpty()) {
            round = existing.stream().mapToInt(QuotationNegotiationHead::getNegotiationRound).max().orElse(0) + 1;
        }
        dto.setNegotiationRound(round);
        dto.setNegotiationDate(new Date());
        dto.setNegotiationNo("AUTO");
        dto.setStatusName("OPEN");
        
        BigDecimal origTotal = calculateQuotationTotal(quotation);
        dto.setOriginalTotal(origTotal);
        dto.setNegotiatedTotal(origTotal);
        dto.setTotalSavings(BigDecimal.ZERO);
        
        dto.setOriginalDeliveryTerms(quotation.getDeliveryTerms());
        dto.setNegotiatedDeliveryTerms(dto.getOriginalDeliveryTerms());
        dto.setOriginalPaymentTerms(quotation.getPaymentTerms());
        dto.setNegotiatedPaymentTerms(quotation.getPaymentTerms());
        dto.setOriginalTransportMode(quotation.getTransportScope());
        dto.setNegotiatedTransportMode(quotation.getTransportScope());
        
        List<QuoteNegotiationTransDTO> transDTOs = new ArrayList<>();
        if (quotation.getDetails() != null) {
            for (QuotationDetail qd : quotation.getDetails()) {
                QuoteNegotiationTransDTO td = new QuoteNegotiationTransDTO();
                td.setQuotationDetailId(qd.getId());
                td.setItemId(qd.getItem().getId());
                td.setItemCode(qd.getItem().getItemCode());
                td.setItemName(qd.getItem().getItemName());
                td.setQty(qd.getQty());
                
                BigDecimal origPrice = qd.getUnitPrice();
                td.setOriginalPrice(origPrice);
                td.setNegotiatedPrice(origPrice);
                td.setSavings(BigDecimal.ZERO);
                
                td.setOriginalDeliveryDays(quotation.getLeadTimeDays());
                td.setNegotiatedDeliveryDays(quotation.getLeadTimeDays());
                td.setOriginalWarranty(qd.getWarrantyTerms());
                td.setNegotiatedWarranty(qd.getWarrantyTerms());
                
                transDTOs.add(td);
            }
        }
        dto.setTransactions(transDTOs);
        
        return dto;
    }

    @Override
    @Transactional
    public QuoteNegotiationHeadDTO saveNegotiation(QuoteNegotiationHeadDTO dto, String userId) {
        QuotationNegotiationHead entity;
        boolean isNew = false;
        
        if (dto.getId() == null) {
            entity = new QuotationNegotiationHead();
            entity.setNegotiationNo(generateNegotiationNo());
            entity.setNegotiationDate(new Date());
            
            QuotationHead quotation = quotationRepository.findById(dto.getQuotationId())
                .orElseThrow(() -> new BusinessException("Quotation not found for ID: " + dto.getQuotationId()));
            entity.setQuotationHead(quotation);
            entity.setRfqHead(quotation.getRfqHead());
            entity.setSupplier(quotation.getSupplier());
            
            com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster buyer = employeeRepository.findById(dto.getBuyerId())
                .orElseGet(() -> employeeRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BusinessException("Invalid Buyer/Employee ID mapped to this user and no fallback employee found.")));
            entity.setBuyer(buyer);
            entity.setDivision(quotation.getDivision());
            
            // Determine round
            List<QuotationNegotiationHead> existing = repository.findByQuotationHeadId(quotation.getId());
            int round = 1;
            if (existing != null && !existing.isEmpty()) {
                round = existing.stream().mapToInt(QuotationNegotiationHead::getNegotiationRound).max().orElse(0) + 1;
            }
            entity.setNegotiationRound(round);
            
            entity.setOriginalTotal(calculateQuotationTotal(quotation));
            entity.setNegotiatedTotal(entity.getOriginalTotal());
            entity.setTotalSavings(java.math.BigDecimal.ZERO);
            
            entity.setOriginalDeliveryTerms(quotation.getLeadTimeDays() != null ? quotation.getLeadTimeDays() + " Days" : null);
            entity.setNegotiatedDeliveryTerms(entity.getOriginalDeliveryTerms());
            entity.setOriginalPaymentTerms(quotation.getPaymentTerms());
            entity.setNegotiatedPaymentTerms(quotation.getPaymentTerms());
            entity.setOriginalTransportMode(quotation.getTransportScope());
            entity.setNegotiatedTransportMode(quotation.getTransportScope());
            
            entity.setStatus(getStatusByName("OPEN"));
            
            entity.setCreatedBy(userId);
            entity.setCreatedDate(new Date());
            isNew = true;
            
            entity = repository.save(entity);
            
            // Create Trans records from Quotation Details
            List<QuotationNegotiationTrans> transactions = new ArrayList<>();
            for (QuotationDetail qd : quotation.getDetails()) {
                QuotationNegotiationTrans trans = new QuotationNegotiationTrans();
                trans.setNegotiationHead(entity);
                trans.setQuotationDetail(qd);
                trans.setItem(qd.getItem());
                trans.setQty(qd.getQty());
                
                BigDecimal origPrice = qd.getUnitPrice();
                trans.setOriginalPrice(origPrice);
                trans.setNegotiatedPrice(origPrice); // default to original
                trans.setSavings(BigDecimal.ZERO);
                
                trans.setOriginalDeliveryDays(quotation.getLeadTimeDays());
                trans.setNegotiatedDeliveryDays(quotation.getLeadTimeDays());
                
                trans.setOriginalWarranty(quotation.getWarrantyTerms());
                trans.setNegotiatedWarranty(quotation.getWarrantyTerms());
                
                trans.setCreatedBy(userId);
                trans.setCreatedDate(new Date());
                transactions.add(trans);
            }
            transRepository.saveAll(transactions);
            entity.setTransactions(transactions);
            
        } else {
            entity = repository.findById(dto.getId()).orElseThrow();
            entity.setUpdatedBy(userId);
            entity.setUpdatedDate(new Date());
            if ("AGREED".equalsIgnoreCase(entity.getStatus().getName()) || "CLOSED".equalsIgnoreCase(entity.getStatus().getName())) {
                throw new BusinessException("Cannot edit closed or agreed negotiations");
            }
            
            // Update transactions
            BigDecimal negotiatedTotal = BigDecimal.ZERO;
            BigDecimal totalSavings = BigDecimal.ZERO;
            
            if (dto.getTransactions() != null) {
                for (QuoteNegotiationTransDTO tdto : dto.getTransactions()) {
                    QuotationNegotiationTrans trans = transRepository.findById(tdto.getId()).orElseThrow();
                    trans.setNegotiatedPrice(tdto.getNegotiatedPrice());
                    trans.setNegotiatedDeliveryDays(tdto.getNegotiatedDeliveryDays());
                    trans.setNegotiatedWarranty(tdto.getNegotiatedWarranty());
                    trans.setRemarks(tdto.getRemarks());
                    
                    if (trans.getOriginalPrice() != null && trans.getNegotiatedPrice() != null) {
                        BigDecimal savings = trans.getOriginalPrice().subtract(trans.getNegotiatedPrice()).multiply(trans.getQty());
                        trans.setSavings(savings);
                        totalSavings = totalSavings.add(savings);
                    }
                    
                    if (trans.getNegotiatedPrice() != null) {
                        negotiatedTotal = negotiatedTotal.add(trans.getNegotiatedPrice().multiply(trans.getQty()));
                    }
                    
                    trans.setUpdatedBy(userId);
                    trans.setUpdatedDate(new Date());
                    transRepository.save(trans);
                }
            }
            
            entity.setNegotiatedTotal(negotiatedTotal);
            entity.setTotalSavings(totalSavings);
            entity.setNegotiationRemarks(dto.getNegotiationRemarks());
            entity.setSupplierRemarks(dto.getSupplierRemarks());
            
            entity.setNegotiatedDeliveryTerms(dto.getNegotiatedDeliveryTerms());
            entity.setNegotiatedPaymentTerms(dto.getNegotiatedPaymentTerms());
            entity.setNegotiatedTransportMode(dto.getNegotiatedTransportMode());
            
            entity = repository.save(entity);
        }

        // Add history
        addHistory(entity, isNew ? "Created Negotiation Round " + entity.getNegotiationRound() : "Updated Negotiation", dto.getNegotiationRemarks(), userId);

        return mapToDTO(entity);
    }

    @Override
    @Transactional
    public QuoteNegotiationHeadDTO updateNegotiationStatus(Long id, Long statusId, String remarks, String userId) {
        QuotationNegotiationHead entity = repository.findById(id).orElseThrow();
        
        String newStatus = (String) entityManager.createNativeQuery("SELECT NAME FROM AD_STATUS_MASTER WHERE ID = :id")
                .setParameter("id", statusId)
                .getSingleResult();
                
        com.autonoma.erp.modules.platform.common.entity.StatusMaster status = getStatusByName(newStatus.trim());
        entity.setStatus(status);
        entity.setUpdatedBy(userId);
        entity.setUpdatedDate(new Date());
        
        entity = repository.save(entity);
        
        addHistory(entity, "Status Changed to " + status.getName(), remarks, userId);
        
        return mapToDTO(entity);
    }

    @Override
    @Transactional
    public void deleteNegotiation(Long id) {
        QuotationNegotiationHead entity = repository.findById(id).orElseThrow();
        if ("AGREED".equalsIgnoreCase(entity.getStatus().getName()) || "CLOSED".equalsIgnoreCase(entity.getStatus().getName())) {
            throw new BusinessException("Cannot delete closed or agreed negotiations");
        }
        repository.delete(entity);
    }
    
    private void addHistory(QuotationNegotiationHead entity, String action, String remarks, String userId) {
        QuotationNegotiationHistory history = new QuotationNegotiationHistory();
        history.setNegotiationHead(entity);
        history.setActionDate(new Date());
        history.setActionType(action);
        history.setRemarks(remarks);
        history.setUserId(userId);
        history.setCreatedBy(userId);
        history.setCreatedDate(new Date());
        historyRepository.save(history);
    }

    private QuoteNegotiationHeadDTO mapToDTO(QuotationNegotiationHead entity) {
        QuoteNegotiationHeadDTO dto = new QuoteNegotiationHeadDTO();
        dto.setId(entity.getId());
        dto.setNegotiationNo(entity.getNegotiationNo());
        dto.setNegotiationRound(entity.getNegotiationRound());
        dto.setNegotiationDate(entity.getNegotiationDate());
        
        dto.setQuotationId(entity.getQuotationHead().getId());
        dto.setQuotationNo(entity.getQuotationHead().getQuotationNo());
        
        dto.setRfqId(entity.getRfqHead().getId());
        dto.setRfqNo(entity.getRfqHead().getRfqNo());
        
        dto.setSupplierId(entity.getSupplier().getId());
        dto.setSupplierName(entity.getSupplier().getLedgerName());
        
        dto.setBuyerId(entity.getBuyer().getId());
        dto.setBuyerName(entity.getBuyer().getEmployeeName());
        
        dto.setDivisionId(entity.getDivision().getId());
        
        dto.setOriginalTotal(entity.getOriginalTotal());
        dto.setNegotiatedTotal(entity.getNegotiatedTotal());
        dto.setTotalSavings(entity.getTotalSavings());
        
        dto.setOriginalDeliveryTerms(entity.getOriginalDeliveryTerms());
        dto.setNegotiatedDeliveryTerms(entity.getNegotiatedDeliveryTerms());
        dto.setOriginalPaymentTerms(entity.getOriginalPaymentTerms());
        dto.setNegotiatedPaymentTerms(entity.getNegotiatedPaymentTerms());
        dto.setOriginalTransportMode(entity.getOriginalTransportMode());
        dto.setNegotiatedTransportMode(entity.getNegotiatedTransportMode());
        
        dto.setNegotiationRemarks(entity.getNegotiationRemarks());
        dto.setSupplierRemarks(entity.getSupplierRemarks());
        
        dto.setStatusId(entity.getStatus().getId());
        dto.setStatusName(entity.getStatus().getName());
        
        List<QuoteNegotiationTransDTO> transDTOs = new ArrayList<>();
        if (entity.getTransactions() != null) {
            for (QuotationNegotiationTrans t : entity.getTransactions()) {
                QuoteNegotiationTransDTO td = new QuoteNegotiationTransDTO();
                td.setId(t.getId());
                td.setNegotiationHeadId(t.getNegotiationHead().getId());
                td.setQuotationDetailId(t.getQuotationDetail().getId());
                td.setItemId(t.getItem().getId());
                td.setItemCode(t.getItem().getItemCode());
                td.setItemName(t.getItem().getItemName());
                td.setQty(t.getQty());
                td.setOriginalPrice(t.getOriginalPrice());
                td.setNegotiatedPrice(t.getNegotiatedPrice());
                td.setSavings(t.getSavings());
                td.setOriginalDeliveryDays(t.getOriginalDeliveryDays());
                td.setNegotiatedDeliveryDays(t.getNegotiatedDeliveryDays());
                td.setOriginalWarranty(t.getOriginalWarranty());
                td.setNegotiatedWarranty(t.getNegotiatedWarranty());
                td.setRemarks(t.getRemarks());
                transDTOs.add(td);
            }
        }
        dto.setTransactions(transDTOs);
        
        List<QuoteNegotiationHistoryDTO> history = historyRepository.findByNegotiationHeadIdOrderByActionDateDesc(entity.getId())
            .stream().map(h -> {
                QuoteNegotiationHistoryDTO hdto = new QuoteNegotiationHistoryDTO();
                hdto.setId(h.getId());
                hdto.setNegotiationId(h.getNegotiationHead().getId());
                hdto.setActionDate(h.getActionDate());
                hdto.setActionType(h.getActionType());
                hdto.setUserId(h.getUserId());
                hdto.setRemarks(h.getRemarks());
                return hdto;
            }).collect(Collectors.toList());
            
        dto.setHistory(history);
        
        return dto;
    }

    private String generateNegotiationNo() {
        String query = "SELECT ISNULL(MAX(CAST(SUBSTRING(NEGOTIATION_NO, 4, LEN(NEGOTIATION_NO)) AS INT)), 0) + 1 FROM PP_QUOTATION_NEGOTIATION_HEAD WHERE NEGOTIATION_NO LIKE 'QN-%'";
        Integer nextVal = (Integer) entityManager.createNativeQuery(query).getSingleResult();
        return "QN-" + String.format("%06d", nextVal);
    }
    
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusByName(String name) {
        String q = "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = :name";
        try {
            Long id = ((Number) entityManager.createNativeQuery(q).setParameter("name", name.toUpperCase()).getSingleResult()).longValue();
            return entityManager.find(com.autonoma.erp.modules.platform.common.entity.StatusMaster.class, id);
        } catch (Exception e) {
            // Create if missing
            com.autonoma.erp.modules.platform.common.entity.StatusMaster status = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
            status.setName(name);
            entityManager.persist(status);
            return status;
        }
    }
    
    private BigDecimal calculateQuotationTotal(QuotationHead head) {
        if (head.getDetails() == null || head.getDetails().isEmpty()) return BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (QuotationDetail d : head.getDetails()) {
            if (d.getTotalAmount() != null) {
                total = total.add(d.getTotalAmount());
            }
        }
        return total;
    }
}
