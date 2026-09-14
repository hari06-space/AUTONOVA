package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_CONTROL_METHOD")
@Getter
@Setter
public class NpdControlMethod extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CONTROL_METHOD", nullable = false, unique = true, length = 100)
    private String controlMethod;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public NpdControlMethod() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getControlMethod() { return controlMethod; }
    public void setControlMethod(String controlMethod) { this.controlMethod = controlMethod; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
