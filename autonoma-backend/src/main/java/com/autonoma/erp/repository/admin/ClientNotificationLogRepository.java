package com.autonoma.erp.repository.admin;

import com.autonoma.erp.entity.admin.ClientNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientNotificationLogRepository extends JpaRepository<ClientNotificationLog, Long> {

    List<ClientNotificationLog> findByNotification_NotificationId(Long notificationId);

    @Query("SELECT l FROM ClientNotificationLog l WHERE l.notification.notificationId = :notificationId AND l.clientCode = :clientCode")
    Optional<ClientNotificationLog> findByNotificationIdAndClientCode(@Param("notificationId") Long notificationId, @Param("clientCode") String clientCode);

    @Query("SELECT l FROM ClientNotificationLog l WHERE l.notification.notificationId = :notificationId AND l.clientCode = :clientCode AND l.userId = :userId")
    Optional<ClientNotificationLog> findByNotificationIdAndClientCodeAndUserId(
            @Param("notificationId") Long notificationId, 
            @Param("clientCode") String clientCode, 
            @Param("userId") String userId);

    @Query("SELECT l.notification.notificationId FROM ClientNotificationLog l WHERE l.clientCode = :clientCode AND l.userId = :userId AND l.status = 'ACKNOWLEDGED'")
    java.util.Set<Long> findAcknowledgedNotificationIdsByClientCodeAndUserId(
            @Param("clientCode") String clientCode,
            @Param("userId") String userId);
}
