package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.modules.platform.identity.dto.ClientHealthDTO;
import com.autonoma.erp.modules.platform.identity.dto.ClientMasterDTO;

import java.util.List;

public interface ClientHealthService {

    List<ClientMasterDTO> getClientsWithHealthMonitoring();

    ClientHealthDTO getLiveHealthSummary(String clientCode);

    ClientHealthDTO getHealthTrends(String clientCode, String range);
}
