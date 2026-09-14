package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NcrOfiAttachmentRepository extends JpaRepository<NcrOfiAttachment, Long> {
    List<NcrOfiAttachment> findByPageCodeAndRefId(String pageCode, String refId);

    @Query("SELECT a FROM NcrOfiAttachment a WHERE a.pageCode IN (:pageCodes) AND a.refId IN (:refIds)")
    List<NcrOfiAttachment> findByPageCodesAndRefIds(
        @org.springframework.data.repository.query.Param("pageCodes") List<String> pageCodes,
        @org.springframework.data.repository.query.Param("refIds") List<String> refIds
    );
}
