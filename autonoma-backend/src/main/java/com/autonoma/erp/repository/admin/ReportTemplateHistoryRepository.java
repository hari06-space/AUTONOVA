package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.ReportTemplateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportTemplateHistoryRepository extends JpaRepository<ReportTemplateHistory, Long> {
    List<ReportTemplateHistory> findByTemplateIdOrderByVersionDesc(Long templateId);
}
