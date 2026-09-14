package com.autonoma.erp.modules.hra.penalty.controller;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.UserCredential;

import com.autonoma.erp.modules.hra.penalty.entity.HraPenalty;
import com.autonoma.erp.modules.hra.penalty.service.HraPenaltyService;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api/hra/penalties")
@CrossOrigin(origins = "*")
public class HraPenaltyController {
    private final HraPenaltyService service;
    private final UserRepository userRepository;
    private final BosUserPageAuthService authService;

    @org.springframework.beans.factory.annotation.Autowired
    public HraPenaltyController(HraPenaltyService service, UserRepository userRepository, BosUserPageAuthService authService) {
        this.service = service;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping
    @RequirePagePermission(pageCode = "HA1290", action = "read")
    public List<HraPenalty> getAll() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "HA1290", "additional1");
            if (!hasCompanyAccess) {
                com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    // If it's a normal user, return only their own penalties unless they are a manager for HA1290
                    boolean isManager = authService.hasPermission(currentUserId, "HA1290", "manager");
                    if (!isManager) {
                        if (user.getEmpId() != null) {
                            return service.getByEmployeeId(user.getEmpId());
                        } else {
                            return Collections.emptyList();
                        }
                    }
                }
            }
        }
        return service.getAll();
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1290", action = "read")
    public ResponseEntity<HraPenalty> getById(@PathVariable Long id) {
        HraPenalty penalty = service.getById(id);
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "HA1290", "additional1");
            if (!hasCompanyAccess) {
                com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    // If it's a normal user, they can only view their own penalty unless they are a manager for HA1290
                    boolean isManager = authService.hasPermission(currentUserId, "HA1290", "manager");
                    if (!isManager) {
                        if (penalty.getEmployee() == null || !penalty.getEmployee().getId().equals(user.getEmpId())) {
                            throw new AccessDeniedException("Access Denied: You do not have permission to view this penalty.");
                        }
                    }
                }
            }
        }
        return ResponseEntity.ok(penalty);
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1290", action = "write")
    public ResponseEntity<HraPenalty> create(@Valid @RequestBody HraPenalty penalty) {
        return ResponseEntity.ok(service.save(penalty));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1290", action = "write")
    public ResponseEntity<HraPenalty> update(@PathVariable Long id, @Valid @RequestBody HraPenalty penalty) {
        return ResponseEntity.ok(service.update(id, penalty));
    }

    @PutMapping("/{id}/short-close")
    @RequirePagePermission(pageCode = "HA1290", action = "write")
    public ResponseEntity<?> shortClose(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String remarks = body.get("remarks");
            HraPenalty result = service.shortClose(id, remarks);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
