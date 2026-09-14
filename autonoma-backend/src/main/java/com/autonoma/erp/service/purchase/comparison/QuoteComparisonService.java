package com.autonoma.erp.service.purchase.comparison;

import com.autonoma.erp.dto.purchase.comparison.QuoteComparisonDTO;
import com.autonoma.erp.model.QuoteComparisonHead;
import com.autonoma.erp.repository.QuoteComparisonHeadRepository;
import com.autonoma.erp.repository.RfqHeadRepository;
import com.autonoma.erp.model.RfqHead;
import lombok.RequiredArgsConstructor;
import com.autonoma.erp.service.purchase.ProcurementQuotationResolver;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuoteComparisonService {

    private final QuoteComparisonHeadRepository headRepository;
    private final RfqHeadRepository rfqHeadRepository;
    private final jakarta.persistence.EntityManager entityManager;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final ProcurementQuotationResolver quotationResolver;
    private final com.autonoma.erp.repository.QuotationHeadRepository quotationHeadRepository;
    private final com.autonoma.erp.repository.QuoteComparisonTransRepository transRepository;

    public List<QuoteComparisonDTO> getAllComparisons(Long divisionId) {
        String sql = "SELECT c.ID, c.COMPARISON_NO, c.VERSION, c.COMPARISON_DATE, " +
                "c.SELECTION_TYPE, c.OVERALL_SELECTED_SUPPLIER_ID, " +
                "c.STATUS_ID, sm.NAME AS STATUS_NAME, " +
                "r.ID AS RFQ_ID, r.RFQ_NO, " +
                "pr.ID AS PR_ID, pr.PR_NO, " +
                "s.LEDGER_NAME AS SUPPLIER_NAME " +
                "FROM PP_QUOTE_COMPARISON_HEAD c " +
                "LEFT JOIN PP_RFQ_HEAD r ON c.RFQ_ID = r.ID " +
                "LEFT JOIN PP_PURCHASE_REQUEST_HEAD pr ON r.PR_REF_ID = pr.ID " +
                "LEFT JOIN AD_STATUS_MASTER sm ON c.STATUS_ID = sm.ID " +
                "LEFT JOIN FA_ACCOUNT_LEDGER s ON c.OVERALL_SELECTED_SUPPLIER_ID = s.ID " +
                "WHERE c.DIVISION = ? ORDER BY c.ID DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            QuoteComparisonDTO dto = new QuoteComparisonDTO();
            dto.setId(rs.getLong("ID"));
            dto.setComparisonNo(rs.getString("COMPARISON_NO"));
            dto.setVersion(rs.getInt("VERSION"));
            dto.setComparisonDate(rs.getDate("COMPARISON_DATE"));
            
            String selectionType = rs.getString("SELECTION_TYPE");
            dto.setSelectionType(selectionType);
            
            dto.setRfqId(rs.getObject("RFQ_ID") != null ? rs.getLong("RFQ_ID") : null);
            dto.setRfqNo(rs.getString("RFQ_NO"));
            
            dto.setPrId(rs.getObject("PR_ID") != null ? rs.getLong("PR_ID") : null);
            dto.setPrNo(rs.getString("PR_NO"));
            
            dto.setStatusId(rs.getObject("STATUS_ID") != null ? rs.getLong("STATUS_ID") : null);
            String statusName = rs.getString("STATUS_NAME");
            dto.setStatusName(statusName != null ? statusName.trim().toUpperCase() : null);
            
            try {
                // Fetch Awarded Suppliers
                String awardedSuppliers = null;
                if ("OVERALL".equalsIgnoreCase(selectionType)) {
                    awardedSuppliers = rs.getString("SUPPLIER_NAME");
                } else if ("ITEM_WISE".equalsIgnoreCase(selectionType)) {
                    List<String> suppliers = jdbcTemplate.queryForList(
                            "SELECT DISTINCT l.LEDGER_NAME FROM PP_QUOTE_COMPARISON_TRANS t " +
                                    "JOIN FA_ACCOUNT_LEDGER l ON t.SELECTED_SUPPLIER_ID = l.ID " +
                                    "WHERE t.COMPARISON_HEAD_ID = ?",
                            String.class, dto.getId());
                    if (!suppliers.isEmpty()) {
                        awardedSuppliers = String.join(", ", suppliers);
                    }
                }
                dto.setAwardedSuppliers(awardedSuppliers != null ? awardedSuppliers : "-");

                // Fetch PO Numbers
                List<String> pos = jdbcTemplate.queryForList(
                        "SELECT DISTINCT h.PO_NO FROM PP_PURCHASE_ORDER_SOURCE s " +
                                "JOIN PP_PURCHASE_ORDER_HEAD h ON s.PO_HEAD_ID = h.ID " +
                                "WHERE s.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND s.SOURCE_HEAD_ID = ? AND h.ACTIVE_STATUS = 1",
                        String.class, dto.getId());

                if (!pos.isEmpty()) {
                    dto.setPoNumbers(String.join(", ", pos));
                    dto.setTrackCycle("PO Generated");
                } else {
                    dto.setPoNumbers("-");
                    if ("APPROVED".equalsIgnoreCase(dto.getStatusName())) {
                        dto.setTrackCycle("Pending PO");
                    } else if ("LOCKED".equalsIgnoreCase(dto.getStatusName())) {
                        dto.setTrackCycle("Locked for Approval");
                    } else if ("DRAFT".equalsIgnoreCase(dto.getStatusName())) {
                        dto.setTrackCycle("Draft Stage");
                    } else {
                        dto.setTrackCycle("In Progress");
                    }
                }
            } catch (Exception e) {
                dto.setAwardedSuppliers("-");
                dto.setPoNumbers("-");
                dto.setTrackCycle("Error Fetching Status");
            }

            return dto;
        }, divisionId);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public QuoteComparisonDTO getComparisonById(Long id) {
        QuoteComparisonHead head = headRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comparison not found"));

        QuoteComparisonDTO dto = new QuoteComparisonDTO();
        dto.setId(head.getId());
        dto.setComparisonNo(head.getComparisonNo());
        dto.setVersion(head.getVersion());
        dto.setComparisonDate(head.getComparisonDate());
        dto.setSelectionType(head.getSelectionType() != null ? head.getSelectionType().name() : null);
        dto.setRfqId(head.getRfqId());
        dto.setStatusId(head.getStatusId());
        if (head.getStatusId() != null) {
            try {
                String statusName = (String) entityManager
                        .createNativeQuery("SELECT NAME FROM AD_STATUS_MASTER WHERE ID = :statusId")
                        .setParameter("statusId", head.getStatusId())
                        .getSingleResult();
                dto.setStatusName(statusName != null ? statusName.trim().toUpperCase() : null);
            } catch (Exception e) {
            }
        }

        if (head.getRfqId() != null) {
            rfqHeadRepository.findById(head.getRfqId()).ifPresent(rfq -> {
                dto.setRfqNo(rfq.getRfqNo());
                if (rfq.getPurchaseRequestHead() != null) {
                    dto.setPrNo(rfq.getPurchaseRequestHead().getPrNo());
                    dto.setPrDate(rfq.getPurchaseRequestHead().getPrDate());
                }
            });

            // Fetch matrix items using the ProcurementQuotationResolver
            List<com.autonoma.erp.dto.purchase.comparison.QuoteComparisonMatrixDTO> matrixItems = quotationResolver
                    .resolveEffectiveQuotationsByRfq(head.getRfqId());

            dto.setMatrixItems(matrixItems);
        }
        return dto;
    }

    @org.springframework.transaction.annotation.Transactional
    public QuoteComparisonDTO createComparison(Long rfqId, String userId) {
        List<QuoteComparisonHead> existingComparisons = headRepository.findByRfqId(rfqId);
        if (existingComparisons != null && !existingComparisons.isEmpty()) {
            QuoteComparisonHead existing = existingComparisons.get(existingComparisons.size() - 1);
            QuoteComparisonDTO dto = new QuoteComparisonDTO();
            dto.setId(existing.getId());
            dto.setComparisonNo(existing.getComparisonNo());
            dto.setComparisonDate(existing.getComparisonDate());
            dto.setRfqId(rfqId);
            rfqHeadRepository.findById(rfqId).ifPresent(rfq -> dto.setRfqNo(rfq.getRfqNo()));
            return dto;
        }

        RfqHead rfq = rfqHeadRepository.findById(rfqId).orElseThrow(() -> new RuntimeException("RFQ not found"));

        QuoteComparisonHead head = new QuoteComparisonHead();
        head.setComparisonNo(generateComparisonNo());
        head.setVersion(1);
        head.setComparisonDate(new java.util.Date());
        head.setRfqId(rfqId);
        head.setDivision(rfq.getDivision());

        // Fetch status id for 'DRAFT'
        Long draftStatusId = getStatusIdByName("DRAFT");
        head.setStatusId(draftStatusId);

        head.setCreatedBy(userId);
        head.setCreatedDate(new java.util.Date());
        head.setActiveStatus(1);

        headRepository.save(head);

        QuoteComparisonDTO dto = new QuoteComparisonDTO();
        dto.setId(head.getId());
        dto.setComparisonNo(head.getComparisonNo());
        dto.setComparisonDate(head.getComparisonDate());
        dto.setRfqId(rfqId);
        dto.setRfqNo(rfq.getRfqNo());
        return dto;
    }

    @org.springframework.transaction.annotation.Transactional
    public QuoteComparisonDTO lockComparison(Long id, String userId, QuoteComparisonDTO payload) {
        QuoteComparisonHead head = headRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comparison not found"));

        if (payload != null) {
            if (payload.getSelectionType() != null) {
                try {
                    head.setSelectionType(com.autonoma.erp.enums.SelectionType.valueOf(payload.getSelectionType()));
                } catch (Exception e) {
                }
            }
            head.setOverallRecommendedSupplierId(payload.getOverallRecommendedSupplierId());
            head.setOverallSelectedSupplierId(payload.getOverallSelectedSupplierId());
            head.setOverrideReason(payload.getOverrideReason());
            if (payload.getOverallRecommendedSupplierId() != null && payload.getOverallSelectedSupplierId() != null) {
                head.setIsManualOverride(
                        !payload.getOverallRecommendedSupplierId().equals(payload.getOverallSelectedSupplierId()));
                if (head.getIsManualOverride()) {
                    head.setOverrideBy(userId);
                    head.setOverrideDate(new java.util.Date());
                }
            }
        }

        Long lockedStatusId = getStatusIdByName("LOCKED");
        head.setStatusId(lockedStatusId);
        head.setLockedBy(userId);
        head.setLockedDate(new java.util.Date());
        head.setSnapshotDate(new java.util.Date());
        headRepository.save(head);

        return getComparisonById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public QuoteComparisonDTO verifyComparison(Long id, String userId, String remarks) {
        QuoteComparisonHead head = headRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comparison not found"));

        Long verifiedStatusId = getStatusIdByName("VERIFIED");

        head.setStatusId(verifiedStatusId);
        head.setApprovalRemarks(remarks);
        head.setUpdatedBy(userId);
        head.setUpdatedDate(new java.util.Date());
        headRepository.save(head);

        // Update the commercial status of underlying quotations
        try {
            Long approvedStatusId = getStatusIdByName("APPROVED");
            Long rejectedStatusId = getStatusIdByName("REJECTED");

            if (head.getSelectionType() != null
                    && head.getSelectionType() == com.autonoma.erp.enums.SelectionType.ENTIRE_RFQ
                    && head.getOverallSelectedSupplierId() != null) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster approvedStatus = entityManager
                        .find(com.autonoma.erp.modules.platform.common.entity.StatusMaster.class, approvedStatusId);
                com.autonoma.erp.modules.platform.common.entity.StatusMaster rejectedStatus = entityManager
                        .find(com.autonoma.erp.modules.platform.common.entity.StatusMaster.class, rejectedStatusId);

                List<com.autonoma.erp.model.QuotationHead> quotes = quotationHeadRepository
                        .findByRfqHeadId(head.getRfqId());
                for (com.autonoma.erp.model.QuotationHead quote : quotes) {
                    if (quote.getSupplier() != null
                            && quote.getSupplier().getId().equals(head.getOverallSelectedSupplierId())) {
                        quote.setStatus(approvedStatus);
                    } else {
                        quote.setStatus(rejectedStatus);
                    }
                    quotationHeadRepository.save(quote);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return getComparisonById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteComparison(Long id) {
        QuoteComparisonHead head = headRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comparison not found"));

        Long verifiedStatusId = null;
        try {
            verifiedStatusId = getStatusIdByName("VERIFIED");
        } catch (Exception e) {
        }

        if (verifiedStatusId != null && head.getStatusId() != null && head.getStatusId().equals(verifiedStatusId)) {
            String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            boolean isSuperAdmin = false;
            try {
                Number count = (Number) entityManager.createNativeQuery(
                        "SELECT USER_LEVEL FROM AD_USER_CREDENTIAL u WHERE u.USER_ID = :uid ")
                        .setParameter("uid", currentUserId).getSingleResult();
                if (count.intValue() == 5)
                    isSuperAdmin = true;
            } catch (Exception ignored) {
            }

            if (!isSuperAdmin) {
                try {
                    Number count2 = (Number) entityManager.createNativeQuery(
                            "SELECT USER_LEVEL FROM AD_USER_CREDENTIAL u WHERE u.USER_ID = :uid ")
                            .setParameter("uid", currentUserId).getSingleResult();
                    if (count2.intValue() == 5)
                        isSuperAdmin = true;
                } catch (Exception ignored) {
                }
            }

            if (!isSuperAdmin) {
                throw new RuntimeException("Cannot delete a verified comparison. (Requires SUPER_ADMIN permission)");
            }
        }

        transRepository.deleteByComparisonHeadId(id);
        headRepository.delete(head);
    }

    private Long getStatusIdByName(String name) {
        List<?> results = entityManager
                .createNativeQuery("SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = :name")
                .setParameter("name", name.trim().toUpperCase())
                .getResultList();

        if (!results.isEmpty()) {
            return ((Number) results.get(0)).longValue();
        }

        com.autonoma.erp.modules.platform.common.entity.StatusMaster sm = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
        sm.setName(name.trim().toUpperCase());
        entityManager.persist(sm);
        entityManager.flush();
        return sm.getId();
    }

    private String generateComparisonNo() {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int year = cal.get(java.util.Calendar.YEAR);
        int month = cal.get(java.util.Calendar.MONTH); // 0-based
        if (month < 3) {
            year = year - 1;
        }
        String yy = String.valueOf(year).substring(2);
        String nextYy = String.valueOf(year + 1).substring(2);
        String finYear = yy + nextYy;

        String prefix = "QC/" + finYear + "/";
        String searchPattern = prefix + "%";

        Object seqResult = null;
        try {
            seqResult = entityManager.createNativeQuery(
                    "SELECT TOP 1 COMPARISON_NO FROM PP_QUOTE_COMPARISON_HEAD WHERE COMPARISON_NO LIKE :pattern ORDER BY ID DESC")
                    .setParameter("pattern", searchPattern)
                    .getResultList().stream().findFirst().orElse(null);
        } catch (Exception e) {
        }

        long nextNum = 1;
        if (seqResult != null) {
            String numStr = (String) seqResult;
            if (numStr.startsWith(prefix)) {
                numStr = numStr.substring(prefix.length());
                try {
                    nextNum = Long.parseLong(numStr) + 1;
                } catch (Exception e) {
                }
            }
        }
        return prefix + String.format("%06d", nextNum);
    }
}
