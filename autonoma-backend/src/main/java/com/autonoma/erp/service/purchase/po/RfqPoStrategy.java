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
import java.util.List;

/**
 * RFQ strategy: loads RFQ items. Supplier is still selected manually.
 */
@Component
@RequiredArgsConstructor
public class RfqPoStrategy implements PurchaseOrderSourceStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean supports(PoSourceType sourceType) {
        return PoSourceType.RFQ == sourceType;
    }

    @Override
    public PurchaseOrderHeadDTO resolve(Long sourceDocId, Long divisionId) {
        String headerSql = "SELECT h.RFQ_NO, h.COMMERCIAL_TERMS FROM PP_RFQ_HEAD h WITH(NOLOCK) WHERE h.ID = ?";

        List<PurchaseOrderHeadDTO> headers = jdbcTemplate.query(headerSql, (rs, n) -> {
            PurchaseOrderHeadDTO dto = new PurchaseOrderHeadDTO();
            dto.setSourceType(PoSourceType.RFQ.name());
            dto.setSourceDocumentNo(rs.getString("RFQ_NO"));
            dto.setDeliveryTerms(rs.getString("COMMERCIAL_TERMS"));
            dto.setCurrency("INR");
            dto.setExchangeRate(BigDecimal.ONE);
            dto.setDivisionId(divisionId);
            return dto;
        }, sourceDocId);

        if (headers.isEmpty())
            throw new BusinessException("RFQ not found: " + sourceDocId);
        PurchaseOrderHeadDTO dto = headers.get(0);

        String itemSql = "SELECT t.ID, t.ITEM_ID, p.ITEM_NAME, p.ITEM_CODE, p.HSN_CODE, COALESCE(t.UOM, p.UOM) AS UOM, t.REQ_QTY AS REQ_QTY, t.REMARKS, " +
                "COALESCE(hsn.CGST_PER, 0) AS CGST_PERCENT, " +
                "COALESCE(hsn.SGST_PER, 0) AS SGST_PERCENT, " +
                "COALESCE(hsn.IGST_PER, 0) AS IGST_PERCENT " +
                "FROM PP_RFQ_DETAIL t WITH(NOLOCK) " +
                "JOIN NPD_PRODUCT_MASTER p WITH(NOLOCK) ON t.ITEM_ID = p.ID " +
                "LEFT JOIN MST_HSN_MASTER hsn WITH(NOLOCK) ON p.HSN_CODE = hsn.HSN_CODE " +
                "WHERE t.RFQ_REF_ID = ? AND t.ACTIVE_STATUS = 1";

        List<PurchaseOrderTransDTO> items = jdbcTemplate.query(itemSql, (rs, n) -> {
            PurchaseOrderTransDTO item = new PurchaseOrderTransDTO();
            item.setItemId(rs.getLong("ITEM_ID"));
            item.setItemName(rs.getString("ITEM_NAME"));
            item.setItemCode(rs.getString("ITEM_CODE"));
            item.setHsnCode(rs.getString("HSN_CODE"));
            item.setUom(rs.getString("UOM"));
            item.setQty(rs.getBigDecimal("REQ_QTY"));
            item.setUnitPrice(BigDecimal.ZERO);
            item.setDiscountPercent(BigDecimal.ZERO);
            item.setCgstPer(rs.getBigDecimal("CGST_PERCENT"));
            item.setSgstPer(rs.getBigDecimal("SGST_PERCENT"));
            item.setIgstPer(rs.getBigDecimal("IGST_PERCENT"));
            item.setTaxPercent(item.getCgstPer().add(item.getSgstPer()));
            item.setNetAmount(BigDecimal.ZERO);
            item.setRemarks(rs.getString("REMARKS"));
            item.setSourceTransId(rs.getLong("ID"));
            item.setSourceDocumentNo(dto.getSourceDocumentNo());
            return item;
        }, sourceDocId);

        dto.setItems(items);

        List<PurchaseOrderSourceDTO> sources = new ArrayList<>();
        PurchaseOrderSourceDTO src = new PurchaseOrderSourceDTO();
        src.setSourceType(PoSourceType.RFQ.name());
        src.setSourceHeadId(sourceDocId);
        src.setSourceDocumentNo(dto.getSourceDocumentNo());
        sources.add(src);
        dto.setSources(sources);

        return dto;
    }
}
