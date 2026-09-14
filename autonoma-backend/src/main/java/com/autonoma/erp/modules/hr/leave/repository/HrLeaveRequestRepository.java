package com.autonoma.erp.modules.hr.leave.repository;

import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Repository
public interface HrLeaveRequestRepository extends JpaRepository<HrLeaveRequest, Long> {

    List<HrLeaveRequest> findByEmpIdOrderByRequestDateDesc(Long empId);

    List<HrLeaveRequest> findByManagerIdAndStatusOrderByRequestDateDesc(Long managerId, String status);

    List<HrLeaveRequest> findByHrIdAndStatusOrderByRequestDateDesc(Long hrId, String status);

    List<HrLeaveRequest> findByLeaveTypeIdAndStatusOrderByRequestDateDesc(Long leaveTypeId, String status);

    List<HrLeaveRequest> findByEmpIdInAndStatusInOrderByRequestDateDesc(List<Long> empIds, List<String> statuses);

    List<HrLeaveRequest> findAllByOrderByRequestDateDesc();

    List<HrLeaveRequest> findByStatusOrderByRequestDateDesc(String status);

    List<HrLeaveRequest> findByStatusInOrderByRequestDateDesc(List<String> statuses);

    @Query("SELECT r FROM HrLeaveRequest r WHERE r.leaveTypeId = :leaveTypeId AND r.status IN ('MANAGER_APPROVED','HR_APPROVED','APPROVED') " +
           "AND ((r.startDate BETWEEN :from AND :to) OR (r.endDate BETWEEN :from AND :to))")
    List<HrLeaveRequest> findApprovedByLeaveTypeAndDateRange(@Param("leaveTypeId") Long leaveTypeId,
                                                             @Param("from") LocalDate from,
                                                             @Param("to") LocalDate to);

    @Query("SELECT r FROM HrLeaveRequest r WHERE r.status IN ('MANAGER_APPROVED','HR_APPROVED','APPROVED') " +
           "AND ((r.startDate BETWEEN :from AND :to) OR (r.endDate BETWEEN :from AND :to))")
    List<HrLeaveRequest> findAllApprovedBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT r FROM HrLeaveRequest r WHERE r.status IN ('MANAGER_APPROVED','HR_APPROVED','APPROVED') " +
           "AND YEAR(r.startDate) = :year")
    List<HrLeaveRequest> findAllApprovedByYear(@Param("year") Integer year);

    @Query("SELECT r FROM HrLeaveRequest r WHERE r.empId = :empId " +
           "AND r.startDate <= :to AND r.endDate >= :from " +
           "AND (r.status IS NULL OR UPPER(TRIM(r.status)) NOT IN ('REJECTED','CANCELLED','REJECT'))")
    List<HrLeaveRequest> findConflictingRequests(@Param("empId") Long empId,
                                                  @Param("from") LocalDate from,
                                                  @Param("to") LocalDate to);

    @Query("SELECT r FROM HrLeaveRequest r WHERE r.empId = :empId " +
           "AND :date BETWEEN r.startDate AND r.endDate " +
           "AND r.status IN ('MANAGER_APPROVED','HR_APPROVED','APPROVED')")
    List<HrLeaveRequest> findApprovedLeavesOnDate(@Param("empId") Long empId, @Param("date") LocalDate date);

    long countByCreatedDateBetween(Date start, Date end);
}
