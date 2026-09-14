package com.autonoma.erp.modules.qmt.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qmt.entity.Machine;
import com.autonoma.erp.modules.qmt.service.MachineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/qmt/machines")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MachineController {

    @Autowired
    private MachineService service;

    @RequirePagePermission(pageCode = "M3520", action = "read")
    @GetMapping
    public List<com.autonoma.erp.modules.qmt.dto.MachineListDTO> getAllMachines() {
        return service.getAllMachinesProjected();
    }

    @RequirePagePermission(pageCode = "M3520", action = "read")
    @GetMapping("/{id}")
    public ResponseEntity<Machine> getMachineById(@PathVariable Long id) {
        return service.getMachineById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M3520", action = "read")
    @GetMapping("/by-code/{assetId}")
    public ResponseEntity<Machine> getMachineByAssetId(@PathVariable String assetId) {
        return service.getMachineByAssetId(assetId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M3520")
    @PostMapping
    public ResponseEntity<?> createMachine(@RequestBody Machine machine) {
        try {
            Machine created = service.createMachine(machine);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @RequirePagePermission(pageCode = "M3520")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMachine(@PathVariable Long id, @RequestBody Machine machine) {
        try {
            Machine updated = service.updateMachine(id, machine);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @RequirePagePermission(pageCode = "M3520")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMachine(@PathVariable Long id) {
        try {
            service.deleteMachine(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
