package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.SeverityFmeaDto;
import java.util.List;

public interface SeverityFmeaService {
    List<SeverityFmeaDto> getAll();
    SeverityFmeaDto getById(Long id);
    SeverityFmeaDto create(SeverityFmeaDto dto);
    SeverityFmeaDto update(Long id, SeverityFmeaDto dto);
    void delete(Long id);
}
