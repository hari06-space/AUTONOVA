package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QmsScheduleRuleRepository extends JpaRepository<QmsScheduleRule, Long> {

    List<QmsScheduleRule> findByConfigIdOrderByPriorityAsc(Long configId);

    List<QmsScheduleRule> findByMeetingIdOrderByPriorityAsc(Long meetingId);

    @Query("SELECT r FROM QmsScheduleRule r WHERE ((:configId IS NOT NULL AND r.configId = :configId) OR (:meetingId IS NOT NULL AND r.meetingId = :meetingId) OR (:meetingTypeId IS NOT NULL AND r.meetingId = :meetingTypeId)) AND r.isActive = true AND r.status = 'ACTIVE' ORDER BY r.priority ASC")
    List<QmsScheduleRule> findActiveRulesByConfigOrMeeting(@Param("configId") Long configId, @Param("meetingId") Long meetingId, @Param("meetingTypeId") Long meetingTypeId);

    @Query("SELECT r FROM QmsScheduleRule r WHERE ((:configId IS NOT NULL AND r.configId = :configId) OR (:meetingId IS NOT NULL AND r.meetingId = :meetingId)) AND r.isActive = true AND r.status = 'ACTIVE' ORDER BY r.priority ASC")
    List<QmsScheduleRule> findActiveRulesByConfigOrMeeting(@Param("configId") Long configId, @Param("meetingId") Long meetingId);

    List<QmsScheduleRule> findByIsActiveTrueOrderByPriorityAsc();
    List<QmsScheduleRule> findByMeetingIdAndRuleName(Long meetingId, String ruleName);
    List<QmsScheduleRule> findByConfigIdAndRuleName(Long configId, String ruleName);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM QmsScheduleRule r WHERE r.ruleName = :ruleName AND ((:meetingId IS NOT NULL AND r.meetingId = :meetingId) OR (:configId IS NOT NULL AND r.configId = :configId))")
    void deleteByRuleNameAndTarget(@Param("ruleName") String ruleName, @Param("meetingId") Long meetingId, @Param("configId") Long configId);
}
