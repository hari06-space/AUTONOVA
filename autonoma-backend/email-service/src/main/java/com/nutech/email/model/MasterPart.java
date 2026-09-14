package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "master_part")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String partCode;

    @Column(nullable = false)
    private String partName;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    private String category;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private String uom = "NOS";

    @Builder.Default
    private Integer leadTimeDays = 0;

    @Builder.Default
    private Integer minOrderQty = 1;

    private String hsnCode;

    @Builder.Default
    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate = new BigDecimal("18.00");

    @Builder.Default
    private Boolean isActive = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
