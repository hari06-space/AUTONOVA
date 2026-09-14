package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "HR_PAYROLL_STATUTORY")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollStatutory extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "CONFIG_KEY", unique = true, nullable = false, length = 100)
    private String configKey; // PF_CONFIG, ESI_CONFIG, etc.

    @Column(name = "CONFIG_NAME", nullable = false, length = 150)
    private String configName;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "STATE_ID")
    private Long stateId;

    @Column(name = "CONFIG_JSON", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String configJson;

    @Column(name = "EFFECTIVE_FROM")
    @Temporal(TemporalType.DATE)
    private Date effectiveFrom;

    public void setEffectiveFrom(Date effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    @Builder.Default
    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() { return isActive; }
    public String getConfigKey() { return configKey; }
    public String getConfigJson() { return configJson; }
}
