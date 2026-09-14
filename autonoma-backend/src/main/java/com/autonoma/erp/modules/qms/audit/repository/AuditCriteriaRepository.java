package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditCriteriaRepository extends JpaRepository<AuditCriteria, Long> {

    @Query("SELECT DISTINCT c FROM AuditCriteria c JOIN c.auditCriteriaTypes act JOIN act.auditType at WHERE c.isActive = true AND UPPER(at.auditType) LIKE UPPER(CONCAT('%', :auditType, '%'))")
    List<AuditCriteria> findByAuditTypeContaining(@Param("auditType") String auditType);

    @Query("SELECT DISTINCT c FROM AuditCriteria c JOIN c.auditCriteriaTypes act JOIN act.auditType at WHERE c.isActive = true AND UPPER(at.auditType) LIKE UPPER(CONCAT('%', :auditType, '%')) AND c.id IN (SELECT ad.refId FROM AuditDepartment ad WHERE ad.deptId = :deptId)")
    List<AuditCriteria> findByAuditTypeContainingAndDepartmentId(@Param("auditType") String auditType,
            @Param("deptId") Long deptId);

    @Query("SELECT DISTINCT c FROM AuditCriteria c " +
            "JOIN c.auditCriteriaTypes act " +
            "JOIN act.auditType at " +
            "JOIN AuditDepartment ad ON c.id = ad.refId " +
            "JOIN ad.department d " +
            "WHERE c.isActive = true " +
            "AND UPPER(TRIM(at.auditType)) = UPPER(TRIM(:auditType)) " +
            "AND UPPER(TRIM(d.departmentName)) = UPPER(TRIM(:department))")
    List<AuditCriteria> findByAuditTypeAndDepartmentName(@Param("auditType") String auditType,
            @Param("department") String department);

    @Query("SELECT c FROM AuditCriteria c WHERE c.seqNo LIKE 'AC-%' ORDER BY CAST(SUBSTRING(c.seqNo, 4) as integer) DESC")
    List<AuditCriteria> findLatestSeqNo(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT c.seqNo FROM AuditCriteria c WHERE c.seqNo IS NOT NULL")
    List<String> findAllSeqNos();

    boolean existsBySeqNoIgnoreCase(String seqNo);

    boolean existsBySeqNoIgnoreCaseAndIdNot(String seqNo, Long id);

    boolean existsByCriteriaTextIgnoreCase(String criteriaText);

    boolean existsByCriteriaTextIgnoreCaseAndIdNot(String criteriaText, Long id);

    @Query("SELECT c FROM AuditCriteria c WHERE UPPER(c.clause) = UPPER(:clause) AND UPPER(CAST(c.criteriaText AS string)) = UPPER(CAST(:criteriaText AS string))")
    List<AuditCriteria> findByClauseIgnoreCaseAndCriteriaTextIgnoreCase(
            @Param("clause") String clause,
            @Param("criteriaText") String criteriaText);

    default boolean existsByClauseIgnoreCaseAndAuditTypeIgnoreCaseAndCriteriaTextIgnoreCase(String clause,
            String auditType, String criteriaText) {
        List<AuditCriteria> matches = findByClauseIgnoreCaseAndCriteriaTextIgnoreCase(clause, criteriaText);
        for (AuditCriteria c : matches) {
            if (c.getAuditType() != null && c.getAuditType().equalsIgnoreCase(auditType)) {
                return true;
            }
        }
        return false;
    }

    default List<AuditCriteria> findByClauseIgnoreCaseAndAuditTypeIgnoreCaseAndCriteriaTextIgnoreCase(String clause,
            String auditType, String criteriaText) {
        List<AuditCriteria> matches = findByClauseIgnoreCaseAndCriteriaTextIgnoreCase(clause, criteriaText);
        List<AuditCriteria> result = new java.util.ArrayList<>();
        for (AuditCriteria c : matches) {
            if (c.getAuditType() != null && c.getAuditType().equalsIgnoreCase(auditType)) {
                result.add(c);
            }
        }
        return result;
    }

    default boolean existsByClauseIgnoreCaseAndAuditTypeIgnoreCaseAndCriteriaTextIgnoreCaseAndIdNot(String clause,
            String auditType, String criteriaText, Long id) {
        List<AuditCriteria> matches = findByClauseIgnoreCaseAndCriteriaTextIgnoreCase(clause, criteriaText);
        for (AuditCriteria c : matches) {
            if (!c.getId().equals(id) && c.getAuditType() != null && c.getAuditType().equalsIgnoreCase(auditType)) {
                return true;
            }
        }
        return false;
    }
}
