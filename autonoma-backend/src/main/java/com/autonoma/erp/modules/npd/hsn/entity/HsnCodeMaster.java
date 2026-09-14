package com.autonoma.erp.modules.npd.hsn.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "MST_HSN_MASTER")
@Getter
@Setter
public class HsnCodeMaster extends BaseAuditEntity {

    @Id
    @Column(name = "HSN_CODE", nullable = false, unique = true, length = 10)
    private String hsnCode;

    @Column(name = "DECRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "CGST_PER", precision = 10, scale = 2)
    private BigDecimal cgstPer;

    @Column(name = "SGST_PER", precision = 10, scale = 2)
    private BigDecimal sgstPer;

    @Column(name = "IGST_PER", precision = 10, scale = 2)
    private BigDecimal igstPer;

    @Column(name = "STATUS")
    private Integer status = 1;

    @Column(name = "CODE_TYPE", length = 20)
    private String codeType; // HSN / SAC

    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getCgstPer() { return cgstPer; }
    public void setCgstPer(BigDecimal cgstPer) { this.cgstPer = cgstPer; }
    public BigDecimal getSgstPer() { return sgstPer; }
    public void setSgstPer(BigDecimal sgstPer) { this.sgstPer = sgstPer; }
    public BigDecimal getIgstPer() { return igstPer; }
    public void setIgstPer(BigDecimal igstPer) { this.igstPer = igstPer; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getCodeType() { return codeType; }
    public void setCodeType(String codeType) { this.codeType = codeType; }
}
