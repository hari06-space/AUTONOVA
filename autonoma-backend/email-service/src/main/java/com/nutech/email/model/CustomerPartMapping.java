package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_part_mapping",
       uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "customer_part_code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPartMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "customer_part_code", nullable = false, length = 100)
    private String customerPartCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_part_id", nullable = false)
    private MasterPart masterPart;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MappingSource mappingSource = MappingSource.MANUAL;

    @Column(precision = 5, scale = 2)
    private BigDecimal aiConfidence;

    private Long mappedByUserId;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum MappingSource {
        MANUAL, AI_AUTO, AI_REVIEWED
    }
}
