package com.autonoma.erp.modules.npd.bom.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "NPD_BOM_MASTER")
@Data
@NoArgsConstructor
public class BomMaster extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID", unique = true, nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductMaster product;

    @Column(name = "BOM_NO", length = 100)
    private String bomNo;

    @Column(name = "REV_NO", length = 50)
    private String revNo;

    @Column(name = "REV_DATE")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate revDate;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "BASE_QUANTITY")
    private BigDecimal baseQuantity;

    @Column(name = "BOM_USAGE", length = 50)
    private String bomUsage;

    @Column(name = "VALID_FROM")
    private LocalDate validFrom;

    @Column(name = "VALID_TO")
    private LocalDate validTo;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "DIVISION")
    private Integer division;

    @OneToMany(mappedBy = "bomMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("seqNo ASC")
    private List<BomProcess> processes = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProductMaster getProduct() { return product; }
    public void setProduct(ProductMaster product) { this.product = product; }
    public String getBomNo() { return bomNo; }
    public void setBomNo(String bomNo) { this.bomNo = bomNo; }
    public String getRevNo() { return revNo; }
    public void setRevNo(String revNo) { this.revNo = revNo; }
    public LocalDate getRevDate() { return revDate; }
    public void setRevDate(LocalDate revDate) { this.revDate = revDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public BigDecimal getBaseQuantity() { return baseQuantity; }
    public void setBaseQuantity(BigDecimal baseQuantity) { this.baseQuantity = baseQuantity; }
    public String getBomUsage() { return bomUsage; }
    public void setBomUsage(String bomUsage) { this.bomUsage = bomUsage; }
    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }
    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public List<BomProcess> getProcesses() { return processes; }
    public void setProcesses(List<BomProcess> processes) { this.processes = processes; }
}
