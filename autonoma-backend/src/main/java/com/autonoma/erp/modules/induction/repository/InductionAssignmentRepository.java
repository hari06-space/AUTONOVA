package com.autonoma.erp.modules.induction.repository;

import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InductionAssignmentRepository extends JpaRepository<InductionAssignment, Long> {
    
    List<InductionAssignment> findByEmpCode(String empCode);
    
    @Query("SELECT a FROM InductionAssignment a WHERE a.empCode = :empCode AND a.roundEntity.roundName = :round AND a.isActive = true AND a.currentStatus != 'COMPLETED'")
    List<InductionAssignment> findActiveAssignmentsByEmpAndRound(@org.springframework.data.repository.query.Param("empCode") String empCode, @org.springframework.data.repository.query.Param("round") String round);

    @Query("SELECT a FROM InductionAssignment a WHERE a.isActive = true")
    List<InductionAssignment> findAllActive();

    // === Trainer page: only assignments where current user is the trainer ===
    @Query("SELECT a FROM InductionAssignment a WHERE a.trainerEmpCode = :trainerEmpCode AND a.isActive = true")
    List<InductionAssignment> findByTrainerEmpCode(@org.springframework.data.repository.query.Param("trainerEmpCode") String trainerEmpCode);

    // === Trainee page: only assignments for the current employee with TRAINING GIVEN status ===
    @Query("SELECT a FROM InductionAssignment a WHERE a.empCode = :empCode AND a.currentStatus = 'TRAINING GIVEN' AND a.isActive = true")
    List<InductionAssignment> findTraineeRecords(@org.springframework.data.repository.query.Param("empCode") String empCode);

    @Query("SELECT a FROM InductionAssignment a WHERE a.currentStatus = 'TRAINING GIVEN' AND a.isActive = true")
    List<InductionAssignment> findAllTraineeRecords();

    @Query("SELECT COUNT(a) FROM InductionAssignment a WHERE a.empCode = :empCode AND a.isActive = true AND a.currentStatus IN ('PENDING', 'TRAINING GIVEN')")
    long countIncompleteByEmpCode(@org.springframework.data.repository.query.Param("empCode") String empCode);

    @Query("SELECT COUNT(DISTINCT a.levelEntity.id) FROM InductionAssignment a WHERE a.empCode = :empCode AND a.isActive = true AND a.currentStatus = 'COMPLETED'")
    long countCompletedLevelsByEmpCode(@org.springframework.data.repository.query.Param("empCode") String empCode);

    java.util.Optional<InductionAssignment> findByFeedbackToken(String feedbackToken);
}

