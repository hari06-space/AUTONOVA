package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.entity.QmsAttachmentPath;
import com.autonoma.erp.modules.qms.meeting.repository.QmsAttachmentPathRepository;
import com.autonoma.erp.modules.platform.files.service.FileService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/master/qms/attachment")
@CrossOrigin(origins = "*")
@Tag(name = "QMS - Attachments", description = "Endpoints for managing QMS attachments")
public class QmsAttachmentPathController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(QmsAttachmentPathController.class);

    @Autowired
    private QmsAttachmentPathRepository attachmentRepository;

    @Autowired
    private FileService fileService;

    @GetMapping("/{pageCode}/{refId}")
    @Operation(summary = "Get Attachments", description = "Fetches a list of attachments for a specific page and refId")
    public List<QmsAttachmentPath> getAttachments(
            @PathVariable String pageCode, 
            @PathVariable Long refId,
            @RequestParam(value = "docType", required = false) String docType) {
        log.info("Fetching attachments for pageCode: {}, refId: {}, docType: {}", pageCode, refId, docType);
        List<QmsAttachmentPath> all = attachmentRepository.findByPageCodeAndRefId(pageCode, refId);
        if (docType != null && !docType.trim().isEmpty()) {
            String targetDocType = docType.trim();
            List<QmsAttachmentPath> filtered = new java.util.ArrayList<>();
            for (QmsAttachmentPath path : all) {
                if (path.getDocType() != null && path.getDocType().trim().equalsIgnoreCase(targetDocType)) {
                    filtered.add(path);
                }
            }
            return filtered;
        }
        return all;
    }

    @GetMapping("/{pageCode}/batch")
    @Operation(summary = "Get Attachments Batch", description = "Fetches all attachments for multiple refIds in a single query")
    public java.util.Map<Long, List<QmsAttachmentPath>> getAttachmentsBatch(
            @PathVariable String pageCode,
            @RequestParam("refIds") String refIdsParam) {
        java.util.Map<Long, List<QmsAttachmentPath>> result = new java.util.HashMap<>();
        if (refIdsParam == null || refIdsParam.trim().isEmpty()) {
            return result;
        }
        List<Long> refIds = new java.util.ArrayList<>();
        for (String part : refIdsParam.split(",")) {
            try {
                refIds.add(Long.parseLong(part.trim()));
            } catch (NumberFormatException ignored) {
            }
        }
        if (refIds.isEmpty()) {
            return result;
        }
        List<QmsAttachmentPath> all = attachmentRepository.findByPageCodeAndRefIdIn(pageCode, refIds);
        for (QmsAttachmentPath att : all) {
            result.computeIfAbsent(att.getRefId(), k -> new java.util.ArrayList<>()).add(att);
        }
        return result;
    }

    @PostMapping("/{pageCode}/{refId}")
    @Operation(summary = "Upload Attachments", description = "Uploads multiple files and saves them to QMS_ATTACHMENT_PATH")
    public ResponseEntity<?> uploadAttachments(
            @PathVariable String pageCode,
            @PathVariable Long refId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "docType", defaultValue = "GENERAL") String docType) {

        log.info("Uploading {} attachments for pageCode: {}, refId: {}", files.length, pageCode, refId);
        List<QmsAttachmentPath> savedAttachments = new ArrayList<>();
        
        String currentUser = "Admin";
        try {
            String loggedInUser = SecurityUtils.getCurrentUserId();
            if (loggedInUser != null && !loggedInUser.trim().isEmpty()) {
                currentUser = loggedInUser;
            }
        } catch (Exception e) {
            log.warn("Could not determine current user, defaulting to Admin");
        }

        for (MultipartFile file : files) {
            try {
                // Save physical file
                String moduleName = resolveModuleFromPageCode(pageCode);
                String serverPath = fileService.saveFile(file, moduleName);

                QmsAttachmentPath att = new QmsAttachmentPath();
                att.setPageCode(pageCode);
                att.setRefId(refId);
                att.setFileName(file.getOriginalFilename());
                att.setPath(serverPath);
                att.setDocType(docType);

                Date now = new Date();
                att.setCreatedDate(now);
                att.setUpdatedDate(now);
                att.setCreatedUser(currentUser);
                att.setUpdatedUser(currentUser);

                attachmentRepository.insertAttachmentNative(pageCode, refId, docType, serverPath, file.getOriginalFilename(), currentUser);
                
                // Return a dummy object or fetch it if needed. For now, returning the constructed entity is fine for the response.
                att.setId(System.currentTimeMillis()); // Mock ID for response
                savedAttachments.add(att);
            } catch (Exception e) {
                e.printStackTrace();
                log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
                return ResponseEntity.internalServerError().body("Failed to upload file: " + file.getOriginalFilename() + " - Error: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(savedAttachments);
    }

    private String resolveModuleFromPageCode(String pageCode) {
        if (pageCode == null) return "DEFAULT";
        switch (pageCode.toUpperCase()) {
            case "M1130":
                return "MASTER_QMS_AUDIT_AUDIT_CRITERIA";
            case "M1210":
            case "QM1110":
                return "MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER";
            case "QM1120":
                return "QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL";
            case "M1310":
                return "MASTER_QMS_MEETING_MEETING_MASTER";
            case "QM1310":
                return "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_SCHEDULE";
            case "QM1320":
                return "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_USER_ATTENDANCE";
            case "QM1330":
                return "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING";
            case "QM1340":
                return "QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM";
            case "QM1350":
                return "QUALITY_MANAGEMENT_SYSTEMS_MEETING_MOM_APPROVAL";
            default:
                return "DEFAULT";
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Attachment", description = "Deletes a specific attachment record")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        log.info("Deleting attachment with ID: {}", id);
        // Note: physically deleting the file from disk could be added here if desired.
        attachmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
