package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleReminderAckLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface QmsScheduleReminderAckLogRepository extends JpaRepository<QmsScheduleReminderAckLog, Long> {

    boolean existsByScheduleIdAndEmployeeIdAndReminderDate(Long scheduleId, Long employeeId, LocalDate reminderDate);

    boolean existsByScheduleIdAndUserIdAndReminderDate(Long scheduleId, String userId, LocalDate reminderDate);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM QmsScheduleReminderAckLog a " +
           "WHERE a.scheduleId = :scheduleId AND a.reminderDate = :reminderDate AND (" +
           "(:employeeId IS NOT NULL AND a.employeeId = :employeeId) OR " +
           "(:userId IS NOT NULL AND LOWER(a.userId) = LOWER(:userId)))")
    boolean isAcknowledgedToday(@Param("scheduleId") Long scheduleId, 
                                @Param("employeeId") Long employeeId, 
                                @Param("userId") String userId, 
                                @Param("reminderDate") LocalDate reminderDate);

    List<QmsScheduleReminderAckLog> findByScheduleId(Long scheduleId);

    List<QmsScheduleReminderAckLog> findByEmployeeIdAndReminderDate(Long employeeId, LocalDate reminderDate);
}
