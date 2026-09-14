package com.autonoma.erp.modules.sm.invoice.controller;

import com.autonoma.erp.modules.sm.invoice.dto.SmInvoiceHeaderDto;
import com.autonoma.erp.modules.sm.invoice.service.SmInvoiceService;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderHeader;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderHeaderRepository;
import com.autonoma.erp.modules.inventory.transaction.repository.ItemTransactionRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/sm/invoices")
public class SmInvoiceController {

    private final SmInvoiceService invoiceService;
    private final SmCustomerOrderHeaderRepository orderHeaderRepository;
    private final ProductMasterRepository productMasterRepository;
    private final ItemTransactionRepository itemTransactionRepository;

    public SmInvoiceController(
            SmInvoiceService invoiceService,
            SmCustomerOrderHeaderRepository orderHeaderRepository,
            ProductMasterRepository productMasterRepository,
            ItemTransactionRepository itemTransactionRepository) {
        this.invoiceService = invoiceService;
        this.orderHeaderRepository = orderHeaderRepository;
        this.productMasterRepository = productMasterRepository;
        this.itemTransactionRepository = itemTransactionRepository;
    }

    @GetMapping("/next-number")
    public ResponseEntity<Map<String, String>> getNextInvoiceNo(@RequestParam(required = false, defaultValue = "INVOICE") String docType) {
        try {
            String nextNo = invoiceService.generateDocNo(docType);
            Map<String, String> resp = new HashMap<>();
            resp.put("invoiceNo", nextNo);
            resp.put("docNo", nextNo);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody SmInvoiceHeaderDto dto) {
        try {
            SmInvoiceHeaderDto created = invoiceService.createInvoice(dto);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/from-dcs")
    public ResponseEntity<?> prepareInvoiceFromDcs(@RequestBody List<Long> dcIds) {
        try {
            SmInvoiceHeaderDto draft = invoiceService.prepareInvoiceFromDcs(dcIds);
            return ResponseEntity.ok(draft);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvoice(@PathVariable Long id, @RequestBody SmInvoiceHeaderDto dto) {
        try {
            SmInvoiceHeaderDto updated = invoiceService.updateInvoice(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        SmInvoiceHeaderDto dto = invoiceService.getInvoiceById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<Page<SmInvoiceHeaderDto>> getAllInvoices(
            @RequestParam(required = false, defaultValue = "INVOICE") String docType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(invoiceService.getAllInvoices(docType, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id) {
        try {
            invoiceService.deleteInvoice(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Invoice deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/already-invoiced/{orderLineId}")
    public ResponseEntity<Map<String, Object>> getAlreadyInvoiced(
            @PathVariable Long orderLineId,
            @RequestParam(required = false) Long excludeInvoiceId) {
        Integer quantity = invoiceService.getAlreadyInvoicedQuantity(orderLineId, excludeInvoiceId);
        Map<String, Object> response = new HashMap<>();
        response.put("orderLineId", orderLineId);
        response.put("alreadyInvoicedQty", quantity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}/open-orders")
    public ResponseEntity<?> getCustomerOpenOrders(@PathVariable Long customerId) {
        List<SmCustomerOrderHeader> orders = orderHeaderRepository.findByCustIdWithDetails(customerId);
        List<Map<String, Object>> openOrdersResponse = new ArrayList<>();

        for (SmCustomerOrderHeader order : orders) {
            List<Map<String, Object>> eligibleLines = new ArrayList<>();
            BigDecimal totalOrderAmount = BigDecimal.ZERO;

            for (SmCustomerOrderDetail detail : order.getOrderDetails()) {
                // Ignore inactive details
                if (Boolean.FALSE.equals(detail.getStatus())) {
                    continue;
                }

                Integer orderedQty = detail.getQty() != null ? detail.getQty() : 0;
                Integer alreadyInvoicedQty = invoiceService.getAlreadyInvoicedQuantity(detail.getId(), null);
                int balanceQty = orderedQty - alreadyInvoicedQty;

                BigDecimal price = detail.getPrice() != null ? detail.getPrice() : BigDecimal.ZERO;
                BigDecimal lineAmount = price.multiply(BigDecimal.valueOf(orderedQty));
                totalOrderAmount = totalOrderAmount.add(lineAmount);

                if (balanceQty > 0) {
                    Map<String, Object> lineMap = new HashMap<>();
                    lineMap.put("id", detail.getId());
                    lineMap.put("partNo", detail.getPartNo());
                    lineMap.put("partName", detail.getPartName());
                    lineMap.put("uom", detail.getUom());
                    lineMap.put("orderedQty", orderedQty);
                    lineMap.put("alreadyInvoicedQty", alreadyInvoicedQty);
                    lineMap.put("balanceQty", balanceQty);
                    lineMap.put("unitPrice", price);
                    lineMap.put("discountPer", detail.getDiscountPer() != null ? detail.getDiscountPer() : BigDecimal.ZERO);
                    lineMap.put("cgstPer", detail.getCgstPer() != null ? detail.getCgstPer() : BigDecimal.ZERO);
                    lineMap.put("sgstPer", detail.getSgstPer() != null ? detail.getSgstPer() : BigDecimal.ZERO);
                    lineMap.put("igstPer", detail.getIgstPer() != null ? detail.getIgstPer() : BigDecimal.ZERO);

                    // Fetch part details from master
                    Optional<ProductMaster> productOpt = productMasterRepository.findByItemNo(detail.getPartNo());
                    if (productOpt.isPresent()) {
                        ProductMaster product = productOpt.get();
                        lineMap.put("partId", product.getId());
                        lineMap.put("itemCategory", product.getItemCategory());
                        // Fetch available stock
                        BigDecimal stock = itemTransactionRepository.findAvailableStock(1L, product.getId());
                        lineMap.put("currentStock", stock != null ? stock : BigDecimal.ZERO);
                    } else {
                        lineMap.put("partId", null);
                        lineMap.put("itemCategory", null);
                        lineMap.put("currentStock", BigDecimal.ZERO);
                    }

                    eligibleLines.add(lineMap);
                }
            }

            if (!eligibleLines.isEmpty()) {
                Map<String, Object> orderMap = new HashMap<>();
                orderMap.put("id", order.getId());
                orderMap.put("orderNo", order.getOrderNo());
                orderMap.put("orderDate", order.getOrderDate());
                orderMap.put("customerPo", order.getOrderNo()); // Ref no / PO
                orderMap.put("totalAmount", totalOrderAmount);
                orderMap.put("eligibleLines", eligibleLines);
                openOrdersResponse.add(orderMap);
            }
        }

        return ResponseEntity.ok(openOrdersResponse);
    }
}
