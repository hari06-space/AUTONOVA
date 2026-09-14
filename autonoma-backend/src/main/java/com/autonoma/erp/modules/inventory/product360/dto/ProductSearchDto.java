package com.autonoma.erp.modules.inventory.product360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchDto {
    private Long id;
    private String itemNo;
    private String itemName;
    private String itemCategory;
    private String itemGroup;
    private String uom;
    private String inventoryType;
    private String drawingNo;
    private String partNoOld;
    private BigDecimal currentStock;
    private BigDecimal sellingRate;
    private BigDecimal itemCost;
    private String status;
    private Double matchScore;
    private String matchedImage;
    private String matchReason;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemNo() { return itemNo; }
    public void setItemNo(String itemNo) { this.itemNo = itemNo; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemCategory() { return itemCategory; }
    public void setItemCategory(String itemCategory) { this.itemCategory = itemCategory; }
    public String getItemGroup() { return itemGroup; }
    public void setItemGroup(String itemGroup) { this.itemGroup = itemGroup; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public String getInventoryType() { return inventoryType; }
    public void setInventoryType(String inventoryType) { this.inventoryType = inventoryType; }
    public String getDrawingNo() { return drawingNo; }
    public void setDrawingNo(String drawingNo) { this.drawingNo = drawingNo; }
    public String getPartNoOld() { return partNoOld; }
    public void setPartNoOld(String partNoOld) { this.partNoOld = partNoOld; }
    public BigDecimal getCurrentStock() { return currentStock; }
    public void setCurrentStock(BigDecimal currentStock) { this.currentStock = currentStock; }
    public BigDecimal getSellingRate() { return sellingRate; }
    public void setSellingRate(BigDecimal sellingRate) { this.sellingRate = sellingRate; }
    public BigDecimal getItemCost() { return itemCost; }
    public void setItemCost(BigDecimal itemCost) { this.itemCost = itemCost; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }
    public String getMatchedImage() { return matchedImage; }
    public void setMatchedImage(String matchedImage) { this.matchedImage = matchedImage; }
    public String getMatchReason() { return matchReason; }
    public void setMatchReason(String matchReason) { this.matchReason = matchReason; }
}
