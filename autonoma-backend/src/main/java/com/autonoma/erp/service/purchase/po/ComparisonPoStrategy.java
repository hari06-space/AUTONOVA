package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.PurchaseOrderChargeDTO;
import com.autonoma.erp.dto.purchase.po.PurchaseOrderHeadDTO;
import com.autonoma.erp.dto.purchase.po.PurchaseOrderSourceDTO;
import com.autonoma.erp.dto.purchase.po.PurchaseOrderTransDTO;
import com.autonoma.erp.enums.PoSourceType;
import com.autonoma.erp.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * QUOTATION_COMPARISON strategy: loads the awarded supplier, awarded prices,
 * terms, additional charges, delivery address, HSN, and taxes automatically.
 */
@Component
@RequiredArgsConstructor
public class ComparisonPoStrategy implements PurchaseOrderSourceStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean supports(PoSourceType sourceType) {
        return PoSourceType.QUOTATION_COMPARISON == sourceType;
    }

    @Override
    public PurchaseOrderHeadDTO resolve(Long sourceDocId, Long divisionId) {
        // 1. Fetch comparison header, awarded supplier, and quotation details
        String headerSql = "SELECT h.ID, h.COMPARISON_NO, " +
                "COALESCE(h.OVERALL_SELECTED_SUPPLIER_ID, h.OVERALL_RECOMMENDED_SUPPLIER_ID) AS OVERALL_SELECTED_SUPPLIER_ID, " +
                "v.LEDGER_NAME AS SUPPLIER_NAME, h.RFQ_ID, h.SELECTION_TYPE, " +
                "qh.ID AS QUOTE_ID, qh.QUOTATION_NO, qh.QUOTATION_DATE, " +
                "qh.SUPPLIER_REF_NO, qh.SUPPLIER_REF_DATE, " +
                "qh.PAYMENT_TERMS, qh.DELIVERY_TERMS, qh.WARRANTY_TERMS, " +
                "qh.CURRENCY, qh.LEAD_TIME_DAYS " +
                "FROM PP_QUOTE_COMPARISON_HEAD h WITH(NOLOCK) " +
                "LEFT JOIN FA_ACCOUNT_LEDGER v WITH(NOLOCK) ON COALESCE(h.OVERALL_SELECTED_SUPPLIER_ID, h.OVERALL_RECOMMENDED_SUPPLIER_ID) = v.ID " +
                "LEFT JOIN PP_QUOTATION_HEAD qh WITH(NOLOCK) ON h.RFQ_ID = qh.RFQ_REF_ID AND qh.SUPPLIER_ID = COALESCE(h.OVERALL_SELECTED_SUPPLIER_ID, h.OVERALL_RECOMMENDED_SUPPLIER_ID) " +
                "WHERE h.ID = ?";

        List<PurchaseOrderHeadDTO> headers = jdbcTemplate.query(headerSql, (rs, n) -> {
            PurchaseOrderHeadDTO dto = new PurchaseOrderHeadDTO();
            dto.setSourceType(PoSourceType.QUOTATION_COMPARISON.name());
            dto.setSourceDocumentNo(rs.getString("COMPARISON_NO"));
            dto.setPoType("ONETIME");
            dto.setSupplierId(rs.getLong("OVERALL_SELECTED_SUPPLIER_ID") == 0 ? null : rs.getLong("OVERALL_SELECTED_SUPPLIER_ID"));
            dto.setSupplierName(rs.getString("SUPPLIER_NAME"));
            
            // Supplier Ref No & Date
            String supRefNo = rs.getString("SUPPLIER_REF_NO");
            if (supRefNo == null || supRefNo.trim().isEmpty()) {
                supRefNo = rs.getString("QUOTATION_NO");
            }
            dto.setSupplierReferenceNo(supRefNo);

            Date supRefDate = rs.getDate("SUPPLIER_REF_DATE");
            if (supRefDate == null) {
                supRefDate = rs.getDate("QUOTATION_DATE");
            }
            dto.setSupplierReferenceDate(supRefDate);

            // Commercial terms from Quotation
            dto.setPaymentTerms(rs.getString("PAYMENT_TERMS"));
            dto.setDeliveryTerms(rs.getString("DELIVERY_TERMS"));
            dto.setWarrantyTerms(rs.getString("WARRANTY_TERMS"));
            dto.setCurrency(rs.getString("CURRENCY") != null ? rs.getString("CURRENCY") : "INR");
            dto.setExchangeRate(BigDecimal.ONE);
            dto.setDivisionId(divisionId);
            return dto;
        }, sourceDocId);

        if (headers.isEmpty())
            throw new BusinessException("Quote Comparison not found: " + sourceDocId);
        PurchaseOrderHeadDTO dto = headers.get(0);

        // 2. Fetch logged-in division address (Delivery Address)
        Long targetDivId = divisionId != null ? divisionId : dto.getDivisionId();
        if (targetDivId != null) {
            String divSql = "SELECT ADDRESS, CITY, STATE, COUNTRY, PINCODE FROM AD_DIVISION WITH(NOLOCK) WHERE ID = ?";
            jdbcTemplate.query(divSql, (rs) -> {
                List<String> parts = new ArrayList<>();
                if (rs.getString("ADDRESS") != null && !rs.getString("ADDRESS").isBlank()) parts.add(rs.getString("ADDRESS").trim());
                if (rs.getString("CITY") != null && !rs.getString("CITY").isBlank()) parts.add(rs.getString("CITY").trim());
                if (rs.getString("STATE") != null && !rs.getString("STATE").isBlank()) parts.add(rs.getString("STATE").trim());
                if (rs.getString("COUNTRY") != null && !rs.getString("COUNTRY").isBlank()) parts.add(rs.getString("COUNTRY").trim());
                String addr = String.join(", ", parts);
                String pincode = rs.getString("PINCODE");
                if (pincode != null && !pincode.isBlank() && !addr.contains(pincode.trim())) {
                    addr += " - " + pincode.trim();
                }
                if (!addr.isBlank()) {
                    dto.setDeliveryAddress(addr);
                }
            }, targetDivId);
        }

        // 3. Fetch awarded items from the Quotation of the selected supplier (including negotiated prices if any)
        String itemSql = "SELECT d.ID, d.ITEM_ID, d.QTY, d.UNIT_PRICE AS ORIGINAL_PRICE, " +
                "d.DISCOUNT_PERCENT, (COALESCE(d.CGST_PERCENT, 0) + COALESCE(d.SGST_PERCENT, 0) + COALESCE(d.IGST_PERCENT, 0)) AS TAX_PERCENT, " +
                "COALESCE(d.CGST_PERCENT, hsn.CGST_PER, 0) AS CGST_PERCENT, " +
                "COALESCE(d.SGST_PERCENT, hsn.SGST_PER, 0) AS SGST_PERCENT, " +
                "COALESCE(d.IGST_PERCENT, hsn.IGST_PER, 0) AS IGST_PERCENT, " +
                "d.CGST_AMOUNT, d.SGST_AMOUNT, d.IGST_AMOUNT, d.TOTAL_AMOUNT, d.DELIVERY_DATE, " +
                "COALESCE(d.WARRANTY_TERMS, qh.WARRANTY_TERMS) AS WARRANTY_TERMS, " +
                "p.ITEM_NAME, p.ITEM_CODE, p.HSN_CODE, COALESCE(d.UOM, p.UOM) AS UOM, " +
                "negT.NEGOTIATED_PRICE, negT.NEGOTIATED_WARRANTY " +
                "FROM PP_QUOTE_COMPARISON_HEAD ch WITH(NOLOCK) " +
                "JOIN PP_QUOTATION_HEAD qh WITH(NOLOCK) ON ch.RFQ_ID = qh.RFQ_REF_ID AND qh.SUPPLIER_ID = COALESCE(ch.OVERALL_SELECTED_SUPPLIER_ID, ch.OVERALL_RECOMMENDED_SUPPLIER_ID) " +
                "JOIN PP_QUOTATION_DETAIL d WITH(NOLOCK) ON qh.ID = d.QUOTATION_REF_ID " +
                "JOIN NPD_PRODUCT_MASTER p WITH(NOLOCK) ON d.ITEM_ID = p.ID " +
                "LEFT JOIN MST_HSN_MASTER hsn WITH(NOLOCK) ON p.HSN_CODE = hsn.HSN_CODE " +
                "OUTER APPLY (SELECT TOP 1 * FROM PP_QUOTATION_NEGOTIATION_HEAD WHERE QUOTATION_ID = qh.ID ORDER BY ID DESC) neg " +
                "LEFT JOIN PP_QUOTATION_NEGOTIATION_TRANS negT ON negT.NEGOTIATION_HEAD_ID = neg.ID AND negT.ITEM_ID = d.ITEM_ID " +
                "WHERE ch.ID = ?";

        final Date[] maxDeliveryDate = new Date[]{null};

        List<PurchaseOrderTransDTO> items = jdbcTemplate.query(itemSql, (rs, n) -> {
            PurchaseOrderTransDTO item = new PurchaseOrderTransDTO();
            item.setItemId(rs.getLong("ITEM_ID"));
            item.setItemName(rs.getString("ITEM_NAME"));
            item.setItemCode(rs.getString("ITEM_CODE"));
            item.setHsnCode(rs.getString("HSN_CODE"));
            item.setUom(rs.getString("UOM"));
            
            BigDecimal qty = rs.getBigDecimal("QTY") != null ? rs.getBigDecimal("QTY") : BigDecimal.ZERO;
            item.setQty(qty);

            BigDecimal negPrice = rs.getBigDecimal("NEGOTIATED_PRICE");
            BigDecimal unitPrice = negPrice != null ? negPrice : (rs.getBigDecimal("ORIGINAL_PRICE") != null ? rs.getBigDecimal("ORIGINAL_PRICE") : BigDecimal.ZERO);
            item.setUnitPrice(unitPrice);

            item.setDiscountPercent(rs.getBigDecimal("DISCOUNT_PERCENT") != null ? rs.getBigDecimal("DISCOUNT_PERCENT") : BigDecimal.ZERO);
            item.setTaxPercent(rs.getBigDecimal("TAX_PERCENT") != null ? rs.getBigDecimal("TAX_PERCENT") : BigDecimal.ZERO);
            
            item.setCgstPer(rs.getBigDecimal("CGST_PERCENT") != null ? rs.getBigDecimal("CGST_PERCENT") : BigDecimal.ZERO);
            item.setSgstPer(rs.getBigDecimal("SGST_PERCENT") != null ? rs.getBigDecimal("SGST_PERCENT") : BigDecimal.ZERO);
            item.setIgstPer(rs.getBigDecimal("IGST_PERCENT") != null ? rs.getBigDecimal("IGST_PERCENT") : BigDecimal.ZERO);

            item.setCgstValue(rs.getBigDecimal("CGST_AMOUNT") != null ? rs.getBigDecimal("CGST_AMOUNT") : BigDecimal.ZERO);
            item.setSgstValue(rs.getBigDecimal("SGST_AMOUNT") != null ? rs.getBigDecimal("SGST_AMOUNT") : BigDecimal.ZERO);
            item.setIgstValue(rs.getBigDecimal("IGST_AMOUNT") != null ? rs.getBigDecimal("IGST_AMOUNT") : BigDecimal.ZERO);

            item.setTaxAmount(item.getCgstValue().add(item.getSgstValue()).add(item.getIgstValue()));
            item.setNetAmount(rs.getBigDecimal("TOTAL_AMOUNT") != null ? rs.getBigDecimal("TOTAL_AMOUNT") : BigDecimal.ZERO);
            item.setSourceTransId(rs.getLong("ID"));
            item.setSourceDocumentNo(dto.getSourceDocumentNo());

            String warranty = rs.getString("NEGOTIATED_WARRANTY") != null ? rs.getString("NEGOTIATED_WARRANTY") : rs.getString("WARRANTY_TERMS");
            item.setWarrantyTerms(warranty);

            Date delDate = rs.getDate("DELIVERY_DATE");
            item.setExpectedDeliveryDate(delDate);

            if (delDate != null) {
                if (maxDeliveryDate[0] == null || delDate.after(maxDeliveryDate[0])) {
                    maxDeliveryDate[0] = delDate;
                }
            }

            return item;
        }, sourceDocId);

        dto.setItems(items);
        if (maxDeliveryDate[0] != null) {
            dto.setExpectedDeliveryDate(maxDeliveryDate[0]);
        }

        // 4. Fetch Additional Charges from Quotation
        String chargeSql = "SELECT c.ID, c.CHARGES_ID, m.CHARGES AS CHARGE_NAME, c.AMOUNT, c.TAX_APPLICABLE, " +
                "c.CGST_PER, c.CGST_VALUE, c.SGST_PER, c.SGST_VALUE, c.IGST_PER, c.IGST_VALUE, c.TOTAL_VALUE " +
                "FROM PP_QUOTE_COMPARISON_HEAD ch WITH(NOLOCK) " +
                "JOIN PP_QUOTATION_HEAD qh WITH(NOLOCK) ON ch.RFQ_ID = qh.RFQ_REF_ID AND qh.SUPPLIER_ID = COALESCE(ch.OVERALL_SELECTED_SUPPLIER_ID, ch.OVERALL_RECOMMENDED_SUPPLIER_ID) " +
                "JOIN PP_QUOTE_ADD_CHARGES c WITH(NOLOCK) ON c.QUOTE_ID = qh.ID " +
                "JOIN SM_ADDITIONAL_CHARGES m WITH(NOLOCK) ON c.CHARGES_ID = m.ID " +
                "WHERE ch.ID = ? AND ISNULL(c.STATUS, 1) = 1";

        List<PurchaseOrderChargeDTO> charges = jdbcTemplate.query(chargeSql, (rs, n) -> {
            PurchaseOrderChargeDTO charge = new PurchaseOrderChargeDTO();
            charge.setChargesId(rs.getLong("CHARGES_ID"));
            charge.setChargeName(rs.getString("CHARGE_NAME"));
            charge.setAmount(rs.getBigDecimal("AMOUNT") != null ? rs.getBigDecimal("AMOUNT") : BigDecimal.ZERO);
            charge.setTaxApplicable(rs.getBoolean("TAX_APPLICABLE"));
            charge.setCgstPer(rs.getBigDecimal("CGST_PER") != null ? rs.getBigDecimal("CGST_PER") : BigDecimal.ZERO);
            charge.setCgstValue(rs.getBigDecimal("CGST_VALUE") != null ? rs.getBigDecimal("CGST_VALUE") : BigDecimal.ZERO);
            charge.setSgstPer(rs.getBigDecimal("SGST_PER") != null ? rs.getBigDecimal("SGST_PER") : BigDecimal.ZERO);
            charge.setSgstValue(rs.getBigDecimal("SGST_VALUE") != null ? rs.getBigDecimal("SGST_VALUE") : BigDecimal.ZERO);
            charge.setIgstPer(rs.getBigDecimal("IGST_PER") != null ? rs.getBigDecimal("IGST_PER") : BigDecimal.ZERO);
            charge.setIgstValue(rs.getBigDecimal("IGST_VALUE") != null ? rs.getBigDecimal("IGST_VALUE") : BigDecimal.ZERO);
            charge.setTotalValue(rs.getBigDecimal("TOTAL_VALUE") != null ? rs.getBigDecimal("TOTAL_VALUE") : BigDecimal.ZERO);
            charge.setActiveStatus(1);
            return charge;
        }, sourceDocId);

        dto.setAdditionalCharges(charges);

        // Build source traceability
        List<PurchaseOrderSourceDTO> sources = new ArrayList<>();
        PurchaseOrderSourceDTO src = new PurchaseOrderSourceDTO();
        src.setSourceType(PoSourceType.QUOTATION_COMPARISON.name());
        src.setSourceHeadId(sourceDocId);
        src.setSourceDocumentNo(dto.getSourceDocumentNo());
        sources.add(src);
        dto.setSources(sources);

        return dto;
    }
}

