package com.autonoma.erp.service.purchase.gateentry.engine;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import com.autonoma.erp.repository.purchase.gateentry.GateEntryHeadRepository;
import com.autonoma.erp.dto.purchase.ProcurementSettingsDTO;
import com.autonoma.erp.service.ProcurementSettingsService;
import org.springframework.stereotype.Service;

@Service
public class GateEntryValidationEngine {

    private final GateEntryHeadRepository gateEntryHeadRepository;
    private final ProcurementSettingsService settingsService;

    public GateEntryValidationEngine(GateEntryHeadRepository gateEntryHeadRepository, ProcurementSettingsService settingsService) {
        this.gateEntryHeadRepository = gateEntryHeadRepository;
        this.settingsService = settingsService;
    }

    public void validateDriverDetails(GateEntryHeadDTO dto) {
        if (dto.getDivisionId() == null) return;
        ProcurementSettingsDTO settings = settingsService.getSettingsByDivision(dto.getDivisionId());
        if (settings != null && Integer.valueOf(1).equals(settings.getRequireDriverLicense())) {
            if (dto.getVisitors() == null || dto.getVisitors().isEmpty()) {
                throw new IllegalArgumentException("Driver / Vehicle Info is mandatory when Require Driver Details is enabled.");
            }
            for (com.autonoma.erp.dto.purchase.gateentry.GateEntryVisitorDTO v : dto.getVisitors()) {
                if (v.getDriverName() == null || v.getDriverName().trim().isEmpty() || "N/A".equalsIgnoreCase(v.getDriverName().trim())) {
                    throw new IllegalArgumentException("Driver Name is mandatory");
                }
                if (v.getDriverMobile() == null || v.getDriverMobile().trim().isEmpty() || "N/A".equalsIgnoreCase(v.getDriverMobile().trim())) {
                    throw new IllegalArgumentException("Driver Mobile is mandatory");
                }
                if (v.getDriverLicenseNo() == null || v.getDriverLicenseNo().trim().isEmpty()) {
                    throw new IllegalArgumentException("Driver License No is mandatory");
                }
                if (v.getLicenseExpiry() == null) {
                    throw new IllegalArgumentException("License Expiry Date is mandatory");
                }
                if (v.getEmergencyContact() == null || v.getEmergencyContact().trim().isEmpty()) {
                    throw new IllegalArgumentException("Emergency Contact is mandatory");
                }
            }
        }
    }

    public void validateForCreation(GateEntryHeadDTO dto) {
        if (dto.getDivisionId() == null) {
            throw new IllegalArgumentException("Division ID is mandatory");
        }
        if (dto.getSupplierId() == null && dto.getTransporterId() == null) {
            throw new IllegalArgumentException("Either Supplier or Transporter is required");
        }
    }

    public void validateForSubmit(GateEntryHead head) {
        if (head.getTransactions().isEmpty()) {
            throw new IllegalArgumentException("Cannot submit Gate Entry without any transactions");
        }
        if (head.getVisitors().isEmpty()) {
            throw new IllegalArgumentException("Cannot submit Gate Entry without vehicle information");
        }
    }

    public void validateDuplicate(String gateEntryNo, Long divisionId) {
        if (gateEntryHeadRepository.existsByGateEntryNoAndDivisionId(gateEntryNo, divisionId)) {
            throw new IllegalArgumentException("Gate Entry Number already exists: " + gateEntryNo);
        }
    }
}
