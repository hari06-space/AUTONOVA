package com.autonoma.erp.modules.platform.identity.repository;

import com.autonoma.erp.modules.platform.identity.entity.CliClientHealthLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CliClientHealthLogRepository extends JpaRepository<CliClientHealthLog, Long> {

    List<CliClientHealthLog> findByClientIdAndLoggedAtAfterOrderByLoggedAtAsc(Long clientId, LocalDateTime after);

    @Query("SELECT h FROM CliClientHealthLog h WHERE h.clientId = :clientId ORDER BY h.loggedAt DESC")
    List<CliClientHealthLog> findLatestByClientId(@Param("clientId") Long clientId);
}
