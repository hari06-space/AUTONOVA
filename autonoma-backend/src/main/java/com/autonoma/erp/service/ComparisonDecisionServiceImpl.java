package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.ComparisonDecisionDTO;
import com.autonoma.erp.model.ComparisonDecision;
import com.autonoma.erp.repository.ComparisonDecisionRepository;
import com.autonoma.erp.repository.RfqHeadRepository;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
public class ComparisonDecisionServiceImpl implements ComparisonDecisionService {

    private final ComparisonDecisionRepository repository;
    private final RfqHeadRepository rfqRepository;
    private final AccountLedgerRepository supplierRepository;
    private final StatusMasterRepository statusRepository;
    private final DivisionRepository divisionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ComparisonDecisionServiceImpl(
            ComparisonDecisionRepository repository,
            RfqHeadRepository rfqRepository,
            AccountLedgerRepository supplierRepository,
            StatusMasterRepository statusRepository,
            DivisionRepository divisionRepository) {
        this.repository = repository;
        this.rfqRepository = rfqRepository;
        this.supplierRepository = supplierRepository;
        this.statusRepository = statusRepository;
        this.divisionRepository = divisionRepository;
    }

    @Override
    public ComparisonDecisionDTO getDecisionByRfq(Long rfqId) {
        return repository.findByRfqHeadId(rfqId)
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public ComparisonDecisionDTO saveDecision(ComparisonDecisionDTO dto) {
        ComparisonDecision entity = repository.findByRfqHeadId(dto.getRfqRefId())
                .orElse(new ComparisonDecision());

        if (entity.getId() == null) {
            entity.setRfqHead(rfqRepository.findById(dto.getRfqRefId()).orElseThrow());
            entity.setDivision(divisionRepository.findById(dto.getDivisionId()).orElseThrow());
            entity.setCreatedBy(SecurityUtils.getCurrentUserId());
        } else {
            entity.setUpdatedBy(SecurityUtils.getCurrentUserId());
        }

        if (dto.getRecommendedSupplierId() != null) {
            entity.setRecommendedSupplier(supplierRepository.findById(dto.getRecommendedSupplierId()).orElse(null));
        }
        entity.setRecommendedReason(dto.getRecommendedReason());
        
        entity.setSelectedSupplier(supplierRepository.findById(dto.getSelectedSupplierId()).orElseThrow());
        entity.setOverrideRemarks(dto.getOverrideRemarks());
        entity.setDecisionDate(new Date());
        
        // Initial status Pending Approval
        entity.setStatus(statusRepository.findByName("Pending Approval").orElseThrow());

        repository.save(entity);
        return mapToDTO(entity);
    }

    @Override
    @Transactional
    public void approveDecision(Long id) {
        ComparisonDecision entity = repository.findById(id).orElseThrow();
        entity.setStatus(statusRepository.findByName("Approved").orElseThrow());
        repository.save(entity);
        
        // Also update the RFQ Status to "Awarded"
        entity.getRfqHead().setStatus(statusRepository.findByName("Awarded").orElseThrow());
        rfqRepository.save(entity.getRfqHead());
    }

    private ComparisonDecisionDTO mapToDTO(ComparisonDecision entity) {
        ComparisonDecisionDTO dto = new ComparisonDecisionDTO();
        dto.setId(entity.getId());
        dto.setRfqRefId(entity.getRfqHead().getId());
        dto.setRfqNo(entity.getRfqHead().getRfqNo());
        if (entity.getRecommendedSupplier() != null) {
            dto.setRecommendedSupplierId(entity.getRecommendedSupplier().getId());
            dto.setRecommendedSupplierName(entity.getRecommendedSupplier().getLedgerName());
        }
        dto.setRecommendedReason(entity.getRecommendedReason());
        dto.setSelectedSupplierId(entity.getSelectedSupplier().getId());
        dto.setSelectedSupplierName(entity.getSelectedSupplier().getLedgerName());
        dto.setOverrideRemarks(entity.getOverrideRemarks());
        dto.setDecisionDate(entity.getDecisionDate());
        dto.setStatusId(entity.getStatus().getId());
        dto.setStatusName(entity.getStatus().getName());
        dto.setDivisionId(entity.getDivision().getId());
        return dto;
    }
}
