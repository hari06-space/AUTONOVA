/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Repository for ProductionPlanTrans
*/
package com.autonoma.erp.modules.production.plan.repository;

import com.autonoma.erp.modules.production.plan.entity.ProductionPlanTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionPlanTransRepository extends JpaRepository<ProductionPlanTrans, Long> {

    List<ProductionPlanTrans> findByProductionPlanHeadPlanNoOrderByPlanTransNoAsc(Long planNo);

    List<ProductionPlanTrans> findByParentTransNo(Long parentTransNo);

    List<ProductionPlanTrans> findByProductionPlanHeadPlanNoAndRequirementType(Long planNo, String requirementType);

    @Query("SELECT t FROM ProductionPlanTrans t WHERE t.productionPlanHead.planNo = :planNo AND t.parentTransNo IS NULL")
    List<ProductionPlanTrans> findRootTransactionsByPlanNo(@Param("planNo") Long planNo);
}
