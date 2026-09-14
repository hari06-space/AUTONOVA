package com.autonoma.erp.model.ai;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "BOS_AI_COLUMN_METADATA")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BosAiColumnMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TABLE_NAME", nullable = false, length = 200)
    private String tableName;

    @Column(name = "COLUMN_NAME", nullable = false, length = 200)
    private String columnName;

    @Column(name = "BUSINESS_NAME", nullable = false, length = 200)
    private String businessName;

    public String getColumnName() { return columnName; }
    public String getBusinessName() { return businessName; }

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;
}
