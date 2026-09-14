package com.autonoma.erp.service.admin;

import com.autonoma.erp.dto.admin.ClientNotificationDTO;
import com.autonoma.erp.dto.admin.ClientNotificationLogDTO;

import java.util.List;

public interface ClientNotificationService {

    List<ClientNotificationDTO> getAllNotifications();

    ClientNotificationDTO getNotificationById(Long id);

    ClientNotificationDTO createNotification(ClientNotificationDTO dto, String username);

    ClientNotificationDTO updateNotification(Long id, ClientNotificationDTO dto, String username);

    ClientNotificationDTO duplicateNotification(Long id, String username);

    ClientNotificationDTO cancelNotification(Long id, String username);

    ClientNotificationDTO toggleNotificationStatus(Long id, String username);

    void deleteNotification(Long id);

    List<ClientNotificationDTO> getActiveNotificationsForClient(String clientCode, String userId);

    void recordView(Long notificationId, String clientCode, String userId);

    void recordAcknowledge(Long notificationId, String clientCode, String userId);

    List<ClientNotificationLogDTO> getNotificationLogs(Long notificationId);

    void processAutomatedStatusTransitions();
}
