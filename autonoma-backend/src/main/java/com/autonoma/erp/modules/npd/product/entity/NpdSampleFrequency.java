package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_SAMPLE_FREQUENCY")
@Getter
@Setter
public class NpdSampleFrequency extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FREQUENCY", nullable = false, unique = true, length = 100)
    private String frequency;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    public NpdSampleFrequency() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
