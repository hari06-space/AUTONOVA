package com.nutech.email.controller;

import com.nutech.email.model.ProcessingRequest;
import com.nutech.email.repository.ProcessingRequestRepository;
import com.nutech.email.service.EmailProcessorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final ProcessingRequestRepository processingRequestRepository;
    private final EmailProcessorService emailProcessorService;

    @PostMapping("/simulate-ingestion")
    public ResponseEntity<ProcessingRequest> simulateIngestion() {
        // Create a fake processing request to test the UI flow
        ProcessingRequest request = ProcessingRequest.builder()
                .emailMessageId("TEST-" + UUID.randomUUID().toString())
                .emailSubject("Inquiry for Ball Bearings")
                .emailFrom("tester@example.com")
                .emailBodyPreview("Hi Nutech, I need 20 units of BRG-6205. Please send a quote.")
                .emailReceivedAt(LocalDateTime.now())
                .status(ProcessingRequest.ProcessingStatus.AWAITING_REVIEW)
                .intent(ProcessingRequest.Intent.QUOTATION_REQUEST)
                .combinedText("Hi Nutech, I need 20 units of BRG-6205. Please send a quote.")
                .extractedPartsJson("[{\"partCode\":\"BRG-6205\",\"quantity\":20}]")
                .build();
        
        return ResponseEntity.ok(processingRequestRepository.save(request));
    }

    @PostMapping("/simulate-email")
    public ResponseEntity<String> simulateEmail(
            @RequestParam String fromEmail, 
            @RequestParam(required = false) String subject) {
        
        try {
            com.microsoft.graph.models.Message msg = new com.microsoft.graph.models.Message();
            msg.setId("TEST-" + UUID.randomUUID().toString());
            msg.setSubject(subject != null ? subject : "Simulated email from " + fromEmail);
            
            com.microsoft.graph.models.Recipient recipient = new com.microsoft.graph.models.Recipient();
            com.microsoft.graph.models.EmailAddress emailAddress = new com.microsoft.graph.models.EmailAddress();
            emailAddress.setAddress(fromEmail);
            emailAddress.setName("Simulated Sender");
            recipient.setEmailAddress(emailAddress);
            msg.setFrom(recipient);
            
            com.microsoft.graph.models.ItemBody body = new com.microsoft.graph.models.ItemBody();
            body.setContent("This is a simulated email body for domain mapping verification.");
            msg.setBody(body);
            msg.setHasAttachments(false);
            
            // Run processing request pipeline
            emailProcessorService.processEmail(msg);
            
            return ResponseEntity.ok("Simulated email from " + fromEmail + " processed. Check processing requests for mapping results.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Simulation failed: " + e.getMessage());
        }
    }
}
