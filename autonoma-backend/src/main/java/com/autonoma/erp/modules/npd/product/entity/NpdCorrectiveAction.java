package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_CORRECTIVE_ACTION")
@Getter
@Setter
public class NpdCorrectiveAction extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SHORT_NAME", nullable = false, unique = true, length = 20)
    private String shortName;

    @Column(name = "CORRECTIVE_PLAN", nullable = false, unique = true, length = 200)
    private String correctivePlan;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public NpdCorrectiveAction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }

    public String getCorrectivePlan() { return correctivePlan; }
    public void setCorrectivePlan(String correctivePlan) { this.correctivePlan = correctivePlan; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
