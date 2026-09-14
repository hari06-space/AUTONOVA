package com.autonoma.erp.controller;

import com.autonoma.erp.dto.purchase.RfqHeadDTO;
import com.autonoma.erp.dto.purchase.RfqListDTO;
import com.autonoma.erp.service.RfqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rfq")
public class RfqController {

    private final RfqService service;

    @org.springframework.beans.factory.annotation.Autowired
    public RfqController(RfqService service) {
        this.service = service;
    }

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<List<RfqListDTO>> getAllRfqs(@PathVariable Long divisionId) {
        return ResponseEntity.ok(service.getAllRfqs(divisionId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RfqHeadDTO> getRfqById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getRfqById(id));
    }

    @PostMapping
    public ResponseEntity<RfqHeadDTO> createRfq(@RequestBody RfqHeadDTO dto) {
        return ResponseEntity.ok(service.createRfq(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RfqHeadDTO> updateRfq(@PathVariable Long id, @RequestBody RfqHeadDTO dto) {
        return ResponseEntity.ok(service.updateRfq(id, dto));
    }

    @PostMapping("/{id}/send-emails")
    public ResponseEntity<Void> sendEmails(@PathVariable Long id, @RequestBody com.autonoma.erp.dto.purchase.SendRfqEmailDTO dto) {
        service.sendRfqEmails(id, dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/latest-email")
    public ResponseEntity<com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO> getLatestEmail(@PathVariable Long id) {
        return ResponseEntity.ok(service.getLatestEmail(id));
    }

    @GetMapping("/{id}/email-history")
    public ResponseEntity<List<com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO>> getEmailHistory(@PathVariable Long id) {
        return ResponseEntity.ok(service.getEmailHistory(id));
    }

    @PostMapping("/{id}/generate-po")
    public ResponseEntity<Void> generatePo(@PathVariable Long id) {
        service.generatePoFromRfq(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRfq(@PathVariable Long id) {
        service.deleteRfq(id);
        return ResponseEntity.ok().build();
    }

    // Attachment Endpoints
    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<com.autonoma.erp.dto.purchase.RfqAttachmentDTO>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAttachments(id));
    }

    @PostMapping(value = "/{id}/attachments", consumes = { org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<List<com.autonoma.erp.dto.purchase.RfqAttachmentDTO>> uploadAttachments(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam("files") org.springframework.web.multipart.MultipartFile[] files) {
        String username = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.uploadAttachments(id, files, username));
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        service.deleteAttachment(attachmentId);
        return ResponseEntity.ok().build();
    }
}
