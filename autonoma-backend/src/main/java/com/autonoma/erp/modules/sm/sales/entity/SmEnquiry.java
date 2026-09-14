package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "SALES_ENQUIRY_HEADER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SmEnquiry extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ENQUIRY_NO", length = 50)
    private String enquiryNo;

    @Column(name = "ENQUIRY_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date enquiryDate;

    @Column(name = "RFQ_MODE", length = 50)
    private String rfqMode;

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @Transient
    private String customerName;

    @Transient
    private String country;

    @Transient
    private String custCode;

    @Column(name = "CONTACT_ID")
    private Long contactId;

    @Column(name = "TARGET_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date targetDate;

    @Column(name = "SAL_TYPE", length = 100)
    private String salType;

    @Column(name = "SOURCE", length = 100)
    private String source;

    @Column(name = "PRIORITY", length = 50)
    private String priority;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Transient
    private List<SalesAttachmentPath> attachments;

    @Column(name = "STATUS")
    private Long status;

    @OneToMany(mappedBy = "enquiryId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SmEnquiryPart> parts;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEnquiryNo() { return enquiryNo; }
    public void setEnquiryNo(String enquiryNo) { this.enquiryNo = enquiryNo; }
    public Date getEnquiryDate() { return enquiryDate; }
    public void setEnquiryDate(Date enquiryDate) { this.enquiryDate = enquiryDate; }
    public String getRfqMode() { return rfqMode; }
    public void setRfqMode(String rfqMode) { this.rfqMode = rfqMode; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCustCode() { return custCode; }
    public void setCustCode(String custCode) { this.custCode = custCode; }
    public Long getContactId() { return contactId; }
    public void setContactId(Long contactId) { this.contactId = contactId; }
    public Date getTargetDate() { return targetDate; }
    public void setTargetDate(Date targetDate) { this.targetDate = targetDate; }
    public String getSalType() { return salType; }
    public void setSalType(String salType) { this.salType = salType; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<SalesAttachmentPath> getAttachments() { return attachments; }
    public void setAttachments(List<SalesAttachmentPath> attachments) { this.attachments = attachments; }
    public Long getStatus() { return status; }
    public void setStatus(Long status) { this.status = status; }
    public List<SmEnquiryPart> getParts() { return parts; }
    public void setParts(List<SmEnquiryPart> parts) { this.parts = parts; }
}
