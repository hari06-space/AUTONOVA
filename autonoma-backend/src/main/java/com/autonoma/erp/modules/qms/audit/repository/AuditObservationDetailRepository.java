package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail;
import com.autonoma.erp.modules.qms.audit.entity.NcrReworkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface AuditObservationDetailRepository extends JpaRepository<AuditObservationDetail, Long> {
    @Query("SELECT ad FROM AuditObservationDetail ad " +
            "JOIN FETCH ad.auditObservation ao " +
            "LEFT JOIN ao.ncrApprovedByEntity ncrApp " +
            "LEFT JOIN ao.auditTypeEntity at " +
            "LEFT JOIN ad.ncrStatusObj nso " +
            "WHERE ad.observationStatus IN ('NC', 'NCR', 'OFI') " +
            "AND (:observationStatus IS NULL OR :observationStatus = 'All' OR ad.observationStatus = :observationStatus OR (:observationStatus = 'NC' AND ad.observationStatus = 'NCR')) "
            +
            "AND (:ncrStatus IS NULL OR :ncrStatus = 'All' OR nso.name = :ncrStatus OR (:ncrStatus = 'OPEN' AND (nso IS NULL OR nso.name = 'OPEN')) ) "
            +
            "AND (:ncrApprovedBy IS NULL OR :ncrApprovedBy = 'All' OR ncrApp.empCode = :ncrApprovedBy OR CONCAT(ncrApp.employeeName, ' - ', ncrApp.empCode) = :ncrApprovedBy) "
            +
            "AND (:query IS NULL OR ao.observationNo LIKE %:query% OR ao.auditScheduleNo LIKE %:query% OR at.auditType LIKE %:query%) "
            +
            "AND (:considerDate = 'No' OR (ao.observationDate >= :fromDate AND ao.observationDate <= :toDate)) " +
            "AND NOT EXISTS (SELECT 1 FROM NcrReworkLog r WHERE r.observationDetailId = ad.id AND r.verifyStatus = 'VERIFIED')")
    List<AuditObservationDetail> findPendingNcrFindingsFiltered(
            @org.springframework.data.repository.query.Param("fromDate") java.util.Date fromDate,
            @org.springframework.data.repository.query.Param("toDate") java.util.Date toDate,
            @org.springframework.data.repository.query.Param("considerDate") String considerDate,
            @org.springframework.data.repository.query.Param("observationStatus") String observationStatus,
            @org.springframework.data.repository.query.Param("ncrStatus") String ncrStatus,
            @org.springframework.data.repository.query.Param("ncrApprovedBy") String ncrApprovedBy,
            @org.springframework.data.repository.query.Param("query") String query);

    @Query("SELECT ad FROM AuditObservationDetail ad JOIN ad.auditObservation ao WHERE ad.observationStatus IN ('NCR', 'NC', 'OFI') AND ad.approvalStatus != 'CLOSED'")
    List<AuditObservationDetail> findPendingNcrFindings();

    @Query("SELECT d FROM AuditObservationDetail d WHERE d.observationStatus IN ('NCR', 'NC', 'OFI')")
    List<AuditObservationDetail> findAllNcrAndOfi();

    List<AuditObservationDetail> findByObservationStatus(String status);

    AuditObservationDetail findFirstByNcrNoIsNotNullOrderByNcrNoDesc();

    @Query(value = "SELECT COUNT(*) FROM QMS_NCR_REWORK_LOG WITH (NOLOCK) WHERE OBSERVATION_DETAIL_ID = :detailId", nativeQuery = true)
    Integer countReworksByObservationDetailId(
            @org.springframework.data.repository.query.Param("detailId") Long detailId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO QMS_NCR_REWORK_LOG (OBSERVATION_DETAIL_ID, REWORK_NO, SUBMITTED_BY, SUBMITTED_AT, ROOT_CAUSE, CORRECTIVE_ACTION, PREVENTIVE_ACTION) VALUES (:detailId, :reworkNo, :submittedBy, GETDATE(), :rootCause, :correctiveAction, :preventiveAction)", nativeQuery = true)
    void insertReworkLog(@org.springframework.data.repository.query.Param("detailId") Long detailId,
            @org.springframework.data.repository.query.Param("reworkNo") Integer reworkNo,
            @org.springframework.data.repository.query.Param("submittedBy") String submittedBy,
            @org.springframework.data.repository.query.Param("rootCause") String rootCause,
            @org.springframework.data.repository.query.Param("correctiveAction") String correctiveAction,
            @org.springframework.data.repository.query.Param("preventiveAction") String preventiveAction);

    @Query(value = "SELECT NEXT VALUE FOR SEQ_NCR_OFI_NO", nativeQuery = true)
    Long getNextSequenceValue();
}
