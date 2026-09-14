package com.autonoma.erp.modules.hr.loan.controller;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanMaster;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanMasterRepository;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanIssueRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/hr/payroll/loans")
@CrossOrigin(origins = "*")
public class HrLoanMasterController {

    @Autowired
    private HrLoanMasterRepository loanMasterRepository;

    @Autowired
    private HrLoanIssueRepository loanIssueRepository;

    /** Returns the next auto-generated loan code as zero-padded 3-digit string starting from "001" */
    @GetMapping("/next-code")
    public ResponseEntity<String> getNextCode() {
        int next = loanMasterRepository.findMaxLoanCodeAsInt().map(max -> max + 1).orElse(1);
        return ResponseEntity.ok(String.format("%03d", next));
    }

    @GetMapping
    public List<HrLoanMaster> getAll() {
        return loanMasterRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrLoanMaster> getById(@PathVariable Long id) {
        return loanMasterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2340", action = "write")
    public ResponseEntity<?> create(@RequestBody HrLoanMaster loan) {
        if (loanMasterRepository.existsByLoanCode(loan.getLoanCode())) {
            return ResponseEntity.badRequest().body("Loan code " + loan.getLoanCode() + " already exists.");
        }
        if (loanMasterRepository.existsByLoanNameIgnoreCase(loan.getLoanName())) {
            return ResponseEntity.badRequest().body("Loan type \"" + loan.getLoanName() + "\" already exists.");
        }
        if (loan.getMinLimit() != null && loan.getMaxLimit() != null && loan.getMinLimit() > loan.getMaxLimit()) {
            return ResponseEntity.badRequest().body("Min Limit cannot be greater than Max Limit.");
        }
        try {
            return ResponseEntity.ok(loanMasterRepository.save(loan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save loan: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2340", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrLoanMaster loanDetails) {
        return loanMasterRepository.findById(id)
                .map(loan -> {
                    if (loanMasterRepository.existsByLoanCodeAndIdNot(loanDetails.getLoanCode(), id)) {
                        return ResponseEntity.badRequest().body("Loan code " + loanDetails.getLoanCode() + " already exists.");
                    }
                    if (loanMasterRepository.existsByLoanNameIgnoreCaseAndIdNot(loanDetails.getLoanName(), id)) {
                        return ResponseEntity.badRequest().body("Loan type \"" + loanDetails.getLoanName() + "\" already exists.");
                    }
                    if (loanDetails.getMinLimit() != null && loanDetails.getMaxLimit() != null && loanDetails.getMinLimit() > loanDetails.getMaxLimit()) {
                        return ResponseEntity.badRequest().body("Min Limit cannot be greater than Max Limit.");
                    }
                    loan.setLoanCode(loanDetails.getLoanCode());
                    loan.setLoanName(loanDetails.getLoanName());
                    loan.setMinLimit(loanDetails.getMinLimit());
                    loan.setMaxLimit(loanDetails.getMaxLimit());
                    loan.setRemarks(loanDetails.getRemarks());
                    loan.setIsActive(loanDetails.getIsActive());
                    loan.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(loanMasterRepository.save(loan));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2340", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return loanMasterRepository.findById(id)
                .map(loan -> {
                    if (loanIssueRepository.existsByLoanCode(loan.getLoanCode())) {
                        return ResponseEntity.badRequest().body("Cannot delete this loan type because it is currently issued to one or more employees.");
                    }
                    loanMasterRepository.delete(loan);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }
}

