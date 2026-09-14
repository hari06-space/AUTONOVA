package com.autonoma.erp.service.purchase.gateentry.engine;

import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import com.autonoma.erp.repository.purchase.gateentry.GateEntryHeadRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class GateEntryApprovalEngine {

    private final GateEntryHeadRepository gateEntryHeadRepository;

    public GateEntryApprovalEngine(GateEntryHeadRepository gateEntryHeadRepository) {
        this.gateEntryHeadRepository = gateEntryHeadRepository;
    }

    public void processApproval(GateEntryHead head, String action, String actionBy) {
        // Handle timestamps and lifecycle logic based on action
        LocalDateTime now = LocalDateTime.now();

        switch (action) {
            case "VEHICLE ARRIVED":
                head.setArrivalTime(now);
                break;
            case "SECURITY CHECKED":
                if (head.getSecurityCheckStart() == null) {
                    head.setSecurityCheckStart(now);
                }
                head.setSecurityCheckEnd(now);
                break;
            case "STORES VERIFIED":
                if (head.getStoresInspectionStart() == null) {
                    head.setStoresInspectionStart(now);
                }
                head.setStoresInspectionEnd(now);
                break;
            case "GENERATE GRN":
                head.setGrnCreatedTime(now);
                break;
            case "VEHICLE EXIT":
                head.setExitTime(now);
                break;
        }
        
        gateEntryHeadRepository.save(head);
    }
}
