package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.dto.ProductBundleRequestDTO;
import com.autonoma.erp.modules.npd.product.entity.ProductBundleMaster;
import com.autonoma.erp.modules.npd.product.service.ProductBundleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-bundles")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductBundleController {

    @Autowired
    private ProductBundleService bundleService;

    @GetMapping
    public ResponseEntity<List<ProductBundleMaster>> getAllBundles() {
        return ResponseEntity.ok(bundleService.getAllBundles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductBundleMaster> getBundleById(@PathVariable Long id) {
        return ResponseEntity.ok(bundleService.getBundleById(id));
    }

    @PostMapping
    public ResponseEntity<ProductBundleMaster> createBundle(@RequestBody ProductBundleRequestDTO dto, 
                                                            @RequestHeader(value = "Username", defaultValue = "SYSTEM") String username) {
        return ResponseEntity.ok(bundleService.createBundle(dto, username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductBundleMaster> updateBundle(@PathVariable Long id, 
                                                            @RequestBody ProductBundleRequestDTO dto,
                                                            @RequestHeader(value = "Username", defaultValue = "SYSTEM") String username) {
        return ResponseEntity.ok(bundleService.updateBundle(id, dto, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBundle(@PathVariable Long id) {
        bundleService.deleteBundle(id);
        return ResponseEntity.ok().build();
    }
}
