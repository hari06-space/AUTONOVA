package com.autonoma.erp.modules.platform.notification.controller;

import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.transaction.annotation.Propagation;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class AppNotificationController {

    private final AppNotificationRepository repository;
    private final com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public AppNotificationController(
            AppNotificationRepository repository,
            com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository) {
        this.repository = repository;
        this.auditScheduleRepository = auditScheduleRepository;
    }

    private java.time.LocalDateTime getAuditStartDateTime(java.util.Date date, String timeStr) {
        if (date == null || timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }
        try {
            String trimmed = timeStr.trim().toUpperCase();
            java.time.format.DateTimeFormatter formatter;
            if (trimmed.contains("AM") || trimmed.contains("PM")) {
                String formatted = trimmed.replaceAll("(?i)(\\d{2}:\\d{2})\\s*(AM|PM)", "$1 $2");
                formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);
                java.time.LocalTime time = java.time.LocalTime.parse(formatted, formatter);
                return java.time.LocalDateTime.ofInstant(date.toInstant(), java.time.ZoneId.of("Asia/Kolkata"))
                        .withHour(time.getHour())
                        .withMinute(time.getMinute())
                        .withSecond(0)
                        .withNano(0);
            } else {
                formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
                java.time.LocalTime time = java.time.LocalTime.parse(trimmed, formatter);
                return java.time.LocalDateTime.ofInstant(date.toInstant(), java.time.ZoneId.of("Asia/Kolkata"))
                        .withHour(time.getHour())
                        .withMinute(time.getMinute())
                        .withSecond(0)
                        .withNano(0);
            }
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/unread/{empId}")
    @Transactional(readOnly = true)
    public List<AppNotification> getUnreadNotifications(@PathVariable Long empId) {
        if (empId == 0) {
            return repository.findTop100ByIsReadFalseOrderByCreatedAtDesc();
        }
        return repository.findTop100ByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(empId);
    }

    @GetMapping("/all/{empId}")
    @Transactional(readOnly = true)
    public List<AppNotification> getAllNotifications(@PathVariable Long empId) {
        if (empId == 0) {
            return repository.findTop100ByOrderByCreatedAtDesc();
        }
        return repository.findTop100ByRecipientEmpIdOrderByCreatedAtDesc(empId);
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<AppNotification> markAsRead(@PathVariable Long id) {
        return repository.findById(id).map(notif -> {
            notif.setIsRead(true);
            return ResponseEntity.ok(repository.save(notif));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all/{empId}")
    @Transactional
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long empId) {
        List<AppNotification> unread;
        if (empId == 0) {
            unread = repository.findByIsReadFalseOrderByCreatedAtDesc();
        } else {
            unread = repository.findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(empId);
        }
        unread.forEach(n -> n.setIsRead(true));
        repository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}
