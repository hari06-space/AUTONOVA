package com.autonoma.erp.modules.master.commercial.service;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Service
public class MstVendorMasterService {

    @Autowired
    private AccountLedgerRepository repository;

    @Transactional(readOnly = true)
    public List<AccountLedger> getAll() {
        return repository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<AccountLedger> getActiveCustomers() {
        List<AccountLedger> list = repository.findActiveCustomers();
        if (list.isEmpty()) {
            return repository.findAll().stream()
                .filter(a -> a.getIsActive() == null || Boolean.TRUE.equals(a.getIsActive()))
                .filter(a -> a.getLedgerName() != null && !a.getLedgerName().trim().isEmpty())
                .toList();
        }
        return list;
    }
    
    @Transactional(readOnly = true)
    public List<AccountLedger> getActiveSuppliers() {
        List<AccountLedger> list = repository.findActiveSuppliers();
        if (list.isEmpty()) {
            return repository.findAll().stream()
                .filter(a -> a.getIsActive() == null || Boolean.TRUE.equals(a.getIsActive()))
                .filter(a -> a.getLedgerName() != null && !a.getLedgerName().trim().isEmpty())
                .toList();
        }
        return list;
    }
    
    @Transactional(readOnly = true)
    public List<AccountLedger> getActiveSubcons() {
        return getActiveSuppliers();
    }

    public Optional<AccountLedger> getById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public AccountLedger create(AccountLedger entity, String username) {
        entity.setCreatedBy(username);
        entity.setCreatedDate(LocalDateTime.now());
        if (entity.getIsSupplier() == null) entity.setIsSupplier(true); // Default for Vendor API
        return repository.save(entity);
    }

    @Transactional
    public AccountLedger update(Long id, AccountLedger entity, String username) {
        return repository.findById(id).map(existing -> {
            entity.setId(existing.getId());
            entity.setCreatedBy(existing.getCreatedBy());
            entity.setCreatedDate(existing.getCreatedDate());
            entity.setUpdatedBy(username);
            entity.setUpdatedDate(LocalDateTime.now());
            if (entity.getIsSupplier() == null) entity.setIsSupplier(existing.getIsSupplier());
            return repository.save(entity);
        }).orElseThrow(() -> new RuntimeException("Vendor not found with id " + id));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }
    
    @Transactional
    public AccountLedger toggleActiveStatus(Long id, String username) {
        return repository.findById(id).map(existing -> {
            existing.setIsActive(!existing.getIsActive());
            existing.setUpdatedBy(username);
            existing.setUpdatedDate(LocalDateTime.now());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Vendor not found with id " + id));
    }
}
