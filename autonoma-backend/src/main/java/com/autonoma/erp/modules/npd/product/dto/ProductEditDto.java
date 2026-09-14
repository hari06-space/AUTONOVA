package com.autonoma.erp.modules.npd.product.dto;

public class ProductEditDto {
    private Long id;
    private String itemNo;
    private String itemName;
    private String itemCode;

    public ProductEditDto(Long id, String itemNo, String itemName, String itemCode) {
        this.id = id;
        this.itemNo = itemNo;
        this.itemName = itemName;
        this.itemCode = itemCode;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItemNo() { return itemNo; }
    public void setItemNo(String itemNo) { this.itemNo = itemNo; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
}
