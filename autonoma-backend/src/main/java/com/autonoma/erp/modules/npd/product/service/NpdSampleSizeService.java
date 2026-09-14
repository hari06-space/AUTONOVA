package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.NpdSampleSizeDto;
import java.util.List;

public interface NpdSampleSizeService {
    List<NpdSampleSizeDto> getAll();
    NpdSampleSizeDto getById(Long id);
    NpdSampleSizeDto create(NpdSampleSizeDto dto);
    NpdSampleSizeDto update(Long id, NpdSampleSizeDto dto);
    void delete(Long id);
}
