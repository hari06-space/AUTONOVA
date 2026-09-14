package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.HrLeaveMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HrLeaveMasterRepository extends JpaRepository<HrLeaveMaster, Long> {
    Optional<HrLeaveMaster> findByLeaveCode(String leaveCode);
}
