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
 * NEGOTIATION strategy: loads the negotiated prices from the agreed negotiation
 * round.
 * Reuses the existing negotiation data structure.
 */
@Component
@RequiredArgsConstructor
public class NegotiationPoStrategy implements PurchaseOrderSourceStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean supports(PoSourceType sourceType) {
        return PoSourceType.NEGOTIATION == sourceType;
    }

    @Override
    public PurchaseOrderHeadDTO resolve(Long sourceDocId, Long divisionId) {
        String headerSql = "SELECT n.ID, n.NEGOTIATION_NO, n.NEGOTIATED_TOTAL, " +
                "v.ID AS SUP_ID, v.LEDGER_NAME AS SUPPLIER_NAME, " +
                "q.QUOTATION_NO, q.QUOTATION_DATE, q.SUPPLIER_REF_NO, q.SUPPLIER_REF_DATE, " +
                "q.PAYMENT_TERMS, q.WARRANTY_TERMS, q.CURRENCY " +
                "FROM PP_QUOTATION_NEGOTIATION_HEAD n WITH(NOLOCK) " +
                "JOIN FA_ACCOUNT_LEDGER v WITH(NOLOCK) ON n.SUPPLIER_ID = v.ID " +
                "JOIN PP_QUOTATION_HEAD q WITH(NOLOCK) ON n.QUOTATION_REF_ID = q.ID " +
                "WHERE n.ID = ?";

        List<PurchaseOrderHeadDTO> headers = jdbcTemplate.query(headerSql, (rs, n2) -> {
            PurchaseOrderHeadDTO dto = new PurchaseOrderHeadDTO();
            dto.setSourceType(PoSourceType.NEGOTIATION.name());
            dto.setSourceDocumentNo(rs.getString("NEGOTIATION_NO"));
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
            throw new BusinessException("Negotiation not found: " + sourceDocId);
        PurchaseOrderHeadDTO dto = headers.get(0);

        String itemSql = "SELECT t.ID, t.ITEM_ID, p.ITEM_NAME, p.ITEM_CODE, p.HSN_CODE, COALESCE(qd.UOM, p.UOM) AS UOM, " +
                "t.QTY, t.NEGOTIATED_PRICE, t.NEGOTIATED_WARRANTY, " +
                "COALESCE(qd.CGST_PERCENT, hsn.CGST_PER, 0) AS CGST_PERCENT, " +
                "COALESCE(qd.SGST_PERCENT, hsn.SGST_PER, 0) AS SGST_PERCENT, " +
                "COALESCE(qd.IGST_PERCENT, hsn.IGST_PER, 0) AS IGST_PERCENT " +
                "FROM PP_QUOTATION_NEGOTIATION_TRANS t WITH(NOLOCK) " +
                "JOIN NPD_PRODUCT_MASTER p WITH(NOLOCK) ON t.ITEM_ID = p.ID " +
                "JOIN PP_QUOTATION_DETAIL qd WITH(NOLOCK) ON t.QUOTATION_DETAIL_ID = qd.ID " +
                "LEFT JOIN MST_HSN_MASTER hsn WITH(NOLOCK) ON p.HSN_CODE = hsn.HSN_CODE " +
                "WHERE t.NEGOTIATION_HEAD_ID = ?";

        List<PurchaseOrderTransDTO> items = jdbcTemplate.query(itemSql, (rs, n2) -> {
            PurchaseOrderTransDTO item = new PurchaseOrderTransDTO();
            item.setItemId(rs.getLong("ITEM_ID"));
            item.setItemName(rs.getString("ITEM_NAME"));
            item.setItemCode(rs.getString("ITEM_CODE"));
            item.setHsnCode(rs.getString("HSN_CODE"));
            item.setUom(rs.getString("UOM"));
            BigDecimal qty = rs.getBigDecimal("QTY");
            BigDecimal price = rs.getBigDecimal("NEGOTIATED_PRICE");
            item.setQty(qty != null ? qty : BigDecimal.ZERO);
            item.setUnitPrice(price != null ? price : BigDecimal.ZERO);
            item.setDiscountPercent(BigDecimal.ZERO);
            item.setCgstPer(rs.getBigDecimal("CGST_PERCENT"));
            item.setSgstPer(rs.getBigDecimal("SGST_PERCENT"));
            item.setIgstPer(rs.getBigDecimal("IGST_PERCENT"));
            item.setTaxPercent(item.getCgstPer().add(item.getSgstPer()));
            item.setNetAmount(qty != null && price != null ? qty.multiply(price) : BigDecimal.ZERO);
            item.setSourceTransId(rs.getLong("ID"));
            item.setSourceDocumentNo(dto.getSourceDocumentNo());
            item.setWarrantyTerms(rs.getString("NEGOTIATED_WARRANTY"));
            return item;
        }, sourceDocId);

        dto.setItems(items);

        List<PurchaseOrderSourceDTO> sources = new ArrayList<>();
        PurchaseOrderSourceDTO src = new PurchaseOrderSourceDTO();
        src.setSourceType(PoSourceType.NEGOTIATION.name());
        src.setSourceHeadId(sourceDocId);
        src.setSourceDocumentNo(dto.getSourceDocumentNo());
        sources.add(src);
        dto.setSources(sources);

        return dto;
    }
}
