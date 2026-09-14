package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.BosSchedulerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BosSchedulerConfigRepository extends JpaRepository<BosSchedulerConfig, Long> {
    List<BosSchedulerConfig> findByIsActive(Boolean isActive);
    Optional<BosSchedulerConfig> findByConfigCode(String configCode);
}
