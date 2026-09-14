package com.nutech.email.controller;

import com.nutech.email.model.MasterPart;
import com.nutech.email.repository.MasterPartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
public class MasterPartController {

    private final MasterPartRepository masterPartRepository;

    @GetMapping
    public ResponseEntity<List<MasterPart>> getAll() {
        return ResponseEntity.ok(masterPartRepository.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<MasterPart>> searchParts(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(masterPartRepository.searchByCodeOrName(query.trim()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MasterPart> getById(@PathVariable Long id) {
        return masterPartRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MasterPart> create(@RequestBody MasterPart part) {
        if (part.getPartCode() == null || part.getPartName() == null) {
            throw new IllegalArgumentException("Part code and name are required");
        }
        return ResponseEntity.ok(masterPartRepository.save(part));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MasterPart> update(@PathVariable Long id, @RequestBody MasterPart updated) {
        return masterPartRepository.findById(id).map(p -> {
            if (updated.getPartCode() != null) p.setPartCode(updated.getPartCode());
            if (updated.getPartName() != null) p.setPartName(updated.getPartName());
            if (updated.getDescription() != null) p.setDescription(updated.getDescription());
            if (updated.getCategory() != null) p.setCategory(updated.getCategory());
            if (updated.getUnitPrice() != null) p.setUnitPrice(updated.getUnitPrice());
            if (updated.getUom() != null) p.setUom(updated.getUom());
            if (updated.getHsnCode() != null) p.setHsnCode(updated.getHsnCode());
            if (updated.getGstRate() != null) p.setGstRate(updated.getGstRate());
            if (updated.getLeadTimeDays() != null) p.setLeadTimeDays(updated.getLeadTimeDays());
            return ResponseEntity.ok(masterPartRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!masterPartRepository.existsById(id)) return ResponseEntity.notFound().build();
        masterPartRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
