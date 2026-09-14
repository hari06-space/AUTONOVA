package com.autonoma.erp.modules.master.classification.controller;



import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.master.classification.entity.SubSegment;
import com.autonoma.erp.modules.master.classification.repository.SubSegmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sm/sub-segments")
@CrossOrigin(origins = "*")
public class SubSegmentController {

    @Autowired
    private SubSegmentRepository repository;

    @GetMapping
    public List<SubSegment> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M5280", action = "write")
    public ResponseEntity<?> create(@RequestBody SubSegment item) {
        if (repository.existsBySubSegmentCodeIgnoreCase(item.getSubSegmentCode())) {
            return ResponseEntity.badRequest().body("Sub Segment Code already exists");
        }
        if (repository.existsBySubSegmentNameIgnoreCase(item.getSubSegmentName())) {
            return ResponseEntity.badRequest().body("Sub Segment Name already exists");
        }
        return ResponseEntity.ok(repository.save(item));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M5280", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody SubSegment item) {
        return repository.findById(id)
                .map(existing -> {
                    if (!existing.getSubSegmentCode().equalsIgnoreCase(item.getSubSegmentCode()) && repository.existsBySubSegmentCodeIgnoreCase(item.getSubSegmentCode())) {
                        return ResponseEntity.badRequest().body("Sub Segment Code already exists");
                    }
                    if (!existing.getSubSegmentName().equalsIgnoreCase(item.getSubSegmentName()) && repository.existsBySubSegmentNameIgnoreCase(item.getSubSegmentName())) {
                        return ResponseEntity.badRequest().body("Sub Segment Name already exists");
                    }
                    existing.setSegmentName(item.getSegmentName());
                    existing.setSubSegmentCode(item.getSubSegmentCode());
                    existing.setSubSegmentName(item.getSubSegmentName());
                    existing.setSubSegmentDescription(item.getSubSegmentDescription());
                    existing.setStatus(item.getStatus());
                    existing.setUpdatedBy(item.getUpdatedBy());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M5280", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
