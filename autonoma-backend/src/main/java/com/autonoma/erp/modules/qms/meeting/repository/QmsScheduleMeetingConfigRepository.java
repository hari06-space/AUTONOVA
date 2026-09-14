package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleMeetingConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QmsScheduleMeetingConfigRepository extends JpaRepository<QmsScheduleMeetingConfig, Long> {
    
    @Query("SELECT c FROM QmsScheduleMeetingConfig c WHERE c.status IS NULL OR c.status = false")
    List<QmsScheduleMeetingConfig> findByStatusIsNullOrStatusFalse();

    java.util.Optional<QmsScheduleMeetingConfig> findByMeetingId(Long meetingId);

    List<QmsScheduleMeetingConfig> findByMeetingTypeIdOrderByIdDesc(Long meetingTypeId);
}
