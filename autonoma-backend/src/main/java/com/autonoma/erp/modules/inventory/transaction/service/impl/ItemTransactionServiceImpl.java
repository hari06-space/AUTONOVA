package com.autonoma.erp.modules.inventory.transaction.service.impl;

import com.autonoma.erp.modules.inventory.transaction.dto.CurrentStockReportDto;
import com.autonoma.erp.modules.inventory.transaction.dto.ItemTransactionDto;
import com.autonoma.erp.modules.inventory.transaction.dto.StockLedgerReportDto;
import com.autonoma.erp.modules.inventory.transaction.entity.ItemTransaction;
import com.autonoma.erp.modules.inventory.transaction.repository.ItemTransactionRepository;
import com.autonoma.erp.modules.inventory.transaction.service.ItemTransactionService;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ItemTransactionServiceImpl implements ItemTransactionService {

    @Autowired
    private ItemTransactionRepository repository;

    @Autowired
    private ProductMasterRepository productRepository; // Using generic rep, assuming it exists based on BOS ERP
                                                       // structure

    @Override
    @Transactional
    public ItemTransactionDto createTransaction(ItemTransactionDto dto) {
        ItemTransaction entity = new ItemTransaction();
        BeanUtils.copyProperties(dto, entity, "id");

        // Ensure standard fields are populated
        if (entity.getQtyIn() == null)
            entity.setQtyIn(BigDecimal.ZERO);
        if (entity.getQtyOut() == null)
            entity.setQtyOut(BigDecimal.ZERO);
        if (entity.getPrice() == null)
            entity.setPrice(BigDecimal.ZERO);

        // Generate Transaction Number
        entity.setTransNo(generateTransactionNo(entity.getDivisionId(), entity.getTransType()));

        entity.setStatus("DRAFT");

        entity = repository.save(entity);
        return mapToDto(entity);
    }

    @Override
    @Transactional
    public ItemTransactionDto postTransaction(Long id) {
        ItemTransaction entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!"DRAFT".equals(entity.getStatus())) {
            throw new RuntimeException("Only DRAFT transactions can be posted.");
        }

        // Batch Validation (assuming isExpiryItem means batch controlled as a proxy, or
        // check logic based on requirements)
        ProductMaster product = productRepository.findById(entity.getProductId()).orElse(null);
        if (product != null && Boolean.TRUE.equals(product.getIsExpiryItem())
                && (entity.getBatchId() == null || entity.getBatchId().trim().isEmpty())) {
            throw new RuntimeException("Batch number is mandatory for this product.");
        }

        // Stock Validation
        if (entity.getQtyOut().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentStock = repository.findAvailableStock(entity.getDivisionId(), entity.getProductId());
            if (currentStock == null)
                currentStock = BigDecimal.ZERO;

            // Assume Negative stock is NOT allowed globally for now
            if (currentStock.subtract(entity.getQtyOut()).compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException(
                        "Insufficient stock. Available: " + currentStock + ", Requested: " + entity.getQtyOut());
            }
        }

        entity.setStatus("POSTED");
        entity = repository.save(entity);
        return mapToDto(entity);
    }

    @Override
    @Transactional
    public ItemTransactionDto cancelTransaction(Long id) {
        ItemTransaction original = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!"POSTED".equals(original.getStatus())) {
            throw new RuntimeException("Only POSTED transactions can be cancelled.");
        }

        // Create Reversal
        ItemTransaction reversal = new ItemTransaction();
        BeanUtils.copyProperties(original, reversal, "id", "transNo", "status", "createdDate", "createdBy",
                "updatedDate", "updatedBy");

        // Swap In and Out
        reversal.setQtyIn(original.getQtyOut());
        reversal.setQtyOut(original.getQtyIn());
        reversal.setTransNo(generateTransactionNo(original.getDivisionId(), original.getTransType()));
        reversal.setTransCategory(original.getTransCategory());
        reversal.setRemarks("Reversal for " + original.getTransNo());
        reversal.setStatus("POSTED");

        repository.save(reversal);

        // Mark original as cancelled
        original.setStatus("CANCELLED");
        repository.save(original);

        return mapToDto(original);
    }

    private String generateTransactionNo(Long divisionId, String transType) {
        String lastNo = repository.findLastTransactionNo(divisionId, transType);
        int nextSeq = 1;
        if (lastNo != null && lastNo.contains("-")) {
            try {
                String[] parts = lastNo.split("-");
                nextSeq = Integer.parseInt(parts[1]) + 1;
            } catch (Exception e) {
                // Ignore parsing errors, fallback to 1
            }
        }

        String prefix = transType != null && transType.length() >= 3 ? transType.substring(0, 3).toUpperCase() : "TRN";
        return String.format("%s-%06d", prefix, nextSeq);
    }

    @Override
    public ItemTransactionDto getTransactionById(Long id) {
        return repository.findById(id).map(this::mapToDto).orElse(null);
    }

    @Override
    public Page<ItemTransactionDto> getAllTransactions(Long divisionId, Pageable pageable) {
        return repository.findByDivisionId(divisionId, pageable).map(this::mapToDto);
    }

    @Override
    public Page<CurrentStockReportDto> getCurrentStockReport(Long productId, String inventoryType, Pageable pageable) {
        Specification<ProductMaster> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.or(
                    cb.notEqual(root.get("isActive"), false),
                    cb.isNull(root.get("isActive"))));

            if (productId != null) {
                predicates.add(cb.equal(root.get("id"), productId));
            }
            if (inventoryType != null && !inventoryType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("inventoryType"), inventoryType));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ProductMaster> productPage = productRepository.findAll(spec, pageable);

        if (productPage.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        List<Long> productIds = productPage.getContent().stream()
                .map(ProductMaster::getId)
                .collect(Collectors.toList());

        List<Map<String, Object>> divisionStocks = repository.getStockByProductIdsAndDivision(productIds);
        List<Map<String, Object>> productImages = productRepository.getProductImages(productIds);

        Map<Long, List<Map<String, Object>>> stockByProduct = divisionStocks.stream()
                .collect(Collectors.groupingBy(map -> (Long) map.get("productId")));

        Map<Long, String> imageByProduct = productImages.stream()
                .collect(Collectors.toMap(
                        map -> (Long) map.get("productId"),
                        map -> (String) map.get("path"),
                        (path1, path2) -> path1));

        List<CurrentStockReportDto> content = productPage.getContent().stream().map(product -> {
            CurrentStockReportDto dto = new CurrentStockReportDto();
            dto.setId(product.getId());
            dto.setInventoryType(product.getInventoryType());
            dto.setItemNo(product.getItemNo());
            dto.setItemName(product.getItemName());
            dto.setItemGroup(product.getItemGroup());
            dto.setItemCategory(product.getItemCategory());
            dto.setRackName(product.getRackName());
            dto.setBinName(product.getBinName());
            dto.setUom(product.getUom());
            dto.setProductImage(imageByProduct.get(product.getId()));

            List<Map<String, Object>> stocks = stockByProduct.getOrDefault(product.getId(), Collections.emptyList());

            BigDecimal totalStock = BigDecimal.ZERO;
            BigDecimal totalValue = BigDecimal.ZERO;

            for (Map<String, Object> rec : stocks) {
                Long divId = (Long) rec.get("divisionId");

                Number stockNum = (Number) rec.get("stock");
                BigDecimal stock = stockNum != null ? new BigDecimal(stockNum.toString()) : BigDecimal.ZERO;

                Number avgPriceNum = (Number) rec.get("avgPrice");
                BigDecimal avgPrice = avgPriceNum != null ? new BigDecimal(avgPriceNum.toString()) : BigDecimal.ZERO;

                BigDecimal divValue = stock.multiply(avgPrice);

                dto.getDivisionStocks().put(divId, stock);
                dto.getDivisionValues().put(divId, divValue);

                totalStock = totalStock.add(stock);
                totalValue = totalValue.add(divValue);
            }

            dto.setTotalStock(totalStock);
            dto.setTotalValue(totalValue);

            if (totalStock.compareTo(BigDecimal.ZERO) != 0) {
                dto.setAvgPrice(totalValue.divide(totalStock, 2, java.math.RoundingMode.HALF_UP));
            } else {
                dto.setAvgPrice(BigDecimal.ZERO);
            }

            return dto;
        }).collect(Collectors.toList());

        return new PageImpl<>(content, pageable, productPage.getTotalElements());
    }

    @Override
    public List<StockLedgerReportDto> getStockLedgerReport(Long divisionId, Long productId, LocalDate startDate,
            LocalDate endDate) {
        List<ItemTransaction> allTrans = repository.findLedgerByProduct(divisionId, productId);

        List<StockLedgerReportDto> report = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO;

        for (ItemTransaction trans : allTrans) {
            BigDecimal in = trans.getQtyIn() != null ? trans.getQtyIn() : BigDecimal.ZERO;
            BigDecimal out = trans.getQtyOut() != null ? trans.getQtyOut() : BigDecimal.ZERO;
            runningBalance = runningBalance.add(in).subtract(out);

            if ((startDate == null || !trans.getTransDate().isBefore(startDate)) &&
                    (endDate == null || !trans.getTransDate().isAfter(endDate))) {

                StockLedgerReportDto dto = new StockLedgerReportDto(
                        trans.getTransDate(),
                        trans.getTransNo(),
                        trans.getTransType(),
                        trans.getReferenceNo(),
                        in,
                        out,
                        runningBalance);
                report.add(dto);
            }
        }

        return report;
    }

    @Override
    public Page<ItemTransactionDto> getRejectionStockReport(Long divisionId, Pageable pageable) {
        return repository.findRejectionTransactions(divisionId, pageable).map(this::mapToDto);
    }

    @Override
    public Page<ItemTransactionDto> getStockMovementReport(Long divisionId, LocalDate startDate, LocalDate endDate,
            Pageable pageable) {
        return repository.findStockMovement(divisionId, startDate, endDate, pageable).map(this::mapToDto);
    }

    private ItemTransactionDto mapToDto(ItemTransaction entity) {
        ItemTransactionDto dto = new ItemTransactionDto();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }
}
