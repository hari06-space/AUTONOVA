package com.autonoma.erp.repository.admin;

import com.autonoma.erp.entity.admin.ClientNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClientNotificationRepository extends JpaRepository<ClientNotification, Long> {

    List<ClientNotification> findByStatus(String status);

    @Query("SELECT n FROM ClientNotification n WHERE n.status = 'ACTIVE' AND n.startDateTime <= :now AND n.endDateTime >= :now ORDER BY n.notificationId DESC")
    List<ClientNotification> findCurrentlyActiveNotifications(@Param("now") LocalDateTime now);

    @Query("SELECT n FROM ClientNotification n WHERE n.status = 'SCHEDULED' AND n.startDateTime <= :now AND n.endDateTime >= :now")
    List<ClientNotification> findNotificationsToActivate(@Param("now") LocalDateTime now);

    @Query("SELECT n FROM ClientNotification n WHERE n.status IN ('ACTIVE', 'SCHEDULED') AND n.endDateTime < :now")
    List<ClientNotification> findNotificationsToExpire(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE ClientNotification n SET n.status = 'ACTIVE' WHERE n.notificationId IN :ids")
    int activateNotifications(@Param("ids") List<Long> ids);

    @Modifying
    @Query("UPDATE ClientNotification n SET n.status = 'EXPIRED' WHERE n.notificationId IN :ids")
    int expireNotifications(@Param("ids") List<Long> ids);
}
