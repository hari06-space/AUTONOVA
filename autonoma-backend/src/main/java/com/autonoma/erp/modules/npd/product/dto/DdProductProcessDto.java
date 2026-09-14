package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
public class DdProductProcessDto {
    private Long id;
    private Long productId;
    private String partNo;
    private String partName;
    private String category;
    private String drawingNo;
    private String processCode;
    private String processName;
    private String flowImage;
    private Boolean status;
    private String processWhere;
    private BigDecimal outputQty;
    private String outputUom;
    private Boolean autoGrn;
    private Boolean autoInspection;
    private BigDecimal processOutputWeight;
    private Integer division;
    private List<DdProductProcessMachineDto> machines;
    private List<DdProductProcessToolDto> tools;
    private String createdBy;
    private Date createdAt;
    private String updatedBy;
    private Date updatedAt;

    public DdProductProcessDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }

    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDrawingNo() { return drawingNo; }
    public void setDrawingNo(String drawingNo) { this.drawingNo = drawingNo; }

    public String getProcessCode() { return processCode; }
    public void setProcessCode(String processCode) { this.processCode = processCode; }

    public String getProcessName() { return processName; }
    public void setProcessName(String processName) { this.processName = processName; }

    public String getFlowImage() { return flowImage; }
    public void setFlowImage(String flowImage) { this.flowImage = flowImage; }

    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }

    public String getProcessWhere() { return processWhere; }
    public void setProcessWhere(String processWhere) { this.processWhere = processWhere; }

    public BigDecimal getOutputQty() { return outputQty; }
    public void setOutputQty(BigDecimal outputQty) { this.outputQty = outputQty; }

    public String getOutputUom() { return outputUom; }
    public void setOutputUom(String outputUom) { this.outputUom = outputUom; }

    public Boolean getAutoGrn() { return autoGrn; }
    public void setAutoGrn(Boolean autoGrn) { this.autoGrn = autoGrn; }

    public Boolean getAutoInspection() { return autoInspection; }
    public void setAutoInspection(Boolean autoInspection) { this.autoInspection = autoInspection; }

    public BigDecimal getProcessOutputWeight() { return processOutputWeight; }
    public void setProcessOutputWeight(BigDecimal processOutputWeight) { this.processOutputWeight = processOutputWeight; }

    public Integer getDivision() { return division; }
    public void setDivision(Integer division) { this.division = division; }

    public List<DdProductProcessMachineDto> getMachines() { return machines; }
    public void setMachines(List<DdProductProcessMachineDto> machines) { this.machines = machines; }

    public List<DdProductProcessToolDto> getTools() { return tools; }
    public void setTools(List<DdProductProcessToolDto> tools) { this.tools = tools; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
