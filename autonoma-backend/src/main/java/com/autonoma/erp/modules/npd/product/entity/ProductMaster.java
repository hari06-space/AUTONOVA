package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "NPD_PRODUCT_MASTER")
@Data
@NoArgsConstructor
public class ProductMaster extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID", unique = true, nullable = false)
    private Long id;

    @Column(name = "ITEM_CODE")
    private String itemCode;

    @Column(name = "ITEM_NO", unique = true, nullable = false, length = 100)
    private String itemNo;

    @Column(name = "ITEM_NAME", unique = true, nullable = false, length = 500)
    private String itemName;

    @Column(name = "STATUS", length = 20)
    private String status = "ACTIVE";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "INVENTORY_TYPE", length = 50)
    private String inventoryType;

    @Column(name = "ITEM_GROUP", length = 255)
    private String itemGroup;

    @Column(name = "ITEM_CATEGORY", length = 255)
    private String itemCategory;

    @Column(name = "ITEM_SUB_CATEGORY", length = 50)
    private String itemSubCategory;

    @Column(name = "LEAD_TIME_MIN")
    private Integer leadTimeMin;

    @Column(name = "REORDER_LEVEL")
    private Integer reorderLevel;

    @Column(name = "LEAD_TIME_MAX")
    private Integer leadTimeMax;

    @Column(name = "SELLING_RATE")
    private Double sellingRate;

    @Column(name = "MIN_SELLING_RATE")
    private Double minSellingRate;

    @Column(name = "ITEM_COST")
    private Double itemCost;

    @Column(name = "MRP_RATE")
    private Double mrpRate;

    @Column(name = "RACK_NAME", length = 100)
    private String rackName;

    @Column(name = "BIN_NAME", length = 100)
    private String binName;

    @Column(name = "OEM_NAME_ID")
    private Long oemNameId;

    @Column(name = "WEB_PRODUCT")
    private Boolean webProduct;

    @Column(name = "CONS_NON_MOVING")
    private Boolean consNonMoving;

    @Column(name = "CONS_STOCK_VALUE")
    private Boolean consStockValue;

    @Column(name = "PRIME_PRODUCT")
    private Boolean primeProduct;

    @Column(name = "CAPACITY_ID")
    private Long capacityId;

    @Column(name = "SUPPLIER_PART_NO", length = 50)
    private String supplierPartNo;

    @Column(name = "LD_REQUIRED")
    private Boolean ldRequired;

    @Column(name = "WEIGHT_PER_QTY")
    private Double weightPerQty;

    @Column(name = "PART_NO_OLD", length = 255)
    private String partNoOld;

    @Column(name = "PART_CODE_PREFIX", length = 50)
    private String partCodePrefix;

    @Column(name = "OEM_PREFIX", length = 50)
    private String oemPrefix;

    @Column(name = "ALTERNATIVE_PART_NO", length = 50)
    private String alternativePartNo;

    @Column(name = "WEEKLY_RECONCILIATION")
    private Boolean weeklyReconciliation;

    @Column(name = "MONTHLY_RECONCILIATION")
    private Boolean monthlyReconciliation;

    @Column(name = "PRINT_NAME", length = 500)
    private String printName;

    @Column(name = "REV_NO", length = 50)
    private String revNo;

    @Column(name = "REV_DATE")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate revDate;

    @Column(name = "HSN_CODE", length = 50)
    private String hsnCode;

    @Column(name = "ELEMENT", length = 50)
    private String element;

    @Column(name = "GRADE", length = 255)
    private String grade;

    @Column(name = "SHAPE", length = 50)
    private String shape;

    @Column(name = "CONDITIONS", length = 50)
    private String conditions;

    @Column(name = "STOCK_QTY")
    private Double stockQty;

    @Column(name = "ROL_QTY")
    private Double rolQty;

    @Column(name = "UOM", length = 255)
    private String uom;

    @Column(name = "IS_EXPIRY_ITEM")
    private Boolean isExpiryItem;

    @Column(name = "SELF_LIFE")
    private Integer selfLife;

    @Column(name = "DRM_REQ")
    private Boolean drmReq;

    @Column(name = "MODEL_NO", length = 100)
    private String modelNo;

    @Column(name = "NDA_REQ")
    private Boolean ndaReq;

    @Column(name = "OD")
    private Double od;

    @Column(name = "INNER_DIAMETER")
    private Double innerDiameter;

    @Column(name = "LENGTH")
    private Double length;

    @Column(name = "WIDTH")
    private Double width;

    @Column(name = "THICKNESS")
    private Double thickness;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "REF_ID", referencedColumnName = "ID", nullable = false)
    @org.hibernate.annotations.Where(clause = "PAGE_CODE = 'M3115'")
    private List<NpdAttachmentPath> attachments = new ArrayList<>();

    @Column(name = "KEY_WORD_1", length = 250)
    private String keyWord1;

    @Column(name = "KEY_WORD_2", length = 250)
    private String keyWord2;

    @Column(name = "KEY_WORD_3", length = 250)
    private String keyWord3;

    @Column(name = "REPORT_DESCRIPTION", length = 250)
    private String reportDescription;

    @Column(name = "WTG_QUANTITY")
    private Double wtgQuantity;

    @Column(name = "CAVITY", length = 250)
    private String cavity;

    @Column(name = "INSPECTION_REMARKS", length = 250)
    private String inspectionRemarks;

    @Column(name = "PURCHASE_RATE")
    private Double purchaseRate;

    @Column(name = "MAXIMUM_PURCHASE_RATE")
    private Double maximumPurchaseRate;

    @Column(name = "LOCATION_DIVISION", length = 100)
    private String locationDivision;

    @Column(name = "INSPECTION_REQ")
    private Boolean inspectionReq;

    @Column(name = "DRAWING_NO", length = 100)
    private String drawingNo;

    @Column(name = "SAC_CODE", length = 50)
    private String sacCode;

    @Column(name = "MAKE_NAME", length = 100)
    private String makeName;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "PRODUCT_ID", referencedColumnName = "ID", nullable = false)
    private List<ProductIdentification> identifications = new ArrayList<>();

    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (status == null)
            status = "ACTIVE";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public String getItemNo() { return itemNo; }
    public void setItemNo(String itemNo) { this.itemNo = itemNo; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getInventoryType() { return inventoryType; }
    public void setInventoryType(String inventoryType) { this.inventoryType = inventoryType; }
    public String getItemGroup() { return itemGroup; }
    public void setItemGroup(String itemGroup) { this.itemGroup = itemGroup; }
    public String getItemCategory() { return itemCategory; }
    public void setItemCategory(String itemCategory) { this.itemCategory = itemCategory; }
    public String getItemSubCategory() { return itemSubCategory; }
    public void setItemSubCategory(String itemSubCategory) { this.itemSubCategory = itemSubCategory; }
    public Integer getLeadTimeMin() { return leadTimeMin; }
    public void setLeadTimeMin(Integer leadTimeMin) { this.leadTimeMin = leadTimeMin; }
    public Integer getLeadTimeMax() { return leadTimeMax; }
    public void setLeadTimeMax(Integer leadTimeMax) { this.leadTimeMax = leadTimeMax; }
    public Double getSellingRate() { return sellingRate; }
    public void setSellingRate(Double sellingRate) { this.sellingRate = sellingRate; }
    public Double getMinSellingRate() { return minSellingRate; }
    public void setMinSellingRate(Double minSellingRate) { this.minSellingRate = minSellingRate; }
    public Double getItemCost() { return itemCost; }
    public void setItemCost(Double itemCost) { this.itemCost = itemCost; }
    public Double getMrpRate() { return mrpRate; }
    public void setMrpRate(Double mrpRate) { this.mrpRate = mrpRate; }
    public String getRackName() { return rackName; }
    public void setRackName(String rackName) { this.rackName = rackName; }
    public String getBinName() { return binName; }
    public void setBinName(String binName) { this.binName = binName; }
    public Long getOemNameId() { return oemNameId; }
    public void setOemNameId(Long oemNameId) { this.oemNameId = oemNameId; }
    public Boolean getWebProduct() { return webProduct; }
    public void setWebProduct(Boolean webProduct) { this.webProduct = webProduct; }
    public Boolean getConsNonMoving() { return consNonMoving; }
    public void setConsNonMoving(Boolean consNonMoving) { this.consNonMoving = consNonMoving; }
    public Boolean getConsStockValue() { return consStockValue; }
    public void setConsStockValue(Boolean consStockValue) { this.consStockValue = consStockValue; }
    public Boolean getPrimeProduct() { return primeProduct; }
    public void setPrimeProduct(Boolean primeProduct) { this.primeProduct = primeProduct; }
    public Long getCapacityId() { return capacityId; }
    public void setCapacityId(Long capacityId) { this.capacityId = capacityId; }
    public String getSupplierPartNo() { return supplierPartNo; }
    public void setSupplierPartNo(String supplierPartNo) { this.supplierPartNo = supplierPartNo; }
    public Boolean getLdRequired() { return ldRequired; }
    public void setLdRequired(Boolean ldRequired) { this.ldRequired = ldRequired; }
    public Double getWeightPerQty() { return weightPerQty; }
    public void setWeightPerQty(Double weightPerQty) { this.weightPerQty = weightPerQty; }
    public String getPartNoOld() { return partNoOld; }
    public void setPartNoOld(String partNoOld) { this.partNoOld = partNoOld; }
    public String getPartCodePrefix() { return partCodePrefix; }
    public void setPartCodePrefix(String partCodePrefix) { this.partCodePrefix = partCodePrefix; }
    public String getOemPrefix() { return oemPrefix; }
    public void setOemPrefix(String oemPrefix) { this.oemPrefix = oemPrefix; }
    public String getAlternativePartNo() { return alternativePartNo; }
    public void setAlternativePartNo(String alternativePartNo) { this.alternativePartNo = alternativePartNo; }
    public Boolean getWeeklyReconciliation() { return weeklyReconciliation; }
    public void setWeeklyReconciliation(Boolean weeklyReconciliation) { this.weeklyReconciliation = weeklyReconciliation; }
    public Boolean getMonthlyReconciliation() { return monthlyReconciliation; }
    public void setMonthlyReconciliation(Boolean monthlyReconciliation) { this.monthlyReconciliation = monthlyReconciliation; }
    public String getPrintName() { return printName; }
    public void setPrintName(String printName) { this.printName = printName; }
    public String getRevNo() { return revNo; }
    public void setRevNo(String revNo) { this.revNo = revNo; }
    public java.time.LocalDate getRevDate() { return revDate; }
    public void setRevDate(java.time.LocalDate revDate) { this.revDate = revDate; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getShape() { return shape; }
    public void setShape(String shape) { this.shape = shape; }
    public String getConditions() { return conditions; }
    public void setConditions(String conditions) { this.conditions = conditions; }
    public Double getStockQty() { return stockQty; }
    public void setStockQty(Double stockQty) { this.stockQty = stockQty; }
    public Double getRolQty() { return rolQty; }
    public void setRolQty(Double rolQty) { this.rolQty = rolQty; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public Boolean getIsExpiryItem() { return isExpiryItem; }
    public void setIsExpiryItem(Boolean isExpiryItem) { this.isExpiryItem = isExpiryItem; }
    public Integer getSelfLife() { return selfLife; }
    public void setSelfLife(Integer selfLife) { this.selfLife = selfLife; }
    public Boolean getDrmReq() { return drmReq; }
    public void setDrmReq(Boolean drmReq) { this.drmReq = drmReq; }
    public String getModelNo() { return modelNo; }
    public void setModelNo(String modelNo) { this.modelNo = modelNo; }
    public Boolean getNdaReq() { return ndaReq; }
    public void setNdaReq(Boolean ndaReq) { this.ndaReq = ndaReq; }
    public Double getOd() { return od; }
    public void setOd(Double od) { this.od = od; }
    public Double getInnerDiameter() { return innerDiameter; }
    public void setInnerDiameter(Double innerDiameter) { this.innerDiameter = innerDiameter; }
    public Double getLength() { return length; }
    public void setLength(Double length) { this.length = length; }
    public Double getWidth() { return width; }
    public void setWidth(Double width) { this.width = width; }
    public Double getThickness() { return thickness; }
    public void setThickness(Double thickness) { this.thickness = thickness; }
    public List<NpdAttachmentPath> getAttachments() { return attachments; }
    public void setAttachments(List<NpdAttachmentPath> attachments) { this.attachments = attachments; }
    public String getKeyWord1() { return keyWord1; }
    public void setKeyWord1(String keyWord1) { this.keyWord1 = keyWord1; }
    public String getKeyWord2() { return keyWord2; }
    public void setKeyWord2(String keyWord2) { this.keyWord2 = keyWord2; }
    public String getKeyWord3() { return keyWord3; }
    public void setKeyWord3(String keyWord3) { this.keyWord3 = keyWord3; }
    public String getReportDescription() { return reportDescription; }
    public void setReportDescription(String reportDescription) { this.reportDescription = reportDescription; }
    public Double getWtgQuantity() { return wtgQuantity; }
    public void setWtgQuantity(Double wtgQuantity) { this.wtgQuantity = wtgQuantity; }
    public String getCavity() { return cavity; }
    public void setCavity(String cavity) { this.cavity = cavity; }
    public String getInspectionRemarks() { return inspectionRemarks; }
    public void setInspectionRemarks(String inspectionRemarks) { this.inspectionRemarks = inspectionRemarks; }
    public Double getPurchaseRate() { return purchaseRate; }
    public void setPurchaseRate(Double purchaseRate) { this.purchaseRate = purchaseRate; }
    public Double getMaximumPurchaseRate() { return maximumPurchaseRate; }
    public void setMaximumPurchaseRate(Double maximumPurchaseRate) { this.maximumPurchaseRate = maximumPurchaseRate; }
    public String getLocationDivision() { return locationDivision; }
    public void setLocationDivision(String locationDivision) { this.locationDivision = locationDivision; }
    public Boolean getInspectionReq() { return inspectionReq; }
    public void setInspectionReq(Boolean inspectionReq) { this.inspectionReq = inspectionReq; }
    public String getDrawingNo() { return drawingNo; }
    public void setDrawingNo(String drawingNo) { this.drawingNo = drawingNo; }
    public String getSacCode() { return sacCode; }
    public void setSacCode(String sacCode) { this.sacCode = sacCode; }
    public String getMakeName() { return makeName; }
    public void setMakeName(String makeName) { this.makeName = makeName; }
    public List<ProductIdentification> getIdentifications() { return identifications; }
    public void setIdentifications(List<ProductIdentification> identifications) { this.identifications = identifications; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
}
