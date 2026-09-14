package com.autonoma.erp.modules.pdfdesigner.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BOS_PDF_TEMPLATE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class BosPdfTemplate extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "TEMPLATE_NAME", nullable = false, length = 150)
    private String templateName;

    @Column(name = "DOCUMENT_TYPE", nullable = false, length = 50)
    private String documentType; // PAYSLIP, INVOICE, PURCHASE_ORDER, ID_CARD, etc.

    @Column(name = "PAGE_SIZE", nullable = false, length = 50)
    private String pageSize; // A4_PORTRAIT, A4_LANDSCAPE, LETTER, CUSTOM

    @Column(name = "WIDTH", nullable = false)
    private java.math.BigDecimal width;

    @Column(name = "HEIGHT", nullable = false)
    private java.math.BigDecimal height;

    @Column(name = "TEMPLATE_JSON", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String templateJson;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "IS_DEFAULT", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "BRANCH_ID")
    private Long branchId;

    @Column(name = "VERSION", nullable = false)
    private Integer version = 1;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "DRAFT"; // DRAFT, ACTIVE, INACTIVE

    public Long getRowId() { return rowId; }
    public void setRowId(Long rowId) { this.rowId = rowId; }
    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getPageSize() { return pageSize; }
    public void setPageSize(String pageSize) { this.pageSize = pageSize; }
    public java.math.BigDecimal getWidth() { return width; }
    public void setWidth(java.math.BigDecimal width) { this.width = width; }
    public java.math.BigDecimal getHeight() { return height; }
    public void setHeight(java.math.BigDecimal height) { this.height = height; }
    public String getTemplateJson() { return templateJson; }
    public void setTemplateJson(String templateJson) { this.templateJson = templateJson; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private String templateName; private String documentType; private String pageSize;
        private java.math.BigDecimal width; private java.math.BigDecimal height; private String templateJson;
        private Boolean isActive = true; private Boolean isDefault = false; private Long companyId; private Long branchId;
        private Integer version = 1; private String status = "DRAFT";
        public Builder templateName(String v) { this.templateName = v; return this; }
        public Builder documentType(String v) { this.documentType = v; return this; }
        public Builder pageSize(String v) { this.pageSize = v; return this; }
        public Builder width(java.math.BigDecimal v) { this.width = v; return this; }
        public Builder height(java.math.BigDecimal v) { this.height = v; return this; }
        public Builder templateJson(String v) { this.templateJson = v; return this; }
        public Builder isActive(Boolean v) { this.isActive = v; return this; }
        public Builder isDefault(Boolean v) { this.isDefault = v; return this; }
        public Builder companyId(Long v) { this.companyId = v; return this; }
        public Builder branchId(Long v) { this.branchId = v; return this; }
        public Builder version(Integer v) { this.version = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public BosPdfTemplate build() {
            BosPdfTemplate t = new BosPdfTemplate();
            t.templateName = this.templateName; t.documentType = this.documentType; t.pageSize = this.pageSize;
            t.width = this.width; t.height = this.height; t.templateJson = this.templateJson;
            t.isActive = this.isActive; t.isDefault = this.isDefault; t.companyId = this.companyId; t.branchId = this.branchId;
            t.version = this.version; t.status = this.status;
            return t;
        }
    }
}
