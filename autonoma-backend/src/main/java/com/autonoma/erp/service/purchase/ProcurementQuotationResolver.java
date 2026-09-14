package com.autonoma.erp.service.purchase;

import com.autonoma.erp.dto.purchase.comparison.QuoteComparisonMatrixDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.math.BigDecimal;

/**
 * Centralized service to resolve the "Effective Quotation" for Procurement.
 * It determines whether to use the original supplier quotation or the latest AGREED negotiation.
 */
@Service
public class ProcurementQuotationResolver {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Resolves effective quotations for a given RFQ, merging negotiated terms if an AGREED negotiation exists.
     * 
     * @param rfqId The RFQ ID
     * @return List of unified Effective Quotation items
     */
    public List<QuoteComparisonMatrixDTO> resolveEffectiveQuotationsByRfq(Long rfqId) {
        String sql = "SELECT " +
            "d.ID as QUOTATION_DETAIL_ID, " +
            "d.ITEM_ID, " +
            "p.ITEM_NAME, " +
            "d.UOM, " +
            "d.QTY, " +
            "q.ID as QUOTATION_ID, " +
            "q.SUPPLIER_ID, " +
            "v.LEDGER_NAME AS SUPPLIER_NAME, " +
            "d.UNIT_PRICE AS ORIGINAL_PRICE, " +
            "d.DISCOUNT_PERCENT AS ORIGINAL_DISCOUNT, " +
            "(COALESCE(d.CGST_PERCENT, 0) + COALESCE(d.SGST_PERCENT, 0) + COALESCE(d.IGST_PERCENT, 0)) AS ORIGINAL_TAX, " +
            "d.FREIGHT_AMOUNT AS ORIGINAL_FREIGHT, " +
            "q.PAYMENT_TERMS AS ORIGINAL_PAYMENT_TERMS, " +
            "d.WARRANTY_TERMS AS ORIGINAL_WARRANTY, " +
            "COALESCE(DATEDIFF(day, q.QUOTATION_DATE, d.DELIVERY_DATE), q.LEAD_TIME_DAYS) AS ORIGINAL_DELIVERY_DAYS, " +
            "q.CURRENCY, " +
            "q.QUOTATION_NO, " +
            "q.SUPPLIER_REF_NO AS SUPPLIER_REFERENCE_NO, " +
            "q.TRANSPORT_SCOPE, " +
            "(SELECT SUM(COALESCE(AMOUNT, 0)) FROM PP_QUOTE_ADD_CHARGES WHERE QUOTE_ID = q.ID) AS HEAD_FREIGHT, " +
            "(SELECT SUM(COALESCE(CGST_VALUE, 0) + COALESCE(SGST_VALUE, 0) + COALESCE(IGST_VALUE, 0)) FROM PP_QUOTE_ADD_CHARGES WHERE QUOTE_ID = q.ID) AS HEAD_TAX_AMOUNT, " +
            
            
            "neg.ID AS NEGOTIATION_ID, " +
            "neg.NEGOTIATION_DATE, " +
            "neg.NEGOTIATION_REMARKS, " +
            "negT.NEGOTIATED_PRICE, " +
            "negT.NEGOTIATED_DELIVERY_DAYS, " +
            "negT.NEGOTIATED_WARRANTY, " +
            "neg.NEGOTIATED_TRANSPORT_MODE, " +
            
            "q.TECHNICAL_STATUS_ID, " +
            "(SELECT CALCULATED_SCORE FROM PP_QUOTE_COMPARISON_SCORE WHERE COMPARISON_HEAD_ID IS NULL AND SUPPLIER_ID = q.SUPPLIER_ID AND SCORE_TYPE = 'TECHNICAL' AND ACTIVE_STATUS=1) AS TECH_SCORE, " +
            "(SELECT CALCULATED_SCORE FROM PP_QUOTE_COMPARISON_SCORE WHERE COMPARISON_HEAD_ID IS NULL AND SUPPLIER_ID = q.SUPPLIER_ID AND SCORE_TYPE = 'COMMERCIAL' AND ACTIVE_STATUS=1) AS COMM_SCORE, " +
            
            "v.DISTANCE, " +
            "(SELECT TOP 1 DELIVERY_PERFORMANCE FROM PP_SUPPLIER_PERFORMANCE WHERE SUPPLIER_ID = q.SUPPLIER_ID ORDER BY LAST_EVALUATED DESC) AS PAST_DELIVERY_PERF, " +
            "(SELECT TOP 1 QUALITY_PERFORMANCE FROM PP_SUPPLIER_PERFORMANCE WHERE SUPPLIER_ID = q.SUPPLIER_ID ORDER BY LAST_EVALUATED DESC) AS PAST_QUALITY_PERF " +
            
            "FROM PP_QUOTATION_DETAIL d " +
            "JOIN PP_QUOTATION_HEAD q ON d.QUOTATION_REF_ID = q.ID " +
            "JOIN NPD_PRODUCT_MASTER p ON d.ITEM_ID = p.ID " +
            "JOIN FA_ACCOUNT_LEDGER v ON q.SUPPLIER_ID = v.ID " +
            
            // Left join with latest negotiation for this supplier and quotation
            "OUTER APPLY (SELECT TOP 1 * FROM PP_QUOTATION_NEGOTIATION_HEAD WHERE QUOTATION_ID = q.ID ORDER BY ID DESC) neg " +
            "LEFT JOIN PP_QUOTATION_NEGOTIATION_TRANS negT ON negT.NEGOTIATION_HEAD_ID = neg.ID AND negT.ITEM_ID = d.ITEM_ID " +
            
            "WHERE q.RFQ_REF_ID = ?";
            
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            QuoteComparisonMatrixDTO matrix = new QuoteComparisonMatrixDTO();
            matrix.setRfqItemId(rs.getLong("ITEM_ID"));
            matrix.setItemName(rs.getString("ITEM_NAME"));
            matrix.setUom(rs.getString("UOM"));
            matrix.setQty(rs.getBigDecimal("QTY"));
            matrix.setSupplierId(rs.getLong("SUPPLIER_ID"));
            matrix.setSupplierName(rs.getString("SUPPLIER_NAME"));
            matrix.setCurrency(rs.getString("CURRENCY"));
            matrix.setPaymentTerms(rs.getString("ORIGINAL_PAYMENT_TERMS"));
            
            // Header level fields
            matrix.setQuotationNo(rs.getString("QUOTATION_NO"));
            matrix.setSupplierReferenceNo(rs.getString("SUPPLIER_REFERENCE_NO"));
            matrix.setHeadTaxAmount(rs.getBigDecimal("HEAD_TAX_AMOUNT"));
            matrix.setHeadFreight(rs.getBigDecimal("HEAD_FREIGHT"));
            // matrix.setTransportScope will be evaluated after checking negotiation
            
            // Check if there is an agreed negotiation
            Long negotiationId = rs.getLong("NEGOTIATION_ID");
            boolean isNegotiated = !rs.wasNull();
            
            matrix.setOriginalPrice(rs.getBigDecimal("ORIGINAL_PRICE"));
            
            if (isNegotiated && rs.getBigDecimal("NEGOTIATED_PRICE") != null) {
                BigDecimal negotiatedPrice = rs.getBigDecimal("NEGOTIATED_PRICE");
                BigDecimal originalPrice = rs.getBigDecimal("ORIGINAL_PRICE");
                
                matrix.setNegotiatedPrice(negotiatedPrice);
                matrix.setIsNegotiated(true);
                matrix.setNegotiationDate(rs.getTimestamp("NEGOTIATION_DATE"));
                matrix.setNegotiationRemarks(rs.getString("NEGOTIATION_REMARKS"));
            } else {
                matrix.setNegotiatedPrice(rs.getBigDecimal("ORIGINAL_PRICE"));
                matrix.setIsNegotiated(false);
            }
            
            matrix.setDiscount(rs.getBigDecimal("ORIGINAL_DISCOUNT"));
            matrix.setTax(rs.getBigDecimal("ORIGINAL_TAX"));
            matrix.setFreight(rs.getBigDecimal("ORIGINAL_FREIGHT"));
            
            // Resolve Warranty, Delivery and Transport
            if (isNegotiated && rs.getString("NEGOTIATED_WARRANTY") != null) {
                matrix.setWarranty(rs.getString("NEGOTIATED_WARRANTY"));
            } else {
                matrix.setWarranty(rs.getString("ORIGINAL_WARRANTY"));
            }
            
            if (isNegotiated && rs.getString("NEGOTIATED_TRANSPORT_MODE") != null) {
                matrix.setTransportScope(rs.getString("NEGOTIATED_TRANSPORT_MODE"));
            } else {
                matrix.setTransportScope(rs.getString("TRANSPORT_SCOPE"));
            }
            
            if (isNegotiated && rs.getInt("NEGOTIATED_DELIVERY_DAYS") != 0) { // Assuming not 0, or checking wasNull if primitive
                matrix.setDeliveryDays(rs.getInt("NEGOTIATED_DELIVERY_DAYS"));
            } else {
                matrix.setDeliveryDays(rs.getInt("ORIGINAL_DELIVERY_DAYS"));
                if (rs.wasNull()) matrix.setDeliveryDays(null);
            }
            
            // Scores
            try {
                matrix.setTechnicalScore(rs.getBigDecimal("TECH_SCORE"));
                matrix.setCommercialScore(rs.getBigDecimal("COMM_SCORE"));
            } catch (Exception e) {
                // Ignore if score columns are not properly resolved
            }
            
            // Historical and geographical metrics
            matrix.setDistance(rs.getInt("DISTANCE"));
            if (rs.wasNull()) matrix.setDistance(null);
            
            matrix.setPastDeliveryPerformance(rs.getBigDecimal("PAST_DELIVERY_PERF"));
            matrix.setPastQualityPerformance(rs.getBigDecimal("PAST_QUALITY_PERF"));
            
            // Calculate effective total amount for this line
            java.math.BigDecimal priceToUse = matrix.getNegotiatedPrice() != null ? matrix.getNegotiatedPrice() : matrix.getOriginalPrice();
            if (priceToUse != null && matrix.getQty() != null) {
                java.math.BigDecimal lineTotal = priceToUse.multiply(matrix.getQty());
                
                // Add absolute tax if TAX is a percentage (based on UI expectations, or compute properly)
                if (matrix.getTax() != null) {
                    java.math.BigDecimal taxAmt = lineTotal.multiply(matrix.getTax()).divide(new java.math.BigDecimal("100"));
                    lineTotal = lineTotal.add(taxAmt);
                }
                
                if (matrix.getFreight() != null) {
                    lineTotal = lineTotal.add(matrix.getFreight());
                }
                
                matrix.setTotalAmount(lineTotal);
            }
            
            return matrix;
        }, rfqId);
    }
}
