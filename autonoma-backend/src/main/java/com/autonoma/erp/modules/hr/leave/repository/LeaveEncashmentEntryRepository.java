package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.LeaveEncashmentEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;

@Repository
public interface LeaveEncashmentEntryRepository extends JpaRepository<LeaveEncashmentEntry, Long> {

    @Query("SELECT e FROM LeaveEncashmentEntry e WHERE e.isActive = true " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:employeeName IS NULL OR LOWER(e.employee.employeeName) LIKE LOWER(CONCAT('%', :employeeName, '%'))) " +
            "AND (:employeeCode IS NULL OR LOWER(e.employee.empCode) LIKE LOWER(CONCAT('%', :employeeCode, '%'))) " +
            "AND (:fromDate IS NULL OR e.fromDate >= :fromDate) " +
            "AND (:toDate IS NULL OR e.toDate <= :toDate) " +
            "ORDER BY e.id DESC")
    Page<LeaveEncashmentEntry> searchLeaveEncashment(
            @Param("status") String status,
            @Param("employeeName") String employeeName,
            @Param("employeeCode") String employeeCode,
            @Param("fromDate") Date fromDate,
            @Param("toDate") Date toDate,
            Pageable pageable);
}
