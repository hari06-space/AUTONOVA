package com.autonoma.erp.modules.hra.recruitment.repository;

import com.autonoma.erp.modules.hra.recruitment.entity.AtsRejectedDocument;
import com.autonoma.erp.modules.hra.recruitment.constant.AtsRejectionStage;
import com.autonoma.erp.modules.hra.recruitment.constant.AtsRejectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AtsRejectedDocumentRepository extends JpaRepository<AtsRejectedDocument, Long> {
    List<AtsRejectedDocument> findByEmployeeIdAndActiveStatus(Long employeeId, com.autonoma.erp.modules.platform.common.entity.StatusMaster activeStatus);
    List<AtsRejectedDocument> findByEmployeeIdAndStageAndActiveStatus(Long employeeId, AtsRejectionStage stage, com.autonoma.erp.modules.platform.common.entity.StatusMaster activeStatus);
    Optional<AtsRejectedDocument> findByEmployeeIdAndStageAndDocumentNameAndActiveStatus(Long employeeId, AtsRejectionStage stage, String documentName, com.autonoma.erp.modules.platform.common.entity.StatusMaster activeStatus);
}
