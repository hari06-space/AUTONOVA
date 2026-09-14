package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.QmsFeedbackEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QmsFeedbackEntryRepository extends JpaRepository<QmsFeedbackEntry, Long> {

    @Query("SELECT e FROM QmsFeedbackEntry e WHERE " +
           "(:type IS NULL OR :type = 'All' OR e.satisfactionType = :type) " +
           "ORDER BY e.submittedDate DESC")
    List<QmsFeedbackEntry> findByType(@Param("type") String type);

    @Query("SELECT e FROM QmsFeedbackEntry e WHERE e.submittedBy = :username " +
           "ORDER BY e.submittedDate DESC")
    List<QmsFeedbackEntry> findBySubmittedBy(@Param("username") String username);
}
