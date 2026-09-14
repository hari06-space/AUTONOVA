package com.autonoma.erp.repository;

import com.autonoma.erp.model.HrEmployeeSatisfactionCohortAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HrEmployeeSatisfactionCohortAuditRepository extends JpaRepository<HrEmployeeSatisfactionCohortAudit, Long> {
    boolean existsByCohortNameAndFeedbackCycle(String cohortName, String feedbackCycle);
}
