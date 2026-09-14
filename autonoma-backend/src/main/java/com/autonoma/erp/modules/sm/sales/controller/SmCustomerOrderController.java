package com.autonoma.erp.modules.sm.sales.controller;

import com.autonoma.erp.modules.sm.sales.dto.SmCustomerOrderHeaderDto;
import com.autonoma.erp.modules.sm.sales.service.SmCustomerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/sm/customer-orders")
public class SmCustomerOrderController {

    private final SmCustomerOrderService customerOrderService;

    @org.springframework.beans.factory.annotation.Autowired
    public SmCustomerOrderController(SmCustomerOrderService customerOrderService) {
        this.customerOrderService = customerOrderService;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody SmCustomerOrderHeaderDto dto) {
        SmCustomerOrderHeaderDto created = customerOrderService.createOrder(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @RequestBody SmCustomerOrderHeaderDto dto) {
        SmCustomerOrderHeaderDto updated = customerOrderService.updateOrder(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        SmCustomerOrderHeaderDto dto = customerOrderService.getOrderById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<Page<SmCustomerOrderHeaderDto>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(customerOrderService.getAllOrders(pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        customerOrderService.deleteOrder(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Order deleted successfully"));
    }

    @PutMapping("/{id}/line-items/approval")
    public ResponseEntity<?> updateLineItemsApproval(
            @PathVariable Long id,
            @RequestBody LineItemsApprovalRequest request) {
        customerOrderService.updateLineItemsApproval(id, request.getLineItemIds(), request.getStatus());
        return ResponseEntity.ok(Collections.singletonMap("message", "Line items approval updated successfully"));
    }

    public static class LineItemsApprovalRequest {
        private java.util.List<Long> lineItemIds;
        private String status;

        public java.util.List<Long> getLineItemIds() { return lineItemIds; }
        public void setLineItemIds(java.util.List<Long> lineItemIds) { this.lineItemIds = lineItemIds; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
