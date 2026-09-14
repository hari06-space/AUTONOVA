package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_FEASIBILITY_CATEGORY")
@Getter
@Setter
public class NpdFeasibilityCategory extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "TYPE", nullable = false, length = 20)
    private String type; // FEASIBILITY / PRODUCT REVIEW

    @Column(name = "CATEGORY", nullable = false, unique = true, length = 100)
    private String category;

    @Column(name = "SEQ_NO")
    private Integer seqNo;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public NpdFeasibilityCategory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
