package com.autonoma.erp.modules.sm.supplier.service;

import com.autonoma.erp.modules.sm.supplier.entity.SupplierMaster;
import com.autonoma.erp.modules.sm.supplier.repository.SupplierMasterRepository;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class SupplierMasterService {

    @Autowired
    private SupplierMasterRepository repository;

    @Autowired
    private AccountLedgerRepository accountLedgerRepository;

    public List<SupplierMaster> getAllSuppliers() {
        return repository.findAll();
    }

    public List<com.autonoma.erp.modules.sm.supplier.dto.SupplierMasterListDto> getAllSuppliersProjected() {
        return accountLedgerRepository.findByIsSupplierTrueAndIsActiveTrue().stream().map(ledger -> {
            com.autonoma.erp.modules.sm.supplier.dto.SupplierMasterListDto dto = new com.autonoma.erp.modules.sm.supplier.dto.SupplierMasterListDto();
            dto.setId(ledger.getId());
            dto.setSupplierCode(ledger.getCode());
            dto.setSupplierName(ledger.getLedgerName());
            dto.setAddress(ledger.getAddress());
            dto.setEmailId(ledger.getMailId());
            dto.setMobileNo(ledger.getMobileNo());
            dto.setCity(ledger.getCity());
            dto.setState(ledger.getState());
            dto.setCountry(ledger.getCountry());
            dto.setStatus("Active");
            return dto;
        }).collect(Collectors.toList());
    }

    public Optional<SupplierMaster> getSupplierById(Long id) {
        return repository.findById(id);
    }

    public SupplierMaster saveSupplier(SupplierMaster supplier) {
        // Uniqueness checks
        if (supplier.getId() == null) {
            // New record
            if (repository.existsBySupplierName(supplier.getSupplierName())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
            }
            if (supplier.getSupplierCode() != null && !supplier.getSupplierCode().isEmpty()) {
                if (repository.existsBySupplierCode(supplier.getSupplierCode())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
                }
            }
        } else {
            // Update
            if (repository.existsBySupplierNameAndIdNot(supplier.getSupplierName(), supplier.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
            }
            if (supplier.getSupplierCode() != null && !supplier.getSupplierCode().isEmpty()) {
                if (repository.existsBySupplierCodeAndIdNot(supplier.getSupplierCode(), supplier.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
                }
            }
        }

        if (supplier.getSupplierCode() == null || supplier.getSupplierCode().isEmpty()) {
            supplier.setSupplierCode(generateSupplierCode());
        }
        return repository.save(supplier);
    }

    public void deleteSupplier(Long id) {
        repository.deleteById(id);
    }

    public String getNextSupplierCode() {
        return generateSupplierCode();
    }

    private String generateSupplierCode() {
        try {
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            String prefix = "S-" + year + "-";
            
            Optional<SupplierMaster> lastSupplier = repository.findTopBySupplierCodeStartingWithOrderBySupplierCodeDesc(prefix);
            
            if (lastSupplier.isEmpty()) {
                return prefix + "00001";
            }
            
            String lastCode = lastSupplier.get().getSupplierCode();
            String[] parts = lastCode.split("-");
            if (parts.length < 3) return prefix + "00001";
            
            int lastNum = Integer.parseInt(parts[2]);
            return String.format("%s%05d", prefix, lastNum + 1);
        } catch (Exception e) {
            e.printStackTrace(); // Minimal logging to stdout
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            return "S-" + year + "-00001";
        }
    }
}
