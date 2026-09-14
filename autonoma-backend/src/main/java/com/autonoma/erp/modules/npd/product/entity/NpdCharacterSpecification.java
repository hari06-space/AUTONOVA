package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_CHARACTER_SPECIFICATION")
@Getter
@Setter
public class NpdCharacterSpecification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CHARACTER_SPECIFICATION", nullable = false, unique = true, length = 100)
    private String characterSpecification;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public NpdCharacterSpecification() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCharacterSpecification() { return characterSpecification; }
    public void setCharacterSpecification(String characterSpecification) { this.characterSpecification = characterSpecification; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
