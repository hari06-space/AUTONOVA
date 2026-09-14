package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeTransferRepository extends JpaRepository<EmployeeTransfer, Long> {

    List<EmployeeTransfer> findAllByOrderByCreatedDateDesc();

    List<EmployeeTransfer> findByIsActiveTrueOrderByCreatedDateDesc();

    List<EmployeeTransfer> findByEmployeeIdAndStatusAndIsActiveTrue(Long employeeId, String status);

    List<EmployeeTransfer> findByStatusAndExpectRevDateLessThanEqualAndIsActiveTrue(String status, Date date);

    @Query(value = "SELECT TOP 1 * FROM HR_EMPLOYEE_TRANSFER WHERE employee_id = :employeeId AND is_active = 1 ORDER BY created_date DESC, id DESC", nativeQuery = true)
    Optional<EmployeeTransfer> findLatestByEmployeeId(@Param("employeeId") Long employeeId);
}
