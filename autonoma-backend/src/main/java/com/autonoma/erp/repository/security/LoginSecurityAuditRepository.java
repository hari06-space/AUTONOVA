package com.autonoma.erp.repository.security;

import com.autonoma.erp.model.security.LoginSecurityAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginSecurityAuditRepository extends JpaRepository<LoginSecurityAudit, Long> {
    List<LoginSecurityAudit> findTop100ByCompanyIdOrderByChangedDateDesc(Long companyId);
}
