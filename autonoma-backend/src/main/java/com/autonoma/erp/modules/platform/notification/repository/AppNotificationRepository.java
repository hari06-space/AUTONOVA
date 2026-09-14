package com.autonoma.erp.modules.platform.notification.repository;

import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientEmpId);
    List<AppNotification> findByRecipientEmpIdOrderByCreatedAtDesc(Long recipientEmpId);
    List<AppNotification> findByIsReadFalseOrderByCreatedAtDesc();
    List<AppNotification> findAllByOrderByCreatedAtDesc();

    List<AppNotification> findTop100ByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientEmpId);
    List<AppNotification> findTop100ByRecipientEmpIdOrderByCreatedAtDesc(Long recipientEmpId);
    List<AppNotification> findTop100ByIsReadFalseOrderByCreatedAtDesc();
    List<AppNotification> findTop100ByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AppNotification n SET n.isRead = true WHERE n.recipientEmpId = :empId AND n.linkUrl LIKE %:urlKeyword% AND n.isRead = false")
    void markAsReadByUrlKeywordAndEmpId(@org.springframework.data.repository.query.Param("urlKeyword") String urlKeyword, @org.springframework.data.repository.query.Param("empId") Long empId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AppNotification n SET n.isRead = true WHERE n.linkUrl LIKE %:urlKeyword% AND n.isRead = false")
    void markAsReadByUrlKeyword(@org.springframework.data.repository.query.Param("urlKeyword") String urlKeyword);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AppNotification n SET n.isRead = true WHERE n.title LIKE %:titleKeyword% AND n.isRead = false")
    void markAsReadByTitleContaining(@org.springframework.data.repository.query.Param("titleKeyword") String titleKeyword);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AppNotification n SET n.isRead = true WHERE n.refType = :refType AND n.refId = :refId AND n.isRead = false")
    void markAsReadByRefTypeAndRefId(@org.springframework.data.repository.query.Param("refType") String refType, @org.springframework.data.repository.query.Param("refId") Long refId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(n) > 0 FROM AppNotification n " +
           "WHERE n.recipientEmpId = :recipientEmpId " +
           "AND n.refType = :refType " +
           "AND n.refId = :refId " +
           "AND n.title LIKE %:titleKeyword%")
    boolean existsByRecipientEmpIdAndRefTypeAndRefIdAndTitleKeyword(
        @org.springframework.data.repository.query.Param("recipientEmpId") Long recipientEmpId,
        @org.springframework.data.repository.query.Param("refType") String refType,
        @org.springframework.data.repository.query.Param("refId") Long refId,
        @org.springframework.data.repository.query.Param("titleKeyword") String titleKeyword
    );

    boolean existsByRecipientEmpIdAndRefTypeAndRefIdAndTitleAndIsReadFalse(Long recipientEmpId, String refType, Long refId, String title);
}
