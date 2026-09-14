package com.autonoma.erp.modules.platform.ticketing.repository;

import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketAttachmentRepository extends JpaRepository<SupportTicketAttachment, Integer> {
    List<SupportTicketAttachment> findByTicketRowIdOrderByUploadedAtAsc(Integer ticketRowId);
}
