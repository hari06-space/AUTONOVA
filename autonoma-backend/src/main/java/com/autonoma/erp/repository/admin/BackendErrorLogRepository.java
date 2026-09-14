package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.BackendErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BackendErrorLogRepository extends JpaRepository<BackendErrorLog, Long> {
}
