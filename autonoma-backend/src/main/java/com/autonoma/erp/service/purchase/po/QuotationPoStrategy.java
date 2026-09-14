package com.autonoma.erp.service.purchase.po;

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
 * SUPPLIER_QUOTATION strategy: loads original quotation prices for a specific
 * supplier.
 */
@Component
@RequiredArgsConstructor
public class QuotationPoStrategy implements PurchaseOrderSourceStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean supports(PoSourceType sourceType) {
        return PoSourceType.SUPPLIER_QUOTATION == sourceType;
    }

    @Override
    public PurchaseOrderHeadDTO resolve(Long sourceDocId, Long divisionId) {
        String headerSql = "SELECT q.ID, q.QUOTATION_NO, q.QUOTATION_DATE, q.SUPPLIER_REF_NO, q.SUPPLIER_REF_DATE, " +
                "q.PAYMENT_TERMS, q.WARRANTY_TERMS, q.CURRENCY, q.LEAD_TIME_DAYS, " +
                "v.ID AS SUP_ID, v.LEDGER_NAME AS SUPPLIER_NAME " +
                "FROM PP_QUOTATION_HEAD q WITH(NOLOCK) " +
                "JOIN FA_ACCOUNT_LEDGER v WITH(NOLOCK) ON q.SUPPLIER_ID = v.ID " +
                "WHERE q.ID = ?";

        List<PurchaseOrderHeadDTO> headers = jdbcTemplate.query(headerSql, (rs, n) -> {
            PurchaseOrderHeadDTO dto = new PurchaseOrderHeadDTO();
            dto.setSourceType(PoSourceType.SUPPLIER_QUOTATION.name());
            dto.setSourceDocumentNo(rs.getString("QUOTATION_NO"));
            dto.setSupplierId(rs.getLong("SUP_ID"));
            dto.setSupplierName(rs.getString("SUPPLIER_NAME"));
            
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

            dto.setPaymentTerms(rs.getString("PAYMENT_TERMS"));
            dto.setWarrantyTerms(rs.getString("WARRANTY_TERMS"));
            dto.setCurrency(rs.getString("CURRENCY") != null ? rs.getString("CURRENCY") : "INR");
            dto.setExchangeRate(BigDecimal.ONE);
            dto.setDivisionId(divisionId);
            return dto;
        }, sourceDocId);

        if (headers.isEmpty())
            throw new BusinessException("Quotation not found: " + sourceDocId);
        PurchaseOrderHeadDTO dto = headers.get(0);

        String itemSql = "SELECT d.ID, d.ITEM_ID, p.ITEM_NAME, p.ITEM_CODE, p.HSN_CODE, COALESCE(d.UOM, p.UOM) AS UOM, d.QTY, d.UNIT_PRICE, " +
                "d.DISCOUNT_PERCENT, (COALESCE(d.CGST_PERCENT, 0) + COALESCE(d.SGST_PERCENT, 0) + COALESCE(d.IGST_PERCENT, 0)) AS TAX_PERCENT, " +
                "COALESCE(d.CGST_PERCENT, hsn.CGST_PER, 0) AS CGST_PERCENT, " +
                "COALESCE(d.SGST_PERCENT, hsn.SGST_PER, 0) AS SGST_PERCENT, " +
                "COALESCE(d.IGST_PERCENT, hsn.IGST_PER, 0) AS IGST_PERCENT, " +
                "d.TOTAL_AMOUNT, d.REMARKS, d.WARRANTY_TERMS " +
                "FROM PP_QUOTATION_DETAIL d WITH(NOLOCK) " +
                "JOIN NPD_PRODUCT_MASTER p WITH(NOLOCK) ON d.ITEM_ID = p.ID " +
                "LEFT JOIN MST_HSN_MASTER hsn WITH(NOLOCK) ON p.HSN_CODE = hsn.HSN_CODE " +
                "WHERE d.QUOTATION_REF_ID = ?";

        List<PurchaseOrderTransDTO> items = jdbcTemplate.query(itemSql, (rs, n) -> {
            PurchaseOrderTransDTO item = new PurchaseOrderTransDTO();
            item.setItemId(rs.getLong("ITEM_ID"));
            item.setItemName(rs.getString("ITEM_NAME"));
            item.setItemCode(rs.getString("ITEM_CODE"));
            item.setHsnCode(rs.getString("HSN_CODE"));
            item.setUom(rs.getString("UOM"));
            item.setQty(rs.getBigDecimal("QTY"));
            item.setUnitPrice(rs.getBigDecimal("UNIT_PRICE"));
            item.setDiscountPercent(rs.getBigDecimal("DISCOUNT_PERCENT"));
            item.setTaxPercent(rs.getBigDecimal("TAX_PERCENT"));
            item.setCgstPer(rs.getBigDecimal("CGST_PERCENT"));
            item.setSgstPer(rs.getBigDecimal("SGST_PERCENT"));
            item.setIgstPer(rs.getBigDecimal("IGST_PERCENT"));
            item.setNetAmount(rs.getBigDecimal("TOTAL_AMOUNT"));
            item.setRemarks(rs.getString("REMARKS"));
            item.setWarrantyTerms(rs.getString("WARRANTY_TERMS"));
            item.setSourceTransId(rs.getLong("ID"));
            item.setSourceDocumentNo(dto.getSourceDocumentNo());
            return item;
        }, sourceDocId);

        dto.setItems(items);

        List<PurchaseOrderSourceDTO> sources = new ArrayList<>();
        PurchaseOrderSourceDTO src = new PurchaseOrderSourceDTO();
        src.setSourceType(PoSourceType.SUPPLIER_QUOTATION.name());
        src.setSourceHeadId(sourceDocId);
        src.setSourceDocumentNo(dto.getSourceDocumentNo());
        sources.add(src);
        dto.setSources(sources);

        return dto;
    }
}
