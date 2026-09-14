package com.autonoma.erp.model.purchase.inspection;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "PP_INSPECTION_TEMPLATE_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"template"})
@NoArgsConstructor
@AllArgsConstructor
public class InspectionTemplateDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TEMPLATE_ID", nullable = false)
    private InspectionTemplate template;

    @Column(name = "PARAMETER_NAME", nullable = false, length = 200)
    private String parameterName;

    @Column(name = "INSPECTION_TYPE", nullable = false, length = 50)
    private String inspectionType;

    @Column(name = "EXPECTED_VALUE", length = 500)
    private String expectedValue;

    @Column(name = "UOM", length = 50)
    private String uom;

    @Column(name = "MIN_TOLERANCE", precision = 18, scale = 4)
    private BigDecimal minTolerance;

    @Column(name = "MAX_TOLERANCE", precision = 18, scale = 4)
    private BigDecimal maxTolerance;

    @Column(name = "IS_MANDATORY", nullable = false)
    private Integer isMandatory = 1;
}
