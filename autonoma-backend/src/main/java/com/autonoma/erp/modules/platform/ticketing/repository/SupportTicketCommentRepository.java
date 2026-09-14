package com.autonoma.erp.modules.platform.ticketing.repository;

import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketCommentRepository extends JpaRepository<SupportTicketComment, Integer> {
    List<SupportTicketComment> findByTicketRowIdOrderByCreatedAtAsc(Integer ticketRowId);
}
