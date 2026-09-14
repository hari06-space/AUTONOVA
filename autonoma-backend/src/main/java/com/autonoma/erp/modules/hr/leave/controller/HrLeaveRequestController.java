package com.autonoma.erp.modules.hr.leave.controller;

import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.hr.leave.service.HrLeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hra/leave-requests")
@CrossOrigin(origins = "*")
public class HrLeaveRequestController {

    @Autowired
    private HrLeaveRequestService service;

    @GetMapping("/me")
    @RequirePagePermission(pageCode = "HA1210", action = "read")
    public List<HrLeaveRequest> getMyRequests() {
        return service.findMyRequests();
    }

    @GetMapping("/pending/manager")
    @RequirePagePermission(pageCode = "HA1220", action = "read")
    public List<HrLeaveRequest> getPendingForManager() {
        return service.findPendingForManager();
    }

    @GetMapping("/pending/hr")
    @RequirePagePermission(pageCode = "HA1230", action = "read")
    public List<HrLeaveRequest> getPendingForHr() {
        return service.findPendingForHr();
    }

    @GetMapping("/all")
    @RequirePagePermission(pageCode = "HA1230", action = "read")
    public List<HrLeaveRequest> getAllRequests() {
        return service.findAllRequests();
    }

    @GetMapping("/approved")
    @RequirePagePermission(pageCode = "M2350", action = "read")
    public List<HrLeaveRequest> getApprovedLeaveRequests() {
        return service.findApprovedLeaveRequests();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrLeaveRequest> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> create(@RequestBody HrLeaveRequest request) {
        try {
            return ResponseEntity.ok(service.create(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrLeaveRequest request) {
        try {
            return ResponseEntity.ok(service.update(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/submit")
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> submit(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.submit(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancel")
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.cancel(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1210", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/conflicts")
    public List<HrLeaveRequest> getConflicts(@PathVariable Long id) {
        return service.findConflicts(id);
    }

    @PatchMapping("/{id}/approve-manager")
    @RequirePagePermission(pageCode = "HA1220", action = "approval")
    public ResponseEntity<?> approveManager(@PathVariable Long id,
                                            @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(service.approveByManager(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject-manager")
    @RequirePagePermission(pageCode = "HA1220", action = "approval")
    public ResponseEntity<?> rejectManager(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(service.rejectByManager(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/approve-hr")
    @RequirePagePermission(pageCode = "HA1230", action = "approval")
    public ResponseEntity<?> approveHr(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(service.approveByHr(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject-hr")
    @RequirePagePermission(pageCode = "HA1230", action = "approval")
    public ResponseEntity<?> rejectHr(@PathVariable Long id,
                                      @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(service.rejectByHr(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
