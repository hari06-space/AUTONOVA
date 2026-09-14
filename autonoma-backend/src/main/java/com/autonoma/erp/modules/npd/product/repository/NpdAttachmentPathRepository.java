package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NpdAttachmentPathRepository extends JpaRepository<NpdAttachmentPath, Long> {
    List<NpdAttachmentPath> findByPageCodeAndRefId(String pageCode, Long refId);
    void deleteByPageCodeAndRefId(String pageCode, Long refId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "UPDATE NPD_ATTACHMENT_PATH SET REF_ID = :refId WHERE ID = :id", nativeQuery = true)
    void updateRefId(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("refId") Long refId);
}
