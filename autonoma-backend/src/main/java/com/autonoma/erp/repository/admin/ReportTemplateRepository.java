package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.ReportTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, Long> {

    List<ReportTemplate> findByPageIdAndStatus(Integer pageId, Integer status);

    Optional<ReportTemplate> findByPageIdAndIsDefaultAndStatus(Integer pageId, Integer isDefault, Integer status);

    Optional<ReportTemplate> findByTemplateCode(String templateCode);

    @Modifying
    @Query("UPDATE ReportTemplate r SET r.isDefault = 0 WHERE r.pageId = :pageId AND r.id != :templateId")
    void clearOtherDefaultsForPage(Integer pageId, Long templateId);
}
