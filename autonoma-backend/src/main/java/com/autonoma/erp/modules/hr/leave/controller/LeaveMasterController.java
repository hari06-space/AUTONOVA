package com.autonoma.erp.modules.hr.leave.controller;

import com.autonoma.erp.modules.hr.leave.entity.LeaveMaster;
import com.autonoma.erp.modules.hr.leave.entity.LeaveTransaction;
import com.autonoma.erp.modules.hr.leave.service.LeaveMasterService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/leave-masters")
@CrossOrigin(origins = "*")
public class LeaveMasterController {

    @Autowired
    private LeaveMasterService service;

    @GetMapping
    @RequirePagePermission(pageCode = "M2350", action = "read")
    public ResponseEntity<List<LeaveMaster>> getAllLeaveMasters() {
        return ResponseEntity.ok(service.getAllLeaveMasters());
    }

    @GetMapping("/transactions")
    @RequirePagePermission(pageCode = "M2350", action = "read")
    public ResponseEntity<List<LeaveTransaction>> getAllTransactions() {
        return ResponseEntity.ok(service.getAllTransactions());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2350", action = "write")
    public ResponseEntity<?> saveLeaveMaster(@RequestBody LeaveMaster leaveMaster) {
        try {
            return ResponseEntity.ok(service.saveLeaveMaster(leaveMaster));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2350", action = "delete")
    public ResponseEntity<?> deleteLeaveMaster(@PathVariable Long id) {
        try {
            service.deleteLeaveMaster(id);
            return ResponseEntity.ok(Map.of("message", "Leave Master record inactivated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
