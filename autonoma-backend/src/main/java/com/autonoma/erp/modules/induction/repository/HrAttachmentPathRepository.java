package com.autonoma.erp.modules.induction.repository;

import com.autonoma.erp.modules.induction.entity.HrAttachmentPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrAttachmentPathRepository extends JpaRepository<HrAttachmentPath, Long> {
    List<HrAttachmentPath> findByPageCodeAndRefId(String pageCode, Long refId);
    List<HrAttachmentPath> findByPageCodeAndRefIdInAndDocType(String pageCode, List<Long> refIds, String docType);
    Optional<HrAttachmentPath> findByPageCodeAndRefIdAndDocType(String pageCode, Long refId, String docType);
    List<HrAttachmentPath> findAllByPageCodeAndRefIdAndDocType(String pageCode, Long refId, String docType);
    void deleteByPageCodeAndRefId(String pageCode, Long refId);

    @Modifying
    @Transactional
    @Query("DELETE FROM HrAttachmentPath a WHERE a.pageCode = :pageCode AND a.refId = :refId AND a.docType = :docType")
    void deleteByPageCodeAndRefIdAndDocType(@Param("pageCode") String pageCode, @Param("refId") Long refId, @Param("docType") String docType);
}
