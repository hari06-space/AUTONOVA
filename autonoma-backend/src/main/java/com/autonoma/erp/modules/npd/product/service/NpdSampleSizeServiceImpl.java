package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.NpdSampleSizeDto;
import com.autonoma.erp.modules.npd.product.entity.NpdSampleSize;
import com.autonoma.erp.modules.npd.product.repository.NpdSampleSizeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NpdSampleSizeServiceImpl implements NpdSampleSizeService {

    private final NpdSampleSizeRepository repository;

    public NpdSampleSizeServiceImpl(NpdSampleSizeRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NpdSampleSizeDto> getAll() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NpdSampleSizeDto getById(Long id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public NpdSampleSizeDto create(NpdSampleSizeDto dto) {
        if (repository.existsBySizeIgnoreCase(dto.getSize().trim())) {
            throw new IllegalArgumentException("Sample Size '" + dto.getSize() + "' already exists.");
        }
        NpdSampleSize entity = new NpdSampleSize();
        entity.setSize(dto.getSize().trim());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        NpdSampleSize saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public NpdSampleSizeDto update(Long id, NpdSampleSizeDto dto) {
        NpdSampleSize existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Record not found with id: " + id));

        if (repository.existsBySizeIgnoreCaseAndIdNot(dto.getSize().trim(), id)) {
            throw new IllegalArgumentException("Sample Size '" + dto.getSize() + "' already exists.");
        }

        existing.setSize(dto.getSize().trim());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        NpdSampleSize saved = repository.save(existing);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Record not found with id: " + id);
        }
        repository.deleteById(id);
    }

    private NpdSampleSizeDto toDto(NpdSampleSize entity) {
        if (entity == null) return null;
        NpdSampleSizeDto dto = new NpdSampleSizeDto();
        dto.setId(entity.getId());
        dto.setSize(entity.getSize());
        dto.setStatus(entity.getStatus());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedAt(entity.getUpdatedDate());
        return dto;
    }
}
