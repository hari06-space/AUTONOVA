package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_REACTION_PLAN")
@Getter
@Setter
public class NpdReactionPlan extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SHORT_NAME", nullable = false, unique = true, length = 20)
    private String shortName;

    @Column(name = "REACTION_PLAN", nullable = false, unique = true, length = 200)
    private String reactionPlan;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public NpdReactionPlan() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }

    public String getReactionPlan() { return reactionPlan; }
    public void setReactionPlan(String reactionPlan) { this.reactionPlan = reactionPlan; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
