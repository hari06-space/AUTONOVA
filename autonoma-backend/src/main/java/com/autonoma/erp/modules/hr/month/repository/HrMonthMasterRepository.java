package com.autonoma.erp.modules.hr.month.repository;

import com.autonoma.erp.modules.hr.month.entity.HrMonthMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HrMonthMasterRepository extends JpaRepository<HrMonthMaster, Long> {

    /** Check duplicate: same type + same name */
    boolean existsByMonthTypeAndMonthName(String monthType, String monthName);

    /** Check duplicate on update (exclude self) */
    boolean existsByMonthTypeAndMonthNameAndIdNot(String monthType, String monthName, Long id);

    /**
     * Used by other modules (Payroll, Leave, Loan) to populate dropdowns.
     * Returns active months of the given type sorted by SEQ_NO.
     */
    List<HrMonthMaster> findByMonthTypeAndIsActiveTrueOrderBySeqNoAsc(String monthType);

    /** Returns all months of a given type (including inactive), sorted by SEQ_NO */
    List<HrMonthMaster> findByMonthTypeOrderBySeqNoAsc(String monthType);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(m.seqNo) FROM HrMonthMaster m WHERE m.monthType = :monthType")
    java.util.Optional<Integer> findMaxSeqNoByMonthType(@org.springframework.data.repository.query.Param("monthType") String monthType);
}
