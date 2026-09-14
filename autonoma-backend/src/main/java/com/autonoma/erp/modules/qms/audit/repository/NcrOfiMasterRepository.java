package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.NcrOfiMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface NcrOfiMasterRepository extends JpaRepository<NcrOfiMaster, Integer> {
    Optional<NcrOfiMaster> findByNcrOfiNo(String ncrOfiNo);
    
    @Query("SELECT MAX(n.ncrOfiNo) FROM NcrOfiMaster n WHERE n.type = :type AND n.ncrOfiNo LIKE :prefix")
    String findMaxNoByTypeAndPrefix(String type, String prefix);
    
    Optional<NcrOfiMaster> findByObservationDetailId(Integer observationDetailId);
    Optional<NcrOfiMaster> findFirstByObservationDetailIdOrderByIdDesc(Integer observationDetailId);

    // Issue 6: Rework log support
    @Query(value = "SELECT COUNT(*) FROM QMS_NCR_REWORK_LOG WITH (NOLOCK) WHERE OBSERVATION_DETAIL_ID = :detailId", nativeQuery = true)
    Integer countReworksByObservationDetailId(Integer detailId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO QMS_NCR_REWORK_LOG (OBSERVATION_DETAIL_ID, REWORK_NO, SUBMITTED_BY, SUBMITTED_AT, ROOT_CAUSE, CORRECTIVE_ACTION, PREVENTIVE_ACTION) VALUES (:detailId, :reworkNo, :submittedBy, GETDATE(), :rootCause, :correctiveAction, :preventiveAction)", nativeQuery = true)
    void insertReworkLog(Integer detailId, Integer reworkNo, String submittedBy, String rootCause, String correctiveAction, String preventiveAction);

    @Query(value = "SELECT NEXT VALUE FOR SEQ_NCR_OFI_NO", nativeQuery = true)
    Long getNextSequenceValue();
}
