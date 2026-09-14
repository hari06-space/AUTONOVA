package com.autonoma.erp.modules.hra.recruitment.repository;

import com.autonoma.erp.modules.hra.recruitment.entity.InterviewMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewMasterRepository extends JpaRepository<InterviewMaster, Long> {
    @Query("SELECT MAX(i.id) FROM InterviewMaster i")
    Long findMaxId();

    java.util.List<InterviewMaster> findByCriteriaDetailsIgnoreCaseAndInterviewRoundIgnoreCaseAndStatus(String criteriaDetails, String interviewRound, Boolean status);

    java.util.List<InterviewMaster> findByInterviewRoundIgnoreCaseAndStatus(String interviewRound, Boolean status);
}
