package com.autonoma.erp.modules.sm.supplier.controller;

import com.autonoma.erp.modules.sm.supplier.entity.SupplierMaster;
import com.autonoma.erp.modules.sm.supplier.service.SupplierMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import java.util.List;

@RestController
@RequestMapping("/api/sm/suppliers")
@CrossOrigin(origins = "*")
public class SupplierMasterController {

    @Autowired
    private SupplierMasterService service;

    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplierById(@PathVariable String id) {
        if ("next-code".equals(id)) {
            return ResponseEntity.ok(service.getNextSupplierCode());
        }
        try {
            Long numericId = Long.parseLong(id);
            return service.getSupplierById(numericId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid ID format");
        }
    }

    @GetMapping
    public List<com.autonoma.erp.modules.sm.supplier.dto.SupplierMasterListDto> getAllSuppliers() {
        return service.getAllSuppliersProjected();
    }

    @RequirePagePermission(pageCode = "M4110", action = "write")
    @PostMapping
    public SupplierMaster createSupplier(@RequestBody SupplierMaster supplier) {
        return service.saveSupplier(supplier);
    }

    @RequirePagePermission(pageCode = "M4110", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<SupplierMaster> updateSupplier(@PathVariable Long id, @RequestBody SupplierMaster supplier) {
        return service.getSupplierById(id)
                .map(existing -> {
                    supplier.setId(id);
                    supplier.setCreatedDate(existing.getCreatedDate());
                    supplier.setCreatedBy(existing.getCreatedBy());
                    if (supplier.getUpdatedBy() == null) supplier.setUpdatedBy("Admin");
                    return ResponseEntity.ok(service.saveSupplier(supplier));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M4110", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        service.deleteSupplier(id);
        return ResponseEntity.ok().build();
    }
}
