package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QmsMeetingMasterRepository extends JpaRepository<QmsMeetingMaster, Integer> {

    
    boolean existsByMeetingNameIgnoreCase(String meetingName);
    boolean existsByMeetingNameIgnoreCaseAndIdNot(String meetingName, Integer id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM QMS_MEETING_EMPLOYEE_MAPPING WHERE MEETING_ID = :meetingId", nativeQuery = true)
    void deleteEmployeeMappingsByMeetingId(@org.springframework.data.repository.query.Param("meetingId") Integer meetingId);
}
