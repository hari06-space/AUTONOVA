package com.autonoma.erp.repository;

import com.autonoma.erp.model.SatisfactionCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SatisfactionCriteriaRepository extends JpaRepository<SatisfactionCriteria, Long> {
    @Query("SELECT MAX(s.id) FROM SatisfactionCriteria s")
    Long findMaxId();
}
