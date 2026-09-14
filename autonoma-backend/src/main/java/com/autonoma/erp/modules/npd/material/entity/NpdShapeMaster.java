package com.autonoma.erp.modules.npd.material.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_SHAPE_MASTER")
@Getter
@Setter
public class NpdShapeMaster extends BaseAuditEntity {

    @Id
    @Column(name = "CODE", nullable = false, unique = true, length = 10)
    private String code;

    @Column(name = "SHAPE_NAME", length = 50)
    private String shapeName;

    @Column(name = "DECRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "DIMENSION_TYP", length = 100)
    private String dimensionType;

    @Column(name = "STATUS")
    private Boolean status = true;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getShapeName() { return shapeName; }
    public void setShapeName(String shapeName) { this.shapeName = shapeName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDimensionType() { return dimensionType; }
    public void setDimensionType(String dimensionType) { this.dimensionType = dimensionType; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
