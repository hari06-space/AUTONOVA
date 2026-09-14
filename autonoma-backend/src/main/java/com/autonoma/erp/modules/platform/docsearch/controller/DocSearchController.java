/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: REST controller for document content search, status, and secure streaming.
 */
package com.autonoma.erp.modules.platform.docsearch.controller;

import com.autonoma.erp.modules.platform.docsearch.dto.DbSearchResponseDTO;
import com.autonoma.erp.modules.platform.docsearch.dto.DocIndexStatusDTO;
import com.autonoma.erp.modules.platform.docsearch.dto.DocSearchResponseDTO;
import com.autonoma.erp.modules.platform.docsearch.entity.DocSearchDocument;
import com.autonoma.erp.modules.platform.docsearch.service.DatabaseSearchService;
import com.autonoma.erp.modules.platform.docsearch.service.DocumentSearchService;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.URLConnection;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/document-search")
@RequiredArgsConstructor
public class DocSearchController {

    private final DocumentSearchService documentSearchService;
    private final DatabaseSearchService databaseSearchService;
    private final BosUserPageAuthService pageAuthService;
    private final com.autonoma.erp.modules.npd.product.service.NpdMigrationService npdMigrationService;

    /**
     * Search documents by content.
     */
    @GetMapping
    public ResponseEntity<DocSearchResponseDTO> search(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "module", required = false) String module,
            @RequestParam(value = "fileType", required = false) String fileType,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }

        // Validate basic access to Document Search (DM1010)
        if (currentUserId != null) {
            boolean hasAccess = pageAuthService.hasPermission(currentUserId, "DM1010", "read");
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        DocSearchResponseDTO results = documentSearchService.searchDocuments(query, module, fileType, page, size);
        return ResponseEntity.ok(results);
    }

    /**
     * Search across ERP database tables.
     */
    @GetMapping("/database")
    public ResponseEntity<DbSearchResponseDTO> searchDatabase(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "module", required = false) String module,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }

        if (currentUserId != null) {
            boolean hasAccess = pageAuthService.hasPermission(currentUserId, "DM1010", "read");
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        DbSearchResponseDTO results = databaseSearchService.searchTables(query, module, page, size, currentUserId);
        return ResponseEntity.ok(results);
    }

    /**
     * Stream document file securely without exposing physical file paths.
     */
    @GetMapping("/document/{id}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable("id") Long id) {
        DocSearchDocument doc = documentSearchService.getDocumentById(id);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }

        // Validate user export permission on the document's module/page in BOS_USER_PAGE_AUTH
        if (currentUserId != null) {
            if (doc.getPageCode() == null || !pageAuthService.hasPermission(currentUserId, doc.getPageCode(), "export")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        File physicalFile = documentSearchService.resolvePhysicalFile(doc);
        if (physicalFile == null || !physicalFile.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(physicalFile);
        String mimeType = URLConnection.guessContentTypeFromName(doc.getFileName());
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getFileName() + "\"")
                .body(resource);
    }

    /**
     * Get system indexing status and metrics.
     */
    @GetMapping("/status")
    public ResponseEntity<DocIndexStatusDTO> getStatus() {
        return ResponseEntity.ok(documentSearchService.getStatus());
    }

    /**
     * Trigger indexing of real sample files for POC testing.
     */
    @PostMapping("/poc-index")
    public ResponseEntity<Map<String, Object>> runPocIndex() {
        Map<String, Object> result = documentSearchService.indexPocDocuments();
        return ResponseEntity.ok(result);
    }

    /**
     * Trigger synchronization of all existing attachments into DOC_SEARCH_DOCUMENT for indexing.
     */
    @PostMapping("/sync-existing")
    public ResponseEntity<Map<String, Object>> syncExisting() {
        Map<String, Object> result = documentSearchService.syncExistingAttachments();
        return ResponseEntity.ok(result);
    }

    /**
     * Repair/backfill missing NPD physical files from remote attachment path.
     */
    @PostMapping("/repair-npd-files")
    public ResponseEntity<Map<String, Object>> repairNpdFiles(
            @RequestParam(value = "oldAttachmentPath", required = false) String oldAttachmentPath) {
        Map<String, Object> result = npdMigrationService.repairMissingNpdFiles(oldAttachmentPath);
        return ResponseEntity.ok(result);
    }

    /**
     * Render high-resolution page preview with visual annotations (yellow highlight + red bounding box).
     */
    @GetMapping("/document/{id}/preview-page")
    public ResponseEntity<JsonNode> getPagePreview(
            @PathVariable("id") Long id,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "highlight", defaultValue = "true") boolean highlight) {
        try {
            JsonNode preview = documentSearchService.getDocumentPagePreview(id, page, query, highlight);
            if (preview != null && preview.path("success").asBoolean(false)) {
                return ResponseEntity.ok(preview);
            }
            return ResponseEntity.badRequest().body(preview);
        } catch (Exception e) {
            log.error("Failed to get preview page for doc {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
