/*
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-08-30
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-01
 * Description: Thin REST controller for HRA offer letters. Persistence, status
 *              resolution and pagination live in HraLetterService; email send
 *              is delegated to OfferLetterEmailService / EmailSendingService.
 */
package com.autonoma.erp.modules.hra.letters.controller;

import com.autonoma.erp.modules.hra.letters.dto.OfferLetterDetailDto;
import com.autonoma.erp.modules.hra.letters.dto.OfferLetterSummaryDto;
import com.autonoma.erp.modules.hra.letters.service.HraLetterService;
import com.autonoma.erp.modules.hra.letters.service.OfferLetterEmailService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/hra/letters")
public class HraLettersController {

    private final HraLetterService letterService;
    private final OfferLetterEmailService offerLetterEmailService;

    public HraLettersController(
            HraLetterService letterService,
            OfferLetterEmailService offerLetterEmailService
    ) {
        this.letterService = letterService;
        this.offerLetterEmailService = offerLetterEmailService;
    }

    @GetMapping("/next-no")
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    public ResponseEntity<?> getNextOfferLetterNo() {
        try {
            String nextNo = letterService.previewNextOfferLetterNo();
            Map<String, String> response = new HashMap<>();
            response.put("offerNo", nextNo);
            response.put("offerLetterNo", nextNo);
            response.put("refNo", nextNo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "SEQUENCE_UNAVAILABLE",
                    "message", "Unable to preview the next Offer Letter number. Prefix credentials may be missing."
            ));
        }
    }

    @GetMapping
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    public Page<OfferLetterSummaryDto> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return letterService.list(type, page, size);
    }

    @GetMapping("/{id:[0-9]+}")
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    public ResponseEntity<OfferLetterDetailDto> getById(@PathVariable Long id) {
        return letterService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1360", action = "write")
    public ResponseEntity<?> save(@RequestBody OfferLetterDetailDto dto) {
        try {
            return ResponseEntity.ok(letterService.save(dto));
        } catch (ObjectOptimisticLockingFailureException | jakarta.persistence.OptimisticLockException ole) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "success", false,
                    "error", "CONFLICT",
                    "message", "This Offer Letter was modified by another user. Please reload and try again."
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "BAD_REQUEST",
                    "message", ex.getMessage() != null ? ex.getMessage() : "Failed to save Offer Letter."
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "BAD_REQUEST",
                    "message", ex.getMessage() != null ? ex.getMessage() : "Failed to save Offer Letter."
            ));
        }
    }

    @GetMapping("/email-sender-info")
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    public ResponseEntity<?> getEmailSenderInfo() {
        return ResponseEntity.ok(offerLetterEmailService.getEmailSenderInfo());
    }

    @PostMapping("/email-template-preview")
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    public ResponseEntity<?> previewEmailTemplate(
            @RequestBody(required = false) Map<String, Object> payload,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        return ResponseEntity.ok(offerLetterEmailService.previewOfferLetterEmail(payload, request));
    }

    @PostMapping("/send-offer-letter")
    @RequirePagePermission(pageCode = "HA1360", action = "write")
    public ResponseEntity<?> sendOfferLetter(
            @RequestBody Map<String, Object> payload,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        return ResponseEntity.ok(offerLetterEmailService.sendOfferLetterEmail(payload, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1360", action = "write")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return letterService.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }
}
