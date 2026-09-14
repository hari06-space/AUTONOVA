package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.QmsFeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QmsFeedbackResponseRepository extends JpaRepository<QmsFeedbackResponse, Long> {

    @Query("SELECT r FROM QmsFeedbackResponse r WHERE r.entry.id = :entryId")
    List<QmsFeedbackResponse> findByEntryId(@Param("entryId") Long entryId);
}
