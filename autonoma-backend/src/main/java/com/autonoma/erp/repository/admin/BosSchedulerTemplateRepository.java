package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.BosSchedulerTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BosSchedulerTemplateRepository extends JpaRepository<BosSchedulerTemplate, Long> {
    List<BosSchedulerTemplate> findByTemplateTypeAndIsActive(String templateType, Boolean isActive);
}
