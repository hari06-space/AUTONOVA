package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.DetectionFmeaDto;
import java.util.List;

public interface DetectionFmeaService {
    List<DetectionFmeaDto> getAll();
    DetectionFmeaDto getById(Long id);
    DetectionFmeaDto create(DetectionFmeaDto dto);
    DetectionFmeaDto update(Long id, DetectionFmeaDto dto);
    void delete(Long id);
}
