package com.autonoma.erp.modules.npd.material.service;

import com.autonoma.erp.modules.npd.material.entity.NpdShapeMaster;
import com.autonoma.erp.modules.npd.material.repository.NpdShapeMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NpdShapeMasterService {

    @Autowired
    private NpdShapeMasterRepository repository;

    public List<NpdShapeMaster> getAll() {
        return repository.findAll();
    }

    public Optional<NpdShapeMaster> getByCode(String code) {
        return repository.findById(code);
    }

    public NpdShapeMaster create(NpdShapeMaster shapeMaster) {
        if (repository.existsById(shapeMaster.getCode())) {
            throw new IllegalArgumentException("Shape Master Code already exists");
        }
        return repository.save(shapeMaster);
    }

    public NpdShapeMaster update(String code, NpdShapeMaster shapeMaster) {
        return repository.findById(code)
                .map(existing -> {
                    existing.setShapeName(shapeMaster.getShapeName());
                    existing.setDescription(shapeMaster.getDescription());
                    existing.setDimensionType(shapeMaster.getDimensionType());
                    existing.setStatus(shapeMaster.getStatus() != null ? shapeMaster.getStatus() : existing.getStatus());
                    return repository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Shape Master not found with Code " + code));
    }

    public void delete(String code) {
        if (!repository.existsById(code)) {
            throw new IllegalArgumentException("Shape Master not found with Code " + code);
        }
        repository.deleteById(code);
    }
}
