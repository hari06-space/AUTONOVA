package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.entity.SmAdditionalCharges;
import com.autonoma.erp.modules.sm.sales.repository.SmAdditionalChargesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class SmAdditionalChargesService {

    @Autowired
    private SmAdditionalChargesRepository repository;

    public List<SmAdditionalCharges> getAll() {
        return repository.findAllByOrderByCreatedDateDesc();
    }

    public Optional<SmAdditionalCharges> getById(Long id) {
        return repository.findById(id);
    }

    public SmAdditionalCharges save(SmAdditionalCharges entity) {
        validate(entity);
        return repository.save(entity);
    }

    public SmAdditionalCharges update(Long id, SmAdditionalCharges entity) {
        validate(entity);
        return repository.findById(id).map(existing -> {
            existing.setCharges(entity.getCharges());
            existing.setCalculationType(entity.getCalculationType());
            existing.setStatus(entity.getStatus());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Additional Charge not found with id: " + id));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private void validate(SmAdditionalCharges entity) {
        if (entity == null) {
            throw new IllegalArgumentException("Entity cannot be null");
        }
        if (!StringUtils.hasText(entity.getCharges())) {
            throw new IllegalArgumentException("Charges cannot be null or empty");
        }
        if (!StringUtils.hasText(entity.getCalculationType())) {
            throw new IllegalArgumentException("Calculation Type cannot be null or empty");
        }
        if (entity.getStatus() == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }
    }
}
