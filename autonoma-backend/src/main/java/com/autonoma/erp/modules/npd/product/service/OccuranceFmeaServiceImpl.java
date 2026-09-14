package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.modules.npd.product.dto.OccuranceFmeaDto;
import com.autonoma.erp.modules.npd.product.entity.OccuranceFmea;
import com.autonoma.erp.modules.npd.product.repository.OccuranceFmeaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OccuranceFmeaServiceImpl implements OccuranceFmeaService {

    private final OccuranceFmeaRepository repository;

    public OccuranceFmeaServiceImpl(OccuranceFmeaRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OccuranceFmeaDto> getAll() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OccuranceFmeaDto getById(Long id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public OccuranceFmeaDto create(OccuranceFmeaDto dto) {
        if (repository.existsByProbabilityOfFailureIgnoreCase(dto.getProbabilityOfFailure().trim())) {
            throw new IllegalArgumentException("Probability of Failure '" + dto.getProbabilityOfFailure() + "' already exists.");
        }
        OccuranceFmea entity = new OccuranceFmea();
        entity.setProbabilityOfFailure(dto.getProbabilityOfFailure().trim());
        entity.setLikelyFailureRates(dto.getLikelyFailureRates().trim());
        entity.setRank(dto.getRank());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        OccuranceFmea saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public OccuranceFmeaDto update(Long id, OccuranceFmeaDto dto) {
        OccuranceFmea existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Record not found with id: " + id));

        if (repository.existsByProbabilityOfFailureIgnoreCaseAndIdNot(dto.getProbabilityOfFailure().trim(), id)) {
            throw new IllegalArgumentException("Probability of Failure '" + dto.getProbabilityOfFailure() + "' already exists.");
        }

        existing.setProbabilityOfFailure(dto.getProbabilityOfFailure().trim());
        existing.setLikelyFailureRates(dto.getLikelyFailureRates().trim());
        existing.setRank(dto.getRank());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        OccuranceFmea saved = repository.save(existing);
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

    private OccuranceFmeaDto toDto(OccuranceFmea entity) {
        if (entity == null) return null;
        OccuranceFmeaDto dto = new OccuranceFmeaDto();
        dto.setId(entity.getId());
        dto.setProbabilityOfFailure(entity.getProbabilityOfFailure());
        dto.setLikelyFailureRates(entity.getLikelyFailureRates());
        dto.setRank(entity.getRank());
        dto.setStatus(entity.getStatus());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedAt(entity.getUpdatedDate());
        return dto;
    }
}
