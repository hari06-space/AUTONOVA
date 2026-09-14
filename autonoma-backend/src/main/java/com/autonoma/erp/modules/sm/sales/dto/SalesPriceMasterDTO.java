package com.autonoma.erp.modules.sm.sales.dto;

import lombok.Data;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SalesPriceMasterDTO {
    private Long id;
    private String priceListNo;
    private String priceListType;
    private Long customerId;
    private String customerCode;
    private String customerName;
    private Long customerGroupId;
    private String customerGroupName;
    private Long paymentTermsId;
    private String paymentTermsCode;
    private String paymentTermsName;
    private String referenceNo;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date effectiveFrom;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date effectiveTo;
    private Double exchangeRate;
    private String status;
    private String verifyStatus;
    private String verifyRejComments;
    private String remarks;
    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;
    private String verifiedBy;
    private Date verifiedDate;
    private List<SalesPriceMasterDetailDTO> details;
    private List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> attachments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPriceListNo() { return priceListNo; }
    public void setPriceListNo(String priceListNo) { this.priceListNo = priceListNo; }
    public String getPriceListType() { return priceListType; }
    public void setPriceListType(String priceListType) { this.priceListType = priceListType; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public Long getCustomerGroupId() { return customerGroupId; }
    public void setCustomerGroupId(Long customerGroupId) { this.customerGroupId = customerGroupId; }
    public String getCustomerGroupName() { return customerGroupName; }
    public void setCustomerGroupName(String customerGroupName) { this.customerGroupName = customerGroupName; }
    public Long getPaymentTermsId() { return paymentTermsId; }
    public void setPaymentTermsId(Long paymentTermsId) { this.paymentTermsId = paymentTermsId; }
    public String getPaymentTermsCode() { return paymentTermsCode; }
    public void setPaymentTermsCode(String paymentTermsCode) { this.paymentTermsCode = paymentTermsCode; }
    public String getPaymentTermsName() { return paymentTermsName; }
    public void setPaymentTermsName(String paymentTermsName) { this.paymentTermsName = paymentTermsName; }
    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }
    public Date getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(Date effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public Date getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(Date effectiveTo) { this.effectiveTo = effectiveTo; }
    public Double getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(Double exchangeRate) { this.exchangeRate = exchangeRate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVerifyStatus() { return verifyStatus; }
    public void setVerifyStatus(String verifyStatus) { this.verifyStatus = verifyStatus; }
    public String getVerifyRejComments() { return verifyRejComments; }
    public void setVerifyRejComments(String verifyRejComments) { this.verifyRejComments = verifyRejComments; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public Date getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(Date verifiedDate) { this.verifiedDate = verifiedDate; }
    public List<SalesPriceMasterDetailDTO> getDetails() { return details; }
    public void setDetails(List<SalesPriceMasterDetailDTO> details) { this.details = details; }
    public List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> getAttachments() { return attachments; }
    public void setAttachments(List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> attachments) { this.attachments = attachments; }
}
