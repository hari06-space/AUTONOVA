package com.autonoma.erp.service.purchase.inspection.impl;

import com.autonoma.erp.dto.purchase.inspection.QualityInspectionPayloadDTO;
import com.autonoma.erp.dto.purchase.inspection.QualityInspectionDTO;
import com.autonoma.erp.dto.purchase.inspection.QualityInspectionListDTO;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptHead;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans;
import com.autonoma.erp.model.purchase.inspection.QualityInspection;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.purchase.grn.GoodsReceiptHeadRepository;
import com.autonoma.erp.repository.purchase.inspection.QualityInspectionRepository;
import com.autonoma.erp.repository.purchase.PurchaseAttachmentRepository;
import com.autonoma.erp.model.purchase.PurchaseAttachment;
import com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO;
import com.autonoma.erp.modules.inventory.transaction.service.ItemTransactionService;
import com.autonoma.erp.service.purchase.inspection.QualityInspectionService;
import com.autonoma.erp.service.purchase.common.ProcurementQuantityValidationService;
import com.autonoma.erp.enums.SourceDocType;
import com.autonoma.erp.enums.TargetDocType;
import com.autonoma.erp.modules.inventory.transaction.dto.ItemTransactionDto;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QualityInspectionServiceImpl implements QualityInspectionService {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private QualityInspectionRepository repository;

    @Autowired
    private GoodsReceiptHeadRepository grnHeadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.repository.purchase.grn.GoodsReceiptTransRepository grnTransRepository;

    @Autowired
    private com.autonoma.erp.repository.purchase.inspection.RejectionReasonRepository rejectionReasonRepository;

    @Autowired
    private PurchaseAttachmentRepository purchaseAttachmentRepository;

    @Autowired
    private ItemTransactionService itemTransactionService;

    @Autowired
    private ProcurementQuantityValidationService quantityValidationService;

    @Autowired
    private com.autonoma.erp.repository.purchase.MaterialInspectionRepository materialInspectionRepository;

    @Autowired
    private com.autonoma.erp.modules.qmc.inspectionspecification.repository.InspectionSpecificationDetailRepository specDetailRepository;

    @Autowired
    private com.autonoma.erp.modules.qmc.aql.repository.AqlMasterRepository aqlMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepository;

    @Override
    public Page<QualityInspectionListDTO> search(Long divisionId, String qiNo, LocalDate startDate, LocalDate endDate, String grnNo, Pageable pageable) {
        Page<Object[]> results = repository.searchIndividualInspections(qiNo, pageable);
        List<QualityInspectionListDTO> dtoList = results.getContent().stream().map(obj -> {
            QualityInspectionListDTO dto = new QualityInspectionListDTO();
            dto.setGrnHeadId((String) obj[0]); // Using grnId for routing
            if (obj.length > 11 && obj[11] != null) {
                dto.setId((String) obj[11]); // Unique ID for table rows
            } else {
                dto.setId((String) obj[0]); // fallback
            }
            if (obj[1] != null) {
                if (obj[1] instanceof java.sql.Date) {
                    dto.setQiDate(((java.sql.Date) obj[1]).toLocalDate());
                } else if (obj[1] instanceof LocalDate) {
                    dto.setQiDate((LocalDate) obj[1]);
                } else if (obj[1] instanceof java.sql.Timestamp) {
                    dto.setQiDate(((java.sql.Timestamp) obj[1]).toLocalDateTime().toLocalDate());
                }
            }
            dto.setGrnNo((String) obj[2]);
            String status = (String) obj[3];
            dto.setStatusName(status != null ? status : "PENDING");
            if (obj.length > 4) {
                dto.setTotalGrnQty((java.math.BigDecimal) obj[4]);
                dto.setTotalAcceptedQty((java.math.BigDecimal) obj[5]);
                dto.setTotalRejectedQty((java.math.BigDecimal) obj[6]);
            }
            if (obj.length > 8) {
                dto.setSupplierName((String) obj[7]);
                dto.setPoNo((String) obj[8]);
            }
            if (obj.length > 10) {
                dto.setItemCode((String) obj[9]);
                dto.setItemName((String) obj[10]);
            }
            return dto;
        }).collect(Collectors.toList());
        return new PageImpl<>(dtoList, pageable, results.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public QualityInspectionPayloadDTO getById(String id) {
        Long grnId = Long.parseLong(id);
        List<QualityInspection> items = repository.findByGrnId(grnId);
        if (items.isEmpty()) {
            throw new RuntimeException("Inspection not found for GRN");
        }
        
        QualityInspectionPayloadDTO payload = new QualityInspectionPayloadDTO();
        payload.setId(id);
        payload.setQiDate(items.get(0).getInspectionDate());
        
        GoodsReceiptHead grn = items.get(0).getGrnTrans().getHead();
        payload.setGrnHeadId(grn.getId());
        payload.setGrnNo(grn.getGrnNo());
        payload.setGrnDate(grn.getGrnDate());
        if (grn.getGateEntryHead() != null) {
            payload.setGateEntryNo(grn.getGateEntryHead().getGateEntryNo());
        }
        payload.setBillNo(grn.getDocumentNo());
        payload.setBillDate(grn.getDocumentDate());
        payload.setDocumentType(grn.getDocumentType());
        payload.setDocumentNo(grn.getDocumentNo());
        payload.setDocumentDate(grn.getDocumentDate());
        if (grn.getDivision() != null) {
            payload.setDivisionId(grn.getDivision().getId());
        }
        
        payload.setStatusName(items.get(0).getStatus() != null ? items.get(0).getStatus().getName() : "PENDING");
        
        List<QualityInspectionDTO> txList = new ArrayList<>();
        
        List<Long> sourceLineIds = items.stream().map(i -> i.getGrnTrans().getId()).collect(Collectors.toList());
        var remainingQuantities = quantityValidationService.getRemainingQuantities(
                SourceDocType.GOODS_RECEIPT_NOTE, TargetDocType.QUALITY_INSPECTION, sourceLineIds);
                
        for (QualityInspection i : items) {
            QualityInspectionDTO dto = new QualityInspectionDTO();
            dto.setId(i.getId());
            dto.setGrnTransId(i.getGrnTrans().getId());
            dto.setItemId(i.getItemId());
            
            if (i.getGrnTrans() != null && i.getGrnTrans().getItem() != null) {
                dto.setItemCode(i.getGrnTrans().getItem().getItemCode());
                dto.setItemName(i.getGrnTrans().getItem().getItemName());
            }
            if (i.getGrnTrans() != null) {
                dto.setBatchNo(i.getGrnTrans().getBatchNo());
            }

            dto.setGrnQty(i.getGrnQty());
            dto.setAcceptedQty(i.getAcceptedQty());
            dto.setRejectedQty(i.getRejectedQty());
            dto.setNcQty(i.getNcQty());
            dto.setNcRemarks(i.getNcRemarks());
            dto.setRejectionReasonId(i.getRejectionReasonId());
            if (i.getRejectionReasonId() != null) {
                rejectionReasonRepository.findById(i.getRejectionReasonId()).ifPresent(reason -> 
                    dto.setRejectionReason(reason.getRejectionReason())
                );
            }
            dto.setInspectedById(i.getInspectedById());
            dto.setRemarks(i.getRemarks());
            dto.setStatusId(i.getStatus() != null ? i.getStatus().getId() : null);
            dto.setStatusName(i.getStatus() != null ? i.getStatus().getName() : null);
            
            if (i.getGrnTrans() != null) {
                dto.setUom(i.getGrnTrans().getUom());
                dto.setGrnRemarks(i.getGrnTrans().getRemarks());
                if (i.getGrnTrans().getPoTrans() != null) {
                    dto.setPrice(i.getGrnTrans().getPoTrans().getUnitPrice());
                }
                dto.setTestCertificate(i.getGrnTrans().getTestCertificate());
                dto.setTcSource(i.getGrnTrans().getTcSource());
                dto.setHeatNo(i.getGrnTrans().getHeatNo());
            }
            
            BigDecimal remaining = remainingQuantities.getOrDefault(i.getGrnTrans().getId(), BigDecimal.ZERO);
            BigDecimal currentlyInspected = (i.getAcceptedQty() != null ? i.getAcceptedQty() : BigDecimal.ZERO)
                                            .add(i.getRejectedQty() != null ? i.getRejectedQty() : BigDecimal.ZERO)
                                            .add(i.getNcQty() != null ? i.getNcQty() : BigDecimal.ZERO);
            dto.setRemainingQty(remaining.add(currentlyInspected));
            
            // Fetch line item attachments
            List<PurchaseAttachment> lineAtts = purchaseAttachmentRepository.findByPageCodeAndRefIdAndActiveStatus("PP1126_TRANS", String.valueOf(i.getId()), 1);
            if (lineAtts != null && !lineAtts.isEmpty()) {
                List<PurchaseAttachmentDTO> attDtos = lineAtts.stream().map(a -> {
                    PurchaseAttachmentDTO attDto = new PurchaseAttachmentDTO();
                    attDto.setId(a.getId());
                    attDto.setPoHeadId(a.getPoHeadId());
                    attDto.setRefId(a.getRefId());
                    attDto.setPageCode(a.getPageCode());
                    attDto.setDocType(a.getDocType());
                    attDto.setFileName(a.getFileName());
                    attDto.setFilePath(a.getFilePath());
                    attDto.setFileSize(a.getFileSize());
                    attDto.setMimeType(a.getMimeType());
                    attDto.setActiveStatus(a.getActiveStatus());
                    attDto.setServerFileName(a.getFilePath());
                    attDto.setName(a.getFileName());
                    attDto.setFileType(a.getMimeType());
                    return attDto;
                }).collect(Collectors.toList());
                dto.setAttachments(attDtos);
            }
            
            // Fetch Test Reports
            java.util.List<com.autonoma.erp.model.purchase.inspection.MaterialInspection> miList = materialInspectionRepository.findByQualityInspectionId(i.getId());
            if (miList != null && !miList.isEmpty()) {
                List<com.autonoma.erp.dto.purchase.inspection.MaterialInspectionDTO> miDtoList = miList.stream().map(mi -> {
                    com.autonoma.erp.dto.purchase.inspection.MaterialInspectionDTO miDto = new com.autonoma.erp.dto.purchase.inspection.MaterialInspectionDTO();
                    miDto.setId(mi.getId());
                    miDto.setQualityInspectionId(i.getId());
                    if (mi.getSpecParameter() != null) {
                        miDto.setSpecParameterId(mi.getSpecParameter().getId());
                        miDto.setParameterName(mi.getSpecParameter().getParameterName());
                        miDto.setUom(mi.getSpecParameter().getUomCode());
                        miDto.setParameterCondition(mi.getSpecParameter().getParameterCondition());
                        miDto.setProcessId(mi.getSpecParameter().getProcessId());
                        miDto.setInstrumentId(mi.getSpecParameter().getInstrumentId());

                        if (mi.getSpecParameter().getProcessId() != null) {
                            try {
                                ProductProcess proc = entityManager.find(ProductProcess.class, mi.getSpecParameter().getProcessId());
                                if (proc != null) miDto.setProcessName(proc.getProcessName());
                            } catch (Exception e) {}
                        }
                        if (mi.getSpecParameter().getInstrumentId() != null) {
                            try {
                                ProductMaster pm = entityManager.find(ProductMaster.class, mi.getSpecParameter().getInstrumentId());
                                if (pm != null) miDto.setInstrumentName(pm.getItemName());
                            } catch (Exception e) {}
                        }
                    }
                    int sampleSize = 1;
                    com.autonoma.erp.modules.qmc.aql.entity.AqlMaster aql = mi.getAql();
                    
                    if (aql == null && mi.getSpecParameter() != null) {
                        Long fallbackAqlId = mi.getSpecParameter().getAqlMasterId();
                        if (fallbackAqlId == null && mi.getSpecParameter().getSpecification() != null) {
                            fallbackAqlId = mi.getSpecParameter().getSpecification().getAqlId();
                        }
                        if (fallbackAqlId == null) {
                            try {
                                ProductMaster pm = entityManager.find(ProductMaster.class, i.getItemId());
                                if (pm != null && pm.getItemGroup() != null) {
                                    com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup group = 
                                        entityManager.find(com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemGroup.class, pm.getItemGroup());
                                    if (group != null && group.getAqlId() != null) {
                                        fallbackAqlId = group.getAqlId();
                                    }
                                }
                            } catch (Exception e) {}
                        }
                        if (fallbackAqlId != null) {
                            aql = aqlMasterRepository.findById(fallbackAqlId).orElse(null);
                        }
                    }

                    if (aql != null) {
                        miDto.setAqlId(aql.getId());
                        int qty = i.getGrnQty() != null ? i.getGrnQty().intValue() : 0;
                        java.util.Optional<com.autonoma.erp.modules.qmc.aql.entity.AqlSamplingRule> matchingRule = aql.getSamplingRules().stream()
                                .filter(rule -> rule.getLotSizeFrom() <= qty && rule.getLotSizeTo() >= qty)
                                .findFirst();
                        if (matchingRule.isPresent()) {
                            sampleSize = matchingRule.get().getSampleSize();
                        }
                    }

                    if (mi.getObservation() != null && !mi.getObservation().trim().isEmpty() && !mi.getObservation().trim().equals("[]")) {
                        try {
                            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            java.util.List<String> obsList = mapper.readValue(mi.getObservation(), new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
                            if (obsList != null) {
                                boolean hasData = false;
                                for (String val : obsList) {
                                    if (val != null && !val.trim().isEmpty()) {
                                        hasData = true;
                                        break;
                                    }
                                }
                                if (hasData) {
                                    if (obsList.size() > sampleSize) {
                                        sampleSize = obsList.size();
                                    }
                                }
                            }
                        } catch (Exception e) {}
                    }

                    miDto.setSampleSize(sampleSize);
                    miDto.setMinVal(mi.getMinVal());
                    miDto.setMaxVal(mi.getMaxVal());
                    miDto.setObservation(mi.getObservation());
                    miDto.setResult(mi.getResult());
                    return miDto;
                }).collect(Collectors.toList());
                dto.setTestReports(miDtoList);
            }

            txList.add(dto);
        }
        payload.setTransactions(txList);

        // Fetch attachments using grnHeadId as refId
        List<PurchaseAttachment> attachments = purchaseAttachmentRepository.findByPageCodeAndRefIdAndActiveStatus("PP1126", id, 1);
        if (attachments != null && !attachments.isEmpty()) {
            List<PurchaseAttachmentDTO> attDtos = attachments.stream().map(a -> {
                PurchaseAttachmentDTO attDto = new PurchaseAttachmentDTO();
                attDto.setId(a.getId());
                attDto.setPoHeadId(a.getPoHeadId());
                attDto.setRefId(a.getRefId());
                attDto.setPageCode(a.getPageCode());
                attDto.setDocType(a.getDocType());
                attDto.setFileName(a.getFileName());
                attDto.setFilePath(a.getFilePath());
                attDto.setFileSize(a.getFileSize());
                attDto.setMimeType(a.getMimeType());
                attDto.setActiveStatus(a.getActiveStatus());
                attDto.setServerFileName(a.getFilePath());
                attDto.setName(a.getFileName());
                attDto.setFileType(a.getMimeType());
                return attDto;
            }).collect(Collectors.toList());
            payload.setAttachments(attDtos);
        }

        return payload;
    }

    @Override
    @Transactional
    public QualityInspectionPayloadDTO generateFromGrn(Long grnId, Long divisionId, String userId) {
        GoodsReceiptHead grn = grnHeadRepository.findByIdWithDetails(grnId)
                .orElseThrow(() -> new RuntimeException("GRN not found"));

        QualityInspectionPayloadDTO payload = new QualityInspectionPayloadDTO();
        payload.setId(grnId.toString());
        payload.setDivisionId(divisionId);
        payload.setQiDate(LocalDate.now());
        payload.setGrnHeadId(grn.getId());
        payload.setGrnNo(grn.getGrnNo());
        payload.setGrnDate(grn.getGrnDate());
        if (grn.getGateEntryHead() != null) {
            payload.setGateEntryNo(grn.getGateEntryHead().getGateEntryNo());
        }
        payload.setBillNo(grn.getDocumentNo());
        payload.setBillDate(grn.getDocumentDate());
        payload.setDocumentType(grn.getDocumentType());
        payload.setDocumentNo(grn.getDocumentNo());
        payload.setDocumentDate(grn.getDocumentDate());
        payload.setStatusName("DRAFT");
        
        List<QualityInspectionDTO> txList = new ArrayList<>();
        List<Long> sourceLineIds = grn.getTransactions().stream().map(GoodsReceiptTrans::getId).collect(Collectors.toList());
        var remainingQuantities = quantityValidationService.getRemainingQuantities(
                SourceDocType.GOODS_RECEIPT_NOTE, TargetDocType.QUALITY_INSPECTION, sourceLineIds);

        for (GoodsReceiptTrans grnTrans : grn.getTransactions()) {
            BigDecimal remainingQty = remainingQuantities.getOrDefault(grnTrans.getId(), BigDecimal.ZERO);
            if (remainingQty.compareTo(BigDecimal.ZERO) > 0) {
                QualityInspectionDTO dto = new QualityInspectionDTO();
                dto.setGrnTransId(grnTrans.getId());
                dto.setItemId(grnTrans.getItem().getId());
                dto.setItemCode(grnTrans.getItem().getItemCode());
                dto.setItemName(grnTrans.getItem().getItemName());
                dto.setBatchNo(grnTrans.getBatchNo());
                dto.setGrnQty(grnTrans.getGrnQty());
                dto.setAcceptedQty(BigDecimal.ZERO);
                dto.setRejectedQty(BigDecimal.ZERO);
                dto.setNcQty(BigDecimal.ZERO);
                dto.setRemainingQty(remainingQty);
                dto.setUom(grnTrans.getUom());
                dto.setGrnRemarks(grnTrans.getRemarks());
                if (grnTrans.getPoTrans() != null) {
                    dto.setPrice(grnTrans.getPoTrans().getUnitPrice());
                }
                dto.setTestCertificate(grnTrans.getTestCertificate());
                dto.setTcSource(grnTrans.getTcSource());
                dto.setHeatNo(grnTrans.getHeatNo());
                txList.add(dto);
            }
        }
        payload.setTransactions(txList);
        
        // Map GRN attachments
        if (grn.getAttachments() != null && !grn.getAttachments().isEmpty()) {
            List<com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO> attDtos = grn.getAttachments().stream().map(a -> {
                com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO attDto = new com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO();
                attDto.setId(a.getId());
                attDto.setRefId(a.getGoodsReceiptHead().getId().toString());
                attDto.setPageCode("PP1082"); // GRN Page Code
                attDto.setDocType(a.getAttachmentType());
                attDto.setFileName(a.getFileName());
                attDto.setFilePath(a.getFilePath());
                attDto.setFileSize(a.getFileSize());
                attDto.setMimeType(a.getMimeType());
                attDto.setActiveStatus(a.getActiveStatus());
                attDto.setServerFileName(a.getFilePath());
                attDto.setName(a.getFileName());
                attDto.setFileType(a.getMimeType());
                return attDto;
            }).collect(Collectors.toList());
            payload.setAttachments(attDtos);
        }
        
        return payload;
    }

    @Override
    @Transactional
    public QualityInspectionPayloadDTO save(QualityInspectionPayloadDTO dto, String userId) {
        String grnIdStr = dto.getGrnHeadId().toString();
        
        for (QualityInspectionDTO txDto : dto.getTransactions()) {
            // Only save if quantities are entered
            BigDecimal total = (txDto.getAcceptedQty() != null ? txDto.getAcceptedQty() : BigDecimal.ZERO)
                    .add(txDto.getRejectedQty() != null ? txDto.getRejectedQty() : BigDecimal.ZERO)
                    .add(txDto.getNcQty() != null ? txDto.getNcQty() : BigDecimal.ZERO);
                    
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                QualityInspection entity;
                if (txDto.getId() != null) {
                    entity = repository.findById(txDto.getId()).orElse(new QualityInspection());
                } else {
                    entity = new QualityInspection();
                }
                
                GoodsReceiptTrans grnTrans = grnTransRepository.findById(txDto.getGrnTransId())
                        .orElseThrow(() -> new RuntimeException("GRN Transaction not found"));
                
                grnTrans.setTestCertificate(txDto.getTestCertificate());
                grnTrans.setTcSource(txDto.getTcSource());
                grnTrans.setHeatNo(txDto.getHeatNo());
                grnTransRepository.save(grnTrans);
                
                entity.setInspectionDate(dto.getQiDate() != null ? dto.getQiDate() : LocalDate.now());
                entity.setGrnId(dto.getGrnHeadId());
                entity.setGrnTrans(grnTrans);
                entity.setItemId(txDto.getItemId());
                entity.setGrnQty(txDto.getGrnQty());
                entity.setAcceptedQty(txDto.getAcceptedQty());
                entity.setRejectedQty(txDto.getRejectedQty());
                entity.setNcQty(txDto.getNcQty());
                entity.setNcRemarks(txDto.getNcRemarks());
                entity.setRejectionReasonId(txDto.getRejectionReasonId());
                entity.setInspectedById(txDto.getInspectedById());
                entity.setRemarks(txDto.getRemarks());
                BigDecimal balanceQty = txDto.getGrnQty().subtract(total);
                if (balanceQty.compareTo(BigDecimal.ZERO) > 0) {
                    entity.setStatus(statusMasterRepository.findByNameIgnoreCase("PENDING").orElse(null));
                } else {
                    entity.setStatus(statusMasterRepository.findByNameIgnoreCase("COMPLETED").orElse(null));
                }
                
                entity = repository.save(entity);
                
                // Handle line item attachments
                if (txDto.getAttachments() != null) {
                    String transRefId = entity.getId().toString();
                    List<PurchaseAttachment> existingTransAtts = purchaseAttachmentRepository.findByPageCodeAndRefIdAndActiveStatus("PP1126_TRANS", transRefId, 1);
                    if (existingTransAtts != null) {
                        for (PurchaseAttachment a : existingTransAtts) {
                            boolean exists = txDto.getAttachments().stream()
                                    .anyMatch(dtoAtt -> dtoAtt.getId() != null && dtoAtt.getId().equals(a.getId()));
                            if (!exists) {
                                a.setActiveStatus(0);
                                purchaseAttachmentRepository.save(a);
                            }
                        }
                    }
                    
                    for (PurchaseAttachmentDTO attDto : txDto.getAttachments()) {
                        if (attDto.getId() != null) continue; // Already exists
                        PurchaseAttachment att = new PurchaseAttachment();
                        att.setRefId(transRefId);
                        att.setPageCode("PP1126_TRANS");
                        att.setDocType(attDto.getDocType() != null ? attDto.getDocType() : "QI_TRANS");
                        att.setFileName(attDto.getFileName());
                        att.setFilePath(attDto.getFilePath() != null ? attDto.getFilePath() : attDto.getServerFileName());
                        att.setFileSize(attDto.getFileSize());
                        att.setMimeType(attDto.getMimeType() != null ? attDto.getMimeType() : attDto.getFileType());
                        att.setActiveStatus(1);
                        purchaseAttachmentRepository.save(att);
                    }
                }
                // Handle Test Reports (Material Inspection)
                String[] aqlInspectionType = new String[]{"Inspection"};
                if (txDto.getTestReports() != null && !txDto.getTestReports().isEmpty()) {
                    for (com.autonoma.erp.dto.purchase.inspection.MaterialInspectionDTO testDto : txDto.getTestReports()) {
                        com.autonoma.erp.model.purchase.inspection.MaterialInspection mi = null;
                        if (testDto.getId() != null) {
                            mi = entity.getTestReports().stream()
                                    .filter(t -> testDto.getId().equals(t.getId()))
                                    .findFirst()
                                    .orElse(null);
                        }
                        
                        if (mi == null) {
                            mi = new com.autonoma.erp.model.purchase.inspection.MaterialInspection();
                            entity.getTestReports().add(mi);
                        }
                        
                        mi.setQualityInspection(entity);
                        if (testDto.getSpecParameterId() != null) {
                            specDetailRepository.findById(testDto.getSpecParameterId()).ifPresent(mi::setSpecParameter);
                        }
                        if (testDto.getAqlId() != null) {
                            java.util.Optional<com.autonoma.erp.modules.qmc.aql.entity.AqlMaster> aqlOpt = aqlMasterRepository.findById(testDto.getAqlId());
                            if (aqlOpt.isPresent()) {
                                com.autonoma.erp.modules.qmc.aql.entity.AqlMaster aql = aqlOpt.get();
                                mi.setAql(aql);
                                if (aql.getInspectionType() != null && "Inspection".equals(aqlInspectionType[0])) {
                                    aqlInspectionType[0] = aql.getInspectionType();
                                }
                            }
                        }
                        mi.setMinVal(testDto.getMinVal());
                        mi.setMaxVal(testDto.getMaxVal());
                        mi.setObservation(testDto.getObservation());
                        mi.setResult(testDto.getResult());
                    }
                    System.out.println("DEBUG: Saving test reports for entity " + entity.getId() + ". Count = " + entity.getTestReports().size());
                    repository.save(entity); // Save entity again to cascade the test reports
                } else {
                    System.out.println("DEBUG: No test reports received in payload for txDto " + txDto.getItemId());
                }

                // Create Item Transaction
                if (txDto.getAcceptedQty() != null && txDto.getAcceptedQty().compareTo(BigDecimal.ZERO) > 0) {
                    ItemTransactionDto txIn = new ItemTransactionDto();
                    txIn.setTransCategory("STOCK");
                    
                    String itemInvType = grnTrans.getItem() != null ? grnTrans.getItem().getInventoryType() : null;
                    String invType = "RAWMATERIAL".equalsIgnoreCase(itemInvType) ? "RAWMATERIAL" : "PRODUCT";
                    txIn.setInventoryType(invType);
                    
                    String grnNoStr = (grnTrans.getHead() != null && grnTrans.getHead().getGrnNo() != null) ? grnTrans.getHead().getGrnNo() : ("GRN-" + entity.getGrnId());
                    String qiRefStr = "QI-" + entity.getId();

                    txIn.setProductId(txDto.getItemId());
                    txIn.setTransDate(entity.getInspectionDate());
                    txIn.setTransNo(grnNoStr);
                    
                    // Set TransType from Item Transaction Type Master
                    txIn.setTransType("PURCHASE_RECEIPT");
                    
                    txIn.setReferenceNo(qiRefStr);
                    txIn.setQtyIn(txDto.getAcceptedQty());
                    txIn.setQtyOut(BigDecimal.ZERO);
                    txIn.setPrice(grnTrans.getPoTrans() != null ? grnTrans.getPoTrans().getUnitPrice() : BigDecimal.ZERO);
                    txIn.setUom(grnTrans.getUom());
                    txIn.setBatchId(grnTrans.getBatchNo());
                    if (grnTrans.getHead().getSupplier() != null) {
                        txIn.setVendorId(grnTrans.getHead().getSupplier().getId());
                    }
                    Long divIdIn = dto.getDivisionId();
                    if (divIdIn == null && grnTrans.getHead() != null && grnTrans.getHead().getDivision() != null) {
                        divIdIn = grnTrans.getHead().getDivision().getId();
                    }
                    txIn.setDivisionId(divIdIn);
                    txIn.setIsRejection(false);
                    
                    ItemTransactionDto created = itemTransactionService.createTransaction(txIn);
                    itemTransactionService.postTransaction(created.getId());
                }
                
                if (txDto.getRejectedQty() != null && txDto.getRejectedQty().compareTo(BigDecimal.ZERO) > 0) {
                    ItemTransactionDto txRej = new ItemTransactionDto();
                    txRej.setTransCategory("REJECTION");
                    
                    String itemInvType = grnTrans.getItem() != null ? grnTrans.getItem().getInventoryType() : null;
                    String invType = "RAWMATERIAL".equalsIgnoreCase(itemInvType) ? "RAWMATERIAL" : "PRODUCT";
                    txRej.setInventoryType(invType);
                    
                    String grnNoStr = (grnTrans.getHead() != null && grnTrans.getHead().getGrnNo() != null) ? grnTrans.getHead().getGrnNo() : ("GRN-" + entity.getGrnId());
                    String qiRefStr = "QI-" + entity.getId();

                    txRej.setProductId(txDto.getItemId());
                    txRej.setTransDate(entity.getInspectionDate());
                    txRej.setTransNo(grnNoStr);
                    
                    // Set TransType from Item Transaction Type Master
                    txRej.setTransType("REJECTION_IN");
                    
                    txRej.setReferenceNo(qiRefStr);
                    txRej.setQtyIn(txDto.getRejectedQty());
                    txRej.setQtyOut(BigDecimal.ZERO);
                    txRej.setPrice(grnTrans.getPoTrans() != null ? grnTrans.getPoTrans().getUnitPrice() : BigDecimal.ZERO);
                    txRej.setUom(grnTrans.getUom());
                    txRej.setBatchId(grnTrans.getBatchNo());
                    if (grnTrans.getHead().getSupplier() != null) {
                        txRej.setVendorId(grnTrans.getHead().getSupplier().getId());
                    }
                    Long divIdRej = dto.getDivisionId();
                    if (divIdRej == null && grnTrans.getHead() != null && grnTrans.getHead().getDivision() != null) {
                        divIdRej = grnTrans.getHead().getDivision().getId();
                    }
                    txRej.setDivisionId(divIdRej);
                    txRej.setIsRejection(true);
                    
                    ItemTransactionDto created = itemTransactionService.createTransaction(txRej);
                    itemTransactionService.postTransaction(created.getId());
                }
                
                if (txDto.getNcQty() != null && txDto.getNcQty().compareTo(BigDecimal.ZERO) > 0) {
                    ItemTransactionDto txNc = new ItemTransactionDto();
                    txNc.setTransCategory("NC");
                    
                    String itemInvType = grnTrans.getItem() != null ? grnTrans.getItem().getInventoryType() : null;
                    String invType = "RAWMATERIAL".equalsIgnoreCase(itemInvType) ? "RAWMATERIAL" : "PRODUCT";
                    txNc.setInventoryType(invType);
                    
                    String grnNoStr = (grnTrans.getHead() != null && grnTrans.getHead().getGrnNo() != null) ? grnTrans.getHead().getGrnNo() : ("GRN-" + entity.getGrnId());
                    String qiRefStr = "QI-" + entity.getId();

                    txNc.setProductId(txDto.getItemId());
                    txNc.setTransDate(entity.getInspectionDate());
                    txNc.setTransNo(grnNoStr);
                    
                    // Set TransType from Item Transaction Type Master
                    txNc.setTransType("NC_RECEIPT");
                    
                    txNc.setReferenceNo(qiRefStr);
                    txNc.setQtyIn(txDto.getNcQty());
                    txNc.setQtyOut(BigDecimal.ZERO);
                    txNc.setPrice(grnTrans.getPoTrans() != null ? grnTrans.getPoTrans().getUnitPrice() : BigDecimal.ZERO);
                    txNc.setUom(grnTrans.getUom());
                    txNc.setBatchId(grnTrans.getBatchNo());
                    if (grnTrans.getHead().getSupplier() != null) {
                        txNc.setVendorId(grnTrans.getHead().getSupplier().getId());
                    }
                    txNc.setDivisionId(dto.getDivisionId());
                    txNc.setIsRejection(false);
                    
                    ItemTransactionDto created = itemTransactionService.createTransaction(txNc);
                    itemTransactionService.postTransaction(created.getId());
                }
            }
        }
        
        // Handle attachments
        if (dto.getAttachments() != null) {
            // Soft delete existing attachments for this inspection
            List<PurchaseAttachment> existingAttachments = purchaseAttachmentRepository.findByPageCodeAndRefIdAndActiveStatus("PP1126", grnIdStr, 1);
            for (PurchaseAttachment ea : existingAttachments) {
                ea.setActiveStatus(0);
                purchaseAttachmentRepository.save(ea);
            }
            // Save new attachments
            for (PurchaseAttachmentDTO attDto : dto.getAttachments()) {
                PurchaseAttachment attachment = new PurchaseAttachment();
                attachment.setRefId(grnIdStr);
                attachment.setPageCode("PP1126");
                attachment.setDocType(attDto.getDocType() != null ? attDto.getDocType() : "GRN");
                attachment.setFileName(attDto.getFileName());
                attachment.setFilePath(attDto.getFilePath());
                attachment.setFileSize(attDto.getFileSize());
                attachment.setMimeType(attDto.getMimeType());
                attachment.setActiveStatus(1);
                purchaseAttachmentRepository.save(attachment);
            }
        }
        // Auto-close GRN if all lines are fully inspected
        GoodsReceiptHead head = grnHeadRepository.findById(dto.getGrnHeadId()).orElse(null);
        if (head != null && head.getTransactions() != null) {
            boolean allInspected = true;
            List<QualityInspection> allInspections = repository.findByGrnId(dto.getGrnHeadId());
            for (GoodsReceiptTrans trans : head.getTransactions()) {
                if (trans.getGrnQty() == null || trans.getGrnQty().compareTo(BigDecimal.ZERO) <= 0) continue;
                
                BigDecimal sumAccepted = allInspections.stream().filter(qi -> qi.getGrnTrans().getId().equals(trans.getId())).map(qi -> qi.getAcceptedQty() != null ? qi.getAcceptedQty() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal sumRejected = allInspections.stream().filter(qi -> qi.getGrnTrans().getId().equals(trans.getId())).map(qi -> qi.getRejectedQty() != null ? qi.getRejectedQty() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal sumNc = allInspections.stream().filter(qi -> qi.getGrnTrans().getId().equals(trans.getId())).map(qi -> qi.getNcQty() != null ? qi.getNcQty() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal balance = trans.getGrnQty().subtract(sumAccepted).subtract(sumRejected).subtract(sumNc);
                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    allInspected = false;
                    break;
                }
            }
            if (allInspected) {
                head.setStatus(statusMasterRepository.findByNameIgnoreCase("CLOSED").orElse(null));
                grnHeadRepository.save(head);
            }
        }
        
        return getById(grnIdStr);
    }

    @Override
    @Transactional
    public QualityInspectionPayloadDTO postInspection(String id, String userId) {
        Long grnId = Long.parseLong(id);
        List<QualityInspection> items = repository.findByGrnId(grnId);
        
        for (QualityInspection t : items) {
            // Inventory posting goes here if needed.
        }
        
        return getById(id);
    }
}
