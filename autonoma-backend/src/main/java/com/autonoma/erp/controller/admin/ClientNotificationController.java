package com.autonoma.erp.controller.admin;

import com.autonoma.erp.dto.admin.ClientNotificationDTO;
import com.autonoma.erp.dto.admin.ClientNotificationLogDTO;
import com.autonoma.erp.service.admin.ClientNotificationService;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.config.TenantContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class ClientNotificationController {

    private final ClientNotificationService notificationService;
    private final com.autonoma.erp.repository.admin.CompanyCredentialRepository companyCredentialRepository;

    public ClientNotificationController(ClientNotificationService notificationService,
                                        com.autonoma.erp.repository.admin.CompanyCredentialRepository companyCredentialRepository) {
        this.notificationService = notificationService;
        this.companyCredentialRepository = companyCredentialRepository;
    }

    private String resolve6DigitClientCode(String rawCode) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            return null;
        }
        String clean = rawCode.trim();
        // If clean is already a 6-digit number, return it directly
        if (clean.matches("^\\d{6}$")) {
            return clean;
        }
        try {
            // 1. Check if rawCode matches a DB source name (e.g. NAPL_LIVE)
            java.util.Optional<com.autonoma.erp.model.admin.CompanyCredential> compByDb = companyCredentialRepository.findByDbSourceNameIgnoreCase(clean);
            if (compByDb.isPresent() && compByDb.get().getClientCode() != null && !compByDb.get().getClientCode().trim().isEmpty()) {
                return compByDb.get().getClientCode().trim();
            }

            // 2. If rawCode is "AUTONOMA", find the credential mapped to AUTONOMA or fallback to first
            if ("AUTONOMA".equalsIgnoreCase(clean)) {
                java.util.Optional<com.autonoma.erp.model.admin.CompanyCredential> compOpt = companyCredentialRepository.findFirstByOrderByIdAsc();
                if (compOpt.isPresent() && compOpt.get().getClientCode() != null && !compOpt.get().getClientCode().trim().isEmpty()) {
                    return compOpt.get().getClientCode().trim();
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return clean;
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    @GetMapping("/admin")
    public ResponseEntity<List<ClientNotificationDTO>> getAllNotifications(
            @RequestParam(name = "clientCode", required = false) String clientCode) {
        List<ClientNotificationDTO> list = notificationService.getAllNotifications();
        if (clientCode != null && !clientCode.trim().isEmpty()) {
            String resolvedCode = resolve6DigitClientCode(clientCode.trim());
            if (resolvedCode != null && !resolvedCode.isEmpty()) {
                list = list.stream()
                        .filter(n -> "ALL_CLIENTS".equalsIgnoreCase(n.getTargetType()) ||
                                (n.getTargetClientCodes() != null && java.util.Arrays.stream(n.getTargetClientCodes().split(","))
                                        .map(String::trim)
                                        .anyMatch(c -> c.equalsIgnoreCase(resolvedCode))))
                        .collect(java.util.stream.Collectors.toList());
            }
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<ClientNotificationDTO> getNotificationById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(notificationService.getNotificationById(id));
    }

    @PostMapping("/admin")
    public ResponseEntity<ClientNotificationDTO> createNotification(@RequestBody ClientNotificationDTO dto) {
        String username = SecurityUtils.getCurrentUserId();
        normalizeTargetScoping(dto);
        ClientNotificationDTO created = notificationService.createNotification(dto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<ClientNotificationDTO> updateNotification(@PathVariable("id") Long id, @RequestBody ClientNotificationDTO dto) {
        String username = SecurityUtils.getCurrentUserId();
        normalizeTargetScoping(dto);
        ClientNotificationDTO updated = notificationService.updateNotification(id, dto, username);
        return ResponseEntity.ok(updated);
    }

    private void normalizeTargetScoping(ClientNotificationDTO dto) {
        if (dto == null) return;
        if ("ALL_CLIENTS".equalsIgnoreCase(dto.getTargetType())) {
            dto.setTargetType("ALL_CLIENTS");
            dto.setTargetClientCodes(null);
        } else if ("SELECTED_CLIENTS".equalsIgnoreCase(dto.getTargetType())) {
            dto.setTargetType("SELECTED_CLIENTS");
            if (dto.getTargetClientCodes() != null && !dto.getTargetClientCodes().trim().isEmpty()) {
                String normalized = java.util.Arrays.stream(dto.getTargetClientCodes().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(this::resolve6DigitClientCode)
                        .distinct()
                        .collect(java.util.stream.Collectors.joining(","));
                dto.setTargetClientCodes(normalized);
            }
        }
    }

    @PostMapping("/admin/{id}/duplicate")
    public ResponseEntity<ClientNotificationDTO> duplicateNotification(@PathVariable("id") Long id) {
        String username = SecurityUtils.getCurrentUserId();
        ClientNotificationDTO duplicated = notificationService.duplicateNotification(id, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
    }

    @PostMapping("/admin/{id}/cancel")
    public ResponseEntity<ClientNotificationDTO> cancelNotification(@PathVariable("id") Long id) {
        String username = SecurityUtils.getCurrentUserId();
        ClientNotificationDTO cancelled = notificationService.cancelNotification(id, username);
        return ResponseEntity.ok(cancelled);
    }

    @PutMapping("/admin/{id}/toggle-status")
    public ResponseEntity<ClientNotificationDTO> toggleStatus(@PathVariable("id") Long id) {
        String username = SecurityUtils.getCurrentUserId();
        ClientNotificationDTO toggled = notificationService.toggleNotificationStatus(id, username);
        return ResponseEntity.ok(toggled);
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable("id") Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/{id}/logs")
    public ResponseEntity<List<ClientNotificationLogDTO>> getNotificationLogs(@PathVariable("id") Long id) {
        return ResponseEntity.ok(notificationService.getNotificationLogs(id));
    }

    // ==========================================
    // CLIENT APPLICATION ENDPOINTS
    // ==========================================

    @GetMapping("/active")
    public ResponseEntity<List<ClientNotificationDTO>> getActiveNotifications(
            @RequestParam(name = "clientCode", required = false) String clientCode,
            @RequestParam(name = "userId", required = false) String userId) {

        String originalTenant = TenantContextHolder.getTenantId();
        List<ClientNotificationDTO> activeList;
        try {
            TenantContextHolder.setTenantId("AUTONOMA");
            clientCode = resolve6DigitClientCode(clientCode != null && !clientCode.trim().isEmpty() ? clientCode : originalTenant);
            if (userId == null || userId.trim().isEmpty()) {
                userId = SecurityUtils.getCurrentUserId();
            }

            activeList = notificationService.getActiveNotificationsForClient(clientCode, userId);
        } finally {
            TenantContextHolder.setTenantId(originalTenant);
        }
        return ResponseEntity.ok(activeList);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> recordView(
            @PathVariable("id") Long id,
            @RequestParam(name = "clientCode", required = false) String clientCode,
            @RequestParam(name = "userId", required = false) String userId) {

        String originalTenant = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId("AUTONOMA");
            clientCode = resolve6DigitClientCode(clientCode != null && !clientCode.trim().isEmpty() ? clientCode : originalTenant);
            if (userId == null || userId.trim().isEmpty()) {
                userId = SecurityUtils.getCurrentUserId();
            }

            notificationService.recordView(id, clientCode, userId);
        } finally {
            TenantContextHolder.setTenantId(originalTenant);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Void> recordAcknowledge(
            @PathVariable("id") Long id,
            @RequestParam(name = "clientCode", required = false) String clientCode,
            @RequestParam(name = "userId", required = false) String userId) {

        String originalTenant = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId("AUTONOMA");
            clientCode = resolve6DigitClientCode(clientCode != null && !clientCode.trim().isEmpty() ? clientCode : originalTenant);
            if (userId == null || userId.trim().isEmpty()) {
                userId = SecurityUtils.getCurrentUserId();
            }

            notificationService.recordAcknowledge(id, clientCode, userId);
        } finally {
            TenantContextHolder.setTenantId(originalTenant);
        }
        return ResponseEntity.ok().build();
    }
}
