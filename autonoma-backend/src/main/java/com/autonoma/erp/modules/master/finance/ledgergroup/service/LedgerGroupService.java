package com.autonoma.erp.modules.master.finance.ledgergroup.service;

import com.autonoma.erp.modules.master.finance.ledgergroup.dto.LedgerGroupDTO;

import java.util.List;

public interface LedgerGroupService {
    LedgerGroupDTO createLedgerGroup(LedgerGroupDTO dto);
    LedgerGroupDTO updateLedgerGroup(Long id, LedgerGroupDTO dto);
    LedgerGroupDTO getLedgerGroupById(Long id);
    List<LedgerGroupDTO> getAllLedgerGroups();
    void deleteLedgerGroup(Long id);
}
