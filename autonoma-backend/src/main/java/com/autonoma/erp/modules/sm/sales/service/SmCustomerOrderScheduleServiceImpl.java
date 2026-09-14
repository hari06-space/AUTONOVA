package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderScheduleDto;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderSchedule;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderScheduleRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderHeaderRepository;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderHeader;

@Service
public class SmCustomerOrderScheduleServiceImpl implements SmCustomerOrderScheduleService {

    @Autowired
    private SmCustomerOrderScheduleRepository scheduleRepository;

    @Autowired
    private SmCustomerOrderHeaderRepository orderHeaderRepository;

    @Autowired
    private com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderDetailRepository orderDetailRepository;

    @Autowired
    private StatusMasterRepository statusMasterRepository;

    @Override
    @Transactional
    public void saveBulkSchedules(List<SmCustomerOrderScheduleDto> scheduleDtos) {
        if (scheduleDtos == null || scheduleDtos.isEmpty()) return;

        for (SmCustomerOrderScheduleDto dto : scheduleDtos) {
            SmCustomerOrderSchedule entity = new SmCustomerOrderSchedule();
            if (dto.getId() != null) {
                entity = scheduleRepository.findById(dto.getId()).orElse(new SmCustomerOrderSchedule());
            }

            entity.setCustomerId(dto.getCustomerId());
            entity.setOrderId(dto.getOrderId());
            entity.setOrderItemId(dto.getOrderItemId());
            entity.setScheduleQty(dto.getScheduleQty());
            entity.setScheduleDate(dto.getScheduleDate());

            if (dto.getStatus() != null) {
                StatusMaster status = statusMasterRepository.findById(dto.getStatus()).orElse(null);
                entity.setStatusMaster(status);
            } else if (entity.getStatusMaster() == null) {
                StatusMaster pendingStatus = statusMasterRepository.findByNameIgnoreCase("Pending").orElse(null);
                entity.setStatusMaster(pendingStatus);
            }

            scheduleRepository.save(entity);
        }
    }

    @Override
    public List<SmCustomerOrderScheduleDto> getSchedulesByOrderId(Long orderId) {
        List<SmCustomerOrderSchedule> entities = scheduleRepository.findByOrderId(orderId);
        return entities.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<SmCustomerOrderScheduleDto> getSchedulesByCustomerId(Long customerId) {
        List<SmCustomerOrderSchedule> entities = scheduleRepository.findByCustomerId(customerId);
        return entities.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public Page<SmCustomerOrderScheduleDto> getAllSchedules(Pageable pageable, String status) {
        // For simplicity, returning all without status filter for now, can be added later if needed.
        Page<SmCustomerOrderSchedule> pageResult = scheduleRepository.findAll(pageable);
        return pageResult.map(this::mapToDto);
    }

    private SmCustomerOrderScheduleDto mapToDto(SmCustomerOrderSchedule entity) {
        SmCustomerOrderScheduleDto dto = new SmCustomerOrderScheduleDto();
        dto.setId(entity.getId());
        dto.setCustomerId(entity.getCustomerId());
        dto.setOrderId(entity.getOrderId());
        dto.setOrderItemId(entity.getOrderItemId());
        dto.setScheduleQty(entity.getScheduleQty());
        dto.setScheduleDate(entity.getScheduleDate());
        if (entity.getStatusMaster() != null) {
            dto.setStatus(entity.getStatusMaster().getId());
            dto.setStatusName(entity.getStatusMaster().getName());
        }
        if (entity.getOrderId() != null) {
            orderHeaderRepository.findById(entity.getOrderId()).ifPresent(order -> {
                dto.setOrderNo(order.getOrderNo());
            });
        }
        if (entity.getOrderItemId() != null) {
            orderDetailRepository.findById(entity.getOrderItemId()).ifPresent(detail -> {
                dto.setItemCode(detail.getPartNo());
                dto.setItemName(detail.getPartName());
                dto.setUom(detail.getUom());
                dto.setOrderQty(detail.getQty());
            });
        } else if (entity.getOrderId() != null) {
            java.util.List<com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail> details = orderDetailRepository.findByOrderHeaderId(entity.getOrderId());
            if (details != null && !details.isEmpty()) {
                com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail detail = details.get(0);
                dto.setItemCode(detail.getPartNo());
                dto.setItemName(detail.getPartName());
                dto.setUom(detail.getUom());
                dto.setOrderQty(detail.getQty());
            }
        }
        return dto;
    }

    @Override
    public SmCustomerOrderScheduleDto getScheduleById(Long id) {
        SmCustomerOrderSchedule entity = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found with id " + id));
        return mapToDto(entity);
    }
}
