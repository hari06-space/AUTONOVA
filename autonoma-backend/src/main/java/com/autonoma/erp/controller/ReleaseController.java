package com.autonoma.erp.controller;

import com.autonoma.erp.model.ReleaseMaster;
import com.autonoma.erp.model.ReleaseDetail;
import com.autonoma.erp.model.UserReleaseRead;
import com.autonoma.erp.service.ReleaseService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/releases")
@CrossOrigin(origins = "*")
public class ReleaseController {

    @Autowired
    private ReleaseService releaseService;

    @GetMapping("/check-unread")
    public ResponseEntity<?> checkUnreadRelease() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("User session not found. Please log in.");
        }
        Optional<ReleaseMaster> latestUnread = releaseService.checkLatestUnreadRelease(currentUserId);
        if (latestUnread.isPresent()) {
            return ResponseEntity.ok(latestUnread.get());
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/acknowledge/{releaseId}")
    public ResponseEntity<?> acknowledgeRelease(
            @PathVariable Long releaseId,
            @RequestParam(required = false, defaultValue = "false") Boolean dontShowAgain) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("User session not found. Please log in.");
        }
        UserReleaseRead ack = releaseService.acknowledgeRelease(currentUserId, releaseId, dontShowAgain);
        return ResponseEntity.ok(ack);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ReleaseMaster>> getReleaseHistory() {
        List<ReleaseMaster> activeReleases = releaseService.getActiveReleases();
        return ResponseEntity.ok(activeReleases);
    }

    @GetMapping("/admin/list")
    public ResponseEntity<List<ReleaseMaster>> getAdminList() {
        List<ReleaseMaster> allReleases = releaseService.getAllReleases();
        return ResponseEntity.ok(allReleases);
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<?> getReleaseById(@PathVariable Long id) {
        Optional<ReleaseMaster> release = releaseService.getReleaseById(id);
        if (release.isPresent()) {
            return ResponseEntity.ok(release.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/admin/save")
    public ResponseEntity<?> saveRelease(@RequestBody ReleaseMaster release) {
        try {
            ReleaseMaster saved = releaseService.saveRelease(release);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save release: " + e.getMessage());
        }
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteRelease(@PathVariable Long id) {
        try {
            releaseService.deleteRelease(id);
            return ResponseEntity.ok().body("Release deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete release: " + e.getMessage());
        }
    }

    @PostMapping("/admin/reset-read/{id}")
    public ResponseEntity<?> resetReadRecords(@PathVariable Long id) {
        try {
            releaseService.resetReadRecords(id);
            return ResponseEntity.ok().body("Read records reset successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to reset read records: " + e.getMessage());
        }
    }

    @GetMapping("/admin/suggest-commits")
    public ResponseEntity<?> suggestCommits(@RequestParam(required = false) String since) {
        try {
            List<ReleaseDetail> suggestions = releaseService.suggestReleaseDetails(since);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to suggest release details: " + e.getMessage());
        }
    }
}
