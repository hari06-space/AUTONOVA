package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.math.BigDecimal;

@Data
public class PurchaseRequestTransDTO {
    private Long id;
    private Long prRefId;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String uom;
    private BigDecimal price;
    private BigDecimal reqQty;
    private Date reqDate;
    private BigDecimal amount;
    private String remarks;
    private Long approverId;
    private String approverName;
    private Long statusId;
    private String statusName;
    private Date approvedDate;
    private Long divisionId;
    private String productImage;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPrRefId() { return prRefId; }
    public void setPrRefId(Long prRefId) { this.prRefId = prRefId; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getReqQty() { return reqQty; }
    public void setReqQty(BigDecimal reqQty) { this.reqQty = reqQty; }
    public Date getReqDate() { return reqDate; }
    public void setReqDate(Date reqDate) { this.reqDate = reqDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getApproverId() { return approverId; }
    public void setApproverId(Long approverId) { this.approverId = approverId; }
    public String getApproverName() { return approverName; }
    public void setApproverName(String approverName) { this.approverName = approverName; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public Date getApprovedDate() { return approvedDate; }
    public void setApprovedDate(Date approvedDate) { this.approvedDate = approvedDate; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }
}
