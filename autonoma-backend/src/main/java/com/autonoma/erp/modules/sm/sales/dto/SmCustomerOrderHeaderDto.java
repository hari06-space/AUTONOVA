package com.autonoma.erp.modules.sm.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmCustomerOrderHeaderDto {
    private Long id;
    private String orderNo;
    private Date orderDate;
    private Date orderRecDate;
    private String paymentTerms;
    private String currencyCode;
    private String exchangeRate;
    private String quotationNo;
    private Date quotationDate;
    private String modeOfDespatch;
    private String supplyCondition;
    private String deliveryTerms;
    private Long custId;
    private Long billCustId;
    private Long shipCustId;
    
    // UI specific
    private String customerName;
    private String billAddress;
    private String shipAddress;
    
    private String status;
    private Long statusId;
    
    private List<SmCustomerOrderDetailDto> orderDetails;
    private List<SmCustomerOrderChargeDto> orderCharges;

    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public Date getOrderDate() { return orderDate; }
    public void setOrderDate(Date orderDate) { this.orderDate = orderDate; }
    public Date getOrderRecDate() { return orderRecDate; }
    public void setOrderRecDate(Date orderRecDate) { this.orderRecDate = orderRecDate; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(String exchangeRate) { this.exchangeRate = exchangeRate; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public Date getQuotationDate() { return quotationDate; }
    public void setQuotationDate(Date quotationDate) { this.quotationDate = quotationDate; }
    public String getModeOfDespatch() { return modeOfDespatch; }
    public void setModeOfDespatch(String modeOfDespatch) { this.modeOfDespatch = modeOfDespatch; }
    public String getSupplyCondition() { return supplyCondition; }
    public void setSupplyCondition(String supplyCondition) { this.supplyCondition = supplyCondition; }
    public String getDeliveryTerms() { return deliveryTerms; }
    public void setDeliveryTerms(String deliveryTerms) { this.deliveryTerms = deliveryTerms; }
    public Long getCustId() { return custId; }
    public void setCustId(Long custId) { this.custId = custId; }
    public Long getBillCustId() { return billCustId; }
    public void setBillCustId(Long billCustId) { this.billCustId = billCustId; }
    public Long getShipCustId() { return shipCustId; }
    public void setShipCustId(Long shipCustId) { this.shipCustId = shipCustId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getBillAddress() { return billAddress; }
    public void setBillAddress(String billAddress) { this.billAddress = billAddress; }
    public String getShipAddress() { return shipAddress; }
    public void setShipAddress(String shipAddress) { this.shipAddress = shipAddress; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public List<SmCustomerOrderDetailDto> getOrderDetails() { return orderDetails; }
    public void setOrderDetails(List<SmCustomerOrderDetailDto> orderDetails) { this.orderDetails = orderDetails; }
    public List<SmCustomerOrderChargeDto> getOrderCharges() { return orderCharges; }
    public void setOrderCharges(List<SmCustomerOrderChargeDto> orderCharges) { this.orderCharges = orderCharges; }
}
