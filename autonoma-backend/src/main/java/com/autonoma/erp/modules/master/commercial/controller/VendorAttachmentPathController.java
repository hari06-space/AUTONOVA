package com.autonoma.erp.modules.master.commercial.controller;

import com.autonoma.erp.modules.master.commercial.entity.VendorAttachmentPath;
import com.autonoma.erp.modules.master.commercial.repository.VendorAttachmentPathRepository;
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
@RequestMapping("/api/master/vendor/attachment")
@CrossOrigin(origins = "*")
@Tag(name = "Vendor Master - Attachments", description = "Endpoints for managing Vendor attachments")
public class VendorAttachmentPathController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(VendorAttachmentPathController.class);

    @Autowired
    private VendorAttachmentPathRepository attachmentRepository;

    @Autowired
    private FileService fileService;

    @GetMapping("/{pageCode}/{refId}")
    @Operation(summary = "Get Attachments", description = "Fetches a list of attachments for a specific page and refId")
    public List<VendorAttachmentPath> getAttachments(
            @PathVariable String pageCode, 
            @PathVariable Long refId,
            @RequestParam(value = "docType", required = false) String docType) {
        log.info("Fetching vendor attachments for pageCode: {}, refId: {}, docType: {}", pageCode, refId, docType);
        if (docType != null && !docType.trim().isEmpty()) {
            return attachmentRepository.findByPageCodeAndRefIdAndDocType(pageCode, refId, docType);
        }
        return attachmentRepository.findByPageCodeAndRefId(pageCode, refId);
    }

    @PostMapping("/{pageCode}/{refId}")
    @Operation(summary = "Upload Attachments", description = "Uploads multiple files and saves them to VENDOR_ATTACHMENT_PATH")
    public ResponseEntity<?> uploadAttachments(
            @PathVariable String pageCode,
            @PathVariable Long refId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "docType", defaultValue = "GENERAL") String docType) {

        log.info("Uploading {} vendor attachments for pageCode: {}, refId: {}", files.length, pageCode, refId);
        List<VendorAttachmentPath> savedAttachments = new ArrayList<>();
        
        String currentUser = "SYSTEM";
        try {
            String loggedInUser = SecurityUtils.getCurrentUserId();
            if (loggedInUser != null && !loggedInUser.trim().isEmpty()) {
                currentUser = loggedInUser;
            }
        } catch (Exception e) {
            log.warn("Could not determine current user, defaulting to SYSTEM");
        }

        for (MultipartFile file : files) {
            try {
                // Save physical file
                String serverPath = fileService.saveFile(file, "VENDOR_ATTACHMENTS");

                VendorAttachmentPath att = new VendorAttachmentPath();
                att.setPageCode(pageCode);
                att.setRefId(refId);
                att.setFileName(file.getOriginalFilename());
                att.setPath(serverPath);
                att.setDocType(docType);

                Date now = new Date();
                att.setCreatedDate(now);
                att.setUpdatedDate(now);
                att.setCreatedBy(currentUser);
                att.setUpdatedBy(currentUser);
                att.setUpdatedUser(currentUser);

                attachmentRepository.insertAttachmentNative(pageCode, refId, docType, serverPath, file.getOriginalFilename(), currentUser);
                
                // Return a dummy object or fetch it if needed.
                att.setId(System.currentTimeMillis()); // Mock ID for response
                savedAttachments.add(att);
            } catch (Exception e) {
                e.printStackTrace();
                log.error("Failed to upload vendor file: {}", file.getOriginalFilename(), e);
                return ResponseEntity.internalServerError().body("Failed to upload file: " + file.getOriginalFilename() + " - Error: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(savedAttachments);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Attachment", description = "Deletes a specific attachment record")
    public ResponseEntity<?> deleteAttachment(@PathVariable Long id) {
        log.info("Deleting vendor attachment id: {}", id);
        try {
            VendorAttachmentPath att = attachmentRepository.findById(id).orElse(null);
            if (att != null) {
                try {
                    fileService.deleteFile(att.getPath());
                } catch (Exception e) {
                    log.error("Failed to physically delete vendor file: {}", att.getPath(), e);
                    // Continue to delete from DB even if physical delete fails
                }
                attachmentRepository.deleteById(id);
                return ResponseEntity.ok("Deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting vendor attachment id: {}", id, e);
            return ResponseEntity.internalServerError().body("Error deleting attachment: " + e.getMessage());
        }
    }
}
