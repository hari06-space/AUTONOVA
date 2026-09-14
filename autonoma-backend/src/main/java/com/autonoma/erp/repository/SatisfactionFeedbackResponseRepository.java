package com.autonoma.erp.repository;

import com.autonoma.erp.model.SatisfactionFeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatisfactionFeedbackResponseRepository extends JpaRepository<SatisfactionFeedbackResponse, Long> {
    List<SatisfactionFeedbackResponse> findByEntryId(Long entryId);
}
