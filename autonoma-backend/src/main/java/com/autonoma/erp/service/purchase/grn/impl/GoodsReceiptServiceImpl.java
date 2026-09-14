package com.autonoma.erp.service.purchase.grn.impl;

import com.autonoma.erp.dto.purchase.grn.GoodsReceiptHeadDTO;
import com.autonoma.erp.dto.purchase.grn.GoodsReceiptListDTO;
import com.autonoma.erp.dto.purchase.grn.GoodsReceiptTransDTO;
import com.autonoma.erp.dto.purchase.grn.GoodsReceiptAttachmentDTO;
import com.autonoma.erp.model.PurchaseOrderHead;
import com.autonoma.erp.model.PurchaseOrderTrans;
import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;
import com.autonoma.erp.model.purchase.gateentry.GateEntryTrans;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptHead;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptAttachment;

import com.autonoma.erp.modules.inventory.transaction.service.ItemTransactionService;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.repository.PurchaseOrderHeadRepository;
import com.autonoma.erp.repository.PurchaseOrderTransRepository;
import com.autonoma.erp.repository.purchase.gateentry.GateEntryHeadRepository;
import com.autonoma.erp.repository.purchase.grn.GoodsReceiptHeadRepository;
import com.autonoma.erp.repository.purchase.grn.GoodsReceiptTransRepository;
import com.autonoma.erp.repository.purchase.PurchaseScheduleRepository;
import com.autonoma.erp.model.PurchaseSchedule;

import com.autonoma.erp.service.purchase.common.ProcurementQuantityValidationService;
import com.autonoma.erp.dto.purchase.common.TransactionLineDTO;
import com.autonoma.erp.enums.SourceDocType;
import com.autonoma.erp.enums.TargetDocType;
import com.autonoma.erp.service.purchase.grn.GoodsReceiptService;
import java.util.Set;
import java.util.Objects;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    @Autowired
    private GoodsReceiptHeadRepository headRepository;

    @Autowired
    private GoodsReceiptTransRepository transRepository;

    @Autowired
    private StatusMasterRepository statusRepository;

    @Autowired
    private ItemTransactionService itemTransactionService;

    @Autowired
    private ProcurementQuantityValidationService quantityValidationService;

    @Autowired
    private PurchaseOrderHeadRepository poHeadRepository;

    @Autowired
    private GateEntryHeadRepository gateEntryHeadRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private PurchaseOrderTransRepository poTransRepository;

    @Autowired
    private PurchaseScheduleRepository purchaseScheduleRepository;

    @Override
    @Transactional
    public GoodsReceiptHeadDTO generateFromGateEntry(Long gateEntryId, String userId) {
        // Step 1: Validate Gate Entry exists
        GateEntryHead ge = gateEntryHeadRepository.findById(gateEntryId)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found with ID: " + gateEntryId));

        // Step 2: Gate Entry Eligibility Validation
        String geStatus = ge.getStatus() != null ? ge.getStatus().getName().toUpperCase() : "";
        if ("CANCELLED".equals(geStatus) || "REJECTED".equals(geStatus)) {
            throw new RuntimeException("Gate Entry status is " + geStatus + " and is not eligible for GRN generation.");
        }

        // Step 3: Duplicate GRN Prevention (Idempotency)
        List<GoodsReceiptHead> existingGrns = headRepository.findByGateEntryHeadIdWithDetails(gateEntryId);
        if (existingGrns != null && !existingGrns.isEmpty()) {
            for (GoodsReceiptHead existing : existingGrns) {
                String statusName = existing.getStatus() != null ? existing.getStatus().getName().toUpperCase() : "";
                if (!"CANCELLED".equals(statusName)) {
                    // Return existing active/draft GRN instead of creating a duplicate
                    return mapToDto(existing);
                }
            }
        }

        // Step 4: Create GRN Header
        GoodsReceiptHead head = new GoodsReceiptHead();
        head.setDivision(ge.getDivision());
        head.setSupplier(ge.getSupplier());
        head.setGateEntryHead(ge);
        head.setGrnDate(LocalDate.now());

        // Derive PO Head reference if present
        PurchaseOrderHead poHead = null;
        if (ge.getTransactions() != null) {
            for (GateEntryTrans geTrans : ge.getTransactions()) {
                if (geTrans.getPoTrans() != null && geTrans.getPoTrans().getPurchaseOrderHead() != null) {
                    poHead = geTrans.getPoTrans().getPurchaseOrderHead();
                    break;
                }
            }
        }
        head.setPoHead(poHead);

        StatusMaster openStatus = statusRepository.findByNameIgnoreCase("OPEN")
                .orElseGet(() -> {
                    StatusMaster s = new StatusMaster();
                    s.setName("Open");
                    return statusRepository.save(s);
                });
        head.setStatus(openStatus);
        head.setGrnNo(generateGrnNumber(ge.getDivision() != null ? ge.getDivision().getId() : null, LocalDate.now()));
        head.setCreatedBy(userId != null ? userId : "SYSTEM");
        head.setCreatedDate(new java.util.Date());

        // Step 5: Create GRN Transactions
        if (ge.getTransactions() != null && !ge.getTransactions().isEmpty()) {
            for (GateEntryTrans geTrans : ge.getTransactions()) {
                // Ignore zero/invalid quantities
                if (geTrans.getDeliveredQty() == null || geTrans.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                BigDecimal previousReceivedQty = transRepository.sumGrnQtyByGateEntryTransId(geTrans.getId());
                if (previousReceivedQty == null) previousReceivedQty = BigDecimal.ZERO;
                BigDecimal eligibleQty = geTrans.getDeliveredQty().subtract(previousReceivedQty);
                if (eligibleQty.compareTo(BigDecimal.ZERO) <= 0) {
                    continue; // Skip fully received items
                }

                GoodsReceiptTrans trans = new GoodsReceiptTrans();
                trans.setHead(head);
                trans.setGateEntryTrans(geTrans);
                trans.setPoTrans(geTrans.getPoTrans());
                trans.setPurchaseSchedule(geTrans.getPurchaseSchedule());
                trans.setItem(geTrans.getItem());
                trans.setUom(geTrans.getItem() != null ? geTrans.getItem().getUom() : null);

                BigDecimal price = BigDecimal.ZERO;
                if (geTrans.getPoTrans() != null && geTrans.getPoTrans().getUnitPrice() != null) {
                    price = geTrans.getPoTrans().getUnitPrice();
                }
                trans.setPrice(price);
                trans.setGrnQty(eligibleQty);
                trans.setCreatedBy(userId != null ? userId : "SYSTEM");
                trans.setCreatedDate(new java.util.Date());

                head.getTransactions().add(trans);
            }
        }

        if (head.getTransactions().isEmpty()) {
            throw new RuntimeException("No valid items with delivered quantity > 0 found in Gate Entry.");
        }

        head = headRepository.save(head);
        if (head.getGateEntryHead() != null) {
            updateGateEntryStatus(head.getGateEntryHead());
        }
        return mapToDto(head);
    }

    private String generateGrnNumber(Long divisionId, LocalDate grnDate) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        if (grnDate != null) {
            cal.setTime(java.sql.Date.valueOf(grnDate));
        }
        int year = cal.get(java.util.Calendar.YEAR);
        String currentAccountYear = year + "-" + (year + 1);

        com.autonoma.erp.model.admin.PrefixCredential cred = null;
        try {
            List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialRepository.findAll();
            cred = allCreds.stream()
                .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                .findFirst()
                .orElse(allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .findFirst().orElse(null));
        } catch (Exception e) {
            // ignore
        }

        if (cred == null || cred.getGrnPrefix() == null || cred.getGrnPrefix().trim().isEmpty()) {
            throw new RuntimeException("GRN Prefix Credentials not configured for Account Year " + currentAccountYear + ".");
        }

        String configuredPrefix = cred.getGrnPrefix().trim();
        String configuredSuffix = cred.getGrnSuffix() != null ? cred.getGrnSuffix().trim() : "";
        int digits = (cred.getGrnDigit() != null && cred.getGrnDigit() > 0) ? cred.getGrnDigit() : 6;

        String searchPattern = configuredPrefix + "%" + configuredSuffix;
        long nextSeq = headRepository.countByGrnNoLike(searchPattern) + 1;

        String formattedSeq = String.format("%0" + digits + "d", nextSeq);
        return configuredPrefix + formattedSeq + configuredSuffix;
    }

    // =====================================================
    // PREVIEW FROM GATE ENTRY (Transient DTO, not saved to DB)
    // =====================================================
    @Override
    @Transactional(readOnly = true)
    public GoodsReceiptHeadDTO previewFromGateEntry(Long gateEntryId, String userId) {
        GateEntryHead ge = gateEntryHeadRepository.findByIdWithDetails(gateEntryId)
                .orElseThrow(() -> new RuntimeException("Gate Entry not found with ID: " + gateEntryId));

        String statusName = ge.getStatus() != null ? ge.getStatus().getName().toUpperCase() : "";
        if ("CANCELLED".equals(statusName) || "REJECTED".equals(statusName) || "CLOSED".equals(statusName) || "GRN_CREATED".equals(statusName) || "COMPLETED".equals(statusName) || ge.getGrnCreatedTime() != null) {
            throw new RuntimeException("Cannot create GRN for Gate Entry " + ge.getGateEntryNo() + " as it is already closed or processed.");
        }

        GoodsReceiptHeadDTO dto = new GoodsReceiptHeadDTO();
        dto.setId(null);
        dto.setGrnNo("AUTO-GENERATED ON SAVE");
        dto.setGrnDate(LocalDate.now());
        dto.setDivisionId(ge.getDivision() != null ? ge.getDivision().getId() : null);
        if (ge.getSupplier() != null) {
            dto.setSupplierId(ge.getSupplier().getId());
            dto.setSupplierName(ge.getSupplier().getLedgerName());
        }
        dto.setGateEntryHeadId(ge.getId());
        dto.setGateEntryNo(ge.getGateEntryNo());

        // Collect all unique PO numbers
        Set<String> poNos = new java.util.LinkedHashSet<>();
        if (ge.getTransactions() != null) {
            for (GateEntryTrans geTrans : ge.getTransactions()) {
                if (geTrans.getPoTrans() != null && geTrans.getPoTrans().getPurchaseOrderHead() != null) {
                    poNos.add(geTrans.getPoTrans().getPurchaseOrderHead().getPoNo());
                }
            }
        }
        dto.setPoNo(poNos.stream().filter(java.util.Objects::nonNull).collect(Collectors.joining(", ")));
        dto.setStatusName("OPEN");

        List<GoodsReceiptTransDTO> transDtos = new ArrayList<>();
        if (ge.getTransactions() != null) {
            for (GateEntryTrans geTrans : ge.getTransactions()) {
                if (geTrans.getDeliveredQty() == null || geTrans.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                
                BigDecimal previousReceivedQty = transRepository.sumGrnQtyByGateEntryTransId(geTrans.getId());
                if (previousReceivedQty == null) previousReceivedQty = BigDecimal.ZERO;
                BigDecimal eligibleQty = geTrans.getDeliveredQty().subtract(previousReceivedQty);
                if (eligibleQty.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                
                GoodsReceiptTransDTO tDto = new GoodsReceiptTransDTO();
                tDto.setGateEntryTransId(geTrans.getId());
                if (geTrans.getPoTrans() != null) {
                    tDto.setPoTransId(geTrans.getPoTrans().getId());
                    if (geTrans.getPoTrans().getUnitPrice() != null) {
                        tDto.setPrice(geTrans.getPoTrans().getUnitPrice());
                    }
                    if (geTrans.getPoTrans().getPurchaseOrderHead() != null) {
                        tDto.setPoNo(geTrans.getPoTrans().getPurchaseOrderHead().getPoNo());
                    }
                    tDto.setHsnCode(geTrans.getPoTrans().getHsnCode());
                    tDto.setTaxPercent(geTrans.getPoTrans().getTaxPercent());
                    tDto.setCgstPer(geTrans.getPoTrans().getCgstPer());
                    tDto.setSgstPer(geTrans.getPoTrans().getSgstPer());
                    tDto.setIgstPer(geTrans.getPoTrans().getIgstPer());
                }
                if (geTrans.getPurchaseSchedule() != null) {
                    tDto.setPurchaseScheduleId(geTrans.getPurchaseSchedule().getId());
                    if (geTrans.getPurchaseSchedule().getScheduleDate() != null) {
                        tDto.setScheduleDate(new java.sql.Date(geTrans.getPurchaseSchedule().getScheduleDate().getTime()).toLocalDate());
                    }
                }
                if (geTrans.getItem() != null) {
                    tDto.setItemId(geTrans.getItem().getId());
                    tDto.setItemCode(geTrans.getItem().getItemCode());
                    tDto.setItemName(geTrans.getItem().getItemName());
                    tDto.setIsExpiryItem(geTrans.getItem().getIsExpiryItem());
                    tDto.setUom(geTrans.getItem().getUom());
                }
                tDto.setGrnQty(eligibleQty);
                tDto.setEligibleQty(eligibleQty);
                tDto.setRemarks(geTrans.getRemarks());
                transDtos.add(tDto);
            }
        }
        if (transDtos.isEmpty()) {
            throw new RuntimeException("No valid items with delivered quantity > 0 found in Gate Entry.");
        }
        dto.setTransactions(transDtos);

        if (ge.getAttachments() != null) {
            dto.setAttachments(ge.getAttachments().stream().map(att -> {
                GoodsReceiptAttachmentDTO aDto = new GoodsReceiptAttachmentDTO();
                aDto.setFileName(att.getFileName());
                aDto.setFilePath(att.getFilePath());
                aDto.setFileSize(att.getFileSize());
                aDto.setMimeType(att.getMimeType());
                aDto.setAttachmentType("GATE_ENTRY");
                aDto.setActiveStatus(att.getActiveStatus());
                aDto.setServerFileName(att.getFilePath());
                aDto.setFileType(att.getMimeType());
                return aDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    // =====================================================
    // SEARCH (List API - paginated)
    // =====================================================
    @Override
    @Transactional(readOnly = true)
    public Page<GoodsReceiptListDTO> search(Long divisionId, String grnNo, LocalDate startDate, LocalDate endDate, Long supplierId, String poNo, Pageable pageable) {
        Page<GoodsReceiptHead> page = headRepository.search(divisionId, grnNo, startDate, endDate, supplierId, poNo, pageable);
        return page.map(this::mapToListDto);
    }

    // =====================================================
    // GET BY ID (Detail API - single fetch with JOIN FETCH)
    // =====================================================
    @Override
    public GoodsReceiptHeadDTO getById(Long id) {
        GoodsReceiptHead head = headRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("GRN not found"));
        return mapToDto(head);
    }

    @Autowired
    private com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository accountLedgerRepository;

    @Autowired
    private com.autonoma.erp.modules.master.organization.repository.DivisionRepository divisionRepository;

    @Autowired
    private com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository productMasterRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    // =====================================================
    // PREVIEW FROM PURCHASE ORDER (Direct GRN without Gate Entry)
    // =====================================================
    @Override
    @Transactional(readOnly = true)
    public GoodsReceiptHeadDTO previewFromPurchaseOrder(Long poHeadId, String userId) {
        PurchaseOrderHead po = poHeadRepository.findByIdWithDetails(poHeadId)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found with ID: " + poHeadId));

        GoodsReceiptHeadDTO dto = new GoodsReceiptHeadDTO();
        dto.setId(null);
        dto.setGrnNo("AUTO-GENERATED ON SAVE");
        dto.setGrnDate(LocalDate.now());
        dto.setDivisionId(po.getDivision() != null ? po.getDivision().getId() : null);
        if (po.getSupplier() != null) {
            dto.setSupplierId(po.getSupplier().getId());
            dto.setSupplierName(po.getSupplier().getLedgerName());
        }
        dto.setPoHeadId(po.getId());
        dto.setPoNo(po.getPoNo());
        dto.setGateEntryHeadId(null);
        dto.setGateEntryNo(null);
        dto.setStatusName("OPEN");

        List<GoodsReceiptTransDTO> transDtos = new ArrayList<>();
        if (po.getItems() != null) {
            for (PurchaseOrderTrans poTrans : po.getItems()) {
                if (poTrans.getQty() == null || poTrans.getQty().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                
                BigDecimal previousReceivedQty = transRepository.sumGrnQtyByPoTransId(poTrans.getId());
                if (previousReceivedQty == null) previousReceivedQty = BigDecimal.ZERO;

                BigDecimal eligibleQty = poTrans.getQty().subtract(previousReceivedQty);
                if (eligibleQty.compareTo(BigDecimal.ZERO) <= 0) {
                    continue; // skip fully received items
                }

                GoodsReceiptTransDTO tDto = new GoodsReceiptTransDTO();
                tDto.setPoTransId(poTrans.getId());
                if (poTrans.getUnitPrice() != null) {
                    tDto.setPrice(poTrans.getUnitPrice());
                }
                if (poTrans.getItem() != null) {
                    tDto.setItemId(poTrans.getItem().getId());
                    tDto.setItemCode(poTrans.getItem().getItemCode());
                    tDto.setItemName(poTrans.getItem().getItemName());
                    tDto.setIsExpiryItem(poTrans.getItem().getIsExpiryItem());
                    tDto.setUom(poTrans.getUom() != null ? poTrans.getUom() : poTrans.getItem().getUom());
                }

                tDto.setGrnQty(eligibleQty);
                tDto.setEligibleQty(eligibleQty);
                tDto.setRemarks(poTrans.getDescription());
                
                tDto.setPoNo(po.getPoNo());
                tDto.setHsnCode(poTrans.getHsnCode());
                tDto.setTaxPercent(poTrans.getTaxPercent());
                tDto.setCgstPer(poTrans.getCgstPer());
                tDto.setSgstPer(poTrans.getSgstPer());
                tDto.setIgstPer(poTrans.getIgstPer());
                transDtos.add(tDto);
            }
        }
        if (transDtos.isEmpty()) {
            throw new RuntimeException("No eligible items with pending PO quantity found for PO: " + po.getPoNo());
        }
        dto.setTransactions(transDtos);
        return dto;
    }

    // =====================================================
    // SAVE (Create or Update DRAFT GRN)
    // =====================================================
    @Override
    @Transactional
    public GoodsReceiptHeadDTO save(GoodsReceiptHeadDTO dto, String userId) {
        if (dto.getId() == null) {
            // Creating new GRN from preview/manual input
            GateEntryHead ge = null;
            if (dto.getGateEntryHeadId() != null) {
                ge = gateEntryHeadRepository.findByIdWithDetails(dto.getGateEntryHeadId())
                        .orElse(null);
            }

            GoodsReceiptHead head = new GoodsReceiptHead();
            if (ge != null) {
                head.setDivision(ge.getDivision());
                head.setSupplier(ge.getSupplier());
                head.setGateEntryHead(ge);

                // Gate Entry status will be evaluated and updated at the end of save
            } else {
                if (dto.getDivisionId() != null) {
                    head.setDivision(divisionRepository.findById(dto.getDivisionId()).orElse(null));
                }
                if (dto.getSupplierId() != null) {
                    head.setSupplier(accountLedgerRepository.findById(dto.getSupplierId()).orElse(null));
                }
            }

            head.setGrnDate(dto.getGrnDate() != null ? dto.getGrnDate() : LocalDate.now());
            head.setRemarks(dto.getRemarks());
            head.setDocumentType(dto.getDocumentType());
            head.setDocumentNo(dto.getDocumentNo());
            head.setDocumentDate(dto.getDocumentDate());

            // Set PO Head reference if present
            PurchaseOrderHead poHead = null;
            if (dto.getPoHeadId() != null) {
                poHead = poHeadRepository.findById(dto.getPoHeadId()).orElse(null);
            } else if (ge != null && ge.getTransactions() != null) {
                for (GateEntryTrans geTrans : ge.getTransactions()) {
                    if (geTrans.getPoTrans() != null && geTrans.getPoTrans().getPurchaseOrderHead() != null) {
                        poHead = geTrans.getPoTrans().getPurchaseOrderHead();
                        break;
                    }
                }
            }
            head.setPoHead(poHead);

            // Validate Prefix Credentials
            Long divId = head.getDivision() != null ? head.getDivision().getId() : dto.getDivisionId();
            head.setGrnNo(generateGrnNumber(divId, head.getGrnDate()));

            StatusMaster openStatus = statusRepository.findByNameIgnoreCase("OPEN")
                    .orElseGet(() -> {
                        StatusMaster s = new StatusMaster();
                        s.setName("Open");
                        return statusRepository.save(s);
                    });
            head.setStatus(openStatus);
            head.setCreatedBy(userId != null ? userId : "SYSTEM");
            head.setCreatedDate(new java.util.Date());

            if (dto.getTransactions() != null && !dto.getTransactions().isEmpty()) {
                for (GoodsReceiptTransDTO tDto : dto.getTransactions()) {
                    GateEntryTrans geTrans = null;
                    if (ge != null) {
                        if (tDto.getGateEntryTransId() != null) {
                            geTrans = ge.getTransactions().stream()
                                    .filter(gt -> gt.getId().equals(tDto.getGateEntryTransId()))
                                    .findFirst().orElse(null);
                        }
                        if (geTrans == null && tDto.getItemId() != null) {
                            geTrans = ge.getTransactions().stream()
                                    .filter(gt -> gt.getItem() != null && gt.getItem().getId().equals(tDto.getItemId()))
                                    .findFirst().orElse(null);
                        }
                    }

                    PurchaseOrderTrans poTrans = null;
                    if (tDto.getPoTransId() != null) {
                        poTrans = entityManager.find(PurchaseOrderTrans.class, tDto.getPoTransId());
                    } else if (geTrans != null) {
                        poTrans = geTrans.getPoTrans();
                    }

                    com.autonoma.erp.modules.npd.product.entity.ProductMaster item = null;
                    if (tDto.getItemId() != null) {
                        item = productMasterRepository.findById(tDto.getItemId()).orElse(null);
                    } else if (poTrans != null) {
                        item = poTrans.getItem();
                    } else if (geTrans != null) {
                        item = geTrans.getItem();
                    }

                    if (item == null) continue;

                    GoodsReceiptTrans trans = new GoodsReceiptTrans();
                    trans.setHead(head);
                    trans.setGateEntryTrans(geTrans);
                    trans.setPoTrans(poTrans);
                    trans.setItem(item);
                    trans.setUom(tDto.getUom() != null ? tDto.getUom() : item.getUom());

                    BigDecimal price = BigDecimal.ZERO;
                    if (tDto.getPrice() != null) {
                        price = tDto.getPrice();
                    } else if (poTrans != null && poTrans.getUnitPrice() != null) {
                        price = poTrans.getUnitPrice();
                    } else if (geTrans != null && geTrans.getPoTrans() != null && geTrans.getPoTrans().getUnitPrice() != null) {
                        price = geTrans.getPoTrans().getUnitPrice();
                    }
                    trans.setPrice(price);
                    trans.setGrnQty(tDto.getGrnQty() != null ? tDto.getGrnQty() : BigDecimal.ZERO);
                    trans.setRemarks(tDto.getRemarks());
                    trans.setCreatedBy(userId != null ? userId : "SYSTEM");
                    trans.setCreatedDate(new java.util.Date());

                    head.getTransactions().add(trans);
                }
            }

            if (head.getTransactions().isEmpty()) {
                throw new RuntimeException("No valid transaction lines found to save GRN.");
            }

            processAttachments(head, dto.getAttachments(), userId);

            head = headRepository.save(head);
            
            boolean batchUpdated = false;
            for (GoodsReceiptTrans trans : head.getTransactions()) {
                if (trans.getBatchNo() == null || trans.getBatchNo().trim().isEmpty()) {
                    trans.setBatchNo(head.getGrnNo() + "/" + trans.getId());
                    batchUpdated = true;
                }
            }
            if (batchUpdated) {
                head = headRepository.save(head);
            }
            
            updatePurchaseSchedulesForGrn(head);
            if (head.getGateEntryHead() != null) {
                updateGateEntryStatus(head.getGateEntryHead());
            }
            return mapToDto(head);
        }

        // Updating existing GRN
        GoodsReceiptHead head = headRepository.findByIdWithDetails(dto.getId())
                .orElseThrow(() -> new RuntimeException("GRN not found"));

        if (head.getStatus() != null && !("DRAFT".equalsIgnoreCase(head.getStatus().getName()) || "OPEN".equalsIgnoreCase(head.getStatus().getName()))) {
            throw new RuntimeException("Only DRAFT or OPEN GRN can be saved");
        }

        head.setRemarks(dto.getRemarks());
        head.setDocumentType(dto.getDocumentType());
        head.setDocumentNo(dto.getDocumentNo());
        head.setDocumentDate(dto.getDocumentDate());

        if (dto.getTransactions() != null) {
            for (GoodsReceiptTransDTO tDto : dto.getTransactions()) {
                GoodsReceiptTrans t = head.getTransactions().stream()
                        .filter(tx -> tx.getId().equals(tDto.getId()))
                        .findFirst().orElse(null);
                if (t != null) {
                    if (tDto.getGrnQty() == null || tDto.getGrnQty().compareTo(BigDecimal.ZERO) < 0) {
                        throw new RuntimeException("GRN Qty must be >= 0 for item " + t.getItem().getItemName());
                    }
                    t.setGrnQty(tDto.getGrnQty());
                    t.setRemarks(tDto.getRemarks());
                }
            }
            
            // Validate GRN qty against PO pending qty
            for (GoodsReceiptTrans t : head.getTransactions()) {
                if (t.getGrnQty() == null || t.getGrnQty().compareTo(BigDecimal.ZERO) <= 0) continue;
                if (t.getPoTrans() != null) {
                    BigDecimal pendingQty = t.getPoTrans().getPendingQty() != null ? t.getPoTrans().getPendingQty() : BigDecimal.ZERO;
                    if (t.getGrnQty().compareTo(pendingQty) > 0) {
                        String itemName = t.getItem() != null ? t.getItem().getItemName() : "Item";
                        throw new RuntimeException("GRN Qty (" + t.getGrnQty() + ") exceeds PO Pending Qty (" + pendingQty + ") for item: " + itemName);
                    }
                }
            }
        }

        processAttachments(head, dto.getAttachments(), userId);

        head = headRepository.save(head);
        
        boolean batchUpdated = false;
        for (GoodsReceiptTrans trans : head.getTransactions()) {
            if (trans.getBatchNo() == null || trans.getBatchNo().trim().isEmpty()) {
                trans.setBatchNo(head.getGrnNo() + "/" + trans.getId());
                batchUpdated = true;
            }
        }
        if (batchUpdated) {
            head = headRepository.save(head);
        }
        
        updatePurchaseSchedulesForGrn(head);
        if (head.getGateEntryHead() != null) {
            updateGateEntryStatus(head.getGateEntryHead());
        }
        return mapToDto(head);
    }


    private void processAttachments(GoodsReceiptHead head, List<GoodsReceiptAttachmentDTO> attachmentDtos, String userId) {
        if (attachmentDtos != null) {
            head.getAttachments().clear();
            for (GoodsReceiptAttachmentDTO aDto : attachmentDtos) {
                if ("GATE_ENTRY".equalsIgnoreCase(aDto.getAttachmentType())) {
                    continue; // Skip Gate Entry attachments, they are read-only and preserved in Gate Entry table
                }
                GoodsReceiptAttachment att = new GoodsReceiptAttachment();
                att.setGoodsReceiptHead(head);
                att.setFileName(aDto.getFileName());
                att.setFilePath(aDto.getFilePath() != null ? aDto.getFilePath() : aDto.getServerFileName());
                att.setFileSize(aDto.getFileSize());
                att.setMimeType(aDto.getMimeType() != null ? aDto.getMimeType() : aDto.getFileType());
                att.setAttachmentType(aDto.getAttachmentType() != null ? aDto.getAttachmentType() : "GRN");
                att.setActiveStatus(aDto.getActiveStatus() != null ? aDto.getActiveStatus() : 1);
                att.setCreatedBy(userId != null ? userId : "SYSTEM");
                att.setCreatedDate(new java.util.Date());
                head.getAttachments().add(att);
            }
        }
    }

    // =====================================================
    // POST GRN (Atomic: validate → batch gen → status update)
    // =====================================================
    @Override
    @Transactional
    public GoodsReceiptHeadDTO postGrn(Long id, String userId) {
        GoodsReceiptHead head = headRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("GRN not found"));

        String statusName = head.getStatus() != null ? head.getStatus().getName().toUpperCase() : "";

        if ("POSTED".equals(statusName)) {
            throw new RuntimeException("GRN is already POSTED. Cannot post again.");
        }
        if (!"DRAFT".equals(statusName) && !"APPROVED".equals(statusName) && !"OPEN".equals(statusName)) {
            throw new RuntimeException("GRN is not in a postable state. Current status: " + head.getStatus().getName());
        }

        head = headRepository.saveAndFlush(head);

        // Validate GRN qty against PO pending qty
        for (GoodsReceiptTrans t : head.getTransactions()) {
            if (t.getGrnQty() == null || t.getGrnQty().compareTo(BigDecimal.ZERO) <= 0) continue;
            if (t.getPoTrans() != null) {
                BigDecimal pendingQty = t.getPoTrans().getPendingQty() != null ? t.getPoTrans().getPendingQty() : BigDecimal.ZERO;
                if (t.getGrnQty().compareTo(pendingQty) > 0) {
                    String itemName = t.getItem() != null ? t.getItem().getItemName() : "Item";
                    throw new RuntimeException("GRN Qty (" + t.getGrnQty() + ") exceeds PO Pending Qty (" + pendingQty + ") for item: " + itemName);
                }
            }
        }

        java.util.Set<PurchaseOrderHead> affectedPoHeads = new java.util.HashSet<>();

        for (GoodsReceiptTrans t : head.getTransactions()) {
            if (t.getGrnQty() == null || t.getGrnQty().compareTo(BigDecimal.ZERO) <= 0) continue;

            // Generate batch number for all items: grnNo/transId
            String generatedBatch = head.getGrnNo() + "/" + t.getId();
            t.setBatchNo(generatedBatch);

            // Update Purchase Order item received and pending quantities
            if (t.getPoTrans() != null) {
                PurchaseOrderTrans poTrans = t.getPoTrans();
                BigDecimal currentReceived = poTrans.getReceivedQty() != null ? poTrans.getReceivedQty() : BigDecimal.ZERO;
                BigDecimal newReceived = currentReceived.add(t.getGrnQty());
                poTrans.setReceivedQty(newReceived);

                BigDecimal orderedQty = poTrans.getQty() != null ? poTrans.getQty() : BigDecimal.ZERO;
                BigDecimal newPending = orderedQty.subtract(newReceived);
                if (newPending.compareTo(BigDecimal.ZERO) < 0) {
                    newPending = BigDecimal.ZERO;
                }
                poTrans.setPendingQty(newPending);
                poTransRepository.save(poTrans);

                if (poTrans.getPurchaseOrderHead() != null) {
                    affectedPoHeads.add(poTrans.getPurchaseOrderHead());
                }

                // Distribute total received quantity across schedules (FIFO by scheduleDate/id)
                List<PurchaseSchedule> schedules = purchaseScheduleRepository.findByPoId(poTrans.getPurchaseOrderHead().getId()).stream()
                        .filter(s -> s.getPoItemId() != null && s.getPoItemId().equals(poTrans.getId()))
                        .sorted(java.util.Comparator.comparing(PurchaseSchedule::getScheduleDate, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()))
                                .thenComparing(PurchaseSchedule::getId))
                        .collect(Collectors.toList());

                BigDecimal totalReceivedForSchedules = transRepository.sumGrnQtyByPoTransId(poTrans.getId());
                if (totalReceivedForSchedules == null) totalReceivedForSchedules = BigDecimal.ZERO;
                
                BigDecimal remainingReceived = totalReceivedForSchedules;
                for (PurchaseSchedule schedule : schedules) {
                    BigDecimal scheduleQty = schedule.getScheduleQty() != null ? schedule.getScheduleQty() : BigDecimal.ZERO;
                    BigDecimal allocatedQty = remainingReceived.min(scheduleQty);
                    schedule.setReceiveQty(allocatedQty);
                    
                    if (allocatedQty.compareTo(scheduleQty) >= 0 && scheduleQty.compareTo(BigDecimal.ZERO) > 0) {
                        StatusMaster completedStatus = statusRepository.findByNameIgnoreCase("COMPLETED")
                                .orElseGet(() -> statusRepository.findByNameIgnoreCase("CLOSED").orElse(null));
                        if (completedStatus != null) {
                            schedule.setStatus(completedStatus);
                        }
                    } else {
                        StatusMaster pendingStatus = statusRepository.findByNameIgnoreCase("PENDING").orElse(null);
                        if (pendingStatus != null) {
                            schedule.setStatus(pendingStatus);
                        }
                    }

                    remainingReceived = remainingReceived.subtract(allocatedQty);
                    if (remainingReceived.compareTo(BigDecimal.ZERO) < 0) {
                        remainingReceived = BigDecimal.ZERO;
                    }
                }
                if (!schedules.isEmpty()) {
                    purchaseScheduleRepository.saveAll(schedules);
                }
            }
        }

        // Check each affected PO if fully received -> update PO status to CLOSED
        for (PurchaseOrderHead poHead : affectedPoHeads) {
            List<PurchaseOrderTrans> poItems = poTransRepository.findByPurchaseOrderHeadId(poHead.getId());
            boolean allCompleted = poItems != null && !poItems.isEmpty() && poItems.stream()
                    .allMatch(item -> item.getPendingQty() != null && item.getPendingQty().compareTo(BigDecimal.ZERO) <= 0);

            if (allCompleted) {
                StatusMaster closedStatus = statusRepository.findByNameIgnoreCase("CLOSED")
                        .orElseGet(() -> statusRepository.findByNameIgnoreCase("COMPLETED").orElse(null));
                if (closedStatus != null) {
                    poHead.setStatus(closedStatus);
                    poHeadRepository.save(poHead);
                }
            } else {
                StatusMaster partialStatus = statusRepository.findByNameIgnoreCase("PARTIALLY_RECEIVED")
                        .orElseGet(() -> statusRepository.findByNameIgnoreCase("PARTIAL").orElse(null));
                if (partialStatus != null) {
                    poHead.setStatus(partialStatus);
                    poHeadRepository.save(poHead);
                }
            }
        }

        if (head.getGateEntryHead() != null) {
            updateGateEntryStatus(head.getGateEntryHead());
        }

        StatusMaster postedStatus = statusRepository.findByNameIgnoreCase("POSTED")
                .orElseGet(() -> {
                    StatusMaster s = new StatusMaster();
                    s.setName("Posted");
                    return statusRepository.save(s);
                });
        head.setStatus(postedStatus);

        head = headRepository.save(head);
        return mapToDto(head);
    }

    // =====================================================
    // CANCEL GRN
    // =====================================================
    @Override
    @Transactional
    public GoodsReceiptHeadDTO cancelGrn(Long id, String userId) {
        throw new RuntimeException("Cancellation not fully implemented yet");
    }

    // =====================================================
    // DELETE GRN
    // =====================================================
    @Override
    @Transactional
    public void delete(Long id, String userId) {
        GoodsReceiptHead head = headRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("GRN not found with ID: " + id));

        if (head.getStatus() != null && !("DRAFT".equalsIgnoreCase(head.getStatus().getName()) || "OPEN".equalsIgnoreCase(head.getStatus().getName()))) {
            throw new RuntimeException("Only DRAFT or OPEN GRN can be deleted.");
        }

        GateEntryHead ge = head.getGateEntryHead();
        headRepository.delete(head);
        headRepository.flush();
        if (ge != null) {
            updateGateEntryStatus(ge);
        }
    }

    // =====================================================
    // MAPPING METHODS
    // =====================================================
    private GoodsReceiptListDTO mapToListDto(GoodsReceiptHead head) {
        GoodsReceiptListDTO dto = new GoodsReceiptListDTO();
        dto.setId(head.getId());
        dto.setGrnNo(head.getGrnNo());
        dto.setGrnDate(head.getGrnDate());
        if (head.getSupplier() != null) dto.setSupplierName(head.getSupplier().getLedgerName());

        Set<String> poNos = new java.util.LinkedHashSet<>();
        if (head.getPoHead() != null) poNos.add(head.getPoHead().getPoNo());
        try {
            if (org.hibernate.Hibernate.isInitialized(head.getTransactions()) && head.getTransactions() != null) {
                for (GoodsReceiptTrans trans : head.getTransactions()) {
                    if (trans.getPoTrans() != null && trans.getPoTrans().getPurchaseOrderHead() != null) {
                        poNos.add(trans.getPoTrans().getPurchaseOrderHead().getPoNo());
                    }
                }
            }
        } catch (Exception ignored) {
        }
        dto.setPoNo(poNos.stream().filter(java.util.Objects::nonNull).collect(Collectors.joining(", ")));

        if (head.getGateEntryHead() != null) dto.setGateEntryNo(head.getGateEntryHead().getGateEntryNo());
        dto.setStatusName(head.getStatus() != null ? head.getStatus().getName() : "");
        return dto;
    }

    private GoodsReceiptHeadDTO mapToDto(GoodsReceiptHead head) {
        GoodsReceiptHeadDTO dto = new GoodsReceiptHeadDTO();
        dto.setId(head.getId());
        dto.setDivisionId(head.getDivision() != null ? head.getDivision().getId() : null);
        dto.setGrnNo(head.getGrnNo());
        dto.setGrnDate(head.getGrnDate());
        dto.setRemarks(head.getRemarks());
        if (head.getSupplier() != null) {
            dto.setSupplierId(head.getSupplier().getId());
            dto.setSupplierName(head.getSupplier().getLedgerName());
        }

        dto.setDocumentType(head.getDocumentType());
        dto.setDocumentNo(head.getDocumentNo());
        dto.setDocumentDate(head.getDocumentDate());

        if (head.getGateEntryHead() != null) {
            dto.setGateEntryHeadId(head.getGateEntryHead().getId());
            dto.setGateEntryNo(head.getGateEntryHead().getGateEntryNo());
        }

        Set<String> poNos = new java.util.LinkedHashSet<>();
        if (head.getPoHead() != null) {
            dto.setPoHeadId(head.getPoHead().getId());
            poNos.add(head.getPoHead().getPoNo());
        }
        if (head.getTransactions() != null) {
            for (GoodsReceiptTrans trans : head.getTransactions()) {
                if (trans.getPoTrans() != null && trans.getPoTrans().getPurchaseOrderHead() != null) {
                    poNos.add(trans.getPoTrans().getPurchaseOrderHead().getPoNo());
                }
            }
        }
        dto.setPoNo(poNos.stream().filter(java.util.Objects::nonNull).collect(Collectors.joining(", ")));

        if (head.getGateEntryHead() != null) {
            dto.setGateEntryHeadId(head.getGateEntryHead().getId());
            dto.setGateEntryNo(head.getGateEntryHead().getGateEntryNo());
        }

        dto.setStatusId(head.getStatus() != null ? head.getStatus().getId() : null);
        dto.setStatusName(head.getStatus() != null ? head.getStatus().getName() : "");

        if (head.getTransactions() != null) {
            dto.setTransactions(head.getTransactions().stream().map(this::mapTransToDto).collect(Collectors.toList()));
        }
        
        List<GoodsReceiptAttachmentDTO> allAttachments = new ArrayList<>();
        try {
            if (org.hibernate.Hibernate.isInitialized(head.getAttachments()) && head.getAttachments() != null) {
                for (GoodsReceiptAttachment att : head.getAttachments()) {
                    GoodsReceiptAttachmentDTO aDto = new GoodsReceiptAttachmentDTO();
                    aDto.setId(att.getId());
                    aDto.setGoodsReceiptHeadId(head.getId());
                    aDto.setFileName(att.getFileName());
                    aDto.setFilePath(att.getFilePath());
                    aDto.setFileSize(att.getFileSize());
                    aDto.setMimeType(att.getMimeType());
                    aDto.setAttachmentType(att.getAttachmentType() != null ? att.getAttachmentType() : "GRN");
                    aDto.setActiveStatus(att.getActiveStatus());
                    aDto.setServerFileName(att.getFilePath());
                    aDto.setFileType(att.getMimeType());
                    allAttachments.add(aDto);
                }
            }
        } catch (Exception ignored) {
        }
        try {
            if (head.getGateEntryHead() != null && org.hibernate.Hibernate.isInitialized(head.getGateEntryHead().getAttachments()) && head.getGateEntryHead().getAttachments() != null) {
                for (com.autonoma.erp.model.purchase.gateentry.GateEntryAttachment att : head.getGateEntryHead().getAttachments()) {
                    GoodsReceiptAttachmentDTO aDto = new GoodsReceiptAttachmentDTO();
                    aDto.setId(att.getId());
                    aDto.setFileName(att.getFileName());
                    aDto.setFilePath(att.getFilePath());
                    aDto.setFileSize(att.getFileSize());
                    aDto.setMimeType(att.getMimeType());
                    aDto.setAttachmentType("GATE_ENTRY");
                    aDto.setActiveStatus(att.getActiveStatus());
                    aDto.setServerFileName(att.getFilePath());
                    aDto.setFileType(att.getMimeType());
                    allAttachments.add(aDto);
                }
            }
        } catch (Exception ignored) {
        }
        dto.setAttachments(allAttachments);
        return dto;
    }

    private GoodsReceiptTransDTO mapTransToDto(GoodsReceiptTrans t) {
        GoodsReceiptTransDTO dto = new GoodsReceiptTransDTO();
        dto.setId(t.getId());
        dto.setGrnHeadId(t.getHead().getId());
        dto.setItemId(t.getItem().getId());
        dto.setItemCode(t.getItem().getItemCode());
        dto.setItemName(t.getItem().getItemName());
        dto.setIsExpiryItem(t.getItem().getIsExpiryItem());
        dto.setUom(t.getUom());
        dto.setPrice(t.getPrice());
        dto.setGrnQty(t.getGrnQty());
        dto.setBatchNo(t.getBatchNo());
        dto.setRemarks(t.getRemarks());
        
        if (t.getPoTrans() != null) {
            dto.setPoNo(t.getPoTrans().getPurchaseOrderHead() != null ? t.getPoTrans().getPurchaseOrderHead().getPoNo() : null);
            dto.setHsnCode(t.getPoTrans().getHsnCode());
            dto.setTaxPercent(t.getPoTrans().getTaxPercent());
            dto.setCgstPer(t.getPoTrans().getCgstPer());
            dto.setSgstPer(t.getPoTrans().getSgstPer());
            dto.setIgstPer(t.getPoTrans().getIgstPer());
        } else if (t.getItem() != null) {
            dto.setHsnCode(t.getItem().getHsnCode());
        }

        // For now, eligibleQty can be passed separately or fetched in a bulk map if needed
        dto.setEligibleQty(BigDecimal.ZERO);
        return dto;
    }

    private void updatePurchaseSchedulesForGrn(GoodsReceiptHead head) {
        if (head.getTransactions() == null || head.getTransactions().isEmpty()) return;

        java.util.Set<PurchaseOrderHead> affectedPoHeads = new java.util.HashSet<>();

        for (GoodsReceiptTrans t : head.getTransactions()) {
            if (t.getGrnQty() == null || t.getGrnQty().compareTo(BigDecimal.ZERO) <= 0) continue;

            if (t.getPurchaseSchedule() != null) {
                PurchaseSchedule schedule = t.getPurchaseSchedule();
                BigDecimal totalReceivedForSchedule = transRepository.sumGrnQtyByPurchaseScheduleId(schedule.getId());
                if (totalReceivedForSchedule == null) totalReceivedForSchedule = BigDecimal.ZERO;

                schedule.setReceiveQty(totalReceivedForSchedule);
                BigDecimal scheduleQty = schedule.getScheduleQty() != null ? schedule.getScheduleQty() : BigDecimal.ZERO;
                
                if (totalReceivedForSchedule.compareTo(scheduleQty) >= 0 && scheduleQty.compareTo(BigDecimal.ZERO) > 0) {
                    StatusMaster completedStatus = statusRepository.findByNameIgnoreCase("COMPLETED")
                            .orElseGet(() -> statusRepository.findByNameIgnoreCase("CLOSED").orElse(null));
                    if (completedStatus != null) {
                        schedule.setStatus(completedStatus);
                    }
                } else {
                    StatusMaster pendingStatus = statusRepository.findByNameIgnoreCase("PENDING").orElse(null);
                    if (pendingStatus != null) {
                        schedule.setStatus(pendingStatus);
                    }
                }
                purchaseScheduleRepository.save(schedule);
                
                if (t.getPoTrans() != null && t.getPoTrans().getPurchaseOrderHead() != null) {
                    affectedPoHeads.add(t.getPoTrans().getPurchaseOrderHead());
                }
            } else if (t.getPoTrans() != null) {
                // Fallback to legacy FIFO if no schedule attached (backward compatibility)
                PurchaseOrderTrans poTrans = t.getPoTrans();
                BigDecimal totalReceived = transRepository.sumGrnQtyByPoTransId(poTrans.getId());
                if (totalReceived == null) totalReceived = BigDecimal.ZERO;
                
                if (poTrans.getPurchaseOrderHead() != null) {
                    affectedPoHeads.add(poTrans.getPurchaseOrderHead());
                }

                List<PurchaseSchedule> schedules = purchaseScheduleRepository.findByPoId(poTrans.getPurchaseOrderHead().getId()).stream()
                        .filter(s -> s.getPoItemId() != null && s.getPoItemId().equals(poTrans.getId()))
                        .sorted(java.util.Comparator.comparing(PurchaseSchedule::getScheduleDate, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()))
                                .thenComparing(PurchaseSchedule::getId))
                        .collect(Collectors.toList());

                BigDecimal remainingReceived = totalReceived;
                for (PurchaseSchedule schedule : schedules) {
                    BigDecimal scheduleQty = schedule.getScheduleQty() != null ? schedule.getScheduleQty() : BigDecimal.ZERO;
                    BigDecimal allocatedQty = remainingReceived.min(scheduleQty);
                    schedule.setReceiveQty(allocatedQty);
                    
                    if (allocatedQty.compareTo(scheduleQty) >= 0 && scheduleQty.compareTo(BigDecimal.ZERO) > 0) {
                        StatusMaster completedStatus = statusRepository.findByNameIgnoreCase("COMPLETED")
                                .orElseGet(() -> statusRepository.findByNameIgnoreCase("CLOSED").orElse(null));
                        if (completedStatus != null) {
                            schedule.setStatus(completedStatus);
                        }
                    } else {
                        StatusMaster pendingStatus = statusRepository.findByNameIgnoreCase("PENDING").orElse(null);
                        if (pendingStatus != null) {
                            schedule.setStatus(pendingStatus);
                        }
                    }

                    remainingReceived = remainingReceived.subtract(allocatedQty);
                    if (remainingReceived.compareTo(BigDecimal.ZERO) < 0) {
                        remainingReceived = BigDecimal.ZERO;
                    }
                    purchaseScheduleRepository.save(schedule);
                }
            }
        }

        // Check if all schedules for affected POs are completed
        for (PurchaseOrderHead poHead : affectedPoHeads) {
            List<PurchaseSchedule> allSchedules = purchaseScheduleRepository.findByPoId(poHead.getId());
            if (allSchedules != null && !allSchedules.isEmpty()) {
                boolean allCompleted = true;
                for (PurchaseSchedule sch : allSchedules) {
                    String sName = sch.getStatus() != null ? sch.getStatus().getName().toUpperCase() : "";
                    if (!"COMPLETED".equals(sName) && !"CLOSED".equals(sName)) {
                        allCompleted = false;
                        break;
                    }
                }
                if (allCompleted) {
                    StatusMaster closedStatus = statusRepository.findByNameIgnoreCase("CLOSED")
                            .orElseGet(() -> statusRepository.findByNameIgnoreCase("COMPLETED").orElse(null));
                    if (closedStatus != null) {
                        poHead.setStatus(closedStatus);
                        poHeadRepository.save(poHead);
                    }
                }
            }
        }
    }

    private void updateGateEntryStatus(GateEntryHead ge) {
        if (ge == null || ge.getTransactions() == null || ge.getTransactions().isEmpty()) return;
        
        boolean allCompleted = true;
        for (GateEntryTrans geTrans : ge.getTransactions()) {
            if (geTrans.getDeliveredQty() == null || geTrans.getDeliveredQty().compareTo(BigDecimal.ZERO) <= 0) continue;
            
            BigDecimal grnQty = transRepository.sumGrnQtyByGateEntryTransId(geTrans.getId());
            if (grnQty == null) grnQty = BigDecimal.ZERO;
            
            if (grnQty.compareTo(geTrans.getDeliveredQty()) < 0) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted) {
            StatusMaster closedGeStatus = statusRepository.findByNameIgnoreCase("CLOSED")
                    .orElseGet(() -> statusRepository.findByNameIgnoreCase("GRN_CREATED").orElse(null));
            if (closedGeStatus != null) {
                ge.setStatus(closedGeStatus);
            }
            ge.setGrnCreatedTime(java.time.LocalDateTime.now());
        } else {
            StatusMaster openStatus = statusRepository.findByNameIgnoreCase("OPEN")
                    .orElseGet(() -> statusRepository.findByNameIgnoreCase("APPROVED").orElse(null));
            if (openStatus != null) {
                ge.setStatus(openStatus);
            }
            ge.setGrnCreatedTime(null);
        }
        gateEntryHeadRepository.save(ge);
    }
}
