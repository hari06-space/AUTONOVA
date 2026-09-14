package com.autonoma.erp.modules.hra.recruitment.controller;

import com.autonoma.erp.modules.hra.recruitment.entity.InterviewMaster;
import com.autonoma.erp.modules.hra.recruitment.service.InterviewMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/hr/interview-master")
@CrossOrigin(origins = "*")
public class InterviewMasterController {

    @Autowired
    private InterviewMasterService service;

    @GetMapping
    @RequirePagePermission(pageCode = "M2110", action = "read")
    public ResponseEntity<List<InterviewMaster>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/next-sequence")
    @RequirePagePermission(pageCode = "M2110", action = "read")
    public ResponseEntity<Long> getNextSequence() {
        return ResponseEntity.ok(service.getNextSequence());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "M2110", action = "read")
    public ResponseEntity<InterviewMaster> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2110", action = "write")
    public ResponseEntity<?> save(@RequestBody InterviewMaster entity, Principal principal) {
        try {
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2110", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody InterviewMaster entity, Principal principal) {
        try {
            System.out.println("[INTERVIEW-CRITERIA-PUT-DEBUG] id=" + id 
                + ", criteria=" + entity.getCriteriaDetails() 
                + ", levelCodes=" + entity.getLevelCodes() 
                + ", deptCodes=" + entity.getDepartmentCodes());
            entity.setId(id);
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2110", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
