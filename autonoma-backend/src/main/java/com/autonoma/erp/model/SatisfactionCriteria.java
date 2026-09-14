package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "QMS_SATISFACTION_CRITERIA")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionCriteria extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SATISFACTION_TYPE", length = 255, nullable = false)
    private String satisfactionType;

    @Column(name = "SATISFACTION_CRITERIA", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String satisfactionCriteria;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true; // true = Active, false = Inactive

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSatisfactionType() { return satisfactionType; }
    public void setSatisfactionType(String satisfactionType) { this.satisfactionType = satisfactionType; }
    public String getSatisfactionCriteria() { return satisfactionCriteria; }
    public void setSatisfactionCriteria(String satisfactionCriteria) { this.satisfactionCriteria = satisfactionCriteria; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
