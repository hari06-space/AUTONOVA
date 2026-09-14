package com.autonoma.erp.dto.purchase;

import lombok.Data;

@Data
public class RfqSupplierDTO {
    private Long id;
    private Long rfqRefId;
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    private String email;
    private Long supplierStatusId;
    private String supplierStatusName;
    private Boolean emailSent;
    private String threadMessageId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRfqRefId() { return rfqRefId; }
    public void setRfqRefId(Long rfqRefId) { this.rfqRefId = rfqRefId; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getSupplierCode() { return supplierCode; }
    public void setSupplierCode(String supplierCode) { this.supplierCode = supplierCode; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getSupplierStatusId() { return supplierStatusId; }
    public void setSupplierStatusId(Long supplierStatusId) { this.supplierStatusId = supplierStatusId; }
    public String getSupplierStatusName() { return supplierStatusName; }
    public void setSupplierStatusName(String supplierStatusName) { this.supplierStatusName = supplierStatusName; }
    public Boolean getEmailSent() { return emailSent; }
    public void setEmailSent(Boolean emailSent) { this.emailSent = emailSent; }
    public String getThreadMessageId() { return threadMessageId; }
    public void setThreadMessageId(String threadMessageId) { this.threadMessageId = threadMessageId; }
}
