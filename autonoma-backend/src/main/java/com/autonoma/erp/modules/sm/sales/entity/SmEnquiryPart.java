package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "SALES_ENQUIRY_DETAIL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SmEnquiryPart extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ENQUIRY_ID")
    private Long enquiryId;

    @Column(name = "PART_NO_ID")
    private Long partNoId;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty
    private String partNo;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty
    private String name;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty
    private String oemPartNo;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty
    private String ippPartNo;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty
    private String uom;



    @Column(name = "REQ_QTY", precision = 12, scale = 2)
    private BigDecimal reqQty;

    @Column(name = "COMMERCIALLY_FEASIBLE", length = 50)
    private String commerciallyFeasible;

    @Column(name = "TECHNICALLY_FEASIBLE", length = 50)
    private String technicallyFeasible;

    @Column(name = "ASSIGN_TO", length = 200)
    private String assignTo;

    @Column(name = "STATUS")
    private Boolean status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEnquiryId() { return enquiryId; }
    public void setEnquiryId(Long enquiryId) { this.enquiryId = enquiryId; }
    public Long getPartNoId() { return partNoId; }
    public void setPartNoId(Long partNoId) { this.partNoId = partNoId; }
    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOemPartNo() { return oemPartNo; }
    public void setOemPartNo(String oemPartNo) { this.oemPartNo = oemPartNo; }
    public String getIppPartNo() { return ippPartNo; }
    public void setIppPartNo(String ippPartNo) { this.ippPartNo = ippPartNo; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getReqQty() { return reqQty; }
    public void setReqQty(BigDecimal reqQty) { this.reqQty = reqQty; }
    public String getCommerciallyFeasible() { return commerciallyFeasible; }
    public void setCommerciallyFeasible(String commerciallyFeasible) { this.commerciallyFeasible = commerciallyFeasible; }
    public String getTechnicallyFeasible() { return technicallyFeasible; }
    public void setTechnicallyFeasible(String technicallyFeasible) { this.technicallyFeasible = technicallyFeasible; }
    public String getAssignTo() { return assignTo; }
    public void setAssignTo(String assignTo) { this.assignTo = assignTo; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}
