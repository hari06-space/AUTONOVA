package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.VendorAttachmentPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface VendorAttachmentPathRepository extends JpaRepository<VendorAttachmentPath, Long> {

    List<VendorAttachmentPath> findByPageCodeAndRefId(String pageCode, Long refId);

    List<VendorAttachmentPath> findByPageCodeAndRefIdAndDocType(String pageCode, Long refId, String docType);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO VENDOR_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, UPDATED_USER) " +
                   "VALUES (:pageCode, :refId, :docType, :path, :fileName, :user, getdate(), :user, getdate(), :user)", nativeQuery = true)
    void insertAttachmentNative(@Param("pageCode") String pageCode,
                                @Param("refId") Long refId,
                                @Param("docType") String docType,
                                @Param("path") String path,
                                @Param("fileName") String fileName,
                                @Param("user") String user);
}
