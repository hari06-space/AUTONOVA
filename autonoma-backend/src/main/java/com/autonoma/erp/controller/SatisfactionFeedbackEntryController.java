package com.autonoma.erp.controller;

import com.autonoma.erp.model.SatisfactionFeedbackEntry;
import com.autonoma.erp.model.SatisfactionFeedbackResponse;
import com.autonoma.erp.repository.SatisfactionFeedbackEntryRepository;
import com.autonoma.erp.repository.SatisfactionFeedbackResponseRepository;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/qms/satisfaction-feedback")
@Slf4j
@CrossOrigin(origins = "*")
public class SatisfactionFeedbackEntryController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SatisfactionFeedbackEntryController.class);

    private final SatisfactionFeedbackEntryRepository entryRepository;
    private final SatisfactionFeedbackResponseRepository responseRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public SatisfactionFeedbackEntryController(
            SatisfactionFeedbackEntryRepository entryRepository,
            SatisfactionFeedbackResponseRepository responseRepository) {
        this.entryRepository = entryRepository;
        this.responseRepository = responseRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(value = "type", required = false) String type) {
        try {
            if (type != null && !type.trim().isEmpty()) {
                return ResponseEntity.ok(entryRepository.findBySatisfactionTypeOrderByIdDesc(type));
            }
            return ResponseEntity.ok(entryRepository.findAll());
        } catch (Exception e) {
            log.error("Error fetching entries: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/responses/{entryId}")
    public ResponseEntity<?> getResponses(@PathVariable("entryId") Long entryId) {
        try {
            return ResponseEntity.ok(responseRepository.findByEntryId(entryId));
        } catch (Exception e) {
            log.error("Error fetching responses for entry {}: {}", entryId, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> payload, Principal principal) {
        try {
            String satisfactionType = (String) payload.get("satisfactionType");
            String generalComments = (String) payload.get("generalComments");
            List<Map<String, Object>> responsesList = (List<Map<String, Object>>) payload.get("responses");

            if (satisfactionType == null || satisfactionType.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Satisfaction Type is required");
            }
            if (responsesList == null || responsesList.isEmpty()) {
                return ResponseEntity.badRequest().body("Responses are required");
            }

            String currentUser = SecurityUtils.getCurrentUserDisplayName();
            if (currentUser == null) {
                currentUser = principal != null ? principal.getName() : "Anonymous";
            }

            SatisfactionFeedbackEntry entry = new SatisfactionFeedbackEntry();
            entry.setSatisfactionType(satisfactionType);
            entry.setGeneralComments(generalComments);
            entry.setSubmittedBy(currentUser);
            entry.setSubmittedDate(new Date());
            entry.setCreatedBy(currentUser);
            entry.setCreatedDate(new Date());

            int totalScore = 0;
            List<SatisfactionFeedbackResponse> responses = new ArrayList<>();
            for (Map<String, Object> respMap : responsesList) {
                String questionText = (String) respMap.get("questionText");
                String rating = (String) respMap.get("rating");
                Integer score = (Integer) respMap.get("score");
                String comments = (String) respMap.get("comments");

                if ("Moderate".equalsIgnoreCase(rating) || "Poor".equalsIgnoreCase(rating)) {
                    if (comments == null || comments.trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Comments are mandatory for Moderate and Poor ratings");
                    }
                }

                SatisfactionFeedbackResponse response = new SatisfactionFeedbackResponse();
                response.setEntry(entry);
                response.setQuestionText(questionText);
                response.setRating(rating);
                response.setScore(score != null ? score : 0);
                response.setComments(comments);
                response.setCreatedBy(currentUser);
                response.setCreatedDate(new Date());

                totalScore += response.getScore();
                responses.add(response);
            }

            entry.setResponses(responses);
            entry.setTotalScore(totalScore);
            entry.setAverageScore((double) totalScore / responses.size());

            SatisfactionFeedbackEntry savedEntry = entryRepository.save(entry);
            return ResponseEntity.ok(savedEntry);
        } catch (Exception e) {
            log.error("Error submitting general satisfaction feedback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
