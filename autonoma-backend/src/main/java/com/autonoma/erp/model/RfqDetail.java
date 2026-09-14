package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "PP_RFQ_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class RfqDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_REF_ID", nullable = false)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private RfqHead rfqHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "UOM", length = 20, nullable = false)
    private String uom;

    @Column(name = "REQ_QTY", nullable = false, precision = 12, scale = 4)
    private BigDecimal reqQty = BigDecimal.ZERO;

    @Column(name = "EXPECTED_DELIVERY_DATE")
    @Temporal(TemporalType.DATE)
    private Date expectedDeliveryDate;

    @Column(name = "REMARKS", length = 250)
    private String remarks;

    @Column(name = "PR_TRANS_ID")
    private Long prTransId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RfqHead getRfqHead() { return rfqHead; }
    public void setRfqHead(RfqHead rfqHead) { this.rfqHead = rfqHead; }
    public ProductMaster getItem() { return item; }
    public void setItem(ProductMaster item) { this.item = item; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getReqQty() { return reqQty; }
    public void setReqQty(BigDecimal reqQty) { this.reqQty = reqQty; }
    public Date getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(Date expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getPrTransId() { return prTransId; }
    public void setPrTransId(Long prTransId) { this.prTransId = prTransId; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
}
