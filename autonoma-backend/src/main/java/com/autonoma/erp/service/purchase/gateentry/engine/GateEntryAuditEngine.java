package com.autonoma.erp.service.purchase.gateentry.engine;

import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import com.autonoma.erp.model.purchase.gateentry.GateEntryLog;
import com.autonoma.erp.repository.purchase.gateentry.GateEntryLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class GateEntryAuditEngine {

    private final GateEntryLogRepository gateEntryLogRepository;

    public GateEntryAuditEngine(GateEntryLogRepository gateEntryLogRepository) {
        this.gateEntryLogRepository = gateEntryLogRepository;
    }

    public void logEvent(GateEntryHead head, String eventType, String description, String username) {
        GateEntryLog log = new GateEntryLog();
        log.setGateEntryHead(head);
        log.setEventType(eventType);
        log.setEventDescription(description);
        log.setCreatedBy(username);
        log.setCreatedDate(new java.util.Date());
        gateEntryLogRepository.save(log);
    }
}
