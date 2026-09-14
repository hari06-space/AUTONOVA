package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MasterChecklistRepository
              extends JpaRepository<MasterChecklist, Long>, JpaSpecificationExecutor<MasterChecklist> {
       java.util.Optional<MasterChecklist> findFirstByOrderBySeqNoDesc();

       java.util.Optional<MasterChecklist> findFirstByOrderByIdDesc();

       java.util.List<MasterChecklist> findBySeqNoAndIdNot(String seqNo, Long id);

       java.util.List<MasterChecklist> findByStatusObjNameAndVerifyStatusObjName(String status, String verifyStatus);

       @Query("SELECT m FROM MasterChecklist m WHERE (m.isActive IS NULL OR m.isActive = true) AND " +
                     "(m.statusObj.name = 'ACTIVE' AND m.verifyStatusObj.name = 'VERIFIED')")
       java.util.List<MasterChecklist> findActiveTemplatesForGeneration();

       @Query("SELECT m FROM MasterChecklist m WHERE (m.isActive IS NULL OR m.isActive = true) AND " +
                      "m.category = 'RENEWAL' AND " +
                      "(m.statusObj.name = 'ACTIVE' AND m.verifyStatusObj.name = 'VERIFIED')")
       java.util.List<MasterChecklist> findEligibleRenewalChecklists();

       java.util.List<MasterChecklist> findByAssignmentType(String assignmentType);

       @Query("SELECT m.seqNo FROM MasterChecklist m")
       java.util.List<String> findAllSeqNos();

       @Query("SELECT m FROM MasterChecklist m WHERE (m.isActive IS NULL OR m.isActive = true) AND (m.statusObj IS NULL OR (m.statusObj.name != 'INACTIVE')) AND LOWER(TRIM(m.checkingPoint)) = LOWER(TRIM(:checkingPoint)) AND (:id IS NULL OR m.id != :id)")
       java.util.List<MasterChecklist> findDuplicates(String checkingPoint, Long id);

       @Query(value = "SELECT c.* FROM QMS_CHECKLIST_MASTER c WHERE c.active = 1 " +
                     "AND (:status IS NULL OR c.status = :status) " +
                     "AND (:category IS NULL OR c.category = :category) " +
                     "AND (:verifyStatus IS NULL OR c.verify_status = :verifyStatus) " +
                     "AND (:search IS NULL OR CONTAINS(c.search_text, :search)) ORDER BY LEN(c.seq_no) DESC, c.seq_no DESC, c.id DESC", countQuery = "SELECT COUNT(*) FROM QMS_CHECKLIST_MASTER c WHERE c.active = 1 "
                                   +
                                   "AND (:status IS NULL OR c.status = :status) " +
                                   "AND (:category IS NULL OR c.category = :category) " +
                                   "AND (:verifyStatus IS NULL OR c.verify_status = :verifyStatus) " +
                                   "AND (:search IS NULL OR CONTAINS(c.search_text, :search))", nativeQuery = true)
       org.springframework.data.domain.Page<MasterChecklist> searchChecklistsFts(@Param("status") Long status,
                     @Param("category") String category, @Param("verifyStatus") Long verifyStatus,
                     @Param("search") String search, org.springframework.data.domain.Pageable pageable);

       @Query(value = "SELECT c.* FROM QMS_CHECKLIST_MASTER c WHERE c.active = 1 " +
                     "AND (:status IS NULL OR c.status = :status) " +
                     "AND (:category IS NULL OR c.category = :category) " +
                     "AND (:verifyStatus IS NULL OR c.verify_status = :verifyStatus) " +
                     "AND (:search IS NULL OR c.search_text LIKE '%' + :search + '%') ORDER BY LEN(c.seq_no) DESC, c.seq_no DESC, c.id DESC", countQuery = "SELECT COUNT(*) FROM QMS_CHECKLIST_MASTER c WHERE c.active = 1 "
                                   +
                                   "AND (:status IS NULL OR c.status = :status) " +
                                   "AND (:category IS NULL OR c.category = :category) " +
                                   "AND (:verifyStatus IS NULL OR c.verify_status = :verifyStatus) " +
                                   "AND (:search IS NULL OR c.search_text LIKE '%' + :search + '%')", nativeQuery = true)
       org.springframework.data.domain.Page<MasterChecklist> searchChecklistsLike(@Param("status") Long status,
                     @Param("category") String category, @Param("verifyStatus") Long verifyStatus,
                     @Param("search") String search, org.springframework.data.domain.Pageable pageable);

       @Query("SELECT m FROM MasterChecklist m WHERE (m.isActive IS NULL OR m.isActive = true) AND m.pageId = :pageId AND UPPER(TRIM(m.eventTrigger)) = UPPER(TRIM(:eventTrigger))")
       java.util.List<MasterChecklist> findByPageIdAndEventTriggerAndIsActiveTrue(@Param("pageId") Integer pageId, @Param("eventTrigger") String eventTrigger);

       @Query("SELECT m FROM MasterChecklist m WHERE (m.isActive IS NULL OR m.isActive = true) AND UPPER(TRIM(m.eventTrigger)) = 'DEFAULT'")
       java.util.List<MasterChecklist> findByDefaultEventTriggerAndIsActiveTrue();
}
