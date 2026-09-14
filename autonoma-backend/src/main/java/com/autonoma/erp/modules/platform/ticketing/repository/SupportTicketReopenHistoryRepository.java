package com.autonoma.erp.modules.platform.ticketing.repository;

import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketReopenHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketReopenHistoryRepository extends JpaRepository<SupportTicketReopenHistory, Integer> {
    List<SupportTicketReopenHistory> findByTicketRowIdOrderByReopenedAtAsc(Integer ticketRowId);
}
