package com.autonoma.erp.modules.master.geography.service;

import com.autonoma.erp.modules.master.geography.entity.CityMaster;
import com.autonoma.erp.modules.master.geography.repository.CityMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CityMasterService {

    @Autowired
    private CityMasterRepository repository;

    public List<CityMaster> findAll() {
        return repository.findAll();
    }

    public Optional<CityMaster> findById(String id) {
        return repository.findById(id);
    }

    public CityMaster save(CityMaster entity) {
        if (repository.existsById(entity.getCode())) {
            throw new IllegalArgumentException("City code already exists");
        }
        return repository.save(entity);
    }

    public CityMaster update(String code, CityMaster entity) {
        return repository.findById(code).map(existing -> {
            existing.setCityName(entity.getCityName());
            existing.setStateName(entity.getStateName());
            existing.setStatus(entity.getStatus());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("City not found with code: " + code));
    }

    public void delete(String code) {
        repository.deleteById(code);
    }
}
