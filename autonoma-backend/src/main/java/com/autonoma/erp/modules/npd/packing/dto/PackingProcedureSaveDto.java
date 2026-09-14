package com.autonoma.erp.modules.npd.packing.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
public class PackingProcedureSaveDto {
    private Long processId;
    private Long productId;
    private String docNo;
    private Integer divisionId;
    private Integer companyId;

    private List<ConsumableSaveDto> consumables;
    private List<ToolSaveDto> tools;
    private List<SafetyEquipSaveDto> safetyEquipment;
    private List<ManpowerSaveDto> manpower;
    private List<StepSaveDto> steps;

    @Data
    @NoArgsConstructor
    public static class ConsumableSaveDto {
        private Long productId;
        private BigDecimal qty;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public BigDecimal getQty() { return qty; }
        public void setQty(BigDecimal qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class ToolSaveDto {
        private Long assetId;
        private BigDecimal qty;

        public Long getAssetId() { return assetId; }
        public void setAssetId(Long assetId) { this.assetId = assetId; }
        public BigDecimal getQty() { return qty; }
        public void setQty(BigDecimal qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class SafetyEquipSaveDto {
        private Long assetId;
        private BigDecimal qty;

        public Long getAssetId() { return assetId; }
        public void setAssetId(Long assetId) { this.assetId = assetId; }
        public BigDecimal getQty() { return qty; }
        public void setQty(BigDecimal qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class ManpowerSaveDto {
        private Long departmentId;
        private Long designationId;
        private Integer qty;

        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public Long getDesignationId() { return designationId; }
        public void setDesignationId(Long designationId) { this.designationId = designationId; }
        public Integer getQty() { return qty; }
        public void setQty(Integer qty) { this.qty = qty; }
    }

    @Data
    @NoArgsConstructor
    public static class StepSaveDto {
        private Integer stepNo;
        private Integer spendingMinutes;
        private String requiredItems;
        private String procedureDescription;

        public Integer getStepNo() { return stepNo; }
        public void setStepNo(Integer stepNo) { this.stepNo = stepNo; }
        public Integer getSpendingMinutes() { return spendingMinutes; }
        public void setSpendingMinutes(Integer spendingMinutes) { this.spendingMinutes = spendingMinutes; }
        public String getRequiredItems() { return requiredItems; }
        public void setRequiredItems(String requiredItems) { this.requiredItems = requiredItems; }
        public String getProcedureDescription() { return procedureDescription; }
        public void setProcedureDescription(String procedureDescription) { this.procedureDescription = procedureDescription; }
    }

    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getDocNo() { return docNo; }
    public void setDocNo(String docNo) { this.docNo = docNo; }
    public Integer getDivisionId() { return divisionId; }
    public void setDivisionId(Integer divisionId) { this.divisionId = divisionId; }
    public Integer getCompanyId() { return companyId; }
    public void setCompanyId(Integer companyId) { this.companyId = companyId; }
    public List<ConsumableSaveDto> getConsumables() { return consumables; }
    public void setConsumables(List<ConsumableSaveDto> consumables) { this.consumables = consumables; }
    public List<ToolSaveDto> getTools() { return tools; }
    public void setTools(List<ToolSaveDto> tools) { this.tools = tools; }
    public List<SafetyEquipSaveDto> getSafetyEquipment() { return safetyEquipment; }
    public void setSafetyEquipment(List<SafetyEquipSaveDto> safetyEquipment) { this.safetyEquipment = safetyEquipment; }
    public List<ManpowerSaveDto> getManpower() { return manpower; }
    public void setManpower(List<ManpowerSaveDto> manpower) { this.manpower = manpower; }
    public List<StepSaveDto> getSteps() { return steps; }
    public void setSteps(List<StepSaveDto> steps) { this.steps = steps; }
}
