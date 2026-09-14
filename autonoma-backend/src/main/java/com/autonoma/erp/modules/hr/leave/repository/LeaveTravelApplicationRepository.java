package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.LeaveTravelApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveTravelApplicationRepository extends JpaRepository<LeaveTravelApplication, Long> {
    List<LeaveTravelApplication> findByIsActiveTrueOrderByIdDesc();
    List<LeaveTravelApplication> findByEmployeeIdAndIsActiveTrueOrderByIdDesc(Long employeeId);
}
