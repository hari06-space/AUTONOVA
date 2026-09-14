package com.autonoma.erp.modules.npd.packing.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class PackingProcedureDetailsDto {
    private Long id;
    private Long processId;
    private String processName;
    private Long productId;
    private String partNo;
    private String partName;
    private String docNo;
    private Integer revNo;
    private Date revDate;
    private String approvalStatus;
    private Boolean isActive;
    private Integer divisionId;
    private Integer companyId;

    private List<ConsumableDto> consumables;
    private List<ToolDto> tools;
    private List<SafetyEquipDto> safetyEquipment;
    private List<ManpowerDto> manpower;
    private List<StepDto> steps;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }
    public String getProcessName() { return processName; }
    public void setProcessName(String processName) { this.processName = processName; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getDocNo() { return docNo; }
    public void setDocNo(String docNo) { this.docNo = docNo; }
    public Integer getRevNo() { return revNo; }
    public void setRevNo(Integer revNo) { this.revNo = revNo; }
    public Date getRevDate() { return revDate; }
    public void setRevDate(Date revDate) { this.revDate = revDate; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Integer getDivisionId() { return divisionId; }
    public void setDivisionId(Integer divisionId) { this.divisionId = divisionId; }
    public Integer getCompanyId() { return companyId; }
    public void setCompanyId(Integer companyId) { this.companyId = companyId; }
    public List<ConsumableDto> getConsumables() { return consumables; }
    public void setConsumables(List<ConsumableDto> consumables) { this.consumables = consumables; }
    public List<ToolDto> getTools() { return tools; }
    public void setTools(List<ToolDto> tools) { this.tools = tools; }
    public List<SafetyEquipDto> getSafetyEquipment() { return safetyEquipment; }
    public void setSafetyEquipment(List<SafetyEquipDto> safetyEquipment) { this.safetyEquipment = safetyEquipment; }
    public List<ManpowerDto> getManpower() { return manpower; }
    public void setManpower(List<ManpowerDto> manpower) { this.manpower = manpower; }
    public List<StepDto> getSteps() { return steps; }
    public void setSteps(List<StepDto> steps) { this.steps = steps; }

    @Data
    @NoArgsConstructor
    public static class ConsumableDto {
        private Long id;
        private Long productId;
        private String itemNo;
        private String itemName;
        private String uom;
        private BigDecimal qty;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getItemNo() { return itemNo; }
        public void setItemNo(String itemNo) { this.itemNo = itemNo; }
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getQty() { return qty; }
        public void setQty(BigDecimal qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class ToolDto {
        private Long id;
        private Long assetId;
        private String assetNo;
        private String assetName;
        private String uom;
        private BigDecimal qty;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getAssetId() { return assetId; }
        public void setAssetId(Long assetId) { this.assetId = assetId; }
        public String getAssetNo() { return assetNo; }
        public void setAssetNo(String assetNo) { this.assetNo = assetNo; }
        public String getAssetName() { return assetName; }
        public void setAssetName(String assetName) { this.assetName = assetName; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getQty() { return qty; }
        public void setQty(BigDecimal qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class SafetyEquipDto {
        private Long id;
        private Long assetId;
        private String assetNo;
        private String assetName;
        private String uom;
        private BigDecimal qty;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getAssetId() { return assetId; }
        public void setAssetId(Long assetId) { this.assetId = assetId; }
        public String getAssetNo() { return assetNo; }
        public void setAssetNo(String assetNo) { this.assetNo = assetNo; }
        public String getAssetName() { return assetName; }
        public void setAssetName(String assetName) { this.assetName = assetName; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getQty() { return qty; }
        public void setQty(BigDecimal qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class ManpowerDto {
        private Long id;
        private Long departmentId;
        private String departmentName;
        private Long designationId;
        private String designationName;
        private Integer qty;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Long getDesignationId() { return designationId; }
        public void setDesignationId(Long designationId) { this.designationId = designationId; }
        public String getDesignationName() { return designationName; }
        public void setDesignationName(String designationName) { this.designationName = designationName; }
        public Integer getQty() { return qty; }
        public void setQty(Integer qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class StepDto {
        private Long id;
        private Integer stepNo;
        private Integer spendingMinutes;
        private String requiredItems;
        private String procedureDescription;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getStepNo() { return stepNo; }
        public void setStepNo(Integer stepNo) { this.stepNo = stepNo; }
        public Integer getSpendingMinutes() { return spendingMinutes; }
        public void setSpendingMinutes(Integer spendingMinutes) { this.spendingMinutes = spendingMinutes; }
        public String getRequiredItems() { return requiredItems; }
        public void setRequiredItems(String requiredItems) { this.requiredItems = requiredItems; }
        public String getProcedureDescription() { return procedureDescription; }
        public void setProcedureDescription(String procedureDescription) { this.procedureDescription = procedureDescription; }
    }
}
