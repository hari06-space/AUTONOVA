package com.autonoma.erp.modules.master.classification.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.master.classification.entity.Segment;
import com.autonoma.erp.modules.master.classification.repository.SegmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sm/segments")
@CrossOrigin(origins = "*")
public class SegmentController {

    @Autowired
    private SegmentRepository repository;

    @GetMapping
    public List<Segment> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M5270", action = "write")
    public ResponseEntity<?> create(@RequestBody Segment item) {
        if (repository.existsBySegmentCodeIgnoreCase(item.getSegmentCode())) {
            return ResponseEntity.badRequest().body("Segment Code already exists");
        }
        if (repository.existsBySegmentNameIgnoreCase(item.getSegmentName())) {
            return ResponseEntity.badRequest().body("Segment Name already exists");
        }
        return ResponseEntity.ok(repository.save(item));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M5270", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Segment item) {
        return repository.findById(id)
                .map(existing -> {
                    if (!existing.getSegmentCode().equalsIgnoreCase(item.getSegmentCode()) && repository.existsBySegmentCodeIgnoreCase(item.getSegmentCode())) {
                        return ResponseEntity.badRequest().body("Segment Code already exists");
                    }
                    if (!existing.getSegmentName().equalsIgnoreCase(item.getSegmentName()) && repository.existsBySegmentNameIgnoreCase(item.getSegmentName())) {
                        return ResponseEntity.badRequest().body("Segment Name already exists");
                    }
                    existing.setSegmentCode(item.getSegmentCode());
                    existing.setSegmentName(item.getSegmentName());
                    existing.setSegmentDescription(item.getSegmentDescription());
                    existing.setStatus(item.getStatus());
                    existing.setUpdatedBy(item.getUpdatedBy());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M5270", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
