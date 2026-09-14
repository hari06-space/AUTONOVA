package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "DD_PRODUCT_PROCESS", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_DD_PROD_PROC_CODE", columnNames = {"PRODUCT_ID", "PROCESS_CODE"}),
    @UniqueConstraint(name = "UQ_DD_PROD_PROC_NAME", columnNames = {"PRODUCT_ID", "PROCESS_NAME"})
})
@Getter
@Setter
public class DdProductProcess extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PROCESS_CODE", nullable = false, length = 50)
    private String processCode;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "PROCESS_NAME", nullable = false, length = 150)
    private String processName;

    @Column(name = "FLOW_IMAGE", length = 500)
    private String flowImage;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @Column(name = "PROCESS_WHERE", length = 50)
    private String processWhere; // INTERNAL, EXTERNAL, BOTH

    @Column(name = "OUTPUT_QTY", precision = 12, scale = 3)
    private BigDecimal outputQty;

    @Column(name = "OUTPUT_UOM", length = 10)
    private String outputUom;

    @Column(name = "AUTO_GRN", nullable = false)
    private Boolean autoGrn = false;

    @Column(name = "AUTO_INSPECTION", nullable = false)
    private Boolean autoInspection = false;

    @Column(name = "PROCESS_OUTPUT_WEIGHT", precision = 12, scale = 3)
    private BigDecimal processOutputWeight;

    @Column(name = "DIVISION")
    private Integer division;

    @OneToMany(mappedBy = "productProcess", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DdProductProcessMachine> machines = new ArrayList<>();

    @OneToMany(mappedBy = "productProcess", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DdProductProcessTool> tools = new ArrayList<>();

    public void addMachine(DdProductProcessMachine machine) {
        machines.add(machine);
        machine.setProductProcess(this);
    }

    public void removeMachine(DdProductProcessMachine machine) {
        machines.remove(machine);
        machine.setProductProcess(null);
    }

    public void addTool(DdProductProcessTool tool) {
        tools.add(tool);
        tool.setProductProcess(this);
    }

    public void removeTool(DdProductProcessTool tool) {
        tools.remove(tool);
        tool.setProductProcess(null);
    }

    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (this.status == null) {
            this.status = true;
        }
        if (this.autoGrn == null) {
            this.autoGrn = false;
        }
        if (this.autoInspection == null) {
            this.autoInspection = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
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
    public java.math.BigDecimal getOutputQty() { return outputQty; }
    public void setOutputQty(java.math.BigDecimal outputQty) { this.outputQty = outputQty; }
    public String getOutputUom() { return outputUom; }
    public void setOutputUom(String outputUom) { this.outputUom = outputUom; }
    public Boolean getAutoGrn() { return autoGrn; }
    public void setAutoGrn(Boolean autoGrn) { this.autoGrn = autoGrn; }
    public Boolean getAutoInspection() { return autoInspection; }
    public void setAutoInspection(Boolean autoInspection) { this.autoInspection = autoInspection; }
    public java.math.BigDecimal getProcessOutputWeight() { return processOutputWeight; }
    public void setProcessOutputWeight(java.math.BigDecimal processOutputWeight) { this.processOutputWeight = processOutputWeight; }
    public Integer getDivision() { return division; }
    public void setDivision(Integer division) { this.division = division; }
    public java.util.List<DdProductProcessMachine> getMachines() { return machines; }
    public void setMachines(java.util.List<DdProductProcessMachine> machines) { this.machines = machines; }
    public java.util.List<DdProductProcessTool> getTools() { return tools; }
    public void setTools(java.util.List<DdProductProcessTool> tools) { this.tools = tools; }
}
