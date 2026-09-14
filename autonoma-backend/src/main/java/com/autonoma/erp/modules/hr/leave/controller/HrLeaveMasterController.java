package com.autonoma.erp.modules.hr.leave.controller;

import com.autonoma.erp.modules.hr.leave.entity.HrLeaveMaster;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.hr.leave.service.HrLeaveMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/hr/leaves")
@CrossOrigin(origins = "*")
public class HrLeaveMasterController {

    @Autowired
    private HrLeaveMasterService service;

    @GetMapping
    @RequirePagePermission(pageCode = "M2350", action = "read")
    public List<HrLeaveMaster> getAll() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<HrLeaveMaster> getAllActive() {
        return service.findAllActive();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrLeaveMaster> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2350", action = "write")
    public ResponseEntity<?> create(@RequestBody HrLeaveMaster leaveMaster) {
        try {
            return ResponseEntity.ok(service.create(leaveMaster));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2350", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrLeaveMaster leaveMaster) {
        try {
            return ResponseEntity.ok(service.update(id, leaveMaster));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2350", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
