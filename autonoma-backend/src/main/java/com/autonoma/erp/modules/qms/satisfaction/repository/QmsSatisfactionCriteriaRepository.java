package com.autonoma.erp.modules.qms.satisfaction.repository;

import com.autonoma.erp.modules.qms.satisfaction.entity.QmsSatisfactionCriteria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QmsSatisfactionCriteriaRepository extends JpaRepository<QmsSatisfactionCriteria, Long> {
    
    List<QmsSatisfactionCriteria> findBySatisfactionTypeAndStatus(String satisfactionType, Integer status);

    @Query("SELECT c FROM QmsSatisfactionCriteria c WHERE " +
           "(:type IS NULL OR c.satisfactionType = :type) AND " +
           "(:criteria IS NULL OR c.satisfactionCriteria LIKE %:criteria%)")
    Page<QmsSatisfactionCriteria> findByFilters(
            @Param("type") String type,
            @Param("criteria") String criteria,
            Pageable pageable);
}
