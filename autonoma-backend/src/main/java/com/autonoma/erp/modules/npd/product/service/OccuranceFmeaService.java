package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.OccuranceFmeaDto;
import java.util.List;

public interface OccuranceFmeaService {
    List<OccuranceFmeaDto> getAll();
    OccuranceFmeaDto getById(Long id);
    OccuranceFmeaDto create(OccuranceFmeaDto dto);
    OccuranceFmeaDto update(Long id, OccuranceFmeaDto dto);
    void delete(Long id);
}
