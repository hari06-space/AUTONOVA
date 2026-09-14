package com.autonoma.erp.repository.ai;

import com.autonoma.erp.model.ai.BosAiForecastHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiForecastHistoryRepository extends JpaRepository<BosAiForecastHistory, Long> {

    List<BosAiForecastHistory> findByUserIdOrderByCreatedDateDesc(String userId);

    List<BosAiForecastHistory> findByForecastTypeIgnoreCaseOrderByCreatedDateDesc(String forecastType);
}
