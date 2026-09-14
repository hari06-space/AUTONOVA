package com.autonoma.erp.modules.platform.identity.controller;

import com.autonoma.erp.modules.platform.identity.dto.ClientHealthDTO;
import com.autonoma.erp.modules.platform.identity.dto.ClientMasterDTO;
import com.autonoma.erp.modules.platform.identity.service.ClientHealthService;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/client-health")
@CrossOrigin(origins = "*")
@Tag(name = "Platform - Client Health Monitoring", description = "Endpoints for Client Server Health Monitoring Dashboard, KPIs, Alerts, and Historical Trends")
public class ClientHealthController {

    @Autowired
    private ClientHealthService healthService;

    private void checkAdminLevel5() {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if ("SUPER BOSS".equalsIgnoreCase(userId) || "ADMIN".equalsIgnoreCase(userId)) {
            return;
        }
        com.autonoma.erp.repository.admin.UserRepository userRepo = com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.repository.admin.UserRepository.class);
        if (userRepo != null) {
            String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
                java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepo.findByUserId(userId);
                if (userOpt.isPresent()) {
                    Integer level = userOpt.get().getUserLevel();
                    if (level != null && level >= 5) {
                        return;
                    }
                }
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied. Admin Level 5 or higher required.");
    }

    @Operation(summary = "Get list of clients with health monitoring enabled")
    @GetMapping("/clients")
    public ResponseEntity<List<ClientMasterDTO>> getClientsWithHealthMonitoring() {
        checkAdminLevel5();
        return ResponseEntity.ok(healthService.getClientsWithHealthMonitoring());
    }

    @Operation(summary = "Get live server health metrics & active alerts for a specific client")
    @GetMapping("/{clientCode}")
    public ResponseEntity<ClientHealthDTO> getLiveHealthSummary(@PathVariable String clientCode) {
        checkAdminLevel5();
        return ResponseEntity.ok(healthService.getLiveHealthSummary(clientCode));
    }

    @Operation(summary = "Get historical health trend metrics (CPU, Memory, Disk) for a specific time range")
    @GetMapping("/{clientCode}/trends")
    public ResponseEntity<ClientHealthDTO> getHealthTrends(
            @PathVariable String clientCode,
            @RequestParam(name = "range", defaultValue = "24h") String range) {
        checkAdminLevel5();
        return ResponseEntity.ok(healthService.getHealthTrends(clientCode, range));
    }
}
