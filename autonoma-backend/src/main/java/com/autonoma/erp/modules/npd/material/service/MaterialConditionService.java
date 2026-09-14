package com.autonoma.erp.modules.npd.material.service;

import com.autonoma.erp.modules.npd.material.entity.MaterialCondition;
import com.autonoma.erp.modules.npd.material.repository.MaterialConditionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MaterialConditionService {

    @Autowired
    private MaterialConditionRepository repository;

    public List<MaterialCondition> findAll() {
        return repository.findAll();
    }

    public Optional<MaterialCondition> findById(String id) {
        return repository.findById(id);
    }

    public MaterialCondition save(MaterialCondition entity) {
        if (repository.existsById(entity.getCode())) {
            throw new IllegalArgumentException("Material Condition code already exists");
        }
        return repository.save(entity);
    }

    public MaterialCondition update(String code, MaterialCondition entity) {
        return repository.findById(code).map(existing -> {
            existing.setCondition(entity.getCondition());
            existing.setDescription(entity.getDescription());
            existing.setType(entity.getType());
            existing.setStatus(entity.getStatus());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Material Condition not found with code: " + code));
    }

    public void delete(String code) {
        repository.deleteById(code);
    }
}
