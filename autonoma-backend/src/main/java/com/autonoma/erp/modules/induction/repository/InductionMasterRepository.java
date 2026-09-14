package com.autonoma.erp.modules.induction.repository;

import com.autonoma.erp.modules.induction.entity.InductionMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InductionMasterRepository extends JpaRepository<InductionMaster, Long> {
    @Query("SELECT MAX(i.id) FROM InductionMaster i")
    Long findMaxId();

    @Query("SELECT m FROM InductionMaster m WHERE m.isActive = true AND m.inductionRoundMaster.roundName = :round")
    List<InductionMaster> findByRoundAndActive(@Param("round") String round);

    List<InductionMaster> findByInductionDetailsIgnoreCaseAndIsActive(String inductionDetails, Boolean isActive);
}
