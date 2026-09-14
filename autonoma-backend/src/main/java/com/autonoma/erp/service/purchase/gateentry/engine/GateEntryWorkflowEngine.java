package com.autonoma.erp.service.purchase.gateentry.engine;

import com.autonoma.erp.dto.purchase.ProcurementSettingsDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import com.autonoma.erp.service.ProcurementSettingsService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GateEntryWorkflowEngine {

    private final ProcurementSettingsService settingsService;

    public GateEntryWorkflowEngine(ProcurementSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    public List<String> getNextAllowedActions(GateEntryHead head) {
        List<String> actions = new ArrayList<>();
        ProcurementSettingsDTO settings = settingsService.getSettingsByDivision(head.getDivision().getId());
        String currentStatus = head.getStatus().getName().toUpperCase();

        if (!Boolean.TRUE.equals(settings.getEnableGateEntry())) {
            return actions; // Workflow disabled
        }

        switch (currentStatus) {
            case "DRAFT":
                actions.add("SUBMIT");
                break;
            case "VEHICLE EXPECTED":
                actions.add("VEHICLE ARRIVED");
                break;
            case "VEHICLE ARRIVED":
            case "WAITING FOR SECURITY":
                if (Boolean.TRUE.equals(settings.getRequireSecurityApproval())) {
                    actions.add("SECURITY CHECKED");
                } else {
                    actions.add("READY FOR GRN"); // Skip security
                }
                break;
            case "SECURITY CHECKED":
            case "WAITING FOR STORES":
                if (Boolean.TRUE.equals(settings.getRequireStoresVerification())) {
                    actions.add("STORES VERIFIED");
                } else {
                    actions.add("READY FOR GRN");
                }
                break;
            case "STORES VERIFIED":
                actions.add("READY FOR GRN");
                break;
            case "READY FOR GRN":
                actions.add("GENERATE GRN");
                break;
            case "GRN CREATED":
                actions.add("VEHICLE EXIT");
                break;
            case "VEHICLE EXIT":
                actions.add("COMPLETED");
                break;
            default:
                break;
        }

        return actions;
    }
}
