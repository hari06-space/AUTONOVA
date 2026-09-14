package com.autonoma.erp.service.purchase.po;

import com.autonoma.erp.dto.purchase.po.PurchaseScheduleDTO;
import com.autonoma.erp.model.PurchaseSchedule;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.service.StatusMasterCacheService;
import com.autonoma.erp.repository.purchase.PurchaseScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchaseScheduleServiceImpl implements PurchaseScheduleService {

    @Autowired
    private PurchaseScheduleRepository purchaseScheduleRepository;

    @Autowired
    private StatusMasterCacheService statusMasterCacheService;

    @Override
    @Transactional
    public List<PurchaseScheduleDTO> saveSchedules(List<PurchaseScheduleDTO> schedules) {
        StatusMaster pendingStatus = statusMasterCacheService.getStatusByName("Pending");

        List<PurchaseSchedule> entities = schedules.stream().map(dto -> {
            PurchaseSchedule entity;
            if (dto.getId() != null) {
                entity = purchaseScheduleRepository.findById(dto.getId()).orElse(new PurchaseSchedule());
            } else {
                entity = new PurchaseSchedule();
            }
            entity.setSupplierId(dto.getSupplierId());
            entity.setPoId(dto.getPoId());
            entity.setPoItemId(dto.getPoItemId());
            entity.setScheduleQty(dto.getScheduleQty() != null ? dto.getScheduleQty() : BigDecimal.ZERO);
            entity.setScheduleDate(dto.getScheduleDate());
            
            // Only set receive/asn qty if it's a new record or they are provided (prevent overwriting with 0 during edit if not fetched)
            if (dto.getReceiveQty() != null) entity.setReceiveQty(dto.getReceiveQty());
            if (dto.getAsnQty() != null) entity.setAsnQty(dto.getAsnQty());
            
            if (entity.getStatus() == null && pendingStatus != null) {
                entity.setStatus(pendingStatus);
            }
            return entity;
        }).collect(Collectors.toList());

        List<PurchaseSchedule> savedEntities = purchaseScheduleRepository.saveAll(entities);

        return savedEntities.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<PurchaseScheduleDTO> getSchedulesByPo(Long poId) {
        return purchaseScheduleRepository.findByPoId(poId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        if (purchaseScheduleRepository.existsById(id)) {
            purchaseScheduleRepository.deleteById(id);
        }
    }

    private PurchaseScheduleDTO toDTO(PurchaseSchedule entity) {
        PurchaseScheduleDTO dto = new PurchaseScheduleDTO();
        dto.setId(entity.getId());
        dto.setSupplierId(entity.getSupplierId());
        dto.setPoId(entity.getPoId());
        dto.setPoItemId(entity.getPoItemId());
        dto.setScheduleQty(entity.getScheduleQty());
        dto.setScheduleDate(entity.getScheduleDate());
        dto.setReceiveQty(entity.getReceiveQty());
        dto.setAsnQty(entity.getAsnQty());
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        return dto;
    }
}
