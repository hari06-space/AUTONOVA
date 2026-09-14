package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.model.admin.UserSession;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserIdOrderByLoginTimeDesc(String userId);

    Optional<UserSession> findTopByUserIdAndStatusOrderByLoginTimeDesc(String userId, String status);

    List<UserSession> findByUserIdAndStatus(String userId, String status);
    List<UserSession> findByStatus(String status);
    List<UserSession> findByStatusOrderByLoginTimeDesc(String status);

    Optional<UserSession> findBySessionId(String sessionId);
    Optional<UserSession> findBySessionIdAndStatus(String sessionId, String status);
}
