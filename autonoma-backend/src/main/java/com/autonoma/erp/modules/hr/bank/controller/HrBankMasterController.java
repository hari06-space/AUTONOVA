package com.autonoma.erp.modules.hr.bank.controller;

import com.autonoma.erp.modules.hr.bank.entity.HrBankMaster;
import com.autonoma.erp.modules.hr.bank.repository.HrBankMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/hr/payroll/banks")
@CrossOrigin(origins = "*")
public class HrBankMasterController {

    @Autowired
    private HrBankMasterRepository bankMasterRepository;

    /** Returns the next auto-generated bank code as zero-padded 3-digit string starting from "001" */
    @GetMapping("/next-code")
    public ResponseEntity<String> getNextCode() {
        int next = bankMasterRepository.findMaxBankCodeAsInt().map(max -> max + 1).orElse(1);
        return ResponseEntity.ok(String.format("%03d", next));
    }

    @GetMapping
    public List<HrBankMaster> getAll() {
        return bankMasterRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrBankMaster> getById(@PathVariable Long id) {
        return bankMasterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2320", action = "write")
    public ResponseEntity<?> create(@RequestBody HrBankMaster bank) {
        if (bankMasterRepository.existsByBankCode(bank.getBankCode())) {
            return ResponseEntity.badRequest().body("Bank code " + bank.getBankCode() + " already exists.");
        }
        if (bankMasterRepository.existsByAccountNo(bank.getAccountNo())) {
            return ResponseEntity.badRequest().body("Account number \"" + bank.getAccountNo() + "\" already exists.");
        }

        try {
            bank.setCreatedBy(SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(bankMasterRepository.save(bank));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save bank: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2320", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrBankMaster bankDetails) {
        return bankMasterRepository.findById(id)
                .map(bank -> {
                    if (bankMasterRepository.existsByBankCodeAndIdNot(bankDetails.getBankCode(), id)) {
                        return ResponseEntity.badRequest().body("Bank code " + bankDetails.getBankCode() + " already exists.");
                    }
                    if (bankMasterRepository.existsByAccountNoAndIdNot(bankDetails.getAccountNo(), id)) {
                        return ResponseEntity.badRequest().body("Account number \"" + bankDetails.getAccountNo() + "\" already exists.");
                    }

                    bank.setBankCode(bankDetails.getBankCode());
                    bank.setBankName(bankDetails.getBankName());
                    bank.setAccountNo(bankDetails.getAccountNo());
                    bank.setAccountHolderName(bankDetails.getAccountHolderName());
                    bank.setIfscCode(bankDetails.getIfscCode());
                    bank.setBranchName(bankDetails.getBranchName());
                    bank.setBranchLocation(bankDetails.getBranchLocation());
                    bank.setAccountType(bankDetails.getAccountType());
                    bank.setSwiftCode(bankDetails.getSwiftCode());
                    bank.setMicrCode(bankDetails.getMicrCode());
                    bank.setRemarks(bankDetails.getRemarks());
                    bank.setIsActive(bankDetails.getIsActive());
                    bank.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(bankMasterRepository.save(bank));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2320", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return bankMasterRepository.findById(id)
                .map(bank -> {
                    bankMasterRepository.delete(bank);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }
}
