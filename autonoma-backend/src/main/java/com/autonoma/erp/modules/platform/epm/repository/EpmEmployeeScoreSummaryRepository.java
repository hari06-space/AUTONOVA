package com.autonoma.erp.modules.platform.epm.repository;

import com.autonoma.erp.modules.platform.epm.entity.EpmEmployeeScoreSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EpmEmployeeScoreSummaryRepository extends JpaRepository<EpmEmployeeScoreSummary, Long> {
    Optional<EpmEmployeeScoreSummary> findByUserId(Long userId);
}
