package com.autonoma.erp.controller.admin;

import com.autonoma.erp.model.admin.BosSchedulerTemplate;
import com.autonoma.erp.repository.admin.BosSchedulerTemplateRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/automation-templates")
@CrossOrigin(origins = "*")
@Tag(name = "Automation Designer Template API", description = "Endpoints for managing dynamic layout templates")
public class BosSchedulerTemplateController {

    @Autowired
    private BosSchedulerTemplateRepository repository;

    @GetMapping
    @Operation(summary = "Get all templates")
    public List<BosSchedulerTemplate> getAllTemplates() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get template details")
    public ResponseEntity<BosSchedulerTemplate> getTemplateDetails(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "AD1270", action = "write")
    @Operation(summary = "Save or update a template")
    public ResponseEntity<BosSchedulerTemplate> saveTemplate(@RequestBody BosSchedulerTemplate template) {
        String username = "SUPER BOSS";
        try {
            username = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {
        }

        if (template.getRowId() != null) {
            Optional<BosSchedulerTemplate> existingOpt = repository.findById(template.getRowId());
            if (existingOpt.isPresent()) {
                BosSchedulerTemplate existing = existingOpt.get();
                existing.setTemplateName(template.getTemplateName());
                existing.setTemplateType(template.getTemplateType());
                existing.setSubject(template.getSubject());
                existing.setTemplateJson(template.getTemplateJson());
                existing.setIsActive(template.getIsActive());
                existing.setVersion(existing.getVersion() + 1);
                existing.setUpdatedBy(username);
                return ResponseEntity.ok(repository.save(existing));
            }
        }

        template.setCreatedBy(username);
        template.setVersion(1);
        return ResponseEntity.ok(repository.save(template));
    }

    @PostMapping("/{id}/clone")
    @RequirePagePermission(pageCode = "AD1270", action = "write")
    @Operation(summary = "Clone template")
    public ResponseEntity<BosSchedulerTemplate> cloneTemplate(@PathVariable Long id) {
        Optional<BosSchedulerTemplate> sourceOpt = repository.findById(id);
        if (!sourceOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        BosSchedulerTemplate source = sourceOpt.get();
        String username = "SUPER BOSS";
        try {
            username = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {
        }

        BosSchedulerTemplate clone = new BosSchedulerTemplate();
        clone.setTemplateName(source.getTemplateName() + " - Copy");
        clone.setTemplateType(source.getTemplateType());
        clone.setSubject(source.getSubject());
        clone.setTemplateJson(source.getTemplateJson());
        clone.setIsActive(true);
        clone.setVersion(1);
        clone.setCreatedBy(username);
        return ResponseEntity.ok(repository.save(clone));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "AD1270", action = "delete")
    @Operation(summary = "Delete template")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
