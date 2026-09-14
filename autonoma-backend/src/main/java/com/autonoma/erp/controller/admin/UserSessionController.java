package com.autonoma.erp.controller.admin;

import com.autonoma.erp.model.admin.UserSession;
import com.autonoma.erp.service.admin.UserSessionService;
import com.autonoma.erp.util.SecurityUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-03
 * Description: Controller for Admin Active Session Monitoring and Force Logout endpoints.
 */
@RestController
@RequestMapping("/api/audit/sessions")
public class UserSessionController {

    @Autowired
    private UserSessionService userSessionService;

    @GetMapping
    public ResponseEntity<List<UserSession>> getAllSessions() {
        return ResponseEntity.ok(userSessionService.getAllSessions());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveSessions() {
        return ResponseEntity.ok(userSessionService.getActiveSessionsList());
    }

    @PostMapping("/{id}/force-logout")
    public ResponseEntity<?> forceLogoutSession(@PathVariable("id") Long id) {
        String currentAdmin = SecurityUtils.getCurrentUserId();
        if (currentAdmin == null || currentAdmin.isBlank()) {
            currentAdmin = "ADMIN";
        }
        boolean success = userSessionService.adminForceLogout(id, currentAdmin);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Session terminated successfully."));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Session not found or already terminated."));
        }
    }
}
