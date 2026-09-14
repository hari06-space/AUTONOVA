package com.autonoma.erp.service.purchase.gateentry;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryListDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;

public interface GateEntryService {
    
    GateEntryHeadDTO createGateEntry(GateEntryHeadDTO dto, String username);
    
    GateEntryHeadDTO updateGateEntry(Long id, GateEntryHeadDTO dto, String username);
    
    GateEntryHeadDTO getGateEntryById(Long id);
    
    void deleteGateEntry(Long id, String username);
    
    Page<GateEntryListDTO> getGateEntryList(Long divisionId, Pageable pageable);
    
    GateEntryHeadDTO processAction(Long id, String action, String username);
    
    void generateGrnFromGateEntry(Long gateEntryId, String username);
    
    List<String> getNextAllowedActions(Long id);
    
    List<java.util.Map<String, Object>> getOpenPOsForSource(Long divisionId);    
    java.util.Map<String, Object> getPoDetailsForGateEntry(Long poId);
}
