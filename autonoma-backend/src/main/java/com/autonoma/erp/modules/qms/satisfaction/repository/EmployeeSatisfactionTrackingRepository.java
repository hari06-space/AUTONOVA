package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.EmployeeSatisfactionTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeSatisfactionTrackingRepository extends JpaRepository<EmployeeSatisfactionTracking, Long> {
    
    Optional<EmployeeSatisfactionTracking> findByEmployeeIdAndFeedbackCycle(Long employeeId, String feedbackCycle);
    
    List<EmployeeSatisfactionTracking> findByFeedbackCycle(String feedbackCycle);

    List<EmployeeSatisfactionTracking> findByStatus(String status);
    
    @Query("SELECT t FROM EmployeeSatisfactionTracking t WHERE t.status = :status AND t.nextReminderDate <= CURRENT_TIMESTAMP")
    List<EmployeeSatisfactionTracking> findPendingReminders(@Param("status") String status);
}
