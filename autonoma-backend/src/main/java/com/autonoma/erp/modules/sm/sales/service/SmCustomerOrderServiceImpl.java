package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderDetailDto;
import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderHeaderDto;
import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderChargeDto;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderHeader;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderCharge;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderDetailRepository;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderHeaderRepository;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderChargeRepository;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SmCustomerOrderServiceImpl implements SmCustomerOrderService {

    private final SmCustomerOrderHeaderRepository headerRepository;
    private final SmCustomerOrderDetailRepository detailRepository;
    private final SmCustomerOrderChargeRepository chargeRepository;
    private final AccountLedgerRepository ledgerRepository;
    private final StatusMasterRepository statusMasterRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public SmCustomerOrderServiceImpl(
            SmCustomerOrderHeaderRepository headerRepository,
            SmCustomerOrderDetailRepository detailRepository,
            SmCustomerOrderChargeRepository chargeRepository,
            AccountLedgerRepository ledgerRepository,
            StatusMasterRepository statusMasterRepository) {
        this.headerRepository = headerRepository;
        this.detailRepository = detailRepository;
        this.chargeRepository = chargeRepository;
        this.ledgerRepository = ledgerRepository;
        this.statusMasterRepository = statusMasterRepository;
    }

    @Override
    @Transactional
    public SmCustomerOrderHeaderDto createOrder(SmCustomerOrderHeaderDto dto) {
        if (headerRepository.existsByOrderNo(dto.getOrderNo())) {
            throw new RuntimeException("already order no exists");
        }
        SmCustomerOrderHeader header = new SmCustomerOrderHeader();
        BeanUtils.copyProperties(dto, header, "orderDetails", "orderCharges");
        StatusMaster statusMaster = null;
        if (dto.getStatusId() != null) {
            statusMaster = statusMasterRepository.findById(dto.getStatusId()).orElse(null);
        } else if (dto.getStatus() != null) {
            // Support searching by standard method, or fallback manually if repository lacks findFirstByNameIgnoreCase
            // Note: assuming findFirstByNameIgnoreCase or equivalent exists as seen in StatusMasterCacheService
        }
        
        if (statusMaster == null) {
            // Find "Open" status. If not directly available in repo, load all and filter
            statusMaster = statusMasterRepository.findAll().stream()
                .filter(s -> "Open".equalsIgnoreCase(s.getName()))
                .findFirst()
                .orElse(null);
        }
        header.setStatusMaster(statusMaster);
        
        // Map details into parent collection (cascade save)
        if (dto.getOrderDetails() != null) {
            for (SmCustomerOrderDetailDto detailDto : dto.getOrderDetails()) {
                SmCustomerOrderDetail detail = new SmCustomerOrderDetail();
                BeanUtils.copyProperties(detailDto, detail, "id");
                if ("VERIFIED".equalsIgnoreCase(detailDto.getApprovalStatus()) || "APPROVED".equalsIgnoreCase(detailDto.getApprovalStatus())) {
                    detail.setApprovalStatus(Boolean.TRUE);
                } else if ("REJECTED".equalsIgnoreCase(detailDto.getApprovalStatus())) {
                    detail.setApprovalStatus(Boolean.FALSE);
                } else {
                    detail.setApprovalStatus(null);
                }
                detail.setStatus("ACTIVE".equalsIgnoreCase(detailDto.getStatus()));
                detail.setOrderHeader(header);
                header.getOrderDetails().add(detail);
            }
        }

        // Map charges into parent collection (cascade save)
        if (dto.getOrderCharges() != null) {
            for (SmCustomerOrderChargeDto chargeDto : dto.getOrderCharges()) {
                SmCustomerOrderCharge charge = new SmCustomerOrderCharge();
                BeanUtils.copyProperties(chargeDto, charge, "id");
                
                // Calculate values on backend before saving
                java.math.BigDecimal amount = charge.getAmount() != null ? charge.getAmount() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal cgstPer = charge.getCgstPer() != null ? charge.getCgstPer() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal sgstPer = charge.getSgstPer() != null ? charge.getSgstPer() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal igstPer = charge.getIgstPer() != null ? charge.getIgstPer() : java.math.BigDecimal.ZERO;
                
                if (Boolean.TRUE.equals(charge.getTaxAvailable())) {
                    charge.setCgstVal(amount.multiply(cgstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                    charge.setSgstVal(amount.multiply(sgstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                    charge.setIgstVal(amount.multiply(igstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                    
                    java.math.BigDecimal taxTotal = charge.getCgstVal().add(charge.getSgstVal()).add(charge.getIgstVal());
                    charge.setTotalValue(amount.add(taxTotal));
                } else {
                    charge.setCgstVal(java.math.BigDecimal.ZERO);
                    charge.setSgstVal(java.math.BigDecimal.ZERO);
                    charge.setIgstVal(java.math.BigDecimal.ZERO);
                    charge.setTotalValue(amount);
                }
                
                charge.setStatus(chargeDto.getStatus() == null || !"INACTIVE".equalsIgnoreCase(chargeDto.getStatus()));
                charge.setOrderHeader(header);
                header.getOrderCharges().add(charge);
            }
        }

        SmCustomerOrderHeader savedHeader = headerRepository.save(header);
        
        List<SmCustomerOrderDetailDto> detailDtos = savedHeader.getOrderDetails().stream().map(detail -> {
            SmCustomerOrderDetailDto detailDto = new SmCustomerOrderDetailDto();
            BeanUtils.copyProperties(detail, detailDto);
            if (detail.getApprovalStatus() == null) {
                detailDto.setApprovalStatus("PENDING");
            } else if (detail.getApprovalStatus()) {
                detailDto.setApprovalStatus("VERIFIED");
            } else {
                detailDto.setApprovalStatus("REJECTED");
            }
            detailDto.setStatus(Boolean.TRUE.equals(detail.getStatus()) ? "ACTIVE" : "INACTIVE");
            return detailDto;
        }).collect(Collectors.toList());

        List<SmCustomerOrderChargeDto> chargeDtos = savedHeader.getOrderCharges().stream().map(charge -> {
            SmCustomerOrderChargeDto chargeDto = new SmCustomerOrderChargeDto();
            BeanUtils.copyProperties(charge, chargeDto);
            chargeDto.setStatus(Boolean.TRUE.equals(charge.getStatus()) ? "ACTIVE" : "INACTIVE");
            return chargeDto;
        }).collect(Collectors.toList());
        
        SmCustomerOrderHeaderDto savedDto = new SmCustomerOrderHeaderDto();
        BeanUtils.copyProperties(savedHeader, savedDto, "orderDetails", "orderCharges");
        savedDto.setStatus(savedHeader.getStatusMaster() != null ? savedHeader.getStatusMaster().getName() : null);
        savedDto.setStatusId(savedHeader.getStatusMaster() != null ? savedHeader.getStatusMaster().getId() : null);
        savedDto.setOrderDetails(detailDtos);
        savedDto.setOrderCharges(chargeDtos);
        
        return savedDto;
    }

    @Override
    @Transactional
    public SmCustomerOrderHeaderDto updateOrder(Long id, SmCustomerOrderHeaderDto dto) {
        if (headerRepository.existsByOrderNoAndIdNot(dto.getOrderNo(), id)) {
            throw new RuntimeException("already order no exists");
        }
        SmCustomerOrderHeader header = headerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
                
        BeanUtils.copyProperties(dto, header, "id", "createdBy", "createdDate", "orderDetails", "orderCharges");
        if (dto.getStatusId() != null) {
            statusMasterRepository.findById(dto.getStatusId()).ifPresent(header::setStatusMaster);
        } else if (dto.getStatus() != null) {
            statusMasterRepository.findAll().stream()
                .filter(s -> dto.getStatus().equalsIgnoreCase(s.getName()))
                .findFirst()
                .ifPresent(header::setStatusMaster);
        }

        // Update details list in-place to preserve IDs
        List<SmCustomerOrderDetail> existingDetails = new java.util.ArrayList<>(header.getOrderDetails());
        List<SmCustomerOrderDetailDto> incomingDetails = dto.getOrderDetails() != null ? dto.getOrderDetails() : new java.util.ArrayList<>();
        
        // Remove details that are not in the incoming list
        for (SmCustomerOrderDetail existing : existingDetails) {
            boolean existsInIncoming = incomingDetails.stream()
                .anyMatch(incoming -> incoming.getId() != null && incoming.getId().equals(existing.getId()));
            if (!existsInIncoming) {
                header.getOrderDetails().remove(existing);
            }
        }
        
        // Update existing or add new details
        for (SmCustomerOrderDetailDto detailDto : incomingDetails) {
            if (detailDto.getId() != null && detailDto.getId() < 1000000000000L) {
                // Update existing
                header.getOrderDetails().stream()
                    .filter(existing -> existing.getId().equals(detailDto.getId()))
                    .findFirst()
                    .ifPresent(existing -> {
                        BeanUtils.copyProperties(detailDto, existing, "id", "createdBy", "createdDate");
                        if ("VERIFIED".equalsIgnoreCase(detailDto.getApprovalStatus()) || "APPROVED".equalsIgnoreCase(detailDto.getApprovalStatus())) {
                            existing.setApprovalStatus(Boolean.TRUE);
                        } else if ("REJECTED".equalsIgnoreCase(detailDto.getApprovalStatus())) {
                            existing.setApprovalStatus(Boolean.FALSE);
                        } else {
                            existing.setApprovalStatus(null);
                        }
                        existing.setStatus("ACTIVE".equalsIgnoreCase(detailDto.getStatus()));
                    });
            } else {
                // Add new
                SmCustomerOrderDetail detail = new SmCustomerOrderDetail();
                BeanUtils.copyProperties(detailDto, detail, "id");
                if ("VERIFIED".equalsIgnoreCase(detailDto.getApprovalStatus()) || "APPROVED".equalsIgnoreCase(detailDto.getApprovalStatus())) {
                    detail.setApprovalStatus(Boolean.TRUE);
                } else if ("REJECTED".equalsIgnoreCase(detailDto.getApprovalStatus())) {
                    detail.setApprovalStatus(Boolean.FALSE);
                } else {
                    detail.setApprovalStatus(null);
                }
                detail.setStatus("ACTIVE".equalsIgnoreCase(detailDto.getStatus()));
                detail.setOrderHeader(header);
                header.getOrderDetails().add(detail);
            }
        }

        // Update charges list in-place to preserve IDs
        List<SmCustomerOrderCharge> existingCharges = new java.util.ArrayList<>(header.getOrderCharges());
        List<SmCustomerOrderChargeDto> incomingCharges = dto.getOrderCharges() != null ? dto.getOrderCharges() : new java.util.ArrayList<>();
        
        // Remove charges that are not in the incoming list
        for (SmCustomerOrderCharge existing : existingCharges) {
            boolean existsInIncoming = incomingCharges.stream()
                .anyMatch(incoming -> incoming.getId() != null && incoming.getId().equals(existing.getId()));
            if (!existsInIncoming) {
                header.getOrderCharges().remove(existing);
            }
        }
        
        // Update existing or add new charges
        for (SmCustomerOrderChargeDto chargeDto : incomingCharges) {
            if (chargeDto.getId() != null && chargeDto.getId() < 1000000000000L) {
                // Update existing
                header.getOrderCharges().stream()
                    .filter(existing -> existing.getId().equals(chargeDto.getId()))
                    .findFirst()
                    .ifPresent(existing -> {
                        BeanUtils.copyProperties(chargeDto, existing, "id", "createdBy", "createdDate");
                        
                        java.math.BigDecimal amount = existing.getAmount() != null ? existing.getAmount() : java.math.BigDecimal.ZERO;
                        java.math.BigDecimal cgstPer = existing.getCgstPer() != null ? existing.getCgstPer() : java.math.BigDecimal.ZERO;
                        java.math.BigDecimal sgstPer = existing.getSgstPer() != null ? existing.getSgstPer() : java.math.BigDecimal.ZERO;
                        java.math.BigDecimal igstPer = existing.getIgstPer() != null ? existing.getIgstPer() : java.math.BigDecimal.ZERO;
                        
                        if (Boolean.TRUE.equals(existing.getTaxAvailable())) {
                            existing.setCgstVal(amount.multiply(cgstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                            existing.setSgstVal(amount.multiply(sgstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                            existing.setIgstVal(amount.multiply(igstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                            
                            java.math.BigDecimal taxTotal = existing.getCgstVal().add(existing.getSgstVal()).add(existing.getIgstVal());
                            existing.setTotalValue(amount.add(taxTotal));
                        } else {
                            existing.setCgstVal(java.math.BigDecimal.ZERO);
                            existing.setSgstVal(java.math.BigDecimal.ZERO);
                            existing.setIgstVal(java.math.BigDecimal.ZERO);
                            existing.setTotalValue(amount);
                        }
                        
                        existing.setStatus(chargeDto.getStatus() == null || !"INACTIVE".equalsIgnoreCase(chargeDto.getStatus()));
                    });
            } else {
                // Add new
                SmCustomerOrderCharge charge = new SmCustomerOrderCharge();
                BeanUtils.copyProperties(chargeDto, charge, "id");
                
                java.math.BigDecimal amount = charge.getAmount() != null ? charge.getAmount() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal cgstPer = charge.getCgstPer() != null ? charge.getCgstPer() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal sgstPer = charge.getSgstPer() != null ? charge.getSgstPer() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal igstPer = charge.getIgstPer() != null ? charge.getIgstPer() : java.math.BigDecimal.ZERO;
                
                if (Boolean.TRUE.equals(charge.getTaxAvailable())) {
                    charge.setCgstVal(amount.multiply(cgstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                    charge.setSgstVal(amount.multiply(sgstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                    charge.setIgstVal(amount.multiply(igstPer).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
                    
                    java.math.BigDecimal taxTotal = charge.getCgstVal().add(charge.getSgstVal()).add(charge.getIgstVal());
                    charge.setTotalValue(amount.add(taxTotal));
                } else {
                    charge.setCgstVal(java.math.BigDecimal.ZERO);
                    charge.setSgstVal(java.math.BigDecimal.ZERO);
                    charge.setIgstVal(java.math.BigDecimal.ZERO);
                    charge.setTotalValue(amount);
                }
                
                charge.setStatus(chargeDto.getStatus() == null || !"INACTIVE".equalsIgnoreCase(chargeDto.getStatus()));
                charge.setOrderHeader(header);
                header.getOrderCharges().add(charge);
            }
        }
        
        SmCustomerOrderHeader updatedHeader = headerRepository.save(header);
        
        List<SmCustomerOrderDetailDto> detailDtos = updatedHeader.getOrderDetails().stream().map(detail -> {
            SmCustomerOrderDetailDto detailDto = new SmCustomerOrderDetailDto();
            BeanUtils.copyProperties(detail, detailDto);
            if (detail.getApprovalStatus() == null) {
                detailDto.setApprovalStatus("PENDING");
            } else if (detail.getApprovalStatus()) {
                detailDto.setApprovalStatus("VERIFIED");
            } else {
                detailDto.setApprovalStatus("REJECTED");
            }
            detailDto.setStatus(Boolean.TRUE.equals(detail.getStatus()) ? "ACTIVE" : "INACTIVE");
            return detailDto;
        }).collect(Collectors.toList());

        List<SmCustomerOrderChargeDto> chargeDtos = updatedHeader.getOrderCharges().stream().map(charge -> {
            SmCustomerOrderChargeDto chargeDto = new SmCustomerOrderChargeDto();
            BeanUtils.copyProperties(charge, chargeDto);
            chargeDto.setStatus(Boolean.TRUE.equals(charge.getStatus()) ? "ACTIVE" : "INACTIVE");
            return chargeDto;
        }).collect(Collectors.toList());
        
        SmCustomerOrderHeaderDto savedDto = new SmCustomerOrderHeaderDto();
        BeanUtils.copyProperties(updatedHeader, savedDto, "orderDetails", "orderCharges");
        savedDto.setStatus(updatedHeader.getStatusMaster() != null ? updatedHeader.getStatusMaster().getName() : null);
        savedDto.setStatusId(updatedHeader.getStatusMaster() != null ? updatedHeader.getStatusMaster().getId() : null);
        savedDto.setOrderDetails(detailDtos);
        savedDto.setOrderCharges(chargeDtos);
        
        return savedDto;
    }

    @Override
    public SmCustomerOrderHeaderDto getOrderById(Long id) {
        SmCustomerOrderHeader header = headerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
                
        List<SmCustomerOrderDetail> details = detailRepository.findByOrderHeaderId(id);
        List<SmCustomerOrderCharge> charges = chargeRepository.findByOrderHeaderId(id);
        
        SmCustomerOrderHeaderDto dto = new SmCustomerOrderHeaderDto();
        BeanUtils.copyProperties(header, dto, "orderDetails", "orderCharges");
        dto.setStatus(header.getStatusMaster() != null ? header.getStatusMaster().getName() : null);
        dto.setStatusId(header.getStatusMaster() != null ? header.getStatusMaster().getId() : null);
        
        List<SmCustomerOrderDetailDto> detailDtos = details.stream().map(detail -> {
            SmCustomerOrderDetailDto detailDto = new SmCustomerOrderDetailDto();
            BeanUtils.copyProperties(detail, detailDto);
            if (detail.getApprovalStatus() == null) {
                detailDto.setApprovalStatus("PENDING");
            } else if (detail.getApprovalStatus()) {
                detailDto.setApprovalStatus("VERIFIED");
            } else {
                detailDto.setApprovalStatus("REJECTED");
            }
            detailDto.setStatus(Boolean.TRUE.equals(detail.getStatus()) ? "ACTIVE" : "INACTIVE");
            return detailDto;
        }).collect(Collectors.toList());

        List<SmCustomerOrderChargeDto> chargeDtos = charges.stream().map(charge -> {
            SmCustomerOrderChargeDto chargeDto = new SmCustomerOrderChargeDto();
            BeanUtils.copyProperties(charge, chargeDto);
            chargeDto.setStatus(Boolean.TRUE.equals(charge.getStatus()) ? "ACTIVE" : "INACTIVE");
            return chargeDto;
        }).collect(Collectors.toList());
        
        dto.setOrderDetails(detailDtos);
        dto.setOrderCharges(chargeDtos);

        // Fetch customer name
        Long customerId = header.getBillCustId() != null ? header.getBillCustId() : header.getCustId();
        if (customerId != null) {
            ledgerRepository.findById(customerId).ifPresent(ledger -> {
                dto.setCustomerName(ledger.getLedgerName());
            });
        }

        return dto;
    }

    @Override
    public Page<SmCustomerOrderHeaderDto> getAllOrders(Pageable pageable) {
        return headerRepository.findAll(pageable).map(header -> {
            SmCustomerOrderHeaderDto dto = new SmCustomerOrderHeaderDto();
            BeanUtils.copyProperties(header, dto, "orderDetails", "orderCharges");
            dto.setStatus(header.getStatusMaster() != null ? header.getStatusMaster().getName() : null);
            dto.setStatusId(header.getStatusMaster() != null ? header.getStatusMaster().getId() : null);

            // Fetch customer name
            Long customerId = header.getBillCustId() != null ? header.getBillCustId() : header.getCustId();
            if (customerId != null) {
                ledgerRepository.findById(customerId).ifPresent(ledger -> {
                    dto.setCustomerName(ledger.getLedgerName());
                });
            }

            return dto;
        });
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        detailRepository.deleteByOrderHeaderId(id);
        chargeRepository.deleteByOrderHeaderId(id);
        headerRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateLineItemsApproval(Long orderId, java.util.List<Long> lineItemIds, String status) {
        SmCustomerOrderHeader header = headerRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        Boolean approvalStatus;
        if ("VERIFIED".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status)) {
            approvalStatus = Boolean.TRUE;
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            approvalStatus = Boolean.FALSE;
        } else {
            approvalStatus = null;
        }

        for (SmCustomerOrderDetail detail : header.getOrderDetails()) {
            if (lineItemIds.contains(detail.getId())) {
                detail.setApprovalStatus(approvalStatus);
            }
        }
        headerRepository.save(header);
    }
}
