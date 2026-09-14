package com.autonoma.erp.modules.master.admin.controller;

import com.autonoma.erp.modules.master.admin.entity.MstUom;
import com.autonoma.erp.modules.master.admin.repository.MstUomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/admin/uom")
public class MstUomController {

    private final MstUomRepository repository;

    public MstUomController(MstUomRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<MstUom>> getAllUoms() {
        try {
            List<MstUom> items = repository.findAll();
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{uomCode}")
    public ResponseEntity<MstUom> getUomByCode(@PathVariable String uomCode) {
        try {
            return repository.findById(uomCode)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<?> createUom(@RequestBody MstUom uom) {
        try {
            if (uom.getUomCode() != null && repository.existsById(uom.getUomCode())) {
                return ResponseEntity.badRequest().body("UOM code already exists");
            }
            MstUom saved = repository.save(uom);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create UOM: " + e.getMessage());
        }
    }

    @PutMapping("/{uomCode}")
    public ResponseEntity<?> updateUom(@PathVariable String uomCode, @RequestBody MstUom uom) {
        try {
            return repository.findById(uomCode)
                    .map(existing -> {
                        existing.setUomDescription(uom.getUomDescription());
                        existing.setStatus(uom.getStatus());

                        MstUom updated = repository.save(existing);
                        return ResponseEntity.ok(updated);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update UOM: " + e.getMessage());
        }
    }

    @DeleteMapping("/{uomCode}")
    public ResponseEntity<?> deleteUom(@PathVariable String uomCode) {
        try {
            if (!repository.existsById(uomCode)) {
                return ResponseEntity.notFound().build();
            }
            repository.deleteById(uomCode);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete UOM: " + e.getMessage());
        }
    }
}
