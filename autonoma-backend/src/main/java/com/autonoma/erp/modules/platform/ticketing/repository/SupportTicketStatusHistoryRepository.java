package com.autonoma.erp.modules.platform.ticketing.repository;

import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketStatusHistoryRepository extends JpaRepository<SupportTicketStatusHistory, Integer> {
    List<SupportTicketStatusHistory> findByTicketRowIdOrderByUpdatedAtAsc(Integer ticketRowId);
}
