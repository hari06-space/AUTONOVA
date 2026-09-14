package com.autonoma.erp.modules.platform.identity.repository;

import com.autonoma.erp.modules.platform.identity.entity.PermissionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionEntryRepository extends JpaRepository<PermissionEntry, Long> {
    List<PermissionEntry> findAllByOrderByPermissionDateDesc();

    List<PermissionEntry> findByEmployeeIdOrderByPermissionDateDesc(Long employeeId);

    List<PermissionEntry> findByEmployeeIdInOrderByPermissionDateDesc(List<Long> employeeIds);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM HR_PERMISSION_DETAILS WHERE EMPLOYEE_ID = :employeeId AND YEAR(PERMISSION_DATE) = :year AND DATENAME(month, PERMISSION_DATE) = :month", nativeQuery = true)
    List<PermissionEntry> findByEmployeeIdAndYearAndMonthAndIsActiveTrue(@org.springframework.data.repository.query.Param("employeeId") Long employeeId, @org.springframework.data.repository.query.Param("year") Integer year, @org.springframework.data.repository.query.Param("month") String month);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM HR_PERMISSION_DETAILS WHERE EMPLOYEE_ID = :employeeId AND YEAR(PERMISSION_DATE) = :year AND DATENAME(month, PERMISSION_DATE) = :month AND ID <> :id", nativeQuery = true)
    List<PermissionEntry> findByEmployeeIdAndYearAndMonthAndIsActiveTrueAndIdNot(@org.springframework.data.repository.query.Param("employeeId") Long employeeId, @org.springframework.data.repository.query.Param("year") Integer year, @org.springframework.data.repository.query.Param("month") String month, @org.springframework.data.repository.query.Param("id") Long id);

    List<PermissionEntry> findByEmployeeIdAndPermissionDate(Long employeeId, java.util.Date permissionDate);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PermissionEntry p WHERE p.permissionDate = :date AND (p.statusId IN (SELECT s.id FROM StatusMaster s WHERE UPPER(TRIM(s.name)) IN ('VERIFIED', 'APPROVED')) OR (p.statusId IS NULL AND (p.rejectionReason IS NULL OR TRIM(p.rejectionReason) = '')))")
    List<PermissionEntry> findApprovedByDate(@org.springframework.data.repository.query.Param("date") java.util.Date date);
}
