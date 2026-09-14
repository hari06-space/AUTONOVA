package com.autonoma.erp.modules.npd.material.service;

import com.autonoma.erp.modules.npd.material.entity.NpdMaterialType;
import com.autonoma.erp.modules.npd.material.repository.NpdMaterialTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NpdMaterialTypeService {

    @Autowired
    private NpdMaterialTypeRepository repository;

    public List<NpdMaterialType> getAll() {
        return repository.findAll();
    }

    public Optional<NpdMaterialType> getByCode(String code) {
        return repository.findById(code);
    }

    public NpdMaterialType create(NpdMaterialType materialType) {
        if (repository.existsById(materialType.getCode())) {
            throw new IllegalArgumentException("Material Type Code already exists");
        }
        return repository.save(materialType);
    }

    public NpdMaterialType update(String code, NpdMaterialType materialType) {
        return repository.findById(code)
                .map(existing -> {
                    existing.setTypeName(materialType.getTypeName());
                    existing.setDescription(materialType.getDescription());
                    existing.setDensity(materialType.getDensity());
                    existing.setStatus(materialType.getStatus() != null ? materialType.getStatus() : existing.getStatus());
                    return repository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Material Type not found with Code " + code));
    }

    public void delete(String code) {
        if (!repository.existsById(code)) {
            throw new IllegalArgumentException("Material Type not found with Code " + code);
        }
        repository.deleteById(code);
    }
}
