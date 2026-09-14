package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HrAttendanceAuditLogRepository extends JpaRepository<HrAttendanceAuditLog, Long> {
}
