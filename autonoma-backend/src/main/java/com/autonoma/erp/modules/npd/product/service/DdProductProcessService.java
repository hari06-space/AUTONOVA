package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.DdProductProcessDto;
import java.util.List;

public interface DdProductProcessService {
    List<DdProductProcessDto> getAllProcesses();
    DdProductProcessDto getProcessById(Long id);
    DdProductProcessDto createProcess(DdProductProcessDto dto);
    DdProductProcessDto updateProcess(Long id, DdProductProcessDto dto);
    void deleteProcess(Long id);
    List<DdProductProcessDto> getProcessesByProductId(Long productId);
    void bulkSaveProcesses(com.autonoma.erp.modules.npd.product.dto.BulkProductProcessDto dto);
}
