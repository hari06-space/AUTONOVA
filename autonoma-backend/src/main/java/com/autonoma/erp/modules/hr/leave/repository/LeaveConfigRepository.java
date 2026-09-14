package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.LeaveConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveConfigRepository extends JpaRepository<LeaveConfig, Long> {
    List<LeaveConfig> findByLeaveTypeAndEmpTypeAndStatus(String leaveType, String empType, String status);
    List<LeaveConfig> findByStatus(String status);
}
