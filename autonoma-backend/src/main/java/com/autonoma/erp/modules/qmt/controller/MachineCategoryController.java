package com.autonoma.erp.modules.qmt.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qmt.entity.MachineCategory;
import com.autonoma.erp.modules.qmt.service.MachineCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/qmt/machine-categories")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MachineCategoryController {

    @Autowired
    private MachineCategoryService service;

    @RequirePagePermission(pageCode = "M3510")
    @GetMapping
    public List<MachineCategory> getAllCategories() {
        return service.getAllCategories();
    }

    @RequirePagePermission(pageCode = "M3510")
    @GetMapping("/{id}")
    public ResponseEntity<MachineCategory> getCategoryById(@PathVariable Long id) {
        return service.getCategoryById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M3510")
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody MachineCategory category) {
        try {
            MachineCategory created = service.createCategory(category);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @RequirePagePermission(pageCode = "M3510")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody MachineCategory details) {
        try {
            MachineCategory updated = service.updateCategory(id, details);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @RequirePagePermission(pageCode = "M3510")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        try {
            service.deleteCategory(id);
            return ResponseEntity.ok("Category deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
