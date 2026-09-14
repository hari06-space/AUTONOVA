package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "HR_PAYROLL_VALIDATION_RULE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollValidationRule extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "RULE_NAME", nullable = false, length = 150)
    private String ruleName;

    @Column(name = "RULE_CONDITION", nullable = false, length = 1000)
    private String ruleCondition;

    @Column(name = "ERROR_MESSAGE", nullable = false, length = 500)
    private String errorMessage;

    @Column(name = "SEVERITY", nullable = false, length = 50)
    private String severity; // ERROR, WARNING

    @Builder.Default
    @Column(name = "IS_ENABLED")
    private Boolean isEnabled = true;

    public String getRuleName() { return ruleName; }
    public String getRuleCondition() { return ruleCondition; }
    public String getSeverity() { return severity; }
    public String getErrorMessage() { return errorMessage; }
}
