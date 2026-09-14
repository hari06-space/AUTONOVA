package com.autonoma.erp.modules.hra.recruitment.repository;

import com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface HraApplicantInterviewRepository extends JpaRepository<HraApplicantInterview, Long> {
    List<HraApplicantInterview> findByEmployeeId(Long employeeId);

    List<HraApplicantInterview> findByEmployeeIdIn(List<Long> employeeIds);

    List<HraApplicantInterview> findByInterviewerId(Long interviewerId);

    List<HraApplicantInterview> findByInterviewerIdOrInterviewPersonIgnoreCase(Long interviewerId, String interviewPerson);

    void deleteByEmployeeId(Long employeeId);

    @Query(value = "SELECT i.* FROM HR_APPLICANT_INTERVIEW i " +
            "JOIN HR_EMPLOYEE c ON i.EMPLOYEE_ID = c.ID " +
            "JOIN HR_EMPLOYEE intv ON i.INTERVIEWER_ID = intv.ID " +
            "WHERE i.IS_ACTIVE = 1 " +
            "AND i.REMINDER_SENT = 0 " +
            "AND c.IS_ACTIVE = 1 " +
            "AND intv.IS_ACTIVE = 1 " +
            "AND i.INTERVIEW_STATUS = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'PENDING') " +
            "AND TRY_CAST(CONCAT(i.INTERVIEW_DATE, ' ', i.START_TIME) AS DATETIME) BETWEEN TRY_CAST(:nowStr AS DATETIME) AND TRY_CAST(:futureStr AS DATETIME)", nativeQuery = true)
    List<HraApplicantInterview> findUpcomingInterviewsForReminder(@Param("nowStr") String nowStr,
            @Param("futureStr") String futureStr);

    @Modifying
    @Transactional
    @Query(value = "SET NOCOUNT OFF; UPDATE HR_APPLICANT_INTERVIEW SET REMINDER_SENT = 1 WHERE ID = :id AND REMINDER_SENT = 0", nativeQuery = true)
    int lockAndMarkReminderSent(@Param("id") Long id);
}
