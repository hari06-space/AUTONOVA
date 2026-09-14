package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.*;
import com.autonoma.erp.enums.PoSourceType;
import com.autonoma.erp.exception.BusinessException;
import com.autonoma.erp.model.*;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.repository.*;
import com.autonoma.erp.modules.sm.sales.entity.SmAdditionalCharges;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PurchaseOrderService.class);

    private final PurchaseOrderHeadRepository headRepo;
    private final PurchaseOrderTransRepository transRepo;
    private final PurchaseOrderSourceRepository sourceRepo;
    private final PurchaseOrderLogRepository logRepo;
    private final PurchaseOrderSourceResolverFacade resolverFacade;
    private final PurchaseScheduleService purchaseScheduleService;
    private final EntityManager entityManager;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.autonoma.erp.repository.admin.PrefixCredentialRepository prefixCredentialRepository;

    // ---- PREVIEW ----
    public PurchaseOrderHeadDTO previewFromSource(PurchaseOrderSourceRequestDTO request) {
        if (request != null && request.getSourceType() != null && request.getSourceDocId() != null) {
            String checkSql = "SELECT TOP 1 h.PO_NO FROM PP_PURCHASE_ORDER_SOURCE s WITH(NOLOCK) " +
                    "JOIN PP_PURCHASE_ORDER_HEAD h WITH(NOLOCK) ON s.PO_HEAD_ID = h.ID " +
                    "JOIN AD_STATUS_MASTER sm WITH(NOLOCK) ON h.STATUS_ID = sm.ID " +
                    "WHERE s.SOURCE_TYPE = :st AND s.SOURCE_HEAD_ID = :sid " +
                    "AND s.ACTIVE_STATUS = 1 AND h.ACTIVE_STATUS = 1 " +
                    "AND UPPER(TRIM(sm.NAME)) != 'CANCELLED'";
            List<?> existingPos = entityManager.createNativeQuery(checkSql)
                    .setParameter("st", request.getSourceType())
                    .setParameter("sid", request.getSourceDocId())
                    .getResultList();
            if (!existingPos.isEmpty()) {
                String existingPoNo = String.valueOf(existingPos.get(0));
                throw new BusinessException("A Purchase Order (" + existingPoNo + ") has already been generated for this " + request.getSourceType().replace("_", " ") + ".");
            }
        }
        return resolverFacade.resolve(request);
    }

    // ---- LIST ----
    public List<PurchaseOrderListDTO> getAllPos(Long divisionId) {
        String sql = "SELECT h.ID, h.PO_NO, h.PO_DATE, h.REVISION_NO, h.SOURCE_TYPE, h.CURRENCY, " +
                "h.GRAND_TOTAL, h.BILLING_ADDRESS, " +
                "v.LEDGER_NAME AS SUPPLIER_NAME, v.ID AS SUPPLIER_ID, " +
                "sm.NAME AS STATUS_NAME, sm.ID AS STATUS_ID, " +
                "src.SOURCE_DOCUMENT_NO AS SOURCE_DOC_NO, src.SOURCE_HEAD_ID AS SOURCE_HEAD_ID, " +
                "CASE WHEN h.SOURCE_TYPE = 'QUOTATION_COMPARISON' THEN c.COMPARISON_NO ELSE NULL END AS COMP_NO, " +
                "CASE WHEN h.SOURCE_TYPE = 'QUOTATION_COMPARISON' THEN c.ID ELSE NULL END AS COMP_ID, " +
                "CASE WHEN h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' THEN q.QUOTATION_NO ELSE NULL END AS QUOTE_NO, " +
                "CASE WHEN h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' THEN q.ID ELSE NULL END AS QUOTE_ID, " +
                "CASE WHEN h.SOURCE_TYPE = 'PURCHASE_REQUEST' THEN pr_direct.PR_NO " +
                     "WHEN h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' THEN pr_q.PR_NO " +
                     "WHEN h.SOURCE_TYPE = 'QUOTATION_COMPARISON' THEN pr_c.PR_NO ELSE NULL END AS PR_NO, " +
                "CASE WHEN h.SOURCE_TYPE = 'PURCHASE_REQUEST' THEN pr_direct.ID " +
                     "WHEN h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' THEN pr_q.ID " +
                     "WHEN h.SOURCE_TYPE = 'QUOTATION_COMPARISON' THEN pr_c.ID ELSE NULL END AS PR_ID, " +
                "CASE WHEN h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' THEN r_q.RFQ_NO " +
                     "WHEN h.SOURCE_TYPE = 'QUOTATION_COMPARISON' THEN r_c.RFQ_NO ELSE NULL END AS RFQ_NO, " +
                "CASE WHEN h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' THEN r_q.ID " +
                     "WHEN h.SOURCE_TYPE = 'QUOTATION_COMPARISON' THEN r_c.ID ELSE NULL END AS RFQ_ID " +
                "FROM PP_PURCHASE_ORDER_HEAD h WITH(NOLOCK) " +
                "JOIN FA_ACCOUNT_LEDGER v WITH(NOLOCK) ON h.SUPPLIER_ID = v.ID " +
                "JOIN AD_STATUS_MASTER sm WITH(NOLOCK) ON h.STATUS_ID = sm.ID " +
                "OUTER APPLY (SELECT TOP 1 SOURCE_HEAD_ID, SOURCE_DOCUMENT_NO FROM PP_PURCHASE_ORDER_SOURCE s WITH(NOLOCK) WHERE s.PO_HEAD_ID = h.ID) src " +
                "LEFT JOIN PP_QUOTE_COMPARISON_HEAD c WITH(NOLOCK) ON h.SOURCE_TYPE = 'QUOTATION_COMPARISON' AND c.ID = src.SOURCE_HEAD_ID " +
                "LEFT JOIN PP_QUOTATION_HEAD q WITH(NOLOCK) ON h.SOURCE_TYPE = 'SUPPLIER_QUOTATION' AND q.ID = src.SOURCE_HEAD_ID " +
                "LEFT JOIN PP_PURCHASE_REQUEST_HEAD pr_direct WITH(NOLOCK) ON h.SOURCE_TYPE = 'PURCHASE_REQUEST' AND pr_direct.ID = src.SOURCE_HEAD_ID " +
                "LEFT JOIN PP_RFQ_HEAD r_q WITH(NOLOCK) ON q.RFQ_REF_ID = r_q.ID " +
                "LEFT JOIN PP_PURCHASE_REQUEST_HEAD pr_q WITH(NOLOCK) ON r_q.PR_REF_ID = pr_q.ID " +
                "LEFT JOIN PP_RFQ_HEAD r_c WITH(NOLOCK) ON c.RFQ_ID = r_c.ID " +
                "LEFT JOIN PP_PURCHASE_REQUEST_HEAD pr_c WITH(NOLOCK) ON r_c.PR_REF_ID = pr_c.ID " +
                "WHERE h.DIVISION = ? AND h.ACTIVE_STATUS = 1 " +
                "ORDER BY h.ID DESC";

        List<PurchaseOrderListDTO> list = new ArrayList<>();
        try {
            list = jdbcTemplate.query(sql, (rs, n) -> {
                PurchaseOrderListDTO dto = new PurchaseOrderListDTO();
                dto.setId(rs.getLong("ID"));
                dto.setPoNo(rs.getString("PO_NO"));
                dto.setPoDate(rs.getDate("PO_DATE"));
                dto.setRevisionNo(rs.getInt("REVISION_NO"));
                dto.setSourceType(rs.getString("SOURCE_TYPE"));
                dto.setSupplierId(rs.getLong("SUPPLIER_ID"));
                dto.setSupplierName(rs.getString("SUPPLIER_NAME"));
                dto.setCurrency(rs.getString("CURRENCY"));
                dto.setGrandTotal(rs.getBigDecimal("GRAND_TOTAL"));
                dto.setStatusId(rs.getLong("STATUS_ID"));
                dto.setStatusName(rs.getString("STATUS_NAME"));
                dto.setPrNo(rs.getString("PR_NO"));
                dto.setPrId(rs.getObject("PR_ID") != null ? rs.getLong("PR_ID") : null);
                dto.setRfqNo(rs.getString("RFQ_NO"));
                dto.setRfqId(rs.getObject("RFQ_ID") != null ? rs.getLong("RFQ_ID") : null);
                dto.setQuoteNo(rs.getString("QUOTE_NO"));
                dto.setQuoteId(rs.getObject("QUOTE_ID") != null ? rs.getLong("QUOTE_ID") : null);
                dto.setComparisonNo(rs.getString("COMP_NO"));
                dto.setComparisonId(rs.getObject("COMP_ID") != null ? rs.getLong("COMP_ID") : null);
                dto.setSourceDocumentNo(rs.getString("SOURCE_DOC_NO"));
                dto.setDivisionId(divisionId);
                return dto;
            }, divisionId);
        } catch (Exception e) {
            log.warn("Fallback: using JPA for PO list. Error: {}", e.getMessage());
            // JPA fallback
            List<PurchaseOrderHead> heads = headRepo.findByDivisionId(divisionId);
            return heads.stream().map(h -> {
                PurchaseOrderListDTO d = new PurchaseOrderListDTO();
                d.setId(h.getId());
                d.setPoNo(h.getPoNo());
                d.setPoDate(h.getPoDate());
                d.setRevisionNo(h.getRevisionNo());
                d.setSourceType(h.getSourceType() != null ? h.getSourceType().name() : null);
                if (h.getSupplier() != null) {
                    d.setSupplierId(h.getSupplier().getId());
                    d.setSupplierName(h.getSupplier().getLedgerName());
                }
                if (h.getStatus() != null) {
                    d.setStatusId(h.getStatus().getId());
                    d.setStatusName(h.getStatus().getName());
                }
                d.setCurrency(h.getCurrency());
                d.setGrandTotal(h.getGrandTotal());
                d.setDivisionId(divisionId);
                return d;
            }).collect(Collectors.toList());
        }
        return list;
    }

    // ---- GET BY ID ----
    public PurchaseOrderHeadDTO getPoById(Long id) {
        PurchaseOrderHead head = headRepo.findByIdWithDetails(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));

        PurchaseOrderHeadDTO dto = mapHeadToDTO(head);
        dto.setItems(head.getItems() != null ? head.getItems().stream()
                .filter(t -> t.getActiveStatus() == 1)
                .map(this::mapTransToDTO).collect(Collectors.toList()) : new ArrayList<>());

        // Audit log
        List<PurchaseOrderLog> logs = logRepo.findByPoHeadIdOrderByEventDateDesc(id);
        dto.setAuditLog(logs.stream().map(l -> {
            PurchaseOrderLogDTO ld = new PurchaseOrderLogDTO();
            ld.setId(l.getId());
            ld.setPoHeadId(l.getPoHeadId());
            ld.setEventType(l.getEventType());
            ld.setEventDescription(l.getEventDescription());
            ld.setPerformedBy(l.getPerformedBy());
            ld.setEventDate(l.getEventDate());
            ld.setRemarks(l.getRemarks());
            return ld;
        }).collect(Collectors.toList()));

        return dto;
    }

    // ---- CREATE ----
    @Transactional
    public PurchaseOrderHeadDTO createPo(PurchaseOrderHeadDTO dto, String userId) {
        // Generate PO number
        String poNo = generatePoNumber(dto.getDivisionId());

        // Resolve status
        StatusMaster draftStatus = getStatus("DRAFT");

        PurchaseOrderHead head = new PurchaseOrderHead();
        head.setPoNo(poNo);
        head.setPoDate(dto.getPoDate() != null ? dto.getPoDate() : new Date());
        head.setRevisionNo(0);
        head.setSourceType(dto.getSourceType() != null ? PoSourceType.valueOf(dto.getSourceType()) : PoSourceType.DIRECT);
        head.setPoType(dto.getPoType() != null ? dto.getPoType() : "ONETIME");
        head.setExpectedDeliveryDate(dto.getExpectedDeliveryDate());
        head.setTransportScope(dto.getTransportScope());
        head.setSupplierReferenceNo(dto.getSupplierReferenceNo());
        head.setSupplierReferenceDate(dto.getSupplierReferenceDate());
        head.setGstType(dto.getGstType() != null ? dto.getGstType() : "INTRA_STATE");
        head.setStatus(draftStatus);
        head.setDivision(entityManager.getReference(Division.class, dto.getDivisionId()));
        head.setSupplier(entityManager.getReference(AccountLedger.class, dto.getSupplierId()));
        head.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "INR");
        head.setExchangeRate(dto.getExchangeRate() != null ? dto.getExchangeRate() : BigDecimal.ONE);
        head.setPaymentTerms(dto.getPaymentTerms());
        head.setDeliveryTerms(dto.getDeliveryTerms());
        head.setShippingTerms(dto.getShippingTerms());
        head.setWarrantyTerms(dto.getWarrantyTerms());
        head.setBillingAddress(dto.getBillingAddress());
        head.setDeliveryAddress(dto.getDeliveryAddress());
        head.setBuyerId(dto.getBuyerId());
        head.setDepartmentId(dto.getDepartmentId());
        head.setRemarks(dto.getRemarks());
        head.setInternalNotes(dto.getInternalNotes());
        head.setActiveStatus(1);

        // Pricing
        head.setFreightAmount(nvl(dto.getFreightAmount()));
        head.setPackingAmount(nvl(dto.getPackingAmount()));
        head.setInsuranceAmount(nvl(dto.getInsuranceAmount()));
        head.setOtherCharges(nvl(dto.getOtherCharges()));
        head.setDiscountAmount(nvl(dto.getDiscountAmount()));
        head.setRoundOff(nvl(dto.getRoundOff()));

        headRepo.save(head);

        // Save items
        List<PurchaseOrderTrans> transItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        if (dto.getItems() != null) {
            int lineNo = 1;
            for (PurchaseOrderTransDTO itemDto : dto.getItems()) {
                PurchaseOrderTrans trans = new PurchaseOrderTrans();
                trans.setPurchaseOrderHead(head);
                trans.setLineNo(lineNo++);
                trans.setItem(entityManager.getReference(ProductMaster.class, itemDto.getItemId()));
                trans.setDescription(itemDto.getDescription());
                trans.setHsnCode(itemDto.getHsnCode());
                trans.setUom(itemDto.getUom());
                trans.setBrand(itemDto.getBrand());
                trans.setOrigin(itemDto.getOrigin());
                trans.setQty(nvl(itemDto.getQty()));
                trans.setUnitPrice(nvl(itemDto.getUnitPrice()));
                trans.setDiscountPercent(nvl(itemDto.getDiscountPercent()));
                
                BigDecimal cgstPer = nvl(itemDto.getCgstPer());
                BigDecimal sgstPer = nvl(itemDto.getSgstPer());
                BigDecimal igstPer = nvl(itemDto.getIgstPer());
                BigDecimal taxPer = itemDto.getTaxPercent();
                if (taxPer == null || taxPer.compareTo(BigDecimal.ZERO) == 0) {
                    taxPer = "INTER_STATE".equalsIgnoreCase(dto.getGstType()) ? igstPer : cgstPer.add(sgstPer);
                }
                trans.setTaxPercent(taxPer);
                trans.setCgstPer(cgstPer);
                trans.setSgstPer(sgstPer);
                trans.setIgstPer(igstPer);

                // Calculate line amounts
                BigDecimal lineAmt = nvl(itemDto.getQty()).multiply(nvl(itemDto.getUnitPrice()));
                BigDecimal discAmt = lineAmt.multiply(nvl(itemDto.getDiscountPercent())).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal afterDisc = lineAmt.subtract(discAmt);
                BigDecimal taxAmt = afterDisc.multiply(taxPer).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);

                if ("INTER_STATE".equalsIgnoreCase(dto.getGstType())) {
                    trans.setIgstValue(taxAmt);
                    trans.setCgstValue(BigDecimal.ZERO);
                    trans.setSgstValue(BigDecimal.ZERO);
                } else {
                    BigDecimal half = taxAmt.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
                    trans.setCgstValue(half);
                    trans.setSgstValue(taxAmt.subtract(half));
                    trans.setIgstValue(BigDecimal.ZERO);
                }

                trans.setTaxAmount(taxAmt);
                trans.setNetAmount(afterDisc.add(taxAmt));
                trans.setWarrantyTerms(itemDto.getWarrantyTerms());
                trans.setRemarks(itemDto.getRemarks());
                trans.setExpectedDeliveryDate(itemDto.getExpectedDeliveryDate());
                trans.setDueDate(itemDto.getDueDate());
                trans.setWarehouse(itemDto.getWarehouse());
                trans.setProject(itemDto.getProject());
                trans.setCostCenter(itemDto.getCostCenter());
                trans.setPendingQty(nvl(itemDto.getQty()));
                trans.setReceivedQty(BigDecimal.ZERO);
                trans.setRejectedQty(BigDecimal.ZERO);
                trans.setReturnedQty(BigDecimal.ZERO);
                trans.setInvoicedQty(BigDecimal.ZERO);
                trans.setActiveStatus(1);

                subtotal = subtotal.add(afterDisc);
                totalTax = totalTax.add(taxAmt);
                transItems.add(trans);
            }
        }

        // Save additional charges
        List<PurchaseOrderCharge> chargeList = new ArrayList<>();
        BigDecimal additionalChargesTotal = BigDecimal.ZERO;
        BigDecimal additionalChargesTax = BigDecimal.ZERO;
        if (dto.getAdditionalCharges() != null) {
            for (PurchaseOrderChargeDTO cDto : dto.getAdditionalCharges()) {
                PurchaseOrderCharge pc = new PurchaseOrderCharge();
                pc.setPurchaseOrderHead(head);
                pc.setChargeMaster(entityManager.getReference(SmAdditionalCharges.class, cDto.getChargesId()));
                pc.setAmount(nvl(cDto.getAmount()));
                pc.setTaxApplicable(Boolean.TRUE.equals(cDto.getTaxApplicable()));
                pc.setCgstPer(nvl(cDto.getCgstPer()));
                pc.setCgstValue(nvl(cDto.getCgstValue()));
                pc.setSgstPer(nvl(cDto.getSgstPer()));
                pc.setSgstValue(nvl(cDto.getSgstValue()));
                pc.setIgstPer(nvl(cDto.getIgstPer()));
                pc.setIgstValue(nvl(cDto.getIgstValue()));
                pc.setTotalValue(nvl(cDto.getTotalValue()));
                pc.setActiveStatus(1);
                pc.setCreatedBy(userId);
                pc.setCreatedDate(new Date());
                chargeList.add(pc);

                additionalChargesTotal = additionalChargesTotal.add(nvl(cDto.getTotalValue()));
                additionalChargesTax = additionalChargesTax.add(nvl(cDto.getCgstValue())).add(nvl(cDto.getSgstValue())).add(nvl(cDto.getIgstValue()));
            }
        }
        head.setAdditionalCharges(chargeList);

        head.setSubtotal(subtotal);
        head.setTaxAmount(totalTax.add(additionalChargesTax));
        BigDecimal grandTotal = subtotal
                .add(totalTax)
                .add(additionalChargesTotal)
                .add(nvl(dto.getFreightAmount()))
                .add(nvl(dto.getPackingAmount()))
                .add(nvl(dto.getInsuranceAmount()))
                .add(nvl(dto.getOtherCharges()))
                .subtract(nvl(dto.getDiscountAmount()))
                .add(nvl(dto.getRoundOff()));
        head.setGrandTotal(grandTotal);
        head.setItems(transItems);

        headRepo.save(head);

        // Save sources
        if (dto.getSources() != null && !dto.getSources().isEmpty()) {
            for (PurchaseOrderSourceDTO srcDto : dto.getSources()) {
                PurchaseOrderSource src = new PurchaseOrderSource();
                src.setPurchaseOrderHead(head);
                src.setSourceType(PoSourceType.valueOf(srcDto.getSourceType()));
                src.setSourceHeadId(srcDto.getSourceHeadId());
                src.setSourceTransId(srcDto.getSourceTransId());
                src.setSourceDocumentNo(srcDto.getSourceDocumentNo());
                src.setSourceLineNo(srcDto.getSourceLineNo());
                src.setSourceQty(srcDto.getSourceQty());
                src.setOrderedQty(srcDto.getOrderedQty());
                src.setBalanceQty(srcDto.getBalanceQty());
                src.setConvertedQty(nvl(srcDto.getConvertedQty()));
                src.setIsFullyConverted(Boolean.TRUE.equals(srcDto.getIsFullyConverted()));
                src.setActiveStatus(1);
                src.setCreatedBy(userId);
                src.setCreatedDate(new Date());
                sourceRepo.save(src);
            }
        } else if (dto.getSourceDocumentNo() != null && dto.getSourceType() != null) {
            PurchaseOrderSource src = new PurchaseOrderSource();
            src.setPurchaseOrderHead(head);
            try { src.setSourceType(PoSourceType.valueOf(dto.getSourceType())); } catch (Exception e) {}
            src.setSourceDocumentNo(dto.getSourceDocumentNo());
            src.setActiveStatus(1);
            src.setCreatedBy(userId);
            src.setCreatedDate(new Date());
            sourceRepo.save(src);
        }

        // Audit log
        auditLog(head.getId(), "CREATED", "Purchase Order created: " + poNo, null, poNo, userId);

        PurchaseOrderHeadDTO result = mapHeadToDTO(head);
        result.setItems(transItems.stream().map(this::mapTransToDTO).collect(Collectors.toList()));



        return result;
    }

    // ---- UPDATE ----
    @Transactional
    public PurchaseOrderHeadDTO updatePo(Long id, PurchaseOrderHeadDTO dto, String userId) {
        PurchaseOrderHead head = headRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));

        String statusName = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "DRAFT";
        if ("APPROVED".equals(statusName) || "RELEASED".equals(statusName)) {
            throw new BusinessException("Cannot edit a PO in status: " + statusName + ". Please create a revision.");
        }

        head.setPoDate(dto.getPoDate() != null ? dto.getPoDate() : head.getPoDate());
        head.setPoType(dto.getPoType() != null ? dto.getPoType() : head.getPoType());
        head.setExpectedDeliveryDate(dto.getExpectedDeliveryDate());
        head.setTransportScope(dto.getTransportScope());
        head.setSupplierReferenceNo(dto.getSupplierReferenceNo());
        head.setSupplierReferenceDate(dto.getSupplierReferenceDate());
        if (dto.getGstType() != null) head.setGstType(dto.getGstType());
        if (dto.getSupplierId() != null) head.setSupplier(entityManager.getReference(AccountLedger.class, dto.getSupplierId()));
        head.setPaymentTerms(dto.getPaymentTerms());
        head.setDeliveryTerms(dto.getDeliveryTerms());
        head.setShippingTerms(dto.getShippingTerms());
        head.setWarrantyTerms(dto.getWarrantyTerms());
        head.setBillingAddress(dto.getBillingAddress());
        head.setDeliveryAddress(dto.getDeliveryAddress());
        head.setRemarks(dto.getRemarks());
        head.setInternalNotes(dto.getInternalNotes());
        head.setFreightAmount(nvl(dto.getFreightAmount()));
        head.setPackingAmount(nvl(dto.getPackingAmount()));
        head.setInsuranceAmount(nvl(dto.getInsuranceAmount()));
        head.setOtherCharges(nvl(dto.getOtherCharges()));
        head.setDiscountAmount(nvl(dto.getDiscountAmount()));
        head.setRoundOff(nvl(dto.getRoundOff()));

        // Recalculate
        if (dto.getItems() != null) {
            head.getItems().clear();
            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            int lineNo = 1;
            for (PurchaseOrderTransDTO itemDto : dto.getItems()) {
                PurchaseOrderTrans t = new PurchaseOrderTrans();
                t.setPurchaseOrderHead(head);
                t.setLineNo(lineNo++);
                t.setItem(entityManager.getReference(ProductMaster.class, itemDto.getItemId()));
                t.setUom(itemDto.getUom());
                t.setQty(nvl(itemDto.getQty()));
                t.setUnitPrice(nvl(itemDto.getUnitPrice()));
                t.setDiscountPercent(nvl(itemDto.getDiscountPercent()));
                
                BigDecimal cgstPer = nvl(itemDto.getCgstPer());
                BigDecimal sgstPer = nvl(itemDto.getSgstPer());
                BigDecimal igstPer = nvl(itemDto.getIgstPer());
                BigDecimal taxPer = itemDto.getTaxPercent();
                if (taxPer == null || taxPer.compareTo(BigDecimal.ZERO) == 0) {
                    taxPer = "INTER_STATE".equalsIgnoreCase(head.getGstType()) ? igstPer : cgstPer.add(sgstPer);
                }
                t.setTaxPercent(taxPer);
                t.setCgstPer(cgstPer);
                t.setSgstPer(sgstPer);
                t.setIgstPer(igstPer);

                BigDecimal lineAmt = nvl(itemDto.getQty()).multiply(nvl(itemDto.getUnitPrice()));
                BigDecimal discAmt = lineAmt.multiply(nvl(itemDto.getDiscountPercent())).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal afterDisc = lineAmt.subtract(discAmt);
                BigDecimal taxAmt = afterDisc.multiply(taxPer).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);

                if ("INTER_STATE".equalsIgnoreCase(head.getGstType())) {
                    t.setIgstValue(taxAmt);
                    t.setCgstValue(BigDecimal.ZERO);
                    t.setSgstValue(BigDecimal.ZERO);
                } else {
                    BigDecimal half = taxAmt.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
                    t.setCgstValue(half);
                    t.setSgstValue(taxAmt.subtract(half));
                    t.setIgstValue(BigDecimal.ZERO);
                }

                t.setTaxAmount(taxAmt);
                t.setNetAmount(afterDisc.add(taxAmt));
                t.setWarrantyTerms(itemDto.getWarrantyTerms());
                t.setDescription(itemDto.getDescription());
                t.setHsnCode(itemDto.getHsnCode());
                t.setBrand(itemDto.getBrand());
                t.setOrigin(itemDto.getOrigin());
                t.setRemarks(itemDto.getRemarks());
                t.setExpectedDeliveryDate(itemDto.getExpectedDeliveryDate());
                t.setDueDate(itemDto.getDueDate());
                t.setWarehouse(itemDto.getWarehouse());
                t.setPendingQty(nvl(itemDto.getQty()));
                t.setReceivedQty(BigDecimal.ZERO);
                t.setRejectedQty(BigDecimal.ZERO);
                t.setReturnedQty(BigDecimal.ZERO);
                t.setInvoicedQty(BigDecimal.ZERO);
                t.setActiveStatus(1);

                subtotal = subtotal.add(afterDisc);
                totalTax = totalTax.add(taxAmt);
                head.getItems().add(t);
            }
            head.setSubtotal(subtotal);

            // Additional charges
            BigDecimal additionalChargesTotal = BigDecimal.ZERO;
            BigDecimal additionalChargesTax = BigDecimal.ZERO;
            if (dto.getAdditionalCharges() != null) {
                if (head.getAdditionalCharges() != null) {
                    head.getAdditionalCharges().clear();
                } else {
                    head.setAdditionalCharges(new ArrayList<>());
                }
                for (PurchaseOrderChargeDTO cDto : dto.getAdditionalCharges()) {
                    PurchaseOrderCharge pc = new PurchaseOrderCharge();
                    pc.setPurchaseOrderHead(head);
                    pc.setChargeMaster(entityManager.getReference(SmAdditionalCharges.class, cDto.getChargesId()));
                    pc.setAmount(nvl(cDto.getAmount()));
                    pc.setTaxApplicable(Boolean.TRUE.equals(cDto.getTaxApplicable()));
                    pc.setCgstPer(nvl(cDto.getCgstPer()));
                    pc.setCgstValue(nvl(cDto.getCgstValue()));
                    pc.setSgstPer(nvl(cDto.getSgstPer()));
                    pc.setSgstValue(nvl(cDto.getSgstValue()));
                    pc.setIgstPer(nvl(cDto.getIgstPer()));
                    pc.setIgstValue(nvl(cDto.getIgstValue()));
                    pc.setTotalValue(nvl(cDto.getTotalValue()));
                    pc.setActiveStatus(1);
                    pc.setCreatedBy(userId);
                    pc.setCreatedDate(new Date());
                    pc.setUpdatedBy(userId);
                    pc.setUpdatedDate(new Date());
                    head.getAdditionalCharges().add(pc);

                    additionalChargesTotal = additionalChargesTotal.add(nvl(cDto.getTotalValue()));
                    additionalChargesTax = additionalChargesTax.add(nvl(cDto.getCgstValue())).add(nvl(cDto.getSgstValue())).add(nvl(cDto.getIgstValue()));
                }
            }

            head.setTaxAmount(totalTax.add(additionalChargesTax));
            head.setGrandTotal(subtotal
                    .add(totalTax)
                    .add(additionalChargesTotal)
                    .add(nvl(dto.getFreightAmount()))
                    .add(nvl(dto.getPackingAmount()))
                    .add(nvl(dto.getInsuranceAmount()))
                    .add(nvl(dto.getOtherCharges()))
                    .subtract(nvl(dto.getDiscountAmount()))
                    .add(nvl(dto.getRoundOff())));
        }

        headRepo.save(head);
        auditLog(head.getId(), "MODIFIED", "Purchase Order updated", null, null, userId);
        return mapHeadToDTO(head);
    }

    // ---- SUBMIT ----
    @Transactional
    public void submitPo(Long id, String userId) {
        PurchaseOrderHead head = headRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));
        head.setStatus(getStatus("SUBMITTED"));
        headRepo.save(head);
        auditLog(id, "SUBMITTED", "Purchase Order submitted for approval", null, "SUBMITTED", userId);
    }

    // ---- VERIFY ----
    @Transactional
    public void verifyPo(Long id, String userId, String remarks) {
        PurchaseOrderHead head = headRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));
        String currentStatus = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "DRAFT";
        if (!"SUBMITTED".equals(currentStatus) && !"PENDING APPROVAL".equals(currentStatus)) {
            throw new BusinessException("Cannot verify a PO in status: " + currentStatus);
        }
        head.setStatus(getStatus("VERIFIED"));
        headRepo.save(head);

        // Auto-generate PO Schedule if POType is ONETIME
        if ("ONETIME".equalsIgnoreCase(head.getPoType())) {
            List<PurchaseScheduleDTO> schedules = new ArrayList<>();
            for (PurchaseOrderTrans trans : head.getItems()) {
                PurchaseScheduleDTO s = new PurchaseScheduleDTO();
                s.setSupplierId(head.getSupplier().getId());
                s.setPoId(head.getId());
                s.setPoItemId(trans.getId());
                // Use Due Date as Schedule Date, PO Qty as Schedule Qty
                s.setScheduleDate(trans.getDueDate()); 
                s.setScheduleQty(trans.getQty());
                schedules.add(s);
            }
            purchaseScheduleService.saveSchedules(schedules);
        }

        auditLog(id, "VERIFIED", "Purchase Order verified. Remarks: " + remarks, currentStatus, "VERIFIED", userId);
    }

    // ---- REJECT ----
    @Transactional
    public void rejectPo(Long id, String userId, String remarks) {
        PurchaseOrderHead head = headRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));
        String currentStatus = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "DRAFT";
        head.setStatus(getStatus("REJECTED"));
        headRepo.save(head);
        auditLog(id, "REJECTED", "Purchase Order rejected. Remarks: " + remarks, currentStatus, "REJECTED", userId);
    }

    // ---- CANCEL ----
    @Transactional
    public void cancelPo(Long id, String userId, String reason) {
        PurchaseOrderHead head = headRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));
        String currentStatus = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "DRAFT";
        if ("FULLY RECEIVED".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new BusinessException("Cannot cancel a PO in status: " + currentStatus);
        }
        head.setStatus(getStatus("CANCELLED"));
        headRepo.save(head);
        auditLog(id, "CANCELLED", "Purchase Order cancelled. Reason: " + reason, currentStatus, "CANCELLED", userId);
    }

    // ---- DELETE ----
    @Transactional
    public void deletePo(Long id, String userId) {
        PurchaseOrderHead head = headRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Purchase Order not found: " + id));

        String statusName = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "DRAFT";
        if (!"DRAFT".equals(statusName)) {
            throw new BusinessException("Cannot delete a PO in status: " + statusName + ". Only DRAFT POs can be deleted. Please cancel instead.");
        }

        // Hard delete the logs to maintain referential integrity
        List<PurchaseOrderLog> logs = logRepo.findByPoHeadIdOrderByEventDateDesc(id);
        if (logs != null && !logs.isEmpty()) {
            logRepo.deleteAll(logs);
        }

        // Hard delete the PO completely (Cascades to Items, Sources, and Charges). 
        // This frees up the PO Number to be generated again and prevents sequence gaps.
        headRepo.delete(head);
    }

    // ---- HELPERS ----
    private String generatePoNumber(Long divisionId) {
        Calendar cal = Calendar.getInstance();
        int year = cal.get(Calendar.YEAR);
        String currentAccountYear = year + "-" + (year + 1);
        
        String configuredPrefix = null;
        int digits = 6;
        String configuredSuffix = "";
        
        try {
            List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialRepository.findAll();
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                .findFirst()
                .orElse(allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .findFirst().orElse(null));

            if (cred != null && cred.getMatPoPrefix() != null && !cred.getMatPoPrefix().trim().isEmpty()) {
                configuredPrefix = cred.getMatPoPrefix().trim();
                if (cred.getMatPoSuffix() != null) {
                    configuredSuffix = cred.getMatPoSuffix().trim();
                }
                digits = cred.getMatPoDigit() != null ? cred.getMatPoDigit() : 6;
            }
        } catch (Exception ex) {
            log.error("[PurchaseOrderService] Could not read PrefixCredential: {}", ex.getMessage());
        }

        if (configuredPrefix != null) {
            String finalPrefix = configuredPrefix.replaceAll("/+", "/");
            String finalSuffix = configuredSuffix.replaceAll("/+", "/");
            String searchPattern = finalPrefix + "%" + finalSuffix;
            
            Object seqResult = entityManager.createNativeQuery(
                  "SELECT TOP 1 PO_NO FROM PP_PURCHASE_ORDER_HEAD WHERE PO_NO LIKE :pattern ORDER BY ID DESC")
                  .setParameter("pattern", searchPattern)
                  .getResultList().stream().findFirst().orElse(null);
                  
            long nextNum = 1;
            if (seqResult != null) {
                String numStr = (String) seqResult;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                try {
                    nextNum = Long.parseLong(numStr) + 1;
                } catch(Exception e) {}
            }
            return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
        }

        throw new RuntimeException("Purchase Order Prefix/Suffix credentials not configured.");
    }

    private StatusMaster getStatus(String name) {
        List<?> results = entityManager.createQuery(
                "SELECT s FROM StatusMaster s WHERE UPPER(TRIM(s.name)) = :name")
                .setParameter("name", name.toUpperCase())
                .getResultList();
        if (results.isEmpty()) {
            // Auto-create if not exists
            StatusMaster sm = new StatusMaster();
            sm.setName(name);
            entityManager.persist(sm);
            return sm;
        }
        return (StatusMaster) results.get(0);
    }

    private void auditLog(Long poId, String eventType, String desc, String oldVal, String newVal, String userId) {
        PurchaseOrderLog log = new PurchaseOrderLog();
        log.setPoHeadId(poId);
        log.setEventType(eventType);
        log.setEventDescription(desc);
        log.setOldValue(oldVal);
        log.setNewValue(newVal);
        log.setPerformedBy(userId);
        log.setEventDate(new Date());
        logRepo.save(log);
    }

    private PurchaseOrderHeadDTO mapHeadToDTO(PurchaseOrderHead head) {
        PurchaseOrderHeadDTO dto = new PurchaseOrderHeadDTO();
        dto.setId(head.getId());
        dto.setPoNo(head.getPoNo());
        dto.setPoDate(head.getPoDate());
        dto.setRevisionNo(head.getRevisionNo());
        dto.setSourceType(head.getSourceType() != null ? head.getSourceType().name() : null);
        if (head.getSupplier() != null) {
            dto.setSupplierId(head.getSupplier().getId());
            dto.setSupplierName(head.getSupplier().getLedgerName());
        }
        if (head.getStatus() != null) {
            dto.setStatusId(head.getStatus().getId());
            dto.setStatusName(head.getStatus().getName());
        }
        dto.setCurrency(head.getCurrency());
        dto.setExchangeRate(head.getExchangeRate());
        dto.setPaymentTerms(head.getPaymentTerms());
        dto.setDeliveryTerms(head.getDeliveryTerms());
        dto.setShippingTerms(head.getShippingTerms());
        dto.setWarrantyTerms(head.getWarrantyTerms());
        dto.setBillingAddress(head.getBillingAddress());
        dto.setDeliveryAddress(head.getDeliveryAddress());
        dto.setBuyerId(head.getBuyerId());
        dto.setDepartmentId(head.getDepartmentId());
        dto.setSubtotal(head.getSubtotal());
        dto.setFreightAmount(head.getFreightAmount());
        dto.setPackingAmount(head.getPackingAmount());
        dto.setInsuranceAmount(head.getInsuranceAmount());
        dto.setOtherCharges(head.getOtherCharges());
        dto.setDiscountAmount(head.getDiscountAmount());
        dto.setTaxAmount(head.getTaxAmount());
        dto.setRoundOff(head.getRoundOff());
        dto.setGrandTotal(head.getGrandTotal());
        dto.setRemarks(head.getRemarks());
        dto.setInternalNotes(head.getInternalNotes());
        dto.setPoType(head.getPoType() != null ? head.getPoType() : "ONETIME");
        dto.setExpectedDeliveryDate(head.getExpectedDeliveryDate());
        dto.setTransportScope(head.getTransportScope());
        dto.setSupplierReferenceNo(head.getSupplierReferenceNo());
        dto.setSupplierReferenceDate(head.getSupplierReferenceDate());
        dto.setGstType(head.getGstType());
        dto.setCgstAmount(head.getCgstAmount());
        dto.setSgstAmount(head.getSgstAmount());
        dto.setIgstAmount(head.getIgstAmount());
        try {
            if (org.hibernate.Hibernate.isInitialized(head.getSources()) && head.getSources() != null && !head.getSources().isEmpty()) {
                dto.setSourceDocumentNo(head.getSources().get(0).getSourceDocumentNo());
            } else if (head.getId() != null) {
                List<PurchaseOrderSource> srcList = sourceRepo.findByPurchaseOrderHeadId(head.getId());
                if (srcList != null && !srcList.isEmpty()) {
                    dto.setSourceDocumentNo(srcList.get(0).getSourceDocumentNo());
                }
            }
        } catch (Exception e) {
            log.debug("Could not load PO sources for DTO: {}", e.getMessage());
        }

        if (head.getDivision() != null) dto.setDivisionId(head.getDivision().getId());

        List<PurchaseOrderChargeDTO> chargeDTOs = new ArrayList<>();
        try {
            if (org.hibernate.Hibernate.isInitialized(head.getAdditionalCharges()) && head.getAdditionalCharges() != null) {
                for (PurchaseOrderCharge c : head.getAdditionalCharges()) {
                    PurchaseOrderChargeDTO cd = new PurchaseOrderChargeDTO();
                    cd.setId(c.getId());
                    if (c.getChargeMaster() != null) {
                        cd.setChargesId(c.getChargeMaster().getId());
                        cd.setChargeName(c.getChargeMaster().getCharges());
                    }
                    cd.setAmount(c.getAmount());
                    cd.setTaxApplicable(c.getTaxApplicable());
                    cd.setCgstPer(c.getCgstPer());
                    cd.setCgstValue(c.getCgstValue());
                    cd.setSgstPer(c.getSgstPer());
                    cd.setSgstValue(c.getSgstValue());
                    cd.setIgstPer(c.getIgstPer());
                    cd.setIgstValue(c.getIgstValue());
                    cd.setTotalValue(c.getTotalValue());
                    chargeDTOs.add(cd);
                }
            }
        } catch (Exception e) {
            log.debug("Could not load PO additional charges for DTO: {}", e.getMessage());
        }
        dto.setAdditionalCharges(chargeDTOs);

        return dto;
    }

    private PurchaseOrderTransDTO mapTransToDTO(PurchaseOrderTrans t) {
        PurchaseOrderTransDTO dto = new PurchaseOrderTransDTO();
        dto.setId(t.getId());
        dto.setLineNo(t.getLineNo());
        if (t.getPurchaseOrderHead() != null) {
            dto.setSourceDocumentNo(t.getPurchaseOrderHead().getPoNo());
        }
        if (t.getItem() != null) {
            dto.setItemId(t.getItem().getId());
            dto.setItemName(t.getItem().getItemName());
            dto.setItemCode(t.getItem().getItemCode());
        }
        dto.setDescription(t.getDescription());
        dto.setHsnCode(t.getHsnCode());
        dto.setUom(t.getUom());
        dto.setBrand(t.getBrand());
        dto.setOrigin(t.getOrigin());
        dto.setQty(t.getQty());
        dto.setUnitPrice(t.getUnitPrice());
        dto.setDiscountPercent(t.getDiscountPercent());
        dto.setTaxPercent(t.getTaxPercent());
        dto.setCgstPer(t.getCgstPer());
        dto.setSgstPer(t.getSgstPer());
        dto.setIgstPer(t.getIgstPer());
        dto.setCgstValue(t.getCgstValue());
        dto.setSgstValue(t.getSgstValue());
        dto.setIgstValue(t.getIgstValue());
        dto.setTaxAmount(t.getTaxAmount());
        dto.setWarrantyTerms(t.getWarrantyTerms());
        dto.setNetAmount(t.getNetAmount());
        dto.setPendingQty(t.getPendingQty());
        dto.setReceivedQty(t.getReceivedQty());
        dto.setRejectedQty(t.getRejectedQty());
        dto.setReturnedQty(t.getReturnedQty());
        dto.setInvoicedQty(t.getInvoicedQty());
        dto.setExpectedDeliveryDate(t.getExpectedDeliveryDate());
        dto.setWarehouse(t.getWarehouse());
        dto.setProject(t.getProject());
        dto.setCostCenter(t.getCostCenter());
        dto.setRemarks(t.getRemarks());
        dto.setDueDate(t.getDueDate());
        return dto;
    }

    private BigDecimal nvl(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    // ---- PENDING ITEMS BY SUPPLIER ----
    public List<PurchaseOrderTransDTO> getPendingItemsBySupplier(Long supplierId) {
        List<PurchaseOrderTrans> pendingItems = transRepo.findPendingItemsBySupplier(supplierId, BigDecimal.ZERO);
        return pendingItems.stream().map(this::mapTransToDTO).collect(Collectors.toList());
    }
}
