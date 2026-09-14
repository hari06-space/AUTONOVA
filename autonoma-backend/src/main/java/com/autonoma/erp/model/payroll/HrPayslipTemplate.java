package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "HR_PAYSLIP_TEMPLATE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayslipTemplate extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "TEMPLATE_NAME", nullable = false, length = 150)
    private String templateName;

    @Column(name = "HEADER_HTML", columnDefinition = "NVARCHAR(MAX)")
    private String headerHtml;

    @Column(name = "FOOTER_HTML", columnDefinition = "NVARCHAR(MAX)")
    private String footerHtml;

    @Column(name = "EMPLOYEE_FIELDS_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String employeeFieldsJson;

    @Column(name = "EARNINGS_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String earningsJson;

    @Column(name = "DEDUCTIONS_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String deductionsJson;

    @Column(name = "LOGO_PATH", length = 500)
    private String logoPath;

    @Builder.Default
    @Column(name = "IS_DEFAULT")
    private Boolean isDefault = false;

    public String getTemplateName() { return templateName; }
    public String getFooterHtml() { return footerHtml; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }
    public void setHeaderHtml(String headerHtml) { this.headerHtml = headerHtml; }
    public void setFooterHtml(String footerHtml) { this.footerHtml = footerHtml; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
}
