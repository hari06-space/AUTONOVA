package com.autonoma.erp.controller.admin;

import com.autonoma.erp.dto.admin.ReportTemplateDTO;
import com.autonoma.erp.model.admin.ReportTemplate;
import com.autonoma.erp.model.admin.ReportTemplateHistory;
import com.autonoma.erp.service.admin.ReportTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/report-templates")
public class ReportTemplateController {

    @Autowired
    private ReportTemplateService reportTemplateService;

    private ReportTemplateDTO convertToDTO(ReportTemplate entity) {
        if (entity == null) return null;
        ReportTemplateDTO dto = new ReportTemplateDTO();
        dto.setId(entity.getId());
        dto.setTemplateName(entity.getTemplateName());
        dto.setTemplateCode(entity.getTemplateCode());
        dto.setTemplateType(entity.getTemplateType());
        dto.setPageId(entity.getPageId());
        dto.setVersion(entity.getVersion());
        dto.setStatus(entity.getStatus());
        dto.setIsDefault(entity.getIsDefault());
        dto.setTemplateConfig(entity.getTemplateConfig());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }

    private ReportTemplate convertToEntity(ReportTemplateDTO dto, ReportTemplate entity) {
        if (entity == null) entity = new ReportTemplate();
        entity.setTemplateName(dto.getTemplateName());
        entity.setTemplateCode(dto.getTemplateCode());
        entity.setTemplateType(dto.getTemplateType());
        entity.setPageId(dto.getPageId());
        if (dto.getVersion() != null) entity.setVersion(dto.getVersion());
        if (dto.getStatus() != null) entity.setStatus(dto.getStatus());
        if (dto.getIsDefault() != null) entity.setIsDefault(dto.getIsDefault());
        entity.setTemplateConfig(dto.getTemplateConfig());
        return entity;
    }

    @GetMapping
    public ResponseEntity<List<ReportTemplateDTO>> getAllTemplates() {
        List<ReportTemplate> templates = reportTemplateService.getAllTemplates();
        List<ReportTemplateDTO> dtos = templates.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/page/{pageId}")
    public ResponseEntity<List<ReportTemplateDTO>> getTemplatesByPage(@PathVariable Integer pageId) {
        List<ReportTemplate> templates = reportTemplateService.getTemplatesByPageId(pageId);
        List<ReportTemplateDTO> dtos = templates.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/page/{pageId}/default")
    public ResponseEntity<ReportTemplateDTO> getDefaultTemplate(@PathVariable Integer pageId) {
        ReportTemplate template = reportTemplateService.getDefaultTemplateByPageId(pageId);
        if (template == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(convertToDTO(template));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportTemplateDTO> getTemplate(@PathVariable Long id) {
        ReportTemplate template = reportTemplateService.getTemplateById(id);
        if (template == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(convertToDTO(template));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ReportTemplateHistory>> getTemplateHistory(@PathVariable Long id) {
        List<ReportTemplateHistory> history = reportTemplateService.getTemplateHistory(id);
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<ReportTemplateDTO> createTemplate(@RequestBody ReportTemplateDTO dto, @RequestHeader(value = "userId", required = false) String userId) {
        ReportTemplate entity = convertToEntity(dto, null);
        entity.setCreatedBy(userId != null ? userId : "SYSTEM");
        entity.setCreatedDate(new Date());
        ReportTemplate saved = reportTemplateService.saveTemplate(entity);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReportTemplateDTO> updateTemplate(@PathVariable Long id, @RequestBody ReportTemplateDTO dto, @RequestHeader(value = "userId", required = false) String userId) {
        ReportTemplate existing = reportTemplateService.getTemplateById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        convertToEntity(dto, existing);
        existing.setUpdatedBy(userId != null ? userId : "SYSTEM");
        existing.setUpdatedDate(new Date());
        ReportTemplate saved = reportTemplateService.saveTemplate(existing);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<ReportTemplateDTO> cloneTemplate(@PathVariable Long id, @RequestHeader(value = "userId", required = false) String userId) {
        try {
            ReportTemplate cloned = reportTemplateService.cloneTemplate(id, userId);
            return ResponseEntity.ok(convertToDTO(cloned));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ReportTemplateDTO> toggleStatus(@PathVariable Long id, @RequestParam Integer status) {
        try {
            ReportTemplate updated = reportTemplateService.toggleStatus(id, status);
            return ResponseEntity.ok(convertToDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        reportTemplateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }
}
