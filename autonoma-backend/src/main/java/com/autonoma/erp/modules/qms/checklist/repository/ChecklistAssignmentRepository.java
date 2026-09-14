package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface ChecklistAssignmentRepository extends JpaRepository<ChecklistAssignment, Long>, JpaSpecificationExecutor<ChecklistAssignment> {
    List<ChecklistAssignment> findByChecklistId(Long checklistId);
    List<ChecklistAssignment> findByChecklistDate(Date checklistDate);
    List<ChecklistAssignment> findByChecklistIdAndChecklistDate(Long checklistId, Date checklistDate);
    List<ChecklistAssignment> findByPendingActivationTrue();
    Optional<ChecklistAssignment> findByChecklistIdAndAssignedToAndChecklistDate(Long checklistId, String assignedTo, Date checklistDate);
    List<ChecklistAssignment> findAllByChecklistIdAndAssignedToAndChecklistDate(Long checklistId, String assignedTo, Date checklistDate);
    boolean existsByChecklistIdAndAssignedToAndChecklistDate(Long checklistId, String assignedTo, Date checklistDate);

    @Query("SELECT c FROM ChecklistAssignment c LEFT JOIN c.status s WHERE (s IS NULL OR s.name NOT IN ('Completed', 'Verified', 'Accepted', 'Unresolved', 'Missed')) AND c.checklistDate <= :today AND c.checklistDate IS NOT NULL")
    List<ChecklistAssignment> findUncompletedAssignments(@Param("today") Date today);

    /**
     * Finds rows where STATUS_ID is NULL (legacy/race-condition rows).
     * Called by the EOD job to fix them before processing.
     */
    @Query("SELECT c FROM ChecklistAssignment c WHERE c.status IS NULL AND c.checklistDate IS NOT NULL")
    List<ChecklistAssignment> findByStatusIsNullAndChecklistDateIsNotNull();

    @Query("SELECT c FROM ChecklistAssignment c JOIN c.status s WHERE s.name NOT IN ('Completed', 'Verified', 'Accepted', 'Auto Closed', 'Cancelled')")
    List<ChecklistAssignment> findAllOpenAssignments();

    /**
     * Find all PRIMARY assignments that are open/pending for a specific checklist date.
     * Used by the scheduler to identify who needs to be checked for leave availability.
     */
    @Query("SELECT c FROM ChecklistAssignment c JOIN c.status s " +
           "WHERE c.assignType = 'PRIMARY' " +
           "AND s.name IN ('Pending', 'In Progress', 'Open') " +
           "AND c.checklistDate = :checklistDate " +
           "AND (c.isActive IS NULL OR c.isActive = true)")
    List<ChecklistAssignment> findPrimaryAssignmentsForDate(@Param("checklistDate") Date checklistDate);

    /**
     * Find all open PRIMARY assignments (any date) for scheduler reassignment validation.
     * This is used at 10AM/2PM/4PM to check leave status.
     */
    @Query("SELECT c FROM ChecklistAssignment c JOIN c.status s " +
           "WHERE c.assignType = 'PRIMARY' " +
           "AND s.name IN ('Pending', 'In Progress', 'Open') " +
           "AND (c.isActive IS NULL OR c.isActive = true) " +
           "AND c.checklistDate <= :today")
    List<ChecklistAssignment> findOpenPrimaryAssignments(@Param("today") Date today);

    /**
     * Find all open active hierarchy assignments (PRIMARY, SECONDARY, TERTIARY) (any date)
     * for scheduler reassignment validation.
     */
    @Query("SELECT c FROM ChecklistAssignment c JOIN c.status s " +
           "WHERE c.assignType IN ('PRIMARY', 'SECONDARY', 'TERTIARY') " +
           "AND s.name IN ('Pending', 'In Progress', 'Open') " +
           "AND (c.isActive IS NULL OR c.isActive = true) " +
           "AND c.checklistDate <= :today")
    List<ChecklistAssignment> findOpenActiveAssignments(@Param("today") Date today);

    /**
     * Find the SECONDARY assignment for a given checklist.
     * Returns the most recent active SECONDARY assignment row.
     */
    @Query("SELECT c FROM ChecklistAssignment c " +
           "WHERE c.checklist.id = :checklistId " +
           "AND c.assignType = 'SECONDARY' " +
           "AND (c.isActive IS NULL OR c.isActive = true) " +
           "ORDER BY c.id DESC")
    List<ChecklistAssignment> findSecondaryAssignmentsForChecklist(@Param("checklistId") Long checklistId);

    /**
     * Find the TERTIARY assignment for a given checklist.
     * Returns the most recent active TERTIARY assignment row.
     */
    @Query("SELECT c FROM ChecklistAssignment c " +
           "WHERE c.checklist.id = :checklistId " +
           "AND c.assignType = 'TERTIARY' " +
           "AND (c.isActive IS NULL OR c.isActive = true) " +
           "ORDER BY c.id DESC")
    List<ChecklistAssignment> findTertiaryAssignmentsForChecklist(@Param("checklistId") Long checklistId);

    /**
     * Find any assignment for a checklist that matches a specific date and assign type.
     */
    @Query("SELECT c FROM ChecklistAssignment c " +
           "WHERE c.checklist.id = :checklistId " +
           "AND c.assignType = :assignType " +
           "AND c.checklistDate = :checklistDate " +
           "AND (c.isActive IS NULL OR c.isActive = true)")
    List<ChecklistAssignment> findByChecklistIdAndAssignTypeAndChecklistDate(
        @Param("checklistId") Long checklistId,
        @Param("assignType") String assignType,
        @Param("checklistDate") Date checklistDate
    );

    @Query("SELECT c FROM ChecklistAssignment c WHERE c.checklistDate IS NULL AND (c.isActive IS NULL OR c.isActive = true)")
    List<ChecklistAssignment> findActiveTemplates();
    @Query("SELECT DISTINCT UPPER(TRIM(c.groupName)) FROM ChecklistAssignment c WHERE c.groupName IS NOT NULL AND TRIM(c.groupName) <> '' ORDER BY UPPER(TRIM(c.groupName)) ASC")
    List<String> findDistinctGroupNames();

    @Query("SELECT COUNT(c) > 0 FROM ChecklistAssignment c WHERE c.checklist.id = :checklistId " +
           "AND (c.triggerId = :businessRecordId OR c.assignedTo = :businessRecordStr) " +
           "AND c.checklistDate BETWEEN :startDate AND :endDate")
    boolean existsDuplicate(
        @Param("checklistId") Long checklistId,
        @Param("businessRecordId") Long businessRecordId,
        @Param("businessRecordStr") String businessRecordStr,
        @Param("startDate") Date startDate,
        @Param("endDate") Date endDate
    );
}
