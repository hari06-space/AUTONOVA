package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class RfqDetailDTO {
    private Long id;
    private Long rfqRefId;
    private Long itemId;
    private String itemName;
    private String itemCode;
    private String uom;
    private BigDecimal reqQty;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date expectedDeliveryDate;
    private String remarks;
    private Long prTransId;
    private String productImage;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRfqRefId() { return rfqRefId; }
    public void setRfqRefId(Long rfqRefId) { this.rfqRefId = rfqRefId; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
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
    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }
}
