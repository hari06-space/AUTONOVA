package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistAcknowledgementRepository extends JpaRepository<ChecklistAcknowledgement, Long> {

    List<ChecklistAcknowledgement> findByNewAssigneeIdAndAckStatusOrderByIdDesc(Long newAssigneeId, String ackStatus);

    List<ChecklistAcknowledgement> findByChecklistIdAndMemberTypeAndAckStatus(Long checklistId, String memberType, String ackStatus);

    List<ChecklistAcknowledgement> findByChecklistIdOrderByIdDesc(Long checklistId);

    @Query("SELECT ca FROM ChecklistAcknowledgement ca WHERE ca.newAssigneeId = :empId ORDER BY ca.id DESC")
    List<ChecklistAcknowledgement> findAllByNewAssigneeId(@Param("empId") Long empId);
}
