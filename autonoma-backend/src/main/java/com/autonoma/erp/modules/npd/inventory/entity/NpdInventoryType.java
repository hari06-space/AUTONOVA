package com.autonoma.erp.modules.npd.inventory.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_INVENTORY_TYPE")
@Getter
@Setter
public class NpdInventoryType extends BaseAuditEntity {

    @Id
    @Column(name = "CODE", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "TYPE_NAME", length = 50)
    private String typeName;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "STATUS", columnDefinition = "BIT")
    private Integer status = 1;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
