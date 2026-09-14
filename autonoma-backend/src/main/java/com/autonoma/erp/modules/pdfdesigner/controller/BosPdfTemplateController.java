package com.autonoma.erp.modules.pdfdesigner.controller;

import com.autonoma.erp.modules.pdfdesigner.entity.BosPdfTemplate;
import com.autonoma.erp.modules.pdfdesigner.repository.BosPdfTemplateRepository;
import com.autonoma.erp.modules.pdfdesigner.service.PdfDesignerSchemaService;
import com.autonoma.erp.modules.pdfdesigner.service.PdfGenerationEngine;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/pdf-templates")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "PDF Template Designer Module", description = "No-Code Canvas Report Layout Designer API")
public class BosPdfTemplateController {

    @Autowired
    private BosPdfTemplateRepository repository;

    @Autowired
    private PdfDesignerSchemaService schemaService;

    @Autowired
    private PdfGenerationEngine engine;

    @GetMapping
    @Operation(summary = "Get all PDF templates")
    public List<BosPdfTemplate> getAllTemplates(@RequestParam(required = false) String docType) {
        if (docType != null && !docType.trim().isEmpty()) {
            return repository.findByDocumentType(docType.toUpperCase());
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get PDF template details")
    public ResponseEntity<BosPdfTemplate> getTemplateDetails(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "AD1260", action = "write")
    @Operation(summary = "Save or update a template")
    public ResponseEntity<BosPdfTemplate> saveTemplate(@RequestBody BosPdfTemplate template) {
        String user = "system";
        try {
            user = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {}

        if (template.getRowId() != null) {
            Optional<BosPdfTemplate> existingOpt = repository.findById(template.getRowId());
            if (existingOpt.isPresent()) {
                BosPdfTemplate existing = existingOpt.get();
                existing.setTemplateName(template.getTemplateName());
                existing.setDocumentType(template.getDocumentType());
                existing.setPageSize(template.getPageSize());
                existing.setWidth(template.getWidth());
                existing.setHeight(template.getHeight());
                existing.setTemplateJson(template.getTemplateJson());
                existing.setIsActive(template.getIsActive());
                existing.setIsDefault(template.getIsDefault());
                existing.setCompanyId(template.getCompanyId());
                existing.setBranchId(template.getBranchId());
                existing.setStatus(template.getStatus());
                existing.setVersion(existing.getVersion() + 1);
                existing.setUpdatedBy(user);
                
                // If marked as default, reset others of same type
                if (Boolean.TRUE.equals(existing.getIsDefault())) {
                    resetDefaults(existing.getDocumentType(), existing.getRowId());
                }
                
                return ResponseEntity.ok(repository.save(existing));
            }
        }

        template.setCreatedBy(user);
        template.setVersion(1);
        if (Boolean.TRUE.equals(template.getIsDefault())) {
            template = repository.save(template);
            resetDefaults(template.getDocumentType(), template.getRowId());
        } else {
            template = repository.save(template);
        }
        return ResponseEntity.ok(template);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "AD1260", action = "delete")
    @Operation(summary = "Delete template")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/clone")
    @RequirePagePermission(pageCode = "AD1260", action = "write")
    @Operation(summary = "Clone an existing template")
    public ResponseEntity<BosPdfTemplate> cloneTemplate(@PathVariable Long id) {
        Optional<BosPdfTemplate> sourceOpt = repository.findById(id);
        if (!sourceOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        BosPdfTemplate source = sourceOpt.get();
        String user = "system";
        try {
            user = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {}

        BosPdfTemplate clone = BosPdfTemplate.builder()
                .templateName(source.getTemplateName() + " - Copy")
                .documentType(source.getDocumentType())
                .pageSize(source.getPageSize())
                .width(source.getWidth())
                .height(source.getHeight())
                .templateJson(source.getTemplateJson())
                .isActive(true)
                .isDefault(false)
                .companyId(source.getCompanyId())
                .branchId(source.getBranchId())
                .status("DRAFT")
                .version(1)
                .build();
        clone.setCreatedBy(user);
        return ResponseEntity.ok(repository.save(clone));
    }

    @PostMapping("/{id}/set-default")
    @RequirePagePermission(pageCode = "AD1260", action = "write")
    @Operation(summary = "Set template as default configuration")
    public ResponseEntity<BosPdfTemplate> setDefault(@PathVariable Long id) {
        Optional<BosPdfTemplate> templateOpt = repository.findById(id);
        if (!templateOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        BosPdfTemplate template = templateOpt.get();
        template.setIsDefault(true);
        template.setIsActive(true);
        template.setStatus("ACTIVE");
        template = repository.save(template);
        resetDefaults(template.getDocumentType(), template.getRowId());
        return ResponseEntity.ok(template);
    }

    @GetMapping("/schema/{docType}")
    @Operation(summary = "Get drag-and-drop fields list schema for a document type")
    public List<PdfDesignerSchemaService.SchemaField> getSchema(@PathVariable String docType) {
        return schemaService.getSchemaFields(docType);
    }

    @PostMapping("/preview")
    @Operation(summary = "Render live preview PDF from visual workspace configuration")
    public ResponseEntity<byte[]> previewTemplate(@RequestBody BosPdfTemplate payload) {
        try {
            Map<String, Object> mockData = schemaService.getSampleDataContext(payload.getDocumentType());
            byte[] pdfBytes = engine.generatePdf(payload, mockData);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.builder("inline")
                    .filename("Template_Preview.pdf")
                    .build());
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            // Print error inside a small PDF to prevent UI crash
            try {
                com.itextpdf.text.Document doc = new com.itextpdf.text.Document();
                java.io.ByteArrayOutputStream errBos = new java.io.ByteArrayOutputStream();
                com.itextpdf.text.pdf.PdfWriter.getInstance(doc, errBos);
                doc.open();
                doc.add(new com.itextpdf.text.Paragraph("Failed to render preview PDF:"));
                doc.add(new com.itextpdf.text.Paragraph(e.getMessage() != null ? e.getMessage() : e.toString()));
                doc.close();
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                return new ResponseEntity<>(errBos.toByteArray(), headers, HttpStatus.OK);
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
    }

    private void resetDefaults(String docType, Long activeId) {
        List<BosPdfTemplate> templates = repository.findByDocumentType(docType);
        for (BosPdfTemplate t : templates) {
            if (!t.getRowId().equals(activeId) && Boolean.TRUE.equals(t.getIsDefault())) {
                t.setIsDefault(false);
                repository.save(t);
            }
        }
    }
}
