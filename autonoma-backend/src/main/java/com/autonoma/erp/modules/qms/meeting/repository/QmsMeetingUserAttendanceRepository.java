package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
@Transactional(readOnly = true, isolation = Isolation.READ_UNCOMMITTED)
public interface QmsMeetingUserAttendanceRepository extends JpaRepository<QmsMeetingUserAttendance, Long> {
    
    @Query("SELECT a FROM QmsMeetingUserAttendance a LEFT JOIN FETCH a.schedule LEFT JOIN FETCH a.employee LEFT JOIN FETCH a.statusObj WHERE a.schedule.id = :scheduleId")
    List<QmsMeetingUserAttendance> findByScheduleId(@Param("scheduleId") Long scheduleId);
    
    @Query("SELECT a FROM QmsMeetingUserAttendance a LEFT JOIN FETCH a.schedule LEFT JOIN FETCH a.employee LEFT JOIN FETCH a.statusObj WHERE a.schedule.id = :scheduleId AND a.employee.id = :employeeId")
    java.util.List<QmsMeetingUserAttendance> findByScheduleIdAndEmployeeId(@Param("scheduleId") Long scheduleId, @Param("employeeId") Long employeeId);

    @Query("SELECT a FROM QmsMeetingUserAttendance a LEFT JOIN FETCH a.schedule s LEFT JOIN FETCH a.employee LEFT JOIN FETCH a.statusObj WHERE s.meetingDate BETWEEN :fromDate AND :toDate ORDER BY a.id DESC")
    List<QmsMeetingUserAttendance> findBySchedule_MeetingDateBetweenOrderByIdDesc(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT a FROM QmsMeetingUserAttendance a LEFT JOIN FETCH a.schedule s LEFT JOIN FETCH a.employee e LEFT JOIN FETCH a.statusObj WHERE s.meetingDate BETWEEN :fromDate AND :toDate AND e.id IN :empIds ORDER BY a.id DESC")
    List<QmsMeetingUserAttendance> findByDateRangeAndEmpIds(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate, @Param("empIds") java.util.Collection<Long> empIds);

    @Query("SELECT a FROM QmsMeetingUserAttendance a LEFT JOIN FETCH a.schedule LEFT JOIN FETCH a.employee e LEFT JOIN FETCH a.statusObj WHERE e.id IN :empIds ORDER BY a.id DESC")
    List<QmsMeetingUserAttendance> findAllByEmpIds(@Param("empIds") java.util.Collection<Long> empIds);

    @Query("SELECT a FROM QmsMeetingUserAttendance a LEFT JOIN FETCH a.schedule LEFT JOIN FETCH a.employee LEFT JOIN FETCH a.statusObj ORDER BY a.id DESC")
    List<QmsMeetingUserAttendance> findAllWithFetch();
}
