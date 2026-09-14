package com.autonoma.erp.service.purchase.gateentry;

import com.autonoma.erp.dto.purchase.gateentry.GateEntryHeadDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryListDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import com.autonoma.erp.repository.purchase.gateentry.GateEntryHeadRepository;
import com.autonoma.erp.service.admin.PrefixCredentialService;
import com.autonoma.erp.service.purchase.gateentry.engine.GateEntryApprovalEngine;
import com.autonoma.erp.service.purchase.gateentry.engine.GateEntryAuditEngine;
import com.autonoma.erp.service.purchase.gateentry.engine.GateEntryNotificationEngine;
import com.autonoma.erp.service.purchase.gateentry.engine.GateEntryValidationEngine;
import com.autonoma.erp.service.purchase.gateentry.engine.GateEntryWorkflowEngine;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.service.purchase.gateentry.strategy.GateEntrySourceResolver;
import com.autonoma.erp.service.purchase.gateentry.strategy.GateEntrySourceStrategy;
import com.autonoma.erp.dto.purchase.gateentry.GateEntrySourceDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntrySource;
import com.autonoma.erp.model.PurchaseOrderHead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.Date;
import com.autonoma.erp.model.purchase.gateentry.GateEntryTrans;
import com.autonoma.erp.model.purchase.gateentry.GateEntryAttachment;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryTransDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryAttachmentDTO;
import com.autonoma.erp.dto.purchase.gateentry.GateEntryVisitorDTO;
import com.autonoma.erp.model.purchase.gateentry.GateEntryVisitor;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import com.autonoma.erp.model.PurchaseOrderTrans;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class GateEntryServiceImpl implements GateEntryService {

    private final GateEntryHeadRepository gateEntryHeadRepository;
    private final PrefixCredentialService prefixCredentialService;
    private final PrefixCredentialRepository prefixCredentialRepository;
    private final GateEntryValidationEngine validationEngine;
    private final GateEntryWorkflowEngine workflowEngine;
    private final GateEntryApprovalEngine approvalEngine;
    private final GateEntryAuditEngine auditEngine;
    private final GateEntryNotificationEngine notificationEngine;
    private final StatusMasterRepository statusMasterRepository;
    private final GateEntrySourceResolver sourceResolver;
    private final JdbcTemplate jdbcTemplate;
    
    @org.springframework.beans.factory.annotation.Autowired
    private jakarta.persistence.EntityManager entityManager;

    public GateEntryServiceImpl(GateEntryHeadRepository gateEntryHeadRepository,
                                PrefixCredentialService prefixCredentialService,
                                PrefixCredentialRepository prefixCredentialRepository,
                                GateEntryValidationEngine validationEngine,
                                GateEntryWorkflowEngine workflowEngine,
                                GateEntryApprovalEngine approvalEngine,
                                GateEntryAuditEngine auditEngine,
                                GateEntryNotificationEngine notificationEngine,
                                StatusMasterRepository statusMasterRepository,
                                GateEntrySourceResolver sourceResolver,
                                JdbcTemplate jdbcTemplate) {
        this.gateEntryHeadRepository = gateEntryHeadRepository;
        this.prefixCredentialService = prefixCredentialService;
        this.prefixCredentialRepository = prefixCredentialRepository;
        this.validationEngine = validationEngine;
        this.workflowEngine = workflowEngine;
        this.approvalEngine = approvalEngine;
        this.auditEngine = auditEngine;
        this.notificationEngine = notificationEngine;
        this.statusMasterRepository = statusMasterRepository;
        this.sourceResolver = sourceResolver;
        this.jdbcTemplate = jdbcTemplate;
    }

    private String generateGateEntryNumber(Long divisionId, java.util.Date entryDate) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        if (entryDate != null) {
            cal.setTime(entryDate);
        }
        int year = cal.get(java.util.Calendar.YEAR);
        String currentAccountYear = year + "-" + (year + 1);
        
        String configuredPrefix = null;
        String configuredSuffix = "";
        int digits = 6;
        
        try {
            List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialRepository.findAll();
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                .findFirst()
                .orElse(allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .findFirst().orElse(null));

            if (cred != null && cred.getGateEntryPrefix() != null && !cred.getGateEntryPrefix().trim().isEmpty()) {
                configuredPrefix = cred.getGateEntryPrefix().trim();
                if (cred.getGateEntrySuffix() != null) {
                    configuredSuffix = cred.getGateEntrySuffix().trim();
                }
                digits = cred.getGateEntryDigit() != null ? cred.getGateEntryDigit() : 6;
            }
        } catch (Exception ex) {
            // Ignore if credential missing
        }

        if (configuredPrefix != null) {
            String finalPrefix = configuredPrefix.replaceAll("/+", "/");
            String finalSuffix = configuredSuffix.replaceAll("/+", "/");
            String searchPattern = finalPrefix + "%" + finalSuffix;
            
            Object seqResult = entityManager.createNativeQuery(
                  "SELECT TOP 1 GATE_ENTRY_NO FROM PP_GATE_ENTRY_HEAD WHERE GATE_ENTRY_NO LIKE :pattern ORDER BY ID DESC")
                  .setParameter("pattern", searchPattern)
                  .getResultList().stream().findFirst().orElse(null);
                  
            long nextNum = 1;
            if (seqResult != null) {
                String numStr = (String) seqResult;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                try {
                    nextNum = Long.parseLong(numStr) + 1;
                } catch(Exception e) {}
            }
            return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
        }

        throw new RuntimeException("Gate Entry Prefix/Suffix credentials not configured.");
    }

    private GateEntryHead mapDtoToEntity(GateEntryHeadDTO dto, GateEntryHead head, String username) {
        if (head == null) head = new GateEntryHead();
        
        head.setEntryType(dto.getEntryType());
        head.setGatePassType(dto.getGatePassType());
        head.setGateNo(dto.getGateNo());
        head.setGateEntryDate(dto.getGateEntryDate());
        if (dto.getSupplierId() != null) {
            AccountLedger supplier = new AccountLedger();
            supplier.setId(dto.getSupplierId());
            head.setSupplier(supplier);
        }
        
        if (dto.getTransporterId() != null) {
            AccountLedger transporter = new AccountLedger();
            transporter.setId(dto.getTransporterId());
            head.setTransporter(transporter);
        }
        head.setTransportMode(dto.getTransportMode());
        head.setVehicleNo(dto.getVehicleNo());
        head.setLrNo(dto.getLrNo());
        head.setLrDate(dto.getLrDate());
        head.setRemarks(dto.getRemarks());
        // Division Mapping
        if (dto.getDivisionId() != null) {
            Division div = new Division();
            div.setId(dto.getDivisionId());
            head.setDivision(div);
        }
        
        // Status mapping
        if (dto.getStatusName() != null) {
            head.setStatus(statusMasterRepository.findByNameIgnoreCase(dto.getStatusName())
                .orElseGet(() -> {
                    StatusMaster newStatus = new StatusMaster();
                    newStatus.setName(dto.getStatusName().toUpperCase());
                    return statusMasterRepository.save(newStatus);
                }));
        } else if (head.getStatus() == null) {
            String defaultStatus = "OPEN";
            head.setStatus(statusMasterRepository.findByNameIgnoreCase(defaultStatus)
                .orElseGet(() -> {
                    StatusMaster newStatus = new StatusMaster();
                    newStatus.setName(defaultStatus.toUpperCase());
                    return statusMasterRepository.save(newStatus);
                }));
        }

        if (head.getId() == null) {
            head.setCreatedBy(username);
            head.setCreatedDate(new java.util.Date());
            head.setActiveStatus(1);
        } else {
            head.setUpdatedBy(username);
            head.setUpdatedDate(new java.util.Date());
        }

        // Map sources
        if (dto.getSources() != null) {
            if (head.getSources() == null) {
                head.setSources(new ArrayList<>());
            }
            
            // Remove missing sources
            head.getSources().removeIf(existing -> dto.getSources().stream()
                .noneMatch(d -> d.getSourceType().equals(existing.getSourceType()) 
                             && (d.getSourceDocumentNo() == null ? existing.getSourceDocumentNo() == null 
                                 : d.getSourceDocumentNo().equals(existing.getSourceDocumentNo()))));
            
            for (GateEntrySourceDTO sourceDto : dto.getSources()) {
                GateEntrySource strategySrc = head.getSources().stream()
                    .filter(s -> s.getSourceType().equals(sourceDto.getSourceType()) 
                              && (s.getSourceDocumentNo() == null ? sourceDto.getSourceDocumentNo() == null 
                                  : s.getSourceDocumentNo().equals(sourceDto.getSourceDocumentNo())))
                    .findFirst()
                    .orElse(null);

                GateEntrySourceStrategy strategy = sourceResolver.getStrategy(sourceDto.getSourceType());
                strategy.validateSource(sourceDto, dto);
                
                if (strategySrc == null) {
                    strategySrc = new GateEntrySource();
                    strategySrc.setGateEntryHead(head);
                    strategySrc.setSourceType(sourceDto.getSourceType());
                    strategySrc.setSourceDocumentNo(sourceDto.getSourceDocumentNo());
                    strategySrc.setCreatedBy(username);
                    strategySrc.setCreatedDate(new java.util.Date());
                    strategySrc.setActiveStatus(1);
                    head.getSources().add(strategySrc);
                } else {
                    strategySrc.setUpdatedBy(username);
                    strategySrc.setUpdatedDate(new java.util.Date());
                }
                
                strategySrc.setSourceDocumentDate(sourceDto.getSourceDocumentDate());
                if (sourceDto.getSourceHeadId() != null) {
                    PurchaseOrderHead poHead = new PurchaseOrderHead();
                    poHead.setId(sourceDto.getSourceHeadId());
                    strategySrc.setSourceHead(poHead);
                }
            }
        }

        // Map transactions
        if (dto.getTransactions() != null) {
            if (head.getTransactions() == null) {
                head.setTransactions(new ArrayList<>());
            }
            
            // Remove missing transactions
            head.getTransactions().removeIf(existing -> dto.getTransactions().stream()
                .noneMatch(d -> {
                    boolean sameSource = existing.getSource() != null && 
                                         d.getSourceType().equals(existing.getSource().getSourceType()) &&
                                         (d.getSourceDocumentNo() == null ? existing.getSource().getSourceDocumentNo() == null 
                                             : d.getSourceDocumentNo().equals(existing.getSource().getSourceDocumentNo()));
                    boolean sameItem = existing.getItem() != null && d.getItemId() != null && existing.getItem().getId().equals(d.getItemId());
                    return sameSource && sameItem;
                }));
            
            for (GateEntryTransDTO transDto : dto.getTransactions()) {
                // Link to source
                GateEntrySource matchingSource = null;
                if (head.getSources() != null) {
                    matchingSource = head.getSources().stream()
                        .filter(s -> s.getSourceType().equals(transDto.getSourceType()) 
                                  && (s.getSourceDocumentNo() == null ? transDto.getSourceDocumentNo() == null 
                                      : s.getSourceDocumentNo().equals(transDto.getSourceDocumentNo())))
                        .findFirst()
                        .orElse(null);
                }
                if (matchingSource == null) {
                    throw new IllegalArgumentException("Cannot find matching source for item: " + transDto.getItemCode());
                }

                GateEntrySource finalMatchingSource = matchingSource;
                GateEntryTrans trans = head.getTransactions().stream()
                    .filter(t -> t.getSource() != null && t.getSource().equals(finalMatchingSource)
                              && t.getItem() != null && t.getItem().getId().equals(transDto.getItemId()))
                    .findFirst()
                    .orElse(null);

                if (trans == null) {
                    trans = new GateEntryTrans();
                    trans.setGateEntryHead(head);
                    trans.setSource(matchingSource);
                    trans.setCreatedBy(username);
                    trans.setCreatedDate(new java.util.Date());
                    head.getTransactions().add(trans);
                }
                
                trans.setSourceLineId(transDto.getSourceLineId());
                
                GateEntrySourceStrategy strategy = sourceResolver.getStrategy(trans.getSource().getSourceType());
                strategy.validateTransaction(transDto, matchingSource);
                
                if (transDto.getPoTransId() != null) {
                    PurchaseOrderTrans poTrans = new PurchaseOrderTrans();
                    poTrans.setId(transDto.getPoTransId());
                    trans.setPoTrans(poTrans);
                }
                
                if (transDto.getPurchaseScheduleId() != null) {
                    com.autonoma.erp.model.PurchaseSchedule ps = new com.autonoma.erp.model.PurchaseSchedule();
                    ps.setId(transDto.getPurchaseScheduleId());
                    trans.setPurchaseSchedule(ps);
                }
                
                if (transDto.getItemId() != null) {
                    ProductMaster pm = new ProductMaster();
                    pm.setId(transDto.getItemId());
                    trans.setItem(pm);
                }
                
                trans.setDeliveredQty(transDto.getDeliveredQty() != null ? transDto.getDeliveredQty() : BigDecimal.ZERO);
                trans.setAcceptedQty(transDto.getAcceptedQty() != null ? transDto.getAcceptedQty() : BigDecimal.ZERO);
                trans.setRejectedQty(transDto.getRejectedQty() != null ? transDto.getRejectedQty() : BigDecimal.ZERO);
                trans.setDamagedQty(transDto.getDamagedQty() != null ? transDto.getDamagedQty() : BigDecimal.ZERO);
                trans.setShortQty(transDto.getShortQty() != null ? transDto.getShortQty() : BigDecimal.ZERO);
                trans.setPackageCount(transDto.getPackageCount());
                trans.setBatchNo(transDto.getBatchNo());
                trans.setSerialNo(transDto.getSerialNo());
                trans.setRemarks(transDto.getRemarks());
            }
        }
        
        // Map visitors
        if (dto.getVisitors() != null) {
            if (head.getVisitors() == null) {
                head.setVisitors(new ArrayList<>());
            } else {
                head.getVisitors().clear();
            }
            
            for (GateEntryVisitorDTO vDto : dto.getVisitors()) {
                GateEntryVisitor v = new GateEntryVisitor();
                v.setGateEntryHead(head);
                v.setVehicleNo(vDto.getVehicleNo() != null && !vDto.getVehicleNo().trim().isEmpty() ? vDto.getVehicleNo() : 
                              (dto.getVehicleNo() != null && !dto.getVehicleNo().trim().isEmpty() ? dto.getVehicleNo() : "N/A"));
                v.setVehicleType(vDto.getVehicleType());
                v.setTruckSize(vDto.getTruckSize());
                v.setTrailerNo(vDto.getTrailerNo());
                v.setContainerNo(vDto.getContainerNo());
                v.setSealNo(vDto.getSealNo());
                v.setSealCondition(vDto.getSealCondition());
                v.setParkingLocation(vDto.getParkingLocation());
                v.setGrossWeight(vDto.getGrossWeight());
                v.setTareWeight(vDto.getTareWeight());
                v.setNetWeight(vDto.getNetWeight());
                v.setWeighbridgeSlipNo(vDto.getWeighbridgeSlipNo());
                v.setDriverName(vDto.getDriverName() != null && !vDto.getDriverName().trim().isEmpty() ? vDto.getDriverName() : "N/A");
                v.setDriverMobile(vDto.getDriverMobile() != null && !vDto.getDriverMobile().trim().isEmpty() ? vDto.getDriverMobile() : "N/A");
                v.setDriverLicenseNo(vDto.getDriverLicenseNo());
                v.setLicenseExpiry(vDto.getLicenseExpiry());
                v.setHelperName(vDto.getHelperName());
                v.setTransportCompany(vDto.getTransportCompany());
                v.setEmergencyContact(vDto.getEmergencyContact());
                v.setCreatedBy(username);
                v.setCreatedDate(new java.util.Date());
                v.setActiveStatus(1);
                head.getVisitors().add(v);
            }
        }
        
        // Map attachments
        if (dto.getAttachments() != null) {
            if (head.getAttachments() == null) {
                head.setAttachments(new ArrayList<>());
            } else {
                head.getAttachments().clear();
            }
            for (GateEntryAttachmentDTO attDto : dto.getAttachments()) {
                if (attDto.getFilePath() == null || attDto.getFilePath().trim().isEmpty()) continue;
                GateEntryAttachment att = new GateEntryAttachment();
                att.setGateEntryHead(head);
                att.setFileName(attDto.getFileName() != null ? attDto.getFileName() : 
                    attDto.getFilePath().contains("/") ? 
                        attDto.getFilePath().substring(attDto.getFilePath().lastIndexOf('/') + 1) :
                        attDto.getFilePath());
                att.setFilePath(attDto.getFilePath());
                att.setFileSize(attDto.getFileSize());
                att.setMimeType(attDto.getMimeType());
                att.setAttachmentType(attDto.getAttachmentType() != null ? attDto.getAttachmentType() : "GATE_ENTRY");
                att.setActiveStatus(1);
                att.setCreatedBy(username);
                att.setCreatedDate(new java.util.Date());
                head.getAttachments().add(att);
            }
        }
        
        return head;
    }

    private GateEntryHeadDTO mapEntityToDto(GateEntryHead entity) {
        GateEntryHeadDTO dto = new GateEntryHeadDTO();
        dto.setId(entity.getId());
        dto.setGateEntryNo(entity.getGateEntryNo());
        dto.setEntryType(entity.getEntryType());
        dto.setGatePassType(entity.getGatePassType());
        dto.setGateNo(entity.getGateNo());
        dto.setGateEntryDate(entity.getGateEntryDate());
        dto.setSupplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null);
        dto.setSupplierName(entity.getSupplier() != null ? entity.getSupplier().getLedgerName() : null);
        dto.setTransportMode(entity.getTransportMode());
        dto.setTransporterId(entity.getTransporter() != null ? entity.getTransporter().getId() : null);
        dto.setTransporterName(entity.getTransporter() != null ? entity.getTransporter().getLedgerName() : null);
        dto.setVehicleNo(entity.getVehicleNo());
        dto.setLrNo(entity.getLrNo());
        dto.setLrDate(entity.getLrDate());
        dto.setRemarks(entity.getRemarks());
        dto.setDivisionId(entity.getDivision() != null ? entity.getDivision().getId() : null);
        dto.setStatusName(entity.getStatus() != null ? entity.getStatus().getName() : null);

        if (entity.getSources() != null) {
            List<GateEntrySourceDTO> sourceDtos = new ArrayList<>();
            for (GateEntrySource s : entity.getSources()) {
                GateEntrySourceDTO sDto = new GateEntrySourceDTO();
                sDto.setId(s.getId());
                sDto.setSourceType(s.getSourceType());
                sDto.setSourceHeadId(s.getSourceHead() != null ? s.getSourceHead().getId() : null);
                sDto.setSourceDocumentNo(s.getSourceDocumentNo());
                sDto.setSourceDocumentDate(s.getSourceDocumentDate());
                sourceDtos.add(sDto);
            }
            dto.setSources(sourceDtos);
        }

        if (entity.getTransactions() != null) {
            List<GateEntryTransDTO> transDtos = new ArrayList<>();
            for (GateEntryTrans t : entity.getTransactions()) {
                GateEntryTransDTO tDto = new GateEntryTransDTO();
                tDto.setId(t.getId());
                
                if (t.getSource() != null) {
                    tDto.setSourceId(t.getSource().getId());
                    tDto.setSourceType(t.getSource().getSourceType());
                    tDto.setSourceDocumentNo(t.getSource().getSourceDocumentNo());
                }
                tDto.setSourceLineId(t.getSourceLineId());
                
                tDto.setPoTransId(t.getPoTrans() != null ? t.getPoTrans().getId() : null);
                tDto.setItemId(t.getItem() != null ? t.getItem().getId() : null);
                if (t.getItem() != null) {
                    tDto.setItemCode(t.getItem().getItemCode());
                    tDto.setItemName(t.getItem().getItemName());
                    tDto.setUom(t.getItem().getUom());
                }
                if (t.getPoTrans() != null) {
                    tDto.setQty(t.getPoTrans().getQty());
                    tDto.setPendingQty(t.getPoTrans().getPendingQty());
                }
                tDto.setDeliveredQty(t.getDeliveredQty());
                tDto.setAcceptedQty(t.getAcceptedQty());
                tDto.setRejectedQty(t.getRejectedQty());
                transDtos.add(tDto);
            }
            dto.setTransactions(transDtos);
        }

        if (entity.getVisitors() != null) {
            List<GateEntryVisitorDTO> visitorDtos = new ArrayList<>();
            for (GateEntryVisitor v : entity.getVisitors()) {
                GateEntryVisitorDTO vDto = new GateEntryVisitorDTO();
                vDto.setId(v.getId());
                vDto.setGateEntryHeadId(entity.getId());
                vDto.setVehicleNo(v.getVehicleNo());
                vDto.setVehicleType(v.getVehicleType());
                vDto.setTruckSize(v.getTruckSize());
                vDto.setTrailerNo(v.getTrailerNo());
                vDto.setContainerNo(v.getContainerNo());
                vDto.setSealNo(v.getSealNo());
                vDto.setSealCondition(v.getSealCondition());
                vDto.setParkingLocation(v.getParkingLocation());
                vDto.setGrossWeight(v.getGrossWeight());
                vDto.setTareWeight(v.getTareWeight());
                vDto.setNetWeight(v.getNetWeight());
                vDto.setWeighbridgeSlipNo(v.getWeighbridgeSlipNo());
                vDto.setDriverName(v.getDriverName());
                vDto.setDriverMobile(v.getDriverMobile());
                vDto.setDriverLicenseNo(v.getDriverLicenseNo());
                vDto.setLicenseExpiry(v.getLicenseExpiry());
                vDto.setHelperName(v.getHelperName());
                vDto.setTransportCompany(v.getTransportCompany());
                vDto.setEmergencyContact(v.getEmergencyContact());
                vDto.setActiveStatus(v.getActiveStatus());
                visitorDtos.add(vDto);
            }
            dto.setVisitors(visitorDtos);
        }

        if (entity.getLogs() != null) {
            List<Map<String, Object>> logDtos = new ArrayList<>();
            for (com.autonoma.erp.model.purchase.gateentry.GateEntryLog log : entity.getLogs()) {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("id", log.getId());
                logMap.put("action", log.getEventType());
                logMap.put("remarks", log.getEventDescription());
                logMap.put("createdBy", log.getCreatedUser());
                logMap.put("createdDate", log.getCreatedDate());
                logDtos.add(logMap);
            }
            dto.setLogs(logDtos);
        }

        if (entity.getAttachments() != null) {
            List<GateEntryAttachmentDTO> attDtos = new ArrayList<>();
            for (GateEntryAttachment att : entity.getAttachments()) {
                if (att.getActiveStatus() != null && att.getActiveStatus() == 0) continue;
                GateEntryAttachmentDTO aDto = new GateEntryAttachmentDTO();
                aDto.setId(att.getId());
                aDto.setGateEntryHeadId(entity.getId());
                aDto.setFileName(att.getFileName());
                aDto.setFilePath(att.getFilePath());
                aDto.setFileSize(att.getFileSize());
                aDto.setMimeType(att.getMimeType());
                aDto.setAttachmentType(att.getAttachmentType());
                aDto.setActiveStatus(att.getActiveStatus());
                attDtos.add(aDto);
            }
            dto.setAttachments(attDtos);
        }

        return dto;
    }

    @Override
    public GateEntryHeadDTO createGateEntry(GateEntryHeadDTO dto, String username) {
        validationEngine.validateForCreation(dto);
        validationEngine.validateDriverDetails(dto);
        
        GateEntryHead entity = mapDtoToEntity(dto, null, username);
        
        java.util.Date entryDate = dto.getGateEntryDate() != null 
            ? java.util.Date.from(dto.getGateEntryDate().atStartOfDay(ZoneId.systemDefault()).toInstant())
            : new java.util.Date();
        
        entity.setGateEntryNo(generateGateEntryNumber(dto.getDivisionId(), entryDate));
        
        entity = gateEntryHeadRepository.save(entity);
        
        String action = "INWARD".equalsIgnoreCase(entity.getEntryType()) ? "EXPECTED" : "DRAFT";
        auditEngine.logEvent(entity, action, "Gate Entry Created", username);
        
        return mapEntityToDto(entity);
    }

    @Override
    public GateEntryHeadDTO updateGateEntry(Long id, GateEntryHeadDTO dto, String username) {
        GateEntryHead entity = gateEntryHeadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found"));

        String statusName = entity.getStatus() != null ? entity.getStatus().getName().toUpperCase() : "";
        if ("CLOSED".equals(statusName) || "GRN_CREATED".equals(statusName) || "COMPLETED".equals(statusName) || "CANCELLED".equals(statusName) || "REJECTED".equals(statusName)) {
            throw new RuntimeException("Gate Entry is in " + statusName + " status and cannot be modified.");
        }
        
        validationEngine.validateDriverDetails(dto);
                
        entity = mapDtoToEntity(dto, entity, username);
        entity = gateEntryHeadRepository.save(entity);
        
        auditEngine.logEvent(entity, "UPDATED", "Gate Entry Updated", username);
        
        return mapEntityToDto(entity);
    }

    @Override
    @Transactional
    public void deleteGateEntry(Long id, String username) {
        GateEntryHead head = gateEntryHeadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found"));
                
        String statusName = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "";
        if (statusName.equals("CLOSED") || statusName.equals("GRN_CREATED") || statusName.equals("COMPLETED")) {
            throw new RuntimeException("Cannot delete a Gate Entry that is already closed or has a GRN.");
        }
        
        head.setActiveStatus(0);
        head.setUpdatedBy(username);
        head.setUpdatedDate(new java.util.Date());
        gateEntryHeadRepository.save(head);
        
        for (GateEntryTrans trans : head.getTransactions()) {
            trans.setActiveStatus(0);
            trans.setUpdatedBy(username);
            trans.setUpdatedDate(new java.util.Date());
        }
        
        for (GateEntrySource source : head.getSources()) {
            source.setActiveStatus(0);
            source.setUpdatedBy(username);
            source.setUpdatedDate(new java.util.Date());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public GateEntryHeadDTO getGateEntryById(Long id) {
        GateEntryHead entity = gateEntryHeadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found"));
        return mapEntityToDto(entity);
    }

    @Override
    public Page<GateEntryListDTO> getGateEntryList(Long divisionId, Pageable pageable) {
        Page<GateEntryHead> entities = gateEntryHeadRepository.findAllByDivision(divisionId, pageable);
        return entities.map(entity -> {
            GateEntryListDTO dto = new GateEntryListDTO();
            dto.setId(entity.getId());
            dto.setGateEntryNo(entity.getGateEntryNo());
            dto.setGateEntryDate(entity.getGateEntryDate());
            dto.setEntryType(entity.getEntryType());
            dto.setGatePassType(entity.getGatePassType());
            dto.setVehicleNo(entity.getVehicleNo());
            dto.setSupplierName(entity.getSupplier() != null ? entity.getSupplier().getLedgerName() : ""); 
            dto.setStatusName(entity.getStatus() != null ? entity.getStatus().getName() : "");
            return dto;
        });
    }

    @Override
    public GateEntryHeadDTO processAction(Long id, String action, String username) {
        GateEntryHead head = gateEntryHeadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found"));
                
        List<String> allowedActions = workflowEngine.getNextAllowedActions(head);
        if (!allowedActions.contains(action)) {
            throw new RuntimeException("Action " + action + " is not allowed in current state");
        }
        
        approvalEngine.processApproval(head, action, username);
        
        // Update Status
        head.setStatus(statusMasterRepository.findByNameIgnoreCase(action)
                .orElseGet(() -> {
                    StatusMaster newStatus = new StatusMaster();
                    newStatus.setName(action.toUpperCase());
                    return statusMasterRepository.save(newStatus);
                }));
        head.setUpdatedBy(username);
        head.setUpdatedDate(new java.util.Date());
        
        gateEntryHeadRepository.save(head);
        auditEngine.logEvent(head, action, "User processed action: " + action, username);
        notificationEngine.sendNotifications(head, action);
        
        return mapEntityToDto(head);
    }

    @Override
    public void generateGrnFromGateEntry(Long gateEntryId, String username) {
        // TODO: GRN Generation Logic
    }
    
    @Override
    public List<String> getNextAllowedActions(Long id) {
        GateEntryHead head = gateEntryHeadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found"));
        return workflowEngine.getNextAllowedActions(head);
    }

    @Override
    public List<Map<String, Object>> getOpenPOsForSource(Long divisionId) {
        String sql = "SELECT h.ID, h.PO_NO, h.PO_DATE, sm.NAME AS STATUS_NAME, " +
                "al.LEDGER_NAME AS SUPPLIER_NAME, h.SUPPLIER_ID " +
                "FROM PP_PURCHASE_ORDER_HEAD h WITH(NOLOCK) " +
                "LEFT JOIN AD_STATUS_MASTER sm WITH(NOLOCK) ON h.STATUS_ID = sm.ID " +
                "LEFT JOIN FA_ACCOUNT_LEDGER al WITH(NOLOCK) ON h.SUPPLIER_ID = al.ID " +
                "WHERE h.DIVISION = ? AND h.ACTIVE_STATUS = 1 " +
                "AND UPPER(sm.NAME) IN ('VERIFIED', 'APPROVED', 'PARTIALLY RECEIVED') " +
                "AND EXISTS (SELECT 1 FROM PP_PURCHASE_ORDER_TRANS t WITH(NOLOCK) " +
                "  WHERE t.PO_HEAD_ID = h.ID AND t.ACTIVE_STATUS = 1 " +
                "  AND (COALESCE(t.PENDING_QTY, t.QTY) - COALESCE((SELECT SUM(ge.DELIVERED_QTY) FROM PP_GATE_ENTRY_TRANS ge WITH(NOLOCK) INNER JOIN PP_GATE_ENTRY_HEAD geh WITH(NOLOCK) ON ge.GATE_ENTRY_HEAD_ID = geh.ID WHERE ge.PO_TRANS_ID = t.ID AND geh.ACTIVE_STATUS = 1 AND geh.STATUS_ID IN (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) NOT IN ('CLOSED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'GRN_CREATED'))), 0)) > 0) " +
                "AND EXISTS (SELECT 1 FROM PP_PURCHASE_SCHEDULE ps WITH(NOLOCK) INNER JOIN AD_STATUS_MASTER ps_sm WITH(NOLOCK) ON ps.STATUS = ps_sm.ID WHERE ps.PO_ID = h.ID AND UPPER(ps_sm.NAME) = 'PENDING') " +
                "ORDER BY h.ID DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", rs.getLong("ID"));
            row.put("poNo", rs.getString("PO_NO"));
            row.put("poDate", rs.getDate("PO_DATE"));
            row.put("statusName", rs.getString("STATUS_NAME"));
            row.put("supplierName", rs.getString("SUPPLIER_NAME"));
            row.put("supplierId", rs.getLong("SUPPLIER_ID"));
            return row;
        }, divisionId);
    }

    @Override
    public Map<String, Object> getPoDetailsForGateEntry(Long poId) {
        // Fetch PO head details
        String headSql = "SELECT h.ID, h.PO_NO, h.PO_DATE, h.SUPPLIER_ID, h.DELIVERY_ADDRESS, " +
                "h.PAYMENT_TERMS, h.DELIVERY_TERMS, h.SHIPPING_TERMS, h.REMARKS, " +
                "al.LEDGER_NAME AS SUPPLIER_NAME, al.ADDRESS AS SUPPLIER_ADDRESS, " +
                "al.MOBILE_NO AS SUPPLIER_MOBILE, al.MAIL_ID AS SUPPLIER_EMAIL " +
                "FROM PP_PURCHASE_ORDER_HEAD h WITH(NOLOCK) " +
                "LEFT JOIN FA_ACCOUNT_LEDGER al WITH(NOLOCK) ON h.SUPPLIER_ID = al.ID " +
                "WHERE h.ID = ?";
        List<Map<String, Object>> headList = jdbcTemplate.query(headSql, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", rs.getLong("ID"));
            row.put("poNo", rs.getString("PO_NO"));
            row.put("poDate", rs.getDate("PO_DATE"));
            row.put("supplierId", rs.getLong("SUPPLIER_ID"));
            row.put("supplierName", rs.getString("SUPPLIER_NAME"));
            row.put("supplierAddress", rs.getString("SUPPLIER_ADDRESS"));
            row.put("supplierMobile", rs.getString("SUPPLIER_MOBILE"));
            row.put("supplierEmail", rs.getString("SUPPLIER_EMAIL"));
            row.put("deliveryAddress", rs.getString("DELIVERY_ADDRESS"));
            row.put("paymentTerms", rs.getString("PAYMENT_TERMS"));
            row.put("deliveryTerms", rs.getString("DELIVERY_TERMS"));
            row.put("shippingTerms", rs.getString("SHIPPING_TERMS"));
            row.put("remarks", rs.getString("REMARKS"));
            return row;
        }, poId);
        if (headList.isEmpty()) throw new RuntimeException("PO not found: " + poId);
        Map<String, Object> result = new HashMap<>(headList.get(0));

        // Fetch all PO line items by Schedule
        String itemSql = "SELECT ps.ID AS SCHEDULE_ID, ps.SCHEDULE_DATE, ps.SCHEDULE_QTY, ps.RECEIVE_QTY, " +
                "t.ID AS PO_TRANS_ID, t.LINE_NO, t.ITEM_ID, p.ITEM_NAME, p.ITEM_NO AS ITEM_CODE, t.UOM, " +
                "t.UNIT_PRICE, t.HSN_CODE, t.REMARKS, " +
                "(COALESCE(ps.SCHEDULE_QTY, 0) - COALESCE((SELECT SUM(grt.GRN_QTY) FROM PP_GOODS_RECEIPT_TRANS grt WITH(NOLOCK) INNER JOIN PP_GOODS_RECEIPT_HEAD grh WITH(NOLOCK) ON grt.GRN_HEAD_ID = grh.ID WHERE grt.PURCHASE_SCHEDULE_ID = ps.ID AND grh.STATUS_ID NOT IN (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = 'CANCELLED')), 0) - " +
                "COALESCE((SELECT SUM(ge.DELIVERED_QTY) FROM PP_GATE_ENTRY_TRANS ge WITH(NOLOCK) INNER JOIN PP_GATE_ENTRY_HEAD geh WITH(NOLOCK) ON ge.GATE_ENTRY_HEAD_ID = geh.ID WHERE ge.PURCHASE_SCHEDULE_ID = ps.ID AND geh.ACTIVE_STATUS = 1 AND geh.STATUS_ID IN (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) NOT IN ('CLOSED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'GRN_CREATED'))), 0)) AS PENDING_QTY " +
                "FROM PP_PURCHASE_SCHEDULE ps WITH(NOLOCK) " +
                "INNER JOIN PP_PURCHASE_ORDER_TRANS t WITH(NOLOCK) ON ps.PO_ITEM_ID = t.ID " +
                "LEFT JOIN NPD_PRODUCT_MASTER p WITH(NOLOCK) ON t.ITEM_ID = p.ID " +
                "INNER JOIN AD_STATUS_MASTER ps_sm WITH(NOLOCK) ON ps.STATUS = ps_sm.ID " +
                "WHERE ps.PO_ID = ? AND t.ACTIVE_STATUS = 1 " +
                "AND UPPER(ps_sm.NAME) NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED') " +
                "ORDER BY ps.SCHEDULE_DATE, t.LINE_NO";
        List<Map<String, Object>> items = jdbcTemplate.query(itemSql, (rs, rowNum) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("scheduleId", rs.getLong("SCHEDULE_ID"));
            item.put("scheduleDate", rs.getDate("SCHEDULE_DATE"));
            item.put("scheduleQty", rs.getBigDecimal("SCHEDULE_QTY"));
            item.put("id", rs.getLong("PO_TRANS_ID")); // This is mapped to poTransId in UI
            item.put("poTransId", rs.getLong("PO_TRANS_ID")); 
            item.put("lineNo", rs.getInt("LINE_NO"));
            item.put("itemId", rs.getLong("ITEM_ID"));
            item.put("itemName", rs.getString("ITEM_NAME"));
            item.put("itemCode", rs.getString("ITEM_CODE"));
            item.put("uom", rs.getString("UOM"));
            BigDecimal qty = rs.getBigDecimal("SCHEDULE_QTY");
            BigDecimal pendingQty = rs.getBigDecimal("PENDING_QTY");
            item.put("qty", qty);
            item.put("pendingQty", pendingQty);
            item.put("alreadyDeliveredQty", qty != null && pendingQty != null ? qty.subtract(pendingQty) : java.math.BigDecimal.ZERO);
            item.put("unitPrice", rs.getBigDecimal("UNIT_PRICE"));
            item.put("hsnCode", rs.getString("HSN_CODE"));
            item.put("remarks", rs.getString("REMARKS"));
            return item;
        }, poId);
        result.put("items", items);
        return result;
    }
}
