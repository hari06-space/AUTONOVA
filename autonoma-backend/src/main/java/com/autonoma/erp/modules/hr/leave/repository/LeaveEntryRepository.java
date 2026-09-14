package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.LeaveEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface LeaveEntryRepository extends JpaRepository<LeaveEntry, Long> {
    
    @Query("SELECT l FROM LeaveEntry l WHERE l.isActive = true ORDER BY l.fromDate DESC")
    List<LeaveEntry> findByIsActiveTrueOrderByDateDesc();
    
    @Query("SELECT l FROM LeaveEntry l WHERE l.employeeId = :employeeId AND l.isActive = true")
    List<LeaveEntry> findByEmployeeIdAndIsActiveTrue(@Param("employeeId") Long employeeId);
    
    @Query("SELECT l FROM LeaveEntry l WHERE l.employeeId IN :employeeIds AND l.isActive = true")
    List<LeaveEntry> findByEmployeeIdInAndIsActiveTrue(@Param("employeeIds") List<Long> employeeIds);
    
    @Query("SELECT l FROM LeaveEntry l WHERE l.employeeId = :employeeId AND l.isActive = true AND (l.statusId IS NULL OR l.statusId NOT IN (SELECT s.id FROM StatusMaster s WHERE UPPER(TRIM(s.name)) IN ('REJECTED', 'REJECT'))) AND (l.rejectReason IS NULL OR TRIM(l.rejectReason) = '') AND l.fromDate <= :date AND l.toDate >= :date")
    List<LeaveEntry> findByEmployeeIdAndDateAndIsActiveTrue(@Param("employeeId") Long employeeId, @Param("date") Date date);
    
    // For overlap validation (ignores Rejected records with StatusMaster check and rejectReason check to allow reapplication)
    @Query("SELECT l FROM LeaveEntry l WHERE l.employeeId = :employeeId AND l.isActive = true AND (l.statusId IS NULL OR l.statusId NOT IN (SELECT s.id FROM StatusMaster s WHERE UPPER(TRIM(s.name)) IN ('REJECTED', 'REJECT'))) AND (l.rejectReason IS NULL OR TRIM(l.rejectReason) = '') AND l.fromDate <= :toDate AND l.toDate >= :fromDate")
    List<LeaveEntry> findOverlappingLeaves(@Param("employeeId") Long employeeId, @Param("fromDate") Date fromDate, @Param("toDate") Date toDate);

    @Query("SELECT DISTINCT l.employeeId FROM LeaveEntry l WHERE l.isActive = true AND l.statusId IN (SELECT s.id FROM StatusMaster s WHERE UPPER(TRIM(s.name)) IN ('VERIFIED', 'APPROVED')) AND l.fromDate <= :date AND l.toDate >= :date")
    List<Long> findEmployeeIdsOnLeaveOnDate(@Param("date") Date date);

    @Query("SELECT l FROM LeaveEntry l WHERE l.isActive = true AND l.statusId IN (SELECT s.id FROM StatusMaster s WHERE UPPER(TRIM(s.name)) IN ('VERIFIED', 'APPROVED')) AND l.fromDate <= :endOfDay AND l.toDate >= :startOfDay")
    List<LeaveEntry> findByDateRange(
            @Param("startOfDay") Date startOfDay,
            @Param("endOfDay") Date endOfDay
    );
}
