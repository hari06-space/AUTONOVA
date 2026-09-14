package com.autonoma.erp.modules.sm.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmCustomerOrderDetailDto {
    private Long id;
    private String partNo;
    private String partName;
    private String quotationNo;
    private String hsnCode;
    private String uom;
    private BigDecimal stock;
    private Integer qty;
    private BigDecimal price;
    private BigDecimal orderPrice;
    private BigDecimal orderWeight;
    private BigDecimal discountPer;
    private BigDecimal cgstPer;
    private BigDecimal sgstPer;
    private BigDecimal igstPer;
    private BigDecimal cgstValue;
    private BigDecimal sgstValue;
    private BigDecimal igstValue;
    private BigDecimal freightPer;
    private String schedule;
    private String approvalStatus;
    private String itemStatus;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getStock() { return stock; }
    public void setStock(BigDecimal stock) { this.stock = stock; }
    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getOrderPrice() { return orderPrice; }
    public void setOrderPrice(BigDecimal orderPrice) { this.orderPrice = orderPrice; }
    public BigDecimal getOrderWeight() { return orderWeight; }
    public void setOrderWeight(BigDecimal orderWeight) { this.orderWeight = orderWeight; }
    public BigDecimal getDiscountPer() { return discountPer; }
    public void setDiscountPer(BigDecimal discountPer) { this.discountPer = discountPer; }
    public BigDecimal getCgstPer() { return cgstPer; }
    public void setCgstPer(BigDecimal cgstPer) { this.cgstPer = cgstPer; }
    public BigDecimal getSgstPer() { return sgstPer; }
    public void setSgstPer(BigDecimal sgstPer) { this.sgstPer = sgstPer; }
    public BigDecimal getIgstPer() { return igstPer; }
    public void setIgstPer(BigDecimal igstPer) { this.igstPer = igstPer; }
    public BigDecimal getCgstValue() { return cgstValue; }
    public void setCgstValue(BigDecimal cgstValue) { this.cgstValue = cgstValue; }
    public BigDecimal getSgstValue() { return sgstValue; }
    public void setSgstValue(BigDecimal sgstValue) { this.sgstValue = sgstValue; }
    public BigDecimal getIgstValue() { return igstValue; }
    public void setIgstValue(BigDecimal igstValue) { this.igstValue = igstValue; }
    public BigDecimal getFreightPer() { return freightPer; }
    public void setFreightPer(BigDecimal freightPer) { this.freightPer = freightPer; }
    public String getSchedule() { return schedule; }
    public void setSchedule(String schedule) { this.schedule = schedule; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public String getItemStatus() { return itemStatus; }
    public void setItemStatus(String itemStatus) { this.itemStatus = itemStatus; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
