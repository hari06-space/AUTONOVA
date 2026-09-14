package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/master/npd/product-master")
@CrossOrigin(origins = "*")
@Tag(name = "NPD - Product Master", description = "Endpoints for managing NPD Product Master")
public class ProductMasterController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ProductMasterController.class);

    @Autowired
    private ProductMasterRepository repository;

    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.autonoma.erp.modules.platform.docsearch.service.DocumentSearchService documentSearchService;

    @GetMapping
    @Operation(summary = "Get All Products", description = "Fetches a complete list of products")
    public List<ProductMaster> getAll() {
        log.info("Fetching all products");
        return repository.findAll();
    }

    @GetMapping("/list")
    @Operation(summary = "Get Product List (Lightweight)", description = "Fetches a lightweight DTO list for the Product Master table — no attachments or identifications")
    public List<com.autonoma.erp.modules.npd.product.dto.ProductMasterListDto> getList() {
        log.info("Fetching lightweight product list");
        return repository.findAllProjected();
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get Paginated Products", description = "Fetches a paginated and searchable list of products")
    public org.springframework.data.domain.Page<ProductMaster> getPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String itemGroup) {
        log.info("Fetching paginated products - page: {}, size: {}, search: {}, itemGroup: {}", page, size, search, itemGroup);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("itemName").ascending());
        return repository.findBySearch(search, itemGroup, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Product by ID", description = "Fetches a specific product by its ID")
    public ResponseEntity<ProductMaster> getById(@PathVariable Long id) {
        log.info("Fetching product ID: {}", id);
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/edit/{id}")
    @Operation(summary = "Get lightweight Product edit data", description = "Fetches a specific product flat DTO by its ID")
    public ResponseEntity<com.autonoma.erp.modules.npd.product.dto.ProductEditDto> getEditById(@PathVariable Long id) {
        log.info("Fetching lightweight product ID: {}", id);
        return repository.findById(id)
                .map(product -> ResponseEntity.ok(new com.autonoma.erp.modules.npd.product.dto.ProductEditDto(
                    product.getId(), product.getItemNo(), product.getItemName(), product.getItemCode()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3115", action = "write")
    @Operation(summary = "Create Product", description = "Creates a new product")
    public ResponseEntity<?> create(@RequestBody ProductMaster product) {
        log.info("Creating product: {}", product);
        
        String itemNo = product.getItemNo() != null ? product.getItemNo().trim() : "";
        String itemName = product.getItemName() != null ? product.getItemName().trim() : "";
        
        if (itemNo.isEmpty()) {
            return ResponseEntity.badRequest().body("Item No cannot be empty!");
        }
        if (itemName.isEmpty()) {
            return ResponseEntity.badRequest().body("Item Name cannot be empty!");
        }

        if (repository.findByItemNo(itemNo).isPresent()) {
            return ResponseEntity.badRequest().body("Item No already exists!");
        }

        product.setItemNo(itemNo);
        product.setItemName(itemName);
        
        if (product.getAttachments() != null) {
            product.getAttachments().forEach(attachment -> {
                attachment.setPageCode("M3115");
                attachment.setDocType("IMAGE");
                attachment.setCreatedBy(product.getCreatedBy() != null ? product.getCreatedBy() : "Admin");
            });
        }
        
        ProductMaster savedProduct = repository.save(product);

        // Sync attachments to Document Search with product ITEM_NO
        if (documentSearchService != null && savedProduct.getAttachments() != null) {
            for (com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath att : savedProduct.getAttachments()) {
                if (att.getPath() != null) {
                    documentSearchService.registerOrUpdateAttachment(
                            "NPD",
                            "M3115",
                            "NPD_ATTACHMENT_PATH",
                            att.getId() != null ? String.valueOf(att.getId()) : null,
                            savedProduct.getItemNo(),
                            att.getFileName(),
                            att.getPath()
                    );
                }
            }
            documentSearchService.triggerAsyncIndexing();
        }

        return ResponseEntity.ok(savedProduct);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3115", action = "write")
    @Operation(summary = "Update Product", description = "Updates an existing product")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProductMaster details) {
        log.info("Updating product ID {}: {}", id, details);

        String itemNo = details.getItemNo() != null ? details.getItemNo().trim() : "";
        String itemName = details.getItemName() != null ? details.getItemName().trim() : "";

        if (itemNo.isEmpty()) {
            return ResponseEntity.badRequest().body("Item No cannot be empty!");
        }
        if (itemName.isEmpty()) {
            return ResponseEntity.badRequest().body("Item Name cannot be empty!");
        }

        Optional<ProductMaster> existingByItemNo = repository.findByItemNo(itemNo);
        if (existingByItemNo.isPresent() && !existingByItemNo.get().getId().equals(id)) {
            return ResponseEntity.badRequest().body("Item No already exists!");
        }

        return repository.findById(id)
                .map(product -> {
                    org.springframework.beans.BeanUtils.copyProperties(details, product, "id", "createdBy", "createdDate", "attachments", "identifications");
                    product.setItemNo(itemNo);
                    product.setItemName(itemName);

                    if (details.getAttachments() != null) {
                        product.getAttachments().clear();
                        details.getAttachments().forEach(attachment -> {
                            attachment.setId(null);
                            attachment.setPageCode("M3115");
                            attachment.setDocType("IMAGE");
                            attachment.setCreatedBy(product.getUpdatedBy() != null ? product.getUpdatedBy() : "Admin");
                            product.getAttachments().add(attachment);
                        });
                    }

                    if (details.getIdentifications() != null) {
                        product.getIdentifications().clear();
                        details.getIdentifications().forEach(identification -> {
                            identification.setId(null);
                            identification.setCreatedBy(product.getUpdatedBy() != null ? product.getUpdatedBy() : "Admin");
                            product.getIdentifications().add(identification);
                        });
                    }

                    ProductMaster savedProduct = repository.save(product);

                    // Sync attachments to Document Search with product ITEM_NO
                    if (documentSearchService != null && savedProduct.getAttachments() != null) {
                        for (com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath att : savedProduct.getAttachments()) {
                            if (att.getPath() != null) {
                                documentSearchService.registerOrUpdateAttachment(
                                        "NPD",
                                        "M3115",
                                        "NPD_ATTACHMENT_PATH",
                                        att.getId() != null ? String.valueOf(att.getId()) : null,
                                        savedProduct.getItemNo(),
                                        att.getFileName(),
                                        att.getPath()
                                );
                            }
                        }
                        documentSearchService.triggerAsyncIndexing();
                    }

                    return ResponseEntity.ok(savedProduct);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3115", action = "delete")
    @Operation(summary = "Delete Product", description = "Deletes a product by its ID")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Deleting product ID: {}", id);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
