package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsAttachmentPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface QmsAttachmentPathRepository extends JpaRepository<QmsAttachmentPath, Long> {
    List<QmsAttachmentPath> findByPageCodeAndRefId(String pageCode, Long refId);
    List<QmsAttachmentPath> findByPageCodeAndRefIdAndDocType(String pageCode, Long refId, String docType);
    List<QmsAttachmentPath> findByPageCodeAndRefIdIn(String pageCode, List<Long> refIds);

    @Query("SELECT q FROM QmsAttachmentPath q WHERE q.pageCode = :pageCode AND q.refId IN :refIds AND q.docType = :docType")
    List<QmsAttachmentPath> findByPageCodeAndRefIdsAndDocType(@Param("pageCode") String pageCode, @Param("refIds") List<Long> refIds, @Param("docType") String docType);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (:pageCode, :refId, :docType, :path, :fileName, :createdBy, GETDATE(), :createdBy, GETDATE())", nativeQuery = true)
    void insertAttachmentNative(@Param("pageCode") String pageCode, @Param("refId") Long refId, @Param("docType") String docType, @Param("path") String path, @Param("fileName") String fileName, @Param("createdBy") String createdBy);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByPageCodeAndRefId(String pageCode, Long refId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByPageCodeAndRefIdAndDocType(String pageCode, Long refId, String docType);
}
