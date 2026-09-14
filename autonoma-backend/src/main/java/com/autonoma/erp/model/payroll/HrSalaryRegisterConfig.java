package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "HR_SALARY_REGISTER_CONFIG")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrSalaryRegisterConfig extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "CONFIG_NAME", nullable = false, length = 150)
    private String configName;

    @Column(name = "COLUMNS_JSON", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String columnsJson;

    @Builder.Default
    @Column(name = "EXPORT_FORMATS", nullable = false, length = 100)
    private String exportFormats = "EXCEL,PDF,CSV";

    @Builder.Default
    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;
}
