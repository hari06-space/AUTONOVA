package com.autonoma.erp.model.ai;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "BOS_AI_KNOWLEDGE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BosAiKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "MODULE_NAME", nullable = false, length = 200)
    private String moduleName;

    @Column(name = "TABLE_NAME", nullable = false, length = 200)
    private String tableName;

    public String getTableName() { return tableName; }

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    public String getDescription() { return description; }

    @Column(name = "PAGE_CODE", length = 50)
    private String pageCode;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
    }
}
