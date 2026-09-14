package com.autonoma.erp.repository.security;

import com.autonoma.erp.model.security.LoginAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface LoginAccessLogRepository extends JpaRepository<LoginAccessLog, Long> {
    List<LoginAccessLog> findTop100ByCompanyIdOrderByLoginDateTimeDesc(Long companyId);
    Page<LoginAccessLog> findByCompanyIdOrderByLoginDateTimeDesc(Long companyId, Pageable pageable);
    Page<LoginAccessLog> findByCompanyIdAndLoginDateTimeBetweenOrderByLoginDateTimeDesc(Long companyId, Date from, Date to, Pageable pageable);
    long countByCompanyIdAndLoginStatusIgnoreCase(Long companyId, String loginStatus);
}
