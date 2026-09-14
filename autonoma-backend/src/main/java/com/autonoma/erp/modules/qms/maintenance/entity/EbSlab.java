package com.autonoma.erp.modules.qms.maintenance.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "QMS_EB_SLAB")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class EbSlab extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EFFECT_FROM", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate effectFrom = LocalDate.now();

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "SEQ_NO", nullable = false)
    private Integer seqNo;

    @Column(name = "FROM_UNIT", nullable = false)
    private Integer fromUnit;

    @Column(name = "TO_UNIT", nullable = false)
    private Integer toUnit;

    @Column(name = "PRICE", nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getEffectFrom() { return effectFrom; }
    public void setEffectFrom(LocalDate effectFrom) { this.effectFrom = effectFrom; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }
    public Integer getFromUnit() { return fromUnit; }
    public void setFromUnit(Integer fromUnit) { this.fromUnit = fromUnit; }
    public Integer getToUnit() { return toUnit; }
    public void setToUnit(Integer toUnit) { this.toUnit = toUnit; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
