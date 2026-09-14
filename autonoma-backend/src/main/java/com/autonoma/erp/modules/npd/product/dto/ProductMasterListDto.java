package com.autonoma.erp.modules.npd.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Lightweight DTO for the Product Master list page.
 * Contains only columns rendered in the table — no attachments or identifications.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductMasterListDto {
    private Long id;
    private String itemCode;
    private String itemNo;
    private String itemName;
    private String inventoryType;
    private String itemGroup;
    private String itemCategory;
    private String itemSubCategory;
    private String hsnCode;
    private String element;
    private String grade;
    private String shape;
    private String conditions;
    private String revNo;
    private Boolean drmReq;
    private Double stockQty;
    private String uom;
    private String status;
    private String createdBy;
    private Date createdAt;
    private String updatedBy;
    private Date updatedAt;
    private String drawingNo;
    private String productImage;
    private Integer leadTimeMax;
}
