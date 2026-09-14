package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditDepartmentRepository extends JpaRepository<AuditDepartment, Long> {
    List<AuditDepartment> findByRefId(Long refId);
    void deleteByRefId(Long refId);

    @Query("SELECT d FROM AuditDepartment d WHERE d.refId IN :refIds")
    List<AuditDepartment> findByRefIds(@Param("refIds") List<Long> refIds);
}
