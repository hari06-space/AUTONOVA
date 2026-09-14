package com.autonoma.erp.modules.pdfdesigner.repository;

import com.autonoma.erp.modules.pdfdesigner.entity.BosPdfTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BosPdfTemplateRepository extends JpaRepository<BosPdfTemplate, Long> {

    List<BosPdfTemplate> findByDocumentType(String documentType);

    List<BosPdfTemplate> findByDocumentTypeAndIsActiveTrue(String documentType);

    Optional<BosPdfTemplate> findByDocumentTypeAndIsDefaultTrueAndIsActiveTrue(String documentType);

    Optional<BosPdfTemplate> findByDocumentTypeAndCompanyIdAndBranchIdAndIsDefaultTrueAndIsActiveTrue(
            String documentType, Long companyId, Long branchId);

    Optional<BosPdfTemplate> findByDocumentTypeAndCompanyIdAndIsDefaultTrueAndIsActiveTrue(
            String documentType, Long companyId);
}
