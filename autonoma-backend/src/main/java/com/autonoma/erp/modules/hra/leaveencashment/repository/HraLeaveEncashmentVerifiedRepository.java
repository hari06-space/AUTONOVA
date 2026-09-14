package com.autonoma.erp.modules.hra.leaveencashment.repository;

import com.autonoma.erp.modules.hra.leaveencashment.entity.HraLeaveEncashmentVerified;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HraLeaveEncashmentVerifiedRepository
        extends JpaRepository<HraLeaveEncashmentVerified, Long> {

    /** Find all records for a given encashment year. */
    List<HraLeaveEncashmentVerified> findByEncashmentYear(Integer encashmentYear);

    /** Find all records linked to a specific employee. */
    List<HraLeaveEncashmentVerified> findByEmployeeId(Long employeeId);

    /** Find all active records. */
    List<HraLeaveEncashmentVerified> findByIsActiveTrue();
}
