package com.autonoma.erp.modules.master.organization.repository;

import com.autonoma.erp.modules.master.organization.entity.Division;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DivisionRepository extends JpaRepository<Division, Long> {

    /** All divisions for a specific company */
    List<Division> findByCompanyId(Long companyId);

    /** Find by name */
    Division findByDivisionNameIgnoreCase(String divisionName);

    /** Active divisions for a specific company (status = true/1) */
    List<Division> findByCompanyIdAndStatus(Long companyId, Boolean status);

    /** Next sequence number (global) */
    @Query("SELECT MAX(d.sequenceNo) FROM Division d")
    java.util.Optional<Integer> findMaxSequenceNo();
}
