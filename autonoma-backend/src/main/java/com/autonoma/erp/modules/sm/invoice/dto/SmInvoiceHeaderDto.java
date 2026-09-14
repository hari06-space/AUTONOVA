package com.autonoma.erp.modules.sm.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmInvoiceHeaderDto {
    private Long id;
    private String invoiceNo;
    private String docType = "INVOICE";
    private Date invoiceDate;
    private Long customerId;
    private Long billingAddressId;
    private Long shippingAddressId;
    private String paymentTerms;
    private String deliveryTerms;
    private String currencyCode;
    private BigDecimal exchangeRate;
    private String baseCurrency;
    private Date rateDate;
    private String exchangeRateSource;
    private String customerPo;
    private String remarks;
    private BigDecimal subTotal;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal grandTotal;
    private BigDecimal roundOff;
    private BigDecimal additionalCharges;
    private String refInvoiceNo;
    private Date refInvoiceDate;
    private String refDcNos;
    private String dcStatus;
    private String customerName;
    private List<Long> dcIds = new ArrayList<>();
    private List<SmInvoiceDetailDto> invoiceDetails = new ArrayList<>();
    private List<SmInvoiceChargeDto> invoiceCharges = new ArrayList<>();
    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;
}
