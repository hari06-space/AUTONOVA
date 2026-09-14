package com.autonoma.erp.repository;

import com.autonoma.erp.model.HrOtMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface HrOtMasterRepository extends JpaRepository<HrOtMaster, Long> {

    List<HrOtMaster> findByCompanyIdAndActiveStatusTrueOrderByIdDesc(Long companyId);

    List<HrOtMaster> findByEmployeeIdAndActiveStatusTrueOrderByOtDateDesc(Long employeeId);

    @Query("SELECT o FROM HrOtMaster o WHERE o.activeStatus = true AND o.companyId = :companyId " +
           "AND (:fromDate IS NULL OR o.otDate >= :fromDate) " +
           "AND (:toDate IS NULL OR o.otDate <= :toDate) " +
           "AND (:employeeId IS NULL OR o.employeeId = :employeeId) " +
           "ORDER BY o.otDate DESC, o.id DESC")
    List<HrOtMaster> filterOtRecords(
            @Param("companyId") Long companyId,
            @Param("fromDate") Date fromDate,
            @Param("toDate") Date toDate,
            @Param("employeeId") Long employeeId
    );

    @Query("SELECT o FROM HrOtMaster o WHERE o.activeStatus = true AND o.companyId = :companyId " +
           "AND o.statusId = :statusId " +
           "AND (:verticalHeadId IS NULL OR o.verticalHeadId = :verticalHeadId) " +
           "ORDER BY o.otDate DESC, o.id DESC")
    List<HrOtMaster> findPendingVerifications(
            @Param("companyId") Long companyId,
            @Param("statusId") Integer statusId,
            @Param("verticalHeadId") Long verticalHeadId
    );

    @Query(value = "SELECT COALESCE(SUM(o.DURATION_MINUTES), 0) FROM HR_OT_MASTER o WITH (NOLOCK) " +
                   "WHERE o.EMPLOYEE_ID = :employeeId AND o.STATUS_ID = :verifiedStatusId " +
                   "AND MONTH(o.OT_DATE) = :month AND YEAR(o.OT_DATE) = :year AND o.ACTIVE_STATUS = 1", nativeQuery = true)
    Integer findApprovedOtMinutesForMonthAndYear(
            @Param("employeeId") Long employeeId,
            @Param("verifiedStatusId") Integer verifiedStatusId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );
}
