/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Repository for ProductionPlanHead
*/
package com.autonoma.erp.modules.production.plan.repository;

import com.autonoma.erp.modules.production.plan.entity.ProductionPlanHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionPlanHeadRepository extends JpaRepository<ProductionPlanHead, Long> {

    List<ProductionPlanHead> findBySourceTypeAndSourceIdAndStatusNot(String sourceType, Long sourceId, String status);

    @Query("SELECT p FROM ProductionPlanHead p WHERE p.sourceType = :sourceType AND p.sourceId = :sourceId AND p.status <> 'CANCELLED'")
    Optional<ProductionPlanHead> findActivePlanForSource(@Param("sourceType") String sourceType, @Param("sourceId") Long sourceId);

    List<ProductionPlanHead> findByStatusOrderByPlanNoDesc(String status);

    List<ProductionPlanHead> findAllByOrderByPlanNoDesc();
}
