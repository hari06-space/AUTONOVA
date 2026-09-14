package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.ProcurementSettingsDTO;
import com.autonoma.erp.model.ProcurementSettings;
import com.autonoma.erp.repository.ProcurementSettingsRepository;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcurementSettingsServiceImpl implements ProcurementSettingsService {

    private final ProcurementSettingsRepository repository;
    private final DivisionRepository divisionRepository;
    private final com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher realtimePublisher;

    @org.springframework.beans.factory.annotation.Autowired
    public ProcurementSettingsServiceImpl(
            ProcurementSettingsRepository repository,
            DivisionRepository divisionRepository,
            @org.springframework.context.annotation.Lazy com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher realtimePublisher) {
        this.repository = repository;
        this.divisionRepository = divisionRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Override
    public ProcurementSettingsDTO getSettingsByDivision(Long divisionId) {
        return repository.findByDivisionId(divisionId)
                .map(this::mapToDTO)
                .orElseGet(() -> {
                    // Return default weights if not set
                    ProcurementSettingsDTO defaultSettings = new ProcurementSettingsDTO();
                    defaultSettings.setDivisionId(divisionId);
                    defaultSettings.setWeightPrice(new java.math.BigDecimal("40.00"));
                    defaultSettings.setWeightDelivery(new java.math.BigDecimal("20.00"));
                    defaultSettings.setWeightRating(new java.math.BigDecimal("15.00"));
                    defaultSettings.setWeightWarranty(new java.math.BigDecimal("10.00"));
                    defaultSettings.setWeightPayment(new java.math.BigDecimal("15.00"));
                    defaultSettings.setPoApprovalThreshold(new java.math.BigDecimal("10000.00"));
                    defaultSettings.setDefaultCurrencyId(1L); // assuming 1 is default INR
                    
                    defaultSettings.setEnableGateEntry(0);
                    defaultSettings.setRequireSecurityApproval(0);
                    defaultSettings.setRequireStoresVerification(0);
                    defaultSettings.setRequireVehiclePhotos(0);
                    defaultSettings.setRequireDriverLicense(0);
                    defaultSettings.setRequireSealVerification(0);
                    defaultSettings.setRequireWeighbridge(0);

                    return defaultSettings;
                });
    }

    @Override
    @Transactional
    public ProcurementSettingsDTO saveOrUpdateSettings(ProcurementSettingsDTO dto) {
        ProcurementSettings entity = repository.findByDivisionId(dto.getDivisionId())
                .orElse(new ProcurementSettings());

        if (entity.getId() == null) {
            entity.setDivision(divisionRepository.findById(dto.getDivisionId())
                    .orElseThrow(() -> new RuntimeException("Division not found")));
            entity.setCreatedBy(SecurityUtils.getCurrentUserId());
        } else {
            entity.setUpdatedBy(SecurityUtils.getCurrentUserId());
        }

        entity.setWeightPrice(dto.getWeightPrice());
        entity.setWeightDelivery(dto.getWeightDelivery());
        entity.setWeightRating(dto.getWeightRating());
        entity.setWeightWarranty(dto.getWeightWarranty() != null ? dto.getWeightWarranty() : new java.math.BigDecimal("10.00"));
        entity.setWeightPayment(dto.getWeightPayment() != null ? dto.getWeightPayment() : new java.math.BigDecimal("15.00"));
        entity.setPoApprovalThreshold(dto.getPoApprovalThreshold() != null ? dto.getPoApprovalThreshold() : new java.math.BigDecimal("10000.00"));
        entity.setDefaultCurrencyId(dto.getDefaultCurrencyId());

        entity.setEnableGateEntry(dto.getEnableGateEntry() != null ? dto.getEnableGateEntry() : 0);
        entity.setRequireSecurityApproval(dto.getRequireSecurityApproval() != null ? dto.getRequireSecurityApproval() : 0);
        entity.setRequireStoresVerification(dto.getRequireStoresVerification() != null ? dto.getRequireStoresVerification() : 0);
        entity.setRequireVehiclePhotos(dto.getRequireVehiclePhotos() != null ? dto.getRequireVehiclePhotos() : 0);
        entity.setRequireDriverLicense(dto.getRequireDriverLicense() != null ? dto.getRequireDriverLicense() : 0);
        entity.setRequireSealVerification(dto.getRequireSealVerification() != null ? dto.getRequireSealVerification() : 0);
        entity.setRequireWeighbridge(dto.getRequireWeighbridge() != null ? dto.getRequireWeighbridge() : 0);

        try {
            ProcurementSettings saved = repository.save(entity);
            ProcurementSettingsDTO dtoResult = mapToDTO(saved);
            if (realtimePublisher != null) {
                realtimePublisher.publishMutation("ProcurementSettings", "saveSettings");
            }
            return dtoResult;
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("D:\\Workspace\\BOSs\\04082026\\Autonoma_ERP\\autonoma-backend\\settings_error.txt"));
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ignored) {}
            throw e;
        }
    }

    private ProcurementSettingsDTO mapToDTO(ProcurementSettings entity) {
        ProcurementSettingsDTO dto = new ProcurementSettingsDTO();
        dto.setId(entity.getId());
        dto.setDivisionId(entity.getDivision().getId());
        dto.setWeightPrice(entity.getWeightPrice());
        dto.setWeightDelivery(entity.getWeightDelivery());
        dto.setWeightRating(entity.getWeightRating());
        dto.setWeightWarranty(entity.getWeightWarranty());
        dto.setWeightPayment(entity.getWeightPayment());
        dto.setPoApprovalThreshold(entity.getPoApprovalThreshold());
        dto.setDefaultCurrencyId(entity.getDefaultCurrencyId());

        dto.setEnableGateEntry(entity.getEnableGateEntry());
        dto.setRequireSecurityApproval(entity.getRequireSecurityApproval());
        dto.setRequireStoresVerification(entity.getRequireStoresVerification());
        dto.setRequireVehiclePhotos(entity.getRequireVehiclePhotos());
        dto.setRequireDriverLicense(entity.getRequireDriverLicense());
        dto.setRequireSealVerification(entity.getRequireSealVerification());
        dto.setRequireWeighbridge(entity.getRequireWeighbridge());

        return dto;
    }
}
