package com.autonoma.erp.modules.induction.repository;

import com.autonoma.erp.modules.induction.entity.InductionReassignmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InductionReassignmentLogRepository extends JpaRepository<InductionReassignmentLog, Long> {

    @Query("SELECT l FROM InductionReassignmentLog l WHERE l.trainee.empCode = :traineeEmpCode")
    List<InductionReassignmentLog> findByTraineeEmpCode(@org.springframework.data.repository.query.Param("traineeEmpCode") String traineeEmpCode);
}
