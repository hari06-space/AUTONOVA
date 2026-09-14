package com.autonoma.erp.modules.npd.material.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "NPD_MATERIAL_GRADE")
@Getter
@Setter
public class NpdMaterialGrade extends BaseAuditEntity {

    @Id
    @Column(name = "CODE", nullable = false, unique = true, length = 10)
    private String code;

    @Column(name = "GRADE_NAME", length = 50)
    private String gradeName;

    @Column(name = "DECRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "DENSITY", precision = 12, scale = 3)
    private BigDecimal density;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "MATERIAL_TYPE")
    private NpdMaterialType materialType;

    @Column(name = "STATUS")
    private Boolean status = true;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getGradeName() { return gradeName; }
    public void setGradeName(String gradeName) { this.gradeName = gradeName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getDensity() { return density; }
    public void setDensity(BigDecimal density) { this.density = density; }
    public NpdMaterialType getMaterialType() { return materialType; }
    public void setMaterialType(NpdMaterialType materialType) { this.materialType = materialType; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
