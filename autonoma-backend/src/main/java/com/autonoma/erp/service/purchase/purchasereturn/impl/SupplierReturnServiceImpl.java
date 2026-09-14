package com.autonoma.erp.service.purchase.purchasereturn.impl;

import com.autonoma.erp.dto.purchase.common.TransactionLineDTO;
import com.autonoma.erp.dto.purchase.purchasereturn.PurchaseReturnHeadDTO;
import com.autonoma.erp.dto.purchase.purchasereturn.PurchaseReturnTransDTO;
import com.autonoma.erp.enums.SourceDocType;
import com.autonoma.erp.enums.TargetDocType;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.model.purchase.inspection.QualityInspection;
import com.autonoma.erp.model.purchase.purchasereturn.PurchaseReturnHead;
import com.autonoma.erp.model.purchase.purchasereturn.PurchaseReturnReason;
import com.autonoma.erp.model.purchase.purchasereturn.PurchaseReturnTrans;
import com.autonoma.erp.modules.inventory.transaction.dto.ItemTransactionDto;
import com.autonoma.erp.modules.inventory.transaction.service.ItemTransactionService;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.repository.purchase.inspection.QualityInspectionRepository;
import com.autonoma.erp.repository.purchase.purchasereturn.PurchaseReturnHeadRepository;
import com.autonoma.erp.service.purchase.common.ProcurementQuantityValidationService;
import com.autonoma.erp.service.purchase.purchasereturn.SupplierReturnService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class SupplierReturnServiceImpl implements SupplierReturnService {

    @Autowired
    private PurchaseReturnHeadRepository returnHeadRepo;

    @Autowired
    private QualityInspectionRepository qiRepo;

    @Autowired
    private StatusMasterRepository statusRepo;

    @Autowired
    private ProcurementQuantityValidationService validationService;

    @Autowired
    private ItemTransactionService itemTransactionService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<PurchaseReturnHeadDTO> getAllReturns(Long divisionId, Pageable pageable) {
        return Page.empty();
    }

    @Override
    public PurchaseReturnHeadDTO getReturnById(Long id) {
        PurchaseReturnHead head = returnHeadRepo.findById(id).orElseThrow(() -> new RuntimeException("Return not found"));
        return mapToDto(head);
    }

    @Override
    public PurchaseReturnHeadDTO generateFromQi(Long divisionId, String qiNo, String returnType) {
        Long grnId = Long.parseLong(qiNo);
        List<QualityInspection> qiLines = qiRepo.findByGrnId(grnId);
        if (qiLines.isEmpty()) {
            throw new RuntimeException("Quality Inspection not found");
        }
        QualityInspection qi = qiLines.get(0);
                
        List<Long> qiLineIds = qiLines.stream().map(QualityInspection::getId).toList();

        Map<Long, BigDecimal> remainingQties = validationService.getRemainingQuantities(
                SourceDocType.QUALITY_INSPECTION, TargetDocType.SUPPLIER_RETURN, qiLineIds, returnType);
        
        Map<Long, BigDecimal> processedQties = validationService.getProcessedQuantities(
                SourceDocType.QUALITY_INSPECTION, TargetDocType.SUPPLIER_RETURN, qiLineIds, returnType);

        PurchaseReturnHeadDTO dto = new PurchaseReturnHeadDTO();
        dto.setDivisionId(qi.getGrnTrans().getHead().getDivision().getId());
        dto.setSupplierId(qi.getGrnTrans().getHead().getSupplier().getId());
        dto.setSupplierName(qi.getGrnTrans().getHead().getSupplier().getLedgerName());
        dto.setGrnHeadId(qi.getGrnTrans().getHead().getId());
        dto.setGrnNo(qi.getGrnTrans().getHead().getGrnNo());
        dto.setPoHeadId(qi.getGrnTrans().getHead().getPoHead().getId());
        dto.setPoNo(qi.getGrnTrans().getHead().getPoHead().getPoNo());

        dto.setQiNo(grnId.toString());
        dto.setReturnType(returnType);
        dto.setReturnDate(LocalDateTime.now());

        List<PurchaseReturnTransDTO> transDtos = new ArrayList<>();
        for (QualityInspection qiLine : qiLines) {
            BigDecimal remaining = remainingQties.getOrDefault(qiLine.getId(), BigDecimal.ZERO);
            if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                PurchaseReturnTransDTO tDto = new PurchaseReturnTransDTO();
                tDto.setQiTransId(qiLine.getId());
                tDto.setGrnTransId(qiLine.getGrnTrans().getId());
                tDto.setPoTransId(qiLine.getGrnTrans().getPoTrans().getId());
                tDto.setItemId(qiLine.getGrnTrans().getItem().getId());
                tDto.setItemCode(qiLine.getGrnTrans().getItem().getItemCode());
                tDto.setItemName(qiLine.getGrnTrans().getItem().getItemName());
                tDto.setUom(qiLine.getGrnTrans().getUom());
                tDto.setBatchNo(qiLine.getGrnTrans().getBatchNo());
                tDto.setUnitPrice(qiLine.getGrnTrans().getPoTrans().getUnitPrice());
                tDto.setSourceQty("ACCEPTED_STOCK".equals(returnType) ? qiLine.getAcceptedQty() : qiLine.getRejectedQty());
                tDto.setPreviousReturnedQty(processedQties.getOrDefault(qiLine.getId(), BigDecimal.ZERO));
                tDto.setReturnQty(BigDecimal.ZERO);
                transDtos.add(tDto);
            }
        }
        dto.setTransactions(transDtos);
        return dto;
    }

    @Override
    @Transactional
    public PurchaseReturnHeadDTO saveReturn(PurchaseReturnHeadDTO dto, String username) {
        PurchaseReturnHead entity;
        if (dto.getId() != null) {
            entity = returnHeadRepo.findById(dto.getId()).orElseThrow(() -> new RuntimeException("Return not found"));
            if (!"DRAFT".equals(entity.getStatus().getName())) {
                throw new RuntimeException("Only DRAFT returns can be modified");
            }
        } else {
            entity = new PurchaseReturnHead();
            entity.setReturnType(dto.getReturnType());
            entity.setReturnDate(LocalDateTime.now());
            
            String returnNo = "PRT/" + LocalDateTime.now().getYear() + "/" + System.currentTimeMillis();
            entity.setReturnNo(returnNo);
            
            StatusMaster draftStatus = statusRepo.findByName("DRAFT")
                .orElseGet(() -> {
                    StatusMaster sm = new StatusMaster();
                    sm.setName("DRAFT");
                    return statusRepo.save(sm);
                });
            entity.setStatus(draftStatus);
        }
        
        BeanUtils.copyProperties(dto, entity, "id", "transactions", "status", "returnNo", "createdBy", "createdDate");
        entity.setCreatedBy(username);
        entity.setCreatedDate(new java.util.Date());
        entity.setUpdatedBy(username);
        entity.setUpdatedDate(new java.util.Date());
        
        Division div = new Division(); div.setId(dto.getDivisionId()); entity.setDivision(div);
        com.autonoma.erp.modules.master.commercial.entity.AccountLedger supp = new com.autonoma.erp.modules.master.commercial.entity.AccountLedger(); supp.setId(dto.getSupplierId()); entity.setSupplier(supp);
        com.autonoma.erp.model.purchase.grn.GoodsReceiptHead grn = new com.autonoma.erp.model.purchase.grn.GoodsReceiptHead(); grn.setId(dto.getGrnHeadId()); entity.setGrnHead(grn);
        com.autonoma.erp.model.PurchaseOrderHead po = new com.autonoma.erp.model.PurchaseOrderHead(); po.setId(dto.getPoHeadId()); entity.setPoHead(po);
        

        if (dto.getQiNo() != null) {
            entity.setQiNo(dto.getQiNo());
        }
        
        entity.getTransactions().clear();
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalAmt = BigDecimal.ZERO;
        
        for (PurchaseReturnTransDTO tDto : dto.getTransactions()) {
            if (tDto.getReturnQty() != null && tDto.getReturnQty().compareTo(BigDecimal.ZERO) > 0) {
                PurchaseReturnTrans tEntity = new PurchaseReturnTrans();
                BeanUtils.copyProperties(tDto, tEntity, "id");
                tEntity.setHead(entity);
                
                com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans gTrans = new com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans(); gTrans.setId(tDto.getGrnTransId()); tEntity.setGrnTrans(gTrans);
                com.autonoma.erp.model.PurchaseOrderTrans pTrans = new com.autonoma.erp.model.PurchaseOrderTrans(); pTrans.setId(tDto.getPoTransId()); tEntity.setPoTrans(pTrans);

                if (tDto.getQiTransId() != null) {
                    QualityInspection qiTrans = new QualityInspection();
                    qiTrans.setId(tDto.getQiTransId());
                    tEntity.setQiTrans(qiTrans);
                }
                ProductMaster item = new ProductMaster(); item.setId(tDto.getItemId()); tEntity.setItem(item);
                
                PurchaseReturnReason reason = new PurchaseReturnReason(); reason.setId(tDto.getReturnReasonId()); tEntity.setReturnReason(reason);
                
                tEntity.setAmount(tEntity.getReturnQty().multiply(tEntity.getUnitPrice()));
                
                tEntity.setCreatedBy(username);
                tEntity.setCreatedDate(new java.util.Date());
                
                entity.getTransactions().add(tEntity);
                totalQty = totalQty.add(tEntity.getReturnQty());
                totalAmt = totalAmt.add(tEntity.getAmount());
            }
        }
        
        if (entity.getTransactions().isEmpty()) {
            throw new RuntimeException("At least one item must have return quantity > 0");
        }
        
        entity.setTotalQty(totalQty);
        entity.setTotalAmount(totalAmt);
        
        List<TransactionLineDTO> requestedLines = new ArrayList<>();
        for (PurchaseReturnTransDTO t : dto.getTransactions()) {
            TransactionLineDTO tl = new TransactionLineDTO();
            tl.setSourceLineId(t.getQiTransId());
            tl.setRequestedQty(t.getReturnQty());
            tl.setCurrentDocumentTransId(t.getId());
            requestedLines.add(tl);
        }
        validationService.validateQuantities(SourceDocType.QUALITY_INSPECTION, TargetDocType.SUPPLIER_RETURN, requestedLines, entity.getReturnType());
        
        entity = returnHeadRepo.save(entity);
        return mapToDto(entity);
    }

    @Override
    @Transactional
    public PurchaseReturnHeadDTO postReturn(Long id, String username) {
        PurchaseReturnHead entity = returnHeadRepo.findById(id).orElseThrow(() -> new RuntimeException("Return not found"));
        
        if (!"DRAFT".equals(entity.getStatus().getName()) && !"APPROVED".equals(entity.getStatus().getName())) {
            throw new RuntimeException("Cannot post return with status: " + entity.getStatus().getName());
        }
        
        List<TransactionLineDTO> requestedLines = new ArrayList<>();
        for (PurchaseReturnTrans t : entity.getTransactions()) {
            TransactionLineDTO dummy = new TransactionLineDTO();
            dummy.setSourceLineId(t.getQiTrans().getId());
            dummy.setRequestedQty(t.getReturnQty());
            dummy.setCurrentDocumentTransId(t.getId());
            requestedLines.add(dummy);
        }
        
        validationService.validateQuantities(SourceDocType.QUALITY_INSPECTION, TargetDocType.SUPPLIER_RETURN, requestedLines, entity.getReturnType());
        
        StatusMaster postedStatus = statusRepo.findByName("POSTED")
            .orElseGet(() -> {
                StatusMaster sm = new StatusMaster();
                sm.setName("POSTED");
                return statusRepo.save(sm);
            });
            
        entity.setStatus(postedStatus);
        entity.setUpdatedBy(username);
        entity.setUpdatedDate(new java.util.Date());
        
        for (PurchaseReturnTrans line : entity.getTransactions()) {
            ItemTransactionDto itemTx = new ItemTransactionDto();
            itemTx.setProductId(line.getItem().getId());
            itemTx.setTransType("SUPPLIER_RETURN");
            itemTx.setTransNo(entity.getReturnNo());
            itemTx.setTransDate(entity.getReturnDate().toLocalDate());
            itemTx.setDivisionId(entity.getDivision().getId());
            itemTx.setBatchId(line.getBatchNo());
            itemTx.setUom(line.getUom());
            itemTx.setRemarks(line.getRemarks());
            
            if ("ACCEPTED_STOCK".equals(entity.getReturnType())) {
                itemTx.setQtyOut(line.getReturnQty());
                itemTx.setInventoryType("NORMAL");
                ItemTransactionDto created = itemTransactionService.createTransaction(itemTx);
                itemTransactionService.postTransaction(created.getId());
            } else if ("REJECTED_STOCK".equals(entity.getReturnType())) {
                itemTx.setQtyOut(line.getReturnQty());
                itemTx.setInventoryType("REJECTION");
                ItemTransactionDto created = itemTransactionService.createTransaction(itemTx);
                itemTransactionService.postTransaction(created.getId());
            }
        }
        
        return mapToDto(returnHeadRepo.save(entity));
    }

    @Override
    @Transactional
    public PurchaseReturnHeadDTO cancelReturn(Long id, String username) {
        PurchaseReturnHead entity = returnHeadRepo.findById(id).orElseThrow(() -> new RuntimeException("Return not found"));
        
        if ("CANCELLED".equals(entity.getStatus().getName())) {
            throw new RuntimeException("Return is already cancelled");
        }
        
        if ("POSTED".equals(entity.getStatus().getName())) {
            for (PurchaseReturnTrans line : entity.getTransactions()) {
                ItemTransactionDto itemTx = new ItemTransactionDto();
                itemTx.setProductId(line.getItem().getId());
                itemTx.setTransType("SUPPLIER_RETURN_CANCEL");
                itemTx.setTransNo(entity.getReturnNo() + "-CAN");
                itemTx.setTransDate(LocalDate.now());
                itemTx.setDivisionId(entity.getDivision().getId());
                itemTx.setBatchId(line.getBatchNo());
                itemTx.setUom(line.getUom());
                
                if ("ACCEPTED_STOCK".equals(entity.getReturnType())) {
                    itemTx.setQtyIn(line.getReturnQty());
                    itemTx.setInventoryType("NORMAL");
                    ItemTransactionDto created = itemTransactionService.createTransaction(itemTx);
                    itemTransactionService.postTransaction(created.getId());
                } else if ("REJECTED_STOCK".equals(entity.getReturnType())) {
                    itemTx.setQtyIn(line.getReturnQty());
                    itemTx.setInventoryType("REJECTION");
                    ItemTransactionDto created = itemTransactionService.createTransaction(itemTx);
                    itemTransactionService.postTransaction(created.getId());
                }
            }
        }
        
        StatusMaster cancelledStatus = statusRepo.findByName("CANCELLED")
            .orElseGet(() -> {
                StatusMaster sm = new StatusMaster();
                sm.setName("CANCELLED");
                return statusRepo.save(sm);
            });
            
        entity.setStatus(cancelledStatus);
        entity.setUpdatedBy(username);
        entity.setUpdatedDate(new java.util.Date());
        
        return mapToDto(returnHeadRepo.save(entity));
    }

    private PurchaseReturnHeadDTO mapToDto(PurchaseReturnHead entity) {
        PurchaseReturnHeadDTO dto = new PurchaseReturnHeadDTO();
        BeanUtils.copyProperties(entity, dto, "transactions", "division", "supplier", "grnHead", "poHead", "inspectionHead", "qiHead", "status");
        
        if (entity.getDivision() != null) dto.setDivisionId(entity.getDivision().getId());
        if (entity.getSupplier() != null) {
            dto.setSupplierId(entity.getSupplier().getId());
            dto.setSupplierName(entity.getSupplier().getLedgerName());
            dto.setSupplierCode(entity.getSupplier().getLedgerCode());
        }
        if (entity.getGrnHead() != null) {
            dto.setGrnHeadId(entity.getGrnHead().getId());
            dto.setGrnNo(entity.getGrnHead().getGrnNo());
        }
        if (entity.getPoHead() != null) {
            dto.setPoHeadId(entity.getPoHead().getId());
            dto.setPoNo(entity.getPoHead().getPoNo());
        }

        if (entity.getQiNo() != null) {
            dto.setQiNo(entity.getQiNo());
        }
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        
        List<PurchaseReturnTransDTO> tDtos = new ArrayList<>();
        if (entity.getTransactions() != null) {
            for (PurchaseReturnTrans t : entity.getTransactions()) {
                PurchaseReturnTransDTO tDto = new PurchaseReturnTransDTO();
                BeanUtils.copyProperties(t, tDto, "head", "grnTrans", "poTrans", "qiTrans", "item", "returnReason");
                tDto.setReturnHeadId(entity.getId());
                if (t.getGrnTrans() != null) tDto.setGrnTransId(t.getGrnTrans().getId());
                if (t.getPoTrans() != null) tDto.setPoTransId(t.getPoTrans().getId());
                if (t.getQiTrans() != null) tDto.setQiTransId(t.getQiTrans().getId());
                
                if (t.getItem() != null) {
                    tDto.setItemId(t.getItem().getId());
                    tDto.setItemCode(t.getItem().getItemCode());
                    tDto.setItemName(t.getItem().getItemName());
                }
                if (t.getReturnReason() != null) {
                    tDto.setReturnReasonId(t.getReturnReason().getId());
                    tDto.setReturnReasonName(t.getReturnReason().getName());
                }
                tDtos.add(tDto);
            }
        }
        dto.setTransactions(tDtos);
        
        return dto;
    }
}
