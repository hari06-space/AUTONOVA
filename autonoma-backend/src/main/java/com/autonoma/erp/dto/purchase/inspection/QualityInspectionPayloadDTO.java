package com.autonoma.erp.dto.purchase.inspection;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class QualityInspectionPayloadDTO {
    // For single-table backwards compatibility with UI
    private String id; // maps to grnHeadId now
    private Long divisionId;
    private LocalDate qiDate; // maps to inspectionDate
    private Long grnHeadId;
    private String inspectorName;
    private String statusName;
    private String remarks;
    
    // GRN Details for UI
    private String grnNo;
    private LocalDate grnDate;
    private String gateEntryNo;
    private String billNo;
    private LocalDate billDate;
    private String documentType;
    private String documentNo;
    private LocalDate documentDate;
    
    private List<QualityInspectionDTO> transactions;
    private List<com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO> attachments;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public LocalDate getQiDate() { return qiDate; }
    public void setQiDate(LocalDate qiDate) { this.qiDate = qiDate; }
    public Long getGrnHeadId() { return grnHeadId; }
    public void setGrnHeadId(Long grnHeadId) { this.grnHeadId = grnHeadId; }
    public String getInspectorName() { return inspectorName; }
    public void setInspectorName(String inspectorName) { this.inspectorName = inspectorName; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getGrnNo() { return grnNo; }
    public void setGrnNo(String grnNo) { this.grnNo = grnNo; }
    public LocalDate getGrnDate() { return grnDate; }
    public void setGrnDate(LocalDate grnDate) { this.grnDate = grnDate; }
    public String getGateEntryNo() { return gateEntryNo; }
    public void setGateEntryNo(String gateEntryNo) { this.gateEntryNo = gateEntryNo; }
    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }
    public LocalDate getBillDate() { return billDate; }
    public void setBillDate(LocalDate billDate) { this.billDate = billDate; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getDocumentNo() { return documentNo; }
    public void setDocumentNo(String documentNo) { this.documentNo = documentNo; }
    public LocalDate getDocumentDate() { return documentDate; }
    public void setDocumentDate(LocalDate documentDate) { this.documentDate = documentDate; }
    public List<QualityInspectionDTO> getTransactions() { return transactions; }
    public void setTransactions(List<QualityInspectionDTO> transactions) { this.transactions = transactions; }
    public List<com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO> getAttachments() { return attachments; }
    public void setAttachments(List<com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO> attachments) { this.attachments = attachments; }
}
