package com.nutech.email.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "quotation_line")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    @JsonIgnore
    private Quotation quotation;

    private Integer lineNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_part_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private MasterPart masterPart;

    @Column(length = 100)
    private String partCode;

    private String partName;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Builder.Default
    private Integer quantity = 1;

    @Column(precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Builder.Default
    @Column(precision = 5, scale = 2)
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal lineTotal;

    private String hsnCode;

    @Builder.Default
    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate = new BigDecimal("18.00");

    private Integer leadTimeDays;
}
