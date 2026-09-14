package com.autonoma.erp.modules.notebook.controller;

import com.autonoma.erp.modules.notebook.dto.*;
import com.autonoma.erp.modules.notebook.entity.Notebook;
import com.autonoma.erp.modules.notebook.entity.NotebookNote;
import com.autonoma.erp.modules.notebook.entity.NotebookSource;
import com.autonoma.erp.modules.notebook.service.NotebookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support/notebook")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotebookController {

    @Autowired
    private NotebookService service;

    // ─── Notebook CRUD ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> getAllNotebooks() {
        try {
            return ResponseEntity.ok(service.getAllActiveNotebooks());
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyNotebooks(@RequestParam Long ownerId) {
        try {
            return ResponseEntity.ok(service.getNotebooksForUser(ownerId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNotebookById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getNotebookById(id));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createNotebook(@RequestBody NotebookDTO dto) {
        try {
            Notebook created = service.createNotebook(dto);
            return ResponseEntity.ok(created);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNotebook(@PathVariable Long id, @RequestBody NotebookDTO dto) {
        try {
            Notebook updated = service.updateNotebook(id, dto);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotebook(@PathVariable Long id) {
        try {
            service.deleteNotebook(id);
            return ResponseEntity.ok("Notebook deleted successfully.");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── Sources ─────────────────────────────────────────────────────────────

    @GetMapping("/{notebookId}/sources")
    public ResponseEntity<?> getSources(@PathVariable Long notebookId) {
        try {
            return ResponseEntity.ok(service.getSourcesByNotebook(notebookId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/{notebookId}/sources")
    public ResponseEntity<?> addSource(@PathVariable Long notebookId, @RequestBody NotebookSourceDTO dto) {
        try {
            NotebookSource saved = service.addSource(notebookId, dto);
            return ResponseEntity.ok(saved);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Upload PDF / Word / Excel / Image — text is extracted and stored for Gemini grounding */
    @PostMapping(value = "/{notebookId}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long notebookId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("No file provided.");
            }
            NotebookSource saved = service.uploadDocumentAsSource(notebookId, file);
            return ResponseEntity.ok(saved);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    /** Scrape a public URL and add its content as a source for Gemini grounding */
    @PostMapping("/{notebookId}/scrape-url")
    public ResponseEntity<?> scrapeUrl(
            @PathVariable Long notebookId,
            @RequestBody Map<String, String> body) {
        try {
            String url = body.get("url");
            if (url == null || url.isBlank()) {
                return ResponseEntity.badRequest().body("URL is required.");
            }
            NotebookSource saved = service.scrapeUrlAsSource(notebookId, url);
            return ResponseEntity.ok(saved);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Scraping failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/sources/{sourceId}")
    public ResponseEntity<?> removeSource(@PathVariable Long sourceId) {
        try {
            service.removeSource(sourceId);
            return ResponseEntity.ok("Source removed successfully.");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/sources/{sourceId}")
    public ResponseEntity<?> renameSource(@PathVariable Long sourceId, @RequestBody NotebookSourceDTO dto) {
        try {
            NotebookSource updated = service.renameSource(sourceId, dto.getSourceName());
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── Notes ───────────────────────────────────────────────────────────────

    @GetMapping("/{notebookId}/notes")
    public ResponseEntity<?> getNotes(@PathVariable Long notebookId) {
        try {
            return ResponseEntity.ok(service.getNotesByNotebook(notebookId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/{notebookId}/notes")
    public ResponseEntity<?> saveNote(@PathVariable Long notebookId, @RequestBody NotebookNoteDTO dto) {
        try {
            NotebookNote saved = service.saveNote(notebookId, dto);
            return ResponseEntity.ok(saved);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<?> deleteNote(@PathVariable Long noteId) {
        try {
            service.deleteNote(noteId);
            return ResponseEntity.ok("Note deleted successfully.");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── AI Query ────────────────────────────────────────────────────────────

    @PostMapping("/query")
    public ResponseEntity<?> query(@RequestBody NotebookQueryRequest req) {
        try {
            if (req.getNotebookId() == null) {
                return ResponseEntity.badRequest().body("Notebook ID is required");
            }
            NotebookQueryResponse response = service.queryNotebook(req.getNotebookId(), req.getQuery());
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error processing notebook query: " + e.getMessage());
        }
    }

    // ─── Sharing ─────────────────────────────────────────────────────────────

    @GetMapping("/{notebookId}/shares")
    public ResponseEntity<?> getShares(@PathVariable Long notebookId) {
        try {
            return ResponseEntity.ok(service.getSharesForNotebook(notebookId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/{notebookId}/share")
    public ResponseEntity<?> shareNotebook(
            @PathVariable Long notebookId,
            @RequestBody Map<String, Object> body) {
        try {
            Long empId = Long.valueOf(body.get("sharedWithEmpId").toString());
            String permission = body.getOrDefault("permissionLevel", "VIEW").toString();
            return ResponseEntity.ok(service.shareNotebook(notebookId, empId, permission));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Share failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/{notebookId}/share/{empId}")
    public ResponseEntity<?> unshareNotebook(
            @PathVariable Long notebookId,
            @PathVariable Long empId) {
        try {
            service.unshareNotebook(notebookId, empId);
            return ResponseEntity.ok("Notebook unshared successfully.");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // ─── Enterprise Knowledge Base ───────────────────────────────────────────

    @GetMapping("/knowledge")
    public ResponseEntity<?> getEnterpriseKnowledge(@RequestParam Long companyId) {
        try {
            return ResponseEntity.ok(service.getEnterpriseKnowledge(companyId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping(value = "/knowledge/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadKnowledge(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", defaultValue = "GENERAL") String category,
            @RequestParam("companyId") Long companyId) {
        try {
            return ResponseEntity.ok(service.addEnterpriseKnowledge(file, title, category, companyId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/knowledge/scrape-url")
    public ResponseEntity<?> scrapeKnowledgeUrl(@RequestBody Map<String, Object> body) {
        try {
            String url = body.get("url").toString();
            String title = body.getOrDefault("title", "").toString();
            String category = body.getOrDefault("category", "GENERAL").toString();
            Long companyId = Long.valueOf(body.get("companyId").toString());
            return ResponseEntity.ok(service.addEnterpriseKnowledgeFromUrl(url, title, category, companyId));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Scraping failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/knowledge/{id}")
    public ResponseEntity<?> deleteKnowledge(@PathVariable Long id) {
        try {
            service.deleteEnterpriseKnowledge(id);
            return ResponseEntity.ok("Enterprise knowledge deleted.");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/{id}/chat")
    public ResponseEntity<?> getChatHistory(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getChatHistory(id));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to load chat history: " + e.getMessage());
        }
    }
}
