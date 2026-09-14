package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistClosed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface ChecklistClosedRepository extends JpaRepository<ChecklistClosed, Long>, JpaSpecificationExecutor<ChecklistClosed> {
    java.util.List<ChecklistClosed> findByChecklistId(Long checklistId);
    java.util.List<ChecklistClosed> findByChecklistIdAndChecklistDate(Long checklistId, Date checklistDate);

    java.util.List<ChecklistClosed> findByChecklistIdAndAssignedToAndChecklistDate(
            Long checklistId, String assignedTo, Date checklistDate);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM ChecklistClosed c WHERE c.checklist.id = :checklistId " +
           "AND c.assignedTo = :assignedTo " +
           "AND ((:groupName IS NULL AND (c.groupName IS NULL OR TRIM(c.groupName) = '' OR TRIM(c.groupName) = '-')) " +
           "     OR (UPPER(TRIM(c.groupName)) = UPPER(TRIM(:groupName)))) " +
           "AND c.checklistDate = :checklistDate")
    java.util.List<ChecklistClosed> findByChecklistIdAndAssignedToAndGroupNameAndChecklistDate(
            @org.springframework.data.repository.query.Param("checklistId") Long checklistId,
            @org.springframework.data.repository.query.Param("assignedTo") String assignedTo,
            @org.springframework.data.repository.query.Param("groupName") String groupName,
            @org.springframework.data.repository.query.Param("checklistDate") Date checklistDate);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM ChecklistClosed c WHERE c.checklist.id = :checklistId " +
           "AND ((:groupName IS NULL AND (c.groupName IS NULL OR TRIM(c.groupName) = '' OR TRIM(c.groupName) = '-')) " +
           "     OR (UPPER(TRIM(c.groupName)) = UPPER(TRIM(:groupName)))) " +
           "AND c.checklistDate = :checklistDate ORDER BY c.id DESC")
    java.util.List<ChecklistClosed> findByChecklistIdAndGroupNameAndChecklistDateOrderByIdDesc(
            @org.springframework.data.repository.query.Param("checklistId") Long checklistId,
            @org.springframework.data.repository.query.Param("groupName") String groupName,
            @org.springframework.data.repository.query.Param("checklistDate") Date checklistDate);

    Optional<ChecklistClosed> findFirstByChecklistIdAndChecklistDateOrderByIdDesc(
            Long checklistId, Date checklistDate);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM ChecklistClosed c JOIN c.checklist m WHERE " +
           "(c.isActive IS NULL OR c.isActive = true) AND " +
           "m.category = 'CHECK LIST' AND " +
           "(m.carryForward IS NULL OR UPPER(TRIM(m.carryForward)) = 'NO') AND " +
           "c.status.name IN ('Open', 'Pending') AND " +
           "c.checklistDate <= :targetDate")
    java.util.List<ChecklistClosed> findEligibleEodChecklists(@org.springframework.data.repository.query.Param("targetDate") Date targetDate);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) > 0 FROM ChecklistClosed c WHERE c.checklist.id = :checklistId " +
           "AND (c.triggerId = :businessRecordId OR c.assignedTo = :businessRecordStr) " +
           "AND c.checklistDate BETWEEN :startDate AND :endDate")
    boolean existsDuplicate(
        @org.springframework.data.repository.query.Param("checklistId") Long checklistId,
        @org.springframework.data.repository.query.Param("businessRecordId") Long businessRecordId,
        @org.springframework.data.repository.query.Param("businessRecordStr") String businessRecordStr,
        @org.springframework.data.repository.query.Param("startDate") Date startDate,
        @org.springframework.data.repository.query.Param("endDate") Date endDate
    );
}

