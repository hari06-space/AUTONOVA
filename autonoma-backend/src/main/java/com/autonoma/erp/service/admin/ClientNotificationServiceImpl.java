package com.autonoma.erp.service.admin;

import com.autonoma.erp.dto.admin.ClientNotificationDTO;
import com.autonoma.erp.dto.admin.ClientNotificationLogDTO;
import com.autonoma.erp.entity.admin.ClientNotification;
import com.autonoma.erp.entity.admin.ClientNotificationLog;
import com.autonoma.erp.repository.admin.ClientNotificationLogRepository;
import com.autonoma.erp.repository.admin.ClientNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ClientNotificationServiceImpl implements ClientNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(ClientNotificationServiceImpl.class);

    private final ClientNotificationRepository notificationRepository;
    private final ClientNotificationLogRepository logRepository;
    private final com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher realtimePublisher;

    public ClientNotificationServiceImpl(ClientNotificationRepository notificationRepository,
                                         ClientNotificationLogRepository logRepository,
                                         @org.springframework.context.annotation.Lazy com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher realtimePublisher) {
        this.notificationRepository = notificationRepository;
        this.logRepository = logRepository;
        this.realtimePublisher = realtimePublisher;
    }

    private void notifyRealtimeMutation(String action) {
        try {
            if (realtimePublisher != null) {
                realtimePublisher.publishMutation("ClientNotification", action);
                realtimePublisher.publishMutation("Notification", action);
            }
        } catch (Exception e) {
            logger.warn("Failed to publish realtime notification event: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientNotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClientNotificationDTO getNotificationById(Long id) {
        ClientNotification entity = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));
        return mapToDTO(entity);
    }

    @Override
    @Transactional
    public ClientNotificationDTO createNotification(ClientNotificationDTO dto, String username) {
        validateNotification(dto);

        ClientNotification entity = new ClientNotification();
        mapToEntity(dto, entity);
        entity.setCreatedBy(username);
        
        // Evaluate initial status based on start/end dates
        LocalDateTime now = LocalDateTime.now();
        if (entity.getEndDateTime().isBefore(now)) {
            entity.setStatus("EXPIRED");
        } else if (entity.getStartDateTime().isAfter(now)) {
            entity.setStatus("SCHEDULED");
        } else {
            entity.setStatus("ACTIVE");
        }

        ClientNotification saved = notificationRepository.save(entity);
        logger.info("Created Client Notification ID: {} with status: {}", saved.getNotificationId(), saved.getStatus());
        notifyRealtimeMutation("CREATED");
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public ClientNotificationDTO updateNotification(Long id, ClientNotificationDTO dto, String username) {
        validateNotification(dto);

        ClientNotification entity = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));

        if ("CANCELLED".equals(entity.getStatus())) {
            throw new IllegalStateException("Cannot edit a cancelled notification.");
        }

        mapToEntity(dto, entity);
        entity.setUpdatedBy(username);

        LocalDateTime now = LocalDateTime.now();
        if (entity.getEndDateTime().isBefore(now)) {
            entity.setStatus("EXPIRED");
        } else if (entity.getStartDateTime().isAfter(now)) {
            entity.setStatus("SCHEDULED");
        } else {
            entity.setStatus("ACTIVE");
        }

        ClientNotification updated = notificationRepository.save(entity);
        logger.info("Updated Client Notification ID: {} to status: {}", updated.getNotificationId(), updated.getStatus());
        notifyRealtimeMutation("UPDATED");
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public ClientNotificationDTO duplicateNotification(Long id, String username) {
        ClientNotification existing = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));

        ClientNotification copy = new ClientNotification();
        copy.setTitle(existing.getTitle() + " (Copy)");
        copy.setMessage(existing.getMessage());
        copy.setType(existing.getType());
        copy.setPriority(existing.getPriority());
        copy.setColorHex(existing.getColorHex());
        copy.setIconName(existing.getIconName());
        copy.setTargetType(existing.getTargetType());
        copy.setTargetClientCodes(existing.getTargetClientCodes());
        copy.setStartDateTime(LocalDateTime.now());
        copy.setEndDateTime(LocalDateTime.now().plusDays(1));
        copy.setIsMandatoryAck(existing.getIsMandatoryAck());
        copy.setStatus("DRAFT");
        copy.setCreatedBy(username);

        ClientNotification saved = notificationRepository.save(copy);
        logger.info("Duplicated Client Notification ID: {} as new ID: {}", id, saved.getNotificationId());
        notifyRealtimeMutation("DUPLICATED");
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public ClientNotificationDTO cancelNotification(Long id, String username) {
        ClientNotification entity = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));

        entity.setStatus("CANCELLED");
        entity.setUpdatedBy(username);
        ClientNotification updated = notificationRepository.save(entity);
        logger.info("Cancelled Client Notification ID: {}", id);
        notifyRealtimeMutation("CANCELLED");
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public ClientNotificationDTO toggleNotificationStatus(Long id, String username) {
        ClientNotification entity = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));

        if ("ACTIVE".equals(entity.getStatus())) {
            entity.setStatus("CANCELLED");
        } else {
            LocalDateTime now = LocalDateTime.now();
            if (entity.getEndDateTime().isBefore(now)) {
                entity.setStatus("EXPIRED");
            } else if (entity.getStartDateTime().isAfter(now)) {
                entity.setStatus("SCHEDULED");
            } else {
                entity.setStatus("ACTIVE");
            }
        }
        entity.setUpdatedBy(username);
        ClientNotification updated = notificationRepository.save(entity);
        logger.info("Toggled status for Client Notification ID: {} to {}", id, updated.getStatus());
        notifyRealtimeMutation("TOGGLED");
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new IllegalArgumentException("Notification not found with ID: " + id);
        }
        notificationRepository.deleteById(id);
        logger.info("Deleted Client Notification ID: {}", id);
        notifyRealtimeMutation("DELETED");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientNotificationDTO> getActiveNotificationsForClient(String clientCode, String userId) {
        LocalDateTime now = LocalDateTime.now();
        List<ClientNotification> activeNotifications = notificationRepository.findCurrentlyActiveNotifications(now);
        if (activeNotifications.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> acknowledgedIds = (clientCode != null && userId != null) 
                ? logRepository.findAcknowledgedNotificationIdsByClientCodeAndUserId(clientCode, userId)
                : Collections.emptySet();

        return activeNotifications.stream()
                .filter(n -> isTargetedForClient(n, clientCode))
                .filter(n -> !acknowledgedIds.contains(n.getNotificationId()))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void recordView(Long notificationId, String clientCode, String userId) {
        if (clientCode == null || clientCode.trim().isEmpty() || "AUTONOMA".equalsIgnoreCase(clientCode.trim())) {
            logger.warn("Skipping notification view log: Invalid or null clientCode received.");
            return;
        }

        ClientNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        Optional<ClientNotificationLog> logOpt = logRepository.findByNotificationIdAndClientCodeAndUserId(notificationId, clientCode, userId);
        ClientNotificationLog log;
        if (logOpt.isPresent()) {
            log = logOpt.get();
        } else {
            log = new ClientNotificationLog();
            log.setNotification(notification);
            log.setClientCode(clientCode.trim());
            log.setUserId(userId);
            log.setStatus("DELIVERED");
        }

        if (log.getViewedAt() == null) {
            log.setViewedAt(LocalDateTime.now());
            if (!"ACKNOWLEDGED".equals(log.getStatus())) {
                log.setStatus("VIEWED");
            }
            logRepository.save(log);
        }
    }

    @Override
    @Transactional
    public void recordAcknowledge(Long notificationId, String clientCode, String userId) {
        if (clientCode == null || clientCode.trim().isEmpty() || "AUTONOMA".equalsIgnoreCase(clientCode.trim())) {
            logger.warn("Skipping notification acknowledge log: Invalid or null clientCode received.");
            return;
        }

        ClientNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        Optional<ClientNotificationLog> logOpt = logRepository.findByNotificationIdAndClientCodeAndUserId(notificationId, clientCode, userId);
        ClientNotificationLog log;
        if (logOpt.isPresent()) {
            log = logOpt.get();
        } else {
            log = new ClientNotificationLog();
            log.setNotification(notification);
            log.setClientCode(clientCode.trim());
            log.setUserId(userId);
            if (log.getViewedAt() == null) {
                log.setViewedAt(LocalDateTime.now());
            }
        }

        log.setAcknowledgedAt(LocalDateTime.now());
        log.setStatus("ACKNOWLEDGED");
        logRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientNotificationLogDTO> getNotificationLogs(Long notificationId) {
        return logRepository.findByNotification_NotificationId(notificationId).stream()
                .map(log -> {
                    ClientNotificationLogDTO dto = new ClientNotificationLogDTO();
                    dto.setLogId(log.getLogId());
                    dto.setNotificationId(log.getNotification().getNotificationId());
                    dto.setClientCode(log.getClientCode());
                    dto.setUserId(log.getUserId());
                    dto.setViewedAt(log.getViewedAt());
                    dto.setAcknowledgedAt(log.getAcknowledgedAt());
                    dto.setStatus(log.getStatus());
                    dto.setCreatedDate(log.getCreatedDate());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void processAutomatedStatusTransitions() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Activate notifications whose start time has arrived
        List<ClientNotification> toActivate = notificationRepository.findNotificationsToActivate(now);
        if (!toActivate.isEmpty()) {
            List<Long> ids = toActivate.stream().map(ClientNotification::getNotificationId).collect(Collectors.toList());
            notificationRepository.activateNotifications(ids);
            logger.info("Scheduler activated {} client notifications: {}", ids.size(), ids);
        }

        // 2. Expire notifications whose end time has passed
        List<ClientNotification> toExpire = notificationRepository.findNotificationsToExpire(now);
        if (!toExpire.isEmpty()) {
            List<Long> ids = toExpire.stream().map(ClientNotification::getNotificationId).collect(Collectors.toList());
            notificationRepository.expireNotifications(ids);
            logger.info("Scheduler expired {} client notifications: {}", ids.size(), ids);
        }
    }

    // Helper Methods

    private void validateNotification(ClientNotificationDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Notification title is required.");
        }
        if (dto.getMessage() == null || dto.getMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("Notification message is required.");
        }
        if (dto.getStartDateTime() == null || dto.getEndDateTime() == null) {
            throw new IllegalArgumentException("Start Date Time and End Date Time are required.");
        }
        if (dto.getEndDateTime().isBefore(dto.getStartDateTime())) {
            throw new IllegalArgumentException("End Date Time cannot be earlier than Start Date Time.");
        }
        if ("SELECTED_CLIENTS".equals(dto.getTargetType()) && (dto.getTargetClientCodes() == null || dto.getTargetClientCodes().trim().isEmpty())) {
            throw new IllegalArgumentException("Target Client Codes must be specified when 'SELECTED_CLIENTS' is chosen.");
        }
    }

    private boolean isTargetedForClient(ClientNotification n, String clientCode) {
        if ("ALL_CLIENTS".equals(n.getTargetType())) {
            return true;
        }
        if (clientCode == null || clientCode.trim().isEmpty() || n.getTargetClientCodes() == null || n.getTargetClientCodes().trim().isEmpty()) {
            return false;
        }
        String cleanCode = clientCode.trim().toUpperCase();
        return Arrays.stream(n.getTargetClientCodes().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .anyMatch(code -> code.equalsIgnoreCase(cleanCode));
    }

    private boolean isAlreadyAcknowledged(Long notificationId, String clientCode, String userId) {
        if (clientCode == null) return false;
        Optional<ClientNotificationLog> logOpt = logRepository.findByNotificationIdAndClientCodeAndUserId(notificationId, clientCode, userId);
        return logOpt.isPresent() && "ACKNOWLEDGED".equals(logOpt.get().getStatus());
    }

    private ClientNotificationDTO mapToDTO(ClientNotification entity) {
        ClientNotificationDTO dto = new ClientNotificationDTO();
        dto.setNotificationId(entity.getNotificationId());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setType(entity.getType());
        dto.setPriority(entity.getPriority());
        dto.setColorHex(entity.getColorHex());
        dto.setIconName(entity.getIconName());
        dto.setTargetType(entity.getTargetType());
        dto.setTargetClientCodes(entity.getTargetClientCodes());
        dto.setStartDateTime(entity.getStartDateTime());
        dto.setEndDateTime(entity.getEndDateTime());
        dto.setStatus(entity.getStatus());
        dto.setIsMandatoryAck(entity.getIsMandatoryAck());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedDate(entity.getUpdatedDate());

        // Count logs
        List<ClientNotificationLog> logs = logRepository.findByNotification_NotificationId(entity.getNotificationId());
        dto.setDeliveredCount((long) logs.size());
        dto.setViewedCount(logs.stream().filter(l -> l.getViewedAt() != null).count());
        dto.setAcknowledgedCount(logs.stream().filter(l -> l.getAcknowledgedAt() != null).count());

        return dto;
    }

    private void mapToEntity(ClientNotificationDTO dto, ClientNotification entity) {
        entity.setTitle(dto.getTitle());
        entity.setMessage(dto.getMessage());
        entity.setType(dto.getType() != null ? dto.getType() : "INFORMATION");
        entity.setPriority(dto.getPriority() != null ? dto.getPriority() : "MEDIUM");
        entity.setColorHex(dto.getColorHex() != null ? dto.getColorHex() : "#3b82f6");
        entity.setIconName(dto.getIconName() != null ? dto.getIconName() : "Info");
        entity.setTargetType(dto.getTargetType() != null ? dto.getTargetType() : "ALL_CLIENTS");
        entity.setTargetClientCodes(dto.getTargetClientCodes());
        entity.setStartDateTime(dto.getStartDateTime());
        entity.setEndDateTime(dto.getEndDateTime());
        entity.setIsMandatoryAck(dto.getIsMandatoryAck() != null ? dto.getIsMandatoryAck() : false);
    }
}
