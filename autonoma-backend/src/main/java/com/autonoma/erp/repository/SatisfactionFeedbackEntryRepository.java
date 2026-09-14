package com.autonoma.erp.repository;

import com.autonoma.erp.model.SatisfactionFeedbackEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatisfactionFeedbackEntryRepository extends JpaRepository<SatisfactionFeedbackEntry, Long> {
    List<SatisfactionFeedbackEntry> findBySatisfactionTypeOrderByIdDesc(String satisfactionType);
}
