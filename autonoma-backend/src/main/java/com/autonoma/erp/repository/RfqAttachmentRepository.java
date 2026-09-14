package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfqAttachmentRepository extends JpaRepository<RfqAttachment, Long> {
    List<RfqAttachment> findByRfqHeadId(Long rfqHeadId);
    void deleteByRfqHeadId(Long rfqHeadId);
}
