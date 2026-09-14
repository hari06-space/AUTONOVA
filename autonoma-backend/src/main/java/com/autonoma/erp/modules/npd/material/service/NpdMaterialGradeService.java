package com.autonoma.erp.modules.npd.material.service;

import com.autonoma.erp.modules.npd.material.entity.NpdMaterialGrade;
import com.autonoma.erp.modules.npd.material.entity.NpdMaterialType;
import com.autonoma.erp.modules.npd.material.repository.NpdMaterialGradeRepository;
import com.autonoma.erp.modules.npd.material.repository.NpdMaterialTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NpdMaterialGradeService {

    @Autowired
    private NpdMaterialGradeRepository repository;

    @Autowired
    private NpdMaterialTypeRepository materialTypeRepository;

    public List<NpdMaterialGrade> getAll() {
        return repository.findAll();
    }

    public Optional<NpdMaterialGrade> getByCode(String code) {
        return repository.findById(code);
    }

    public NpdMaterialGrade create(NpdMaterialGrade materialGrade) {
        if (repository.existsById(materialGrade.getCode())) {
            throw new IllegalArgumentException("Material Grade Code already exists");
        }
        if (materialGrade.getMaterialType() != null && materialGrade.getMaterialType().getCode() != null) {
            NpdMaterialType type = materialTypeRepository.findById(materialGrade.getMaterialType().getCode())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid Material Type Code"));
            materialGrade.setMaterialType(type);
        }
        return repository.save(materialGrade);
    }

    public NpdMaterialGrade update(String code, NpdMaterialGrade materialGrade) {
        return repository.findById(code)
                .map(existing -> {
                    existing.setGradeName(materialGrade.getGradeName());
                    existing.setDescription(materialGrade.getDescription());
                    existing.setDensity(materialGrade.getDensity());
                    if (materialGrade.getMaterialType() != null && materialGrade.getMaterialType().getCode() != null) {
                        NpdMaterialType type = materialTypeRepository.findById(materialGrade.getMaterialType().getCode())
                                .orElseThrow(() -> new IllegalArgumentException("Invalid Material Type Code"));
                        existing.setMaterialType(type);
                    } else {
                        existing.setMaterialType(null);
                    }
                    existing.setStatus(materialGrade.getStatus() != null ? materialGrade.getStatus() : existing.getStatus());
                    return repository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Material Grade not found with Code " + code));
    }

    public void delete(String code) {
        if (!repository.existsById(code)) {
            throw new IllegalArgumentException("Material Grade not found with Code " + code);
        }
        repository.deleteById(code);
    }
}
