package com.autonoma.erp.modules.qms.satisfaction.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "QMS_SATISFACTION_CRITERIA")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QmsSatisfactionCriteria extends BaseAuditEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SATISFACTION_TYPE", length = 100, nullable = false)
    private String satisfactionType; // Employee, Vendor, Customer, Internal Customer

    @Column(name = "SATISFACTION_CRITERIA", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String satisfactionCriteria;

    @Column(name = "STATUS", nullable = false)
    private Integer status = 1; // Active = 1, Inactive = 0

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSatisfactionType() { return satisfactionType; }
    public void setSatisfactionType(String satisfactionType) { this.satisfactionType = satisfactionType; }
    public String getSatisfactionCriteria() { return satisfactionCriteria; }
    public void setSatisfactionCriteria(String satisfactionCriteria) { this.satisfactionCriteria = satisfactionCriteria; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
