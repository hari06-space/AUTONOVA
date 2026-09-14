package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.EnterpriseKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnterpriseKnowledgeRepository extends JpaRepository<EnterpriseKnowledge, Long> {

    List<EnterpriseKnowledge> findByCompanyIdAndActiveStatus(Long companyId, String activeStatus);

    List<EnterpriseKnowledge> findByCategoryAndCompanyIdAndActiveStatus(String category, Long companyId, String activeStatus);

    @org.springframework.data.jpa.repository.Query("SELECT ek FROM EnterpriseKnowledge ek " +
        "WHERE ek.companyId = :companyId " +
        "AND (ek.divisionId IS NULL OR ek.divisionId = :divisionId) " +
        "AND (ek.moduleScope IN :allowedModules OR ek.moduleScope IS NULL OR ek.moduleScope = 'GENERAL') " +
        "AND ek.approvalStatus = 'APPROVED' " +
        "AND ek.activeStatus = 'Y'")
    List<EnterpriseKnowledge> findScopedKnowledge(
        @org.springframework.data.repository.query.Param("companyId") Long companyId,
        @org.springframework.data.repository.query.Param("divisionId") Long divisionId,
        @org.springframework.data.repository.query.Param("allowedModules") List<String> allowedModules
    );

}
