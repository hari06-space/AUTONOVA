package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.LeaveTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LeaveTransactionRepository extends JpaRepository<LeaveTransaction, Long> {

    List<LeaveTransaction> findByIsActiveTrueOrderByTransactionDateDesc();

    List<LeaveTransaction> findByEmployeeIdAndIsActiveTrueOrderByTransactionDateDesc(Long employeeId);

    @Query("SELECT COALESCE(SUM(t.crQty), 0) FROM LeaveTransaction t WHERE t.employeeId = :employeeId AND t.remarks = 'Working Days Credit' AND t.isActive = true")
    BigDecimal getSumOfWorkingDayCredits(@Param("employeeId") Long employeeId);

    @Query("SELECT t.employeeId, COALESCE(SUM(t.crQty), 0) FROM LeaveTransaction t WHERE t.remarks = 'Working Days Credit' AND t.isActive = true GROUP BY t.employeeId")
    List<Object[]> getSumOfWorkingDayCreditsForAll();

    @Query("SELECT t FROM LeaveTransaction t LEFT JOIN FETCH t.employee WHERE t.isActive = true ORDER BY t.transactionDate DESC")
    List<LeaveTransaction> findAllActiveWithEmployeeOrderByTransactionDateDesc();
}
