package com.autonoma.erp.modules.npd.material.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "NPD_MATERIAL_TYPE")
@Getter
@Setter
public class NpdMaterialType extends BaseAuditEntity {

    @Id
    @Column(name = "CODE", nullable = false, unique = true, length = 10)
    private String code;

    @Column(name = "TYPE_NAME", length = 50)
    private String typeName;

    @Column(name = "DECRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "DENSITY", precision = 12, scale = 3)
    private BigDecimal density;

    @Column(name = "STATUS")
    private Boolean status = true;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getDensity() { return density; }
    public void setDensity(BigDecimal density) { this.density = density; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
