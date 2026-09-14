package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.VerificationCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCriteriaRepository extends JpaRepository<VerificationCriteria, Long> {
    @Query("SELECT MAX(v.id) FROM VerificationCriteria v")
    Long findMaxId();

    Optional<VerificationCriteria> findByDescriptionIgnoreCase(String description);
}
