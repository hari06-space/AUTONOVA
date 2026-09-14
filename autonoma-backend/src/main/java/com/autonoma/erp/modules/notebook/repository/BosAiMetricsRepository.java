package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.BosAiMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiMetricsRepository extends JpaRepository<BosAiMetrics, Long> {
    List<BosAiMetrics> findBySessionId(String sessionId);
}
