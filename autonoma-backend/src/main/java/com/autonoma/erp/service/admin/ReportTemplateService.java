package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.ReportTemplate;
import com.autonoma.erp.model.admin.ReportTemplateHistory;
import com.autonoma.erp.repository.admin.ReportTemplateRepository;
import com.autonoma.erp.repository.admin.ReportTemplateHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReportTemplateService {

    @Autowired
    private ReportTemplateRepository reportTemplateRepository;

    @Autowired
    private ReportTemplateHistoryRepository reportTemplateHistoryRepository;

    public List<ReportTemplate> getAllTemplates() {
        return reportTemplateRepository.findAll();
    }

    public List<ReportTemplate> getTemplatesByPageId(Integer pageId) {
        return reportTemplateRepository.findByPageIdAndStatus(pageId, 1);
    }

    public ReportTemplate getDefaultTemplateByPageId(Integer pageId) {
        return reportTemplateRepository.findByPageIdAndIsDefaultAndStatus(pageId, 1, 1).orElse(null);
    }

    public ReportTemplate getTemplateById(Long id) {
        return reportTemplateRepository.findById(id).orElse(null);
    }

    public List<ReportTemplateHistory> getTemplateHistory(Long templateId) {
        return reportTemplateHistoryRepository.findByTemplateIdOrderByVersionDesc(templateId);
    }

    public ReportTemplate saveTemplate(ReportTemplate template) {
        // If template already exists in database, back up to history and auto-increment version
        if (template.getId() != null) {
            ReportTemplate existing = reportTemplateRepository.findById(template.getId()).orElse(null);
            if (existing != null) {
                ReportTemplateHistory history = new ReportTemplateHistory();
                history.setTemplateId(existing.getId());
                history.setVersion(existing.getVersion());
                history.setTemplateConfig(existing.getTemplateConfig());
                history.setChangeLog("Auto-saved revision prior to v" + (existing.getVersion() + 1));
                history.setCreatedBy(template.getUpdatedBy() != null ? template.getUpdatedBy() : "SYSTEM");
                history.setCreatedDate(new Date());
                reportTemplateHistoryRepository.save(history);

                // Increment version
                template.setVersion(existing.getVersion() + 1);
            }
        } else {
            template.setVersion(1);
        }

        ReportTemplate savedTemplate = reportTemplateRepository.save(template);

        if (savedTemplate.getIsDefault() != null && savedTemplate.getIsDefault() == 1) {
            reportTemplateRepository.clearOtherDefaultsForPage(savedTemplate.getPageId(), savedTemplate.getId());
        }

        return savedTemplate;
    }

    public ReportTemplate cloneTemplate(Long id, String userId) {
        ReportTemplate existing = reportTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        ReportTemplate cloned = new ReportTemplate();
        cloned.setTemplateName(existing.getTemplateName() + " - Copy");
        cloned.setTemplateCode(existing.getTemplateCode() + "_COPY_" + UUID.randomUUID().toString().substring(0, 8));
        cloned.setTemplateType(existing.getTemplateType());
        cloned.setPageId(existing.getPageId());
        cloned.setVersion(1);
        cloned.setStatus(1);
        cloned.setIsDefault(0);
        cloned.setTemplateConfig(existing.getTemplateConfig());
        cloned.setCreatedBy(userId != null ? userId : "SYSTEM");
        cloned.setCreatedDate(new Date());
        
        return reportTemplateRepository.save(cloned);
    }

    public ReportTemplate toggleStatus(Long id, Integer status) {
        ReportTemplate template = reportTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        template.setStatus(status);
        template.setUpdatedDate(new Date());
        return reportTemplateRepository.save(template);
    }

    public void deleteTemplate(Long id) {
        reportTemplateRepository.deleteById(id);
    }
}
