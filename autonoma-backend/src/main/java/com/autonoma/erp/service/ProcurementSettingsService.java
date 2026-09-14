package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.ProcurementSettingsDTO;

public interface ProcurementSettingsService {
    ProcurementSettingsDTO getSettingsByDivision(Long divisionId);
    ProcurementSettingsDTO saveOrUpdateSettings(ProcurementSettingsDTO dto);
}
