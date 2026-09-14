package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesAttachmentPathRepository extends JpaRepository<SalesAttachmentPath, Long> {
    List<SalesAttachmentPath> findByPageCodeAndRefId(String pageCode, Long refId);
    void deleteByPageCodeAndRefId(String pageCode, Long refId);
}
