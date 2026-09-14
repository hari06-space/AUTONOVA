package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkProductProcessDto {
    private Long productId;
    private List<DdProductProcessDto> processes;

    public BulkProductProcessDto() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public List<DdProductProcessDto> getProcesses() { return processes; }
    public void setProcesses(List<DdProductProcessDto> processes) { this.processes = processes; }
}
