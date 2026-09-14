package com.autonoma.erp.modules.qms.satisfaction.service;

import com.autonoma.erp.modules.qms.satisfaction.entity.QmsFeedbackEntry;
import com.autonoma.erp.modules.qms.satisfaction.entity.QmsFeedbackResponse;
import com.autonoma.erp.modules.qms.satisfaction.entity.QmsSatisfactionCriteria;
import com.autonoma.erp.modules.qms.satisfaction.repository.QmsFeedbackEntryRepository;
import com.autonoma.erp.modules.qms.satisfaction.repository.QmsFeedbackResponseRepository;
import com.autonoma.erp.modules.qms.satisfaction.repository.QmsSatisfactionCriteriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class QmsSatisfactionFeedbackService {

    private final QmsFeedbackEntryRepository entryRepo;
    private final QmsFeedbackResponseRepository responseRepo;
    private final QmsSatisfactionCriteriaRepository criteriaRepo;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsSatisfactionFeedbackService(
            QmsFeedbackEntryRepository entryRepo,
            QmsFeedbackResponseRepository responseRepo,
            QmsSatisfactionCriteriaRepository criteriaRepo) {
        this.entryRepo = entryRepo;
        this.responseRepo = responseRepo;
        this.criteriaRepo = criteriaRepo;
    }

    private static final Map<String, Integer> SCORE_MAP = new LinkedHashMap<>();
    static {
        SCORE_MAP.put("Excellent", 100);
        SCORE_MAP.put("Very Good", 75);
        SCORE_MAP.put("Good", 50);
        SCORE_MAP.put("Moderate", 25);
        SCORE_MAP.put("Poor", 0);
    }

    /**
     * Returns a mock "pending assignment" for any logged-in user.
     * This allows any user to fill feedback without requiring a pre-created mapping.
     */
    public Map<String, Object> getPendingAssignment(String username, String cycle) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", -1L);
        result.put("cycle", cycle);
        result.put("username", username);
        result.put("status", "Pending");
        return result;
    }

    /**
     * Returns active criteria questions for the given satisfaction type.
     */
    public List<QmsSatisfactionCriteria> getQuestions(String type) {
        if (type == null || type.isBlank()) {
            return criteriaRepo.findAll().stream()
                    .filter(q -> q.getStatus() != null && q.getStatus() == 1)
                    .toList();
        }
        return criteriaRepo.findBySatisfactionTypeAndStatus(type, 1);
    }

    /**
     * Returns the most recent entry's responses for this user (used as draft).
     */
    public List<Map<String, Object>> getSavedDraft(String username, String cycle, String type) {
        List<QmsFeedbackEntry> entries = entryRepo.findBySubmittedBy(username);
        if (entries.isEmpty()) return Collections.emptyList();

        // Find the latest matching draft
        QmsFeedbackEntry latest = entries.get(0);
        List<QmsFeedbackResponse> responses = responseRepo.findByEntryId(latest.getId());

        List<QmsSatisfactionCriteria> questions = getQuestions(type);
        Map<String, Long> textToIdMap = new HashMap<>();
        for (QmsSatisfactionCriteria q : questions) {
            textToIdMap.put(q.getSatisfactionCriteria(), q.getId());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (QmsFeedbackResponse r : responses) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("questionText", r.getQuestionText());
            item.put("rating", r.getRating());
            item.put("score", r.getScore());
            item.put("comments", r.getComments());
            // Add question wrapper for frontend compatibility
            Map<String, Object> question = new HashMap<>();
            question.put("satisfactionCriteria", r.getQuestionText());
            Long qId = textToIdMap.get(r.getQuestionText());
            if (qId != null) {
                question.put("id", qId);
            } else {
                question.put("id", -1L);
            }
            item.put("question", question);
            result.add(item);
        }
        return result;
    }

    /**
     * Saves or updates a draft entry (upsert by submittedBy).
     */
    @Transactional
    public QmsFeedbackEntry saveDraft(String username, List<Map<String, Object>> responses, String cycle, String type) {
        // Delete existing draft entries for this user to avoid duplicates
        List<QmsFeedbackEntry> existing = entryRepo.findBySubmittedBy(username);
        if (!existing.isEmpty()) {
            entryRepo.deleteAll(existing);
        }
        return saveEntryAndResponses(username, responses, cycle, type != null ? type : "Employee");
    }

    /**
     * Submits feedback (same as draft but marks as final with a submitted date).
     */
    @Transactional
    public QmsFeedbackEntry submitFeedback(String username, List<Map<String, Object>> responses, String cycle, String type) {
        // Delete existing draft entries for this user
        List<QmsFeedbackEntry> existing = entryRepo.findBySubmittedBy(username);
        if (!existing.isEmpty()) {
            entryRepo.deleteAll(existing);
        }
        QmsFeedbackEntry entry = saveEntryAndResponses(username, responses, cycle, type != null ? type : "Employee");
        entry.setSubmittedDate(new Date());
        return entryRepo.save(entry);
    }

    private QmsFeedbackEntry saveEntryAndResponses(String username, List<Map<String, Object>> responses, String cycle, String type) {
        // Calculate totals
        int totalScore = 0;
        int answeredCount = 0;
        for (Map<String, Object> r : responses) {
            String rating = (String) r.get("rating");
            if (rating != null && SCORE_MAP.containsKey(rating)) {
                totalScore += SCORE_MAP.get(rating);
                answeredCount++;
            }
        }
        double avgScore = answeredCount > 0 ? (double) totalScore / answeredCount : 0.0;

        // Create entry
        QmsFeedbackEntry entry = new QmsFeedbackEntry();
        entry.setSubmittedBy(username);
        entry.setSatisfactionType(type);
        entry.setTotalScore(totalScore);
        entry.setAverageScore(Math.round(avgScore * 100.0) / 100.0);
        entry.setSubmittedDate(new Date());
        entry.setCreatedUser(username);
        entry.setCreatedDate(new Date());
        entry = entryRepo.save(entry);

        // Create responses
        List<QmsFeedbackResponse> responseEntities = new ArrayList<>();
        for (Map<String, Object> r : responses) {
            String rating = (String) r.get("rating");
            if (rating == null || rating.isBlank()) continue;

            QmsFeedbackResponse resp = new QmsFeedbackResponse();
            resp.setEntry(entry);

            // Resolve question text
            Object qIdObj = r.get("questionId");
            String questionText = null;
            if (qIdObj != null) {
                try {
                    Long qId = Long.parseLong(String.valueOf(qIdObj));
                    questionText = criteriaRepo.findById(qId)
                            .map(QmsSatisfactionCriteria::getSatisfactionCriteria)
                            .orElse(null);
                } catch (NumberFormatException ignored) {}
            }
            if (questionText == null) {
                questionText = (String) r.getOrDefault("questionText", "");
            }
            resp.setQuestionText(questionText);
            resp.setRating(rating);
            resp.setScore(SCORE_MAP.getOrDefault(rating, 0));
            resp.setComments((String) r.getOrDefault("comments", ""));
            resp.setCreatedUser(username);
            resp.setCreatedDate(new Date());
            responseEntities.add(resp);
        }
        responseRepo.saveAll(responseEntities);
        entry.setResponses(responseEntities);
        return entry;
    }

    /**
     * Returns all feedback entries for dashboard display.
     */
    public List<Map<String, Object>> getAllEntries(String type) {
        List<QmsFeedbackEntry> entries = entryRepo.findByType(type);
        List<Map<String, Object>> result = new ArrayList<>();
        for (QmsFeedbackEntry e : entries) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", e.getId());
            item.put("satisfactionType", e.getSatisfactionType());
            item.put("submittedBy", e.getSubmittedBy());
            item.put("submittedDate", e.getSubmittedDate());
            item.put("totalScore", e.getTotalScore());
            item.put("averageScore", e.getAverageScore());
            item.put("generalComments", e.getGeneralComments());
            item.put("createdDate", e.getCreatedDate());

            // Attach responses
            List<QmsFeedbackResponse> responses = responseRepo.findByEntryId(e.getId());
            List<Map<String, Object>> respList = new ArrayList<>();
            for (QmsFeedbackResponse r : responses) {
                Map<String, Object> rMap = new HashMap<>();
                rMap.put("id", r.getId());
                rMap.put("questionText", r.getQuestionText());
                rMap.put("rating", r.getRating());
                rMap.put("score", r.getScore());
                rMap.put("comments", r.getComments());
                Map<String, Object> question = new HashMap<>();
                question.put("satisfactionCriteria", r.getQuestionText());
                rMap.put("question", question);
                respList.add(rMap);
            }
            item.put("responses", respList);
            result.add(item);
        }
        return result;
    }
}
