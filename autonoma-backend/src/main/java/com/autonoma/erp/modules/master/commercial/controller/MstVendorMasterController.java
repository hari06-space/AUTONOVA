package com.autonoma.erp.modules.master.commercial.controller;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.service.MstVendorMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/master/vendors")
public class MstVendorMasterController {

    @Autowired
    private MstVendorMasterService service;

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "system";
    }

    @GetMapping
    public ResponseEntity<List<AccountLedger>> getAllVendors(@RequestParam(required = false) String type) {
        if ("customer".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(service.getActiveCustomers());
        } else if ("supplier".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(service.getActiveSuppliers());
        } else if ("subcon".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(service.getActiveSubcons());
        }
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountLedger> getVendorById(@PathVariable Long id) {
        Optional<AccountLedger> vendor = service.getById(id);
        return vendor.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AccountLedger> createVendor(@RequestBody AccountLedger vendor) {
        return ResponseEntity.ok(service.create(vendor, getCurrentUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountLedger> updateVendor(@PathVariable Long id, @RequestBody AccountLedger vendor) {
        try {
            return ResponseEntity.ok(service.update(id, vendor, getCurrentUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<AccountLedger> toggleActiveStatus(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.toggleActiveStatus(id, getCurrentUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
