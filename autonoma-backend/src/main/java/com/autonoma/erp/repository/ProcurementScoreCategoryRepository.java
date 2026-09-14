package com.autonoma.erp.repository;

import com.autonoma.erp.model.ProcurementScoreCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcurementScoreCategoryRepository extends JpaRepository<ProcurementScoreCategory, Long> {
    List<ProcurementScoreCategory> findByDivisionIdAndActiveStatus(Long divisionId, Integer activeStatus);
}
