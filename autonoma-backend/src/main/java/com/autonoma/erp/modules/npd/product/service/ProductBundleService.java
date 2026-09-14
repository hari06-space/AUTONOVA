package com.autonoma.erp.modules.npd.product.service;

import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.modules.npd.product.dto.ProductBundleDetailDTO;
import com.autonoma.erp.modules.npd.product.dto.ProductBundleRequestDTO;
import com.autonoma.erp.modules.npd.product.entity.ProductBundleDetail;
import com.autonoma.erp.modules.npd.product.entity.ProductBundleMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath;
import com.autonoma.erp.modules.npd.product.repository.ProductBundleDetailRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductBundleMasterRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.npd.product.repository.NpdAttachmentPathRepository;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.autonoma.erp.service.admin.AuditTrailService;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductBundleService {

    @Autowired
    private ProductBundleMasterRepository bundleMasterRepository;

    @Autowired
    private ProductBundleDetailRepository bundleDetailRepository;

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @Autowired
    private PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private NpdAttachmentPathRepository attachmentPathRepository;

    @Autowired
    private AuditTrailService auditTrailService;

    public List<ProductBundleMaster> getAllBundles() {
        return bundleMasterRepository.findAll();
    }

    public ProductBundleMaster getBundleById(Long id) {
        return bundleMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product Bundle not found with id: " + id));
    }

    @Transactional
    public ProductBundleMaster createBundle(ProductBundleRequestDTO dto, String username) {
        ProductBundleMaster master = new ProductBundleMaster();
        
        // Generate Bundle Code if not provided
        if (dto.getBundleCode() == null || dto.getBundleCode().isEmpty()) {
            master.setBundleCode(generateBundleCode());
        } else {
            if (bundleMasterRepository.existsByBundleCode(dto.getBundleCode())) {
                throw new RuntimeException("Bundle Code already exists");
            }
            master.setBundleCode(dto.getBundleCode());
        }

        master.setBundleName(dto.getBundleName());
        master.setDescription(dto.getDescription());
        master.setBundleType(dto.getBundleType());
        master.setEffectiveFrom(dto.getEffectiveFrom());
        master.setEffectiveTo(dto.getEffectiveTo());
        master.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        master.setCreatedBy(username);

        List<ProductBundleDetail> details = mapDetails(dto.getDetails(), master, username);
        master.setDetails(details);

        if (dto.getAttachments() != null) {
            for (NpdAttachmentPath attachment : dto.getAttachments()) {
                attachment.setPageCode("DD1112");
                attachment.setCreatedBy(username);
            }
            master.getBundleAttachments().addAll(dto.getAttachments());
        }

        master = bundleMasterRepository.saveAndFlush(master);
        if (master.getBundleAttachments() != null) {
            for (NpdAttachmentPath attachment : master.getBundleAttachments()) {
                if (attachment.getId() != null) {
                    attachmentPathRepository.updateRefId(attachment.getId(), master.getId());
                }
            }
        }
        return master;
    }

    @Transactional
    public ProductBundleMaster updateBundle(Long id, ProductBundleRequestDTO dto, String username) {
        ProductBundleMaster master = getBundleById(id);

        master.setBundleName(dto.getBundleName());
        master.setDescription(dto.getDescription());
        master.setBundleType(dto.getBundleType());
        master.setEffectiveFrom(dto.getEffectiveFrom());
        master.setEffectiveTo(dto.getEffectiveTo());
        master.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : master.getIsActive());
        master.setUpdatedBy(username);

        // Capture old state for audit BEFORE merging
        String oldDetailsStr = master.getDetails().stream()
            .map(d -> {
                String itemNo = d.getProduct() != null ? d.getProduct().getItemNo() : "?";
                String qty = d.getQty() != null ? String.valueOf(d.getQty().intValue()) : "0";
                String rate = d.getBundleRate() != null ? String.valueOf(d.getBundleRate()) : "0";
                return itemNo + " | Qty: " + qty + " | Rate: " + rate;
            })
            .collect(Collectors.joining("; "));

        // Merge details — UPDATE existing rows in-place, INSERT new, DELETE removed
        List<ProductBundleDetailDTO> incomingDtos = dto.getDetails() != null ? dto.getDetails() : new ArrayList<>();

        // Build a map of existing details by productId for fast lookup
        java.util.Map<Long, ProductBundleDetail> existingByProductId = master.getDetails().stream()
            .filter(d -> d.getProduct() != null)
            .collect(java.util.stream.Collectors.toMap(
                d -> d.getProduct().getId(),
                d -> d,
                (a, b) -> a
            ));

        // Track which productIds are in the incoming request
        java.util.Set<Long> incomingProductIds = incomingDtos.stream()
            .map(ProductBundleDetailDTO::getProductId)
            .filter(java.util.Objects::nonNull)
            .collect(java.util.stream.Collectors.toSet());

        // Remove details whose product is no longer in the request
        master.getDetails().removeIf(d -> d.getProduct() == null || !incomingProductIds.contains(d.getProduct().getId()));

        for (ProductBundleDetailDTO dDto : incomingDtos) {
            if (dDto.getProductId() == null) continue;
            ProductBundleDetail existing = existingByProductId.get(dDto.getProductId());
            if (existing != null) {
                // UPDATE in-place — preserve ID, CREATED_BY, CREATED_DATE
                existing.setQty(dDto.getQty());
                existing.setNormalRate(dDto.getNormalRate());
                existing.setBundleRate(dDto.getBundleRate());
                existing.setDiscountPercent(dDto.getDiscountPercent());
                existing.setDiscountAmount(dDto.getDiscountAmount());
                existing.setIsActive(dDto.getIsActive() != null ? dDto.getIsActive() : Boolean.TRUE);
                existing.setUpdatedBy(username);
                existing.setUpdatedDate(new java.util.Date());
            } else {
                // INSERT new row
                ProductMaster product = productMasterRepository.findById(dDto.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + dDto.getProductId()));
                ProductBundleDetail newDetail = new ProductBundleDetail();
                newDetail.setBundleMaster(master);
                newDetail.setProduct(product);
                newDetail.setQty(dDto.getQty());
                newDetail.setNormalRate(dDto.getNormalRate());
                newDetail.setBundleRate(dDto.getBundleRate());
                newDetail.setDiscountPercent(dDto.getDiscountPercent());
                newDetail.setDiscountAmount(dDto.getDiscountAmount());
                newDetail.setIsActive(dDto.getIsActive() != null ? dDto.getIsActive() : Boolean.TRUE);
                newDetail.setCreatedBy(username);
                master.getDetails().add(newDetail);
            }
        }

        // Build new state string for audit
        String newDetailsStr = master.getDetails().stream()
            .map(d -> {
                String itemNo = d.getProduct() != null ? d.getProduct().getItemNo() : "?";
                String qty = d.getQty() != null ? String.valueOf(d.getQty().intValue()) : "0";
                String rate = d.getBundleRate() != null ? String.valueOf(d.getBundleRate()) : "0";
                return itemNo + " | Qty: " + qty + " | Rate: " + rate;
            })
            .collect(Collectors.joining("; "));

        if (!oldDetailsStr.equals(newDetailsStr)) {
            String prevVal = "- components: " + (oldDetailsStr.isEmpty() ? "(none)" : oldDetailsStr);
            String currVal = "+ components: " + (newDetailsStr.isEmpty() ? "(none)" : newDetailsStr);
            auditTrailService.saveAuditTrailAsync("UPDATE", "ProductBundleDetail", master.getId().toString(),
                    prevVal, currVal, "Updated Bundle Components", username, "Product Bundle Form");
        }

        // Update attachments
        if (!master.getBundleAttachments().isEmpty()) {
            master.getBundleAttachments().clear();
        }
        if (dto.getAttachments() != null) {
            for (NpdAttachmentPath attachment : dto.getAttachments()) {
                attachment.setId(null);
                attachment.setPageCode("DD1112");
                if (attachment.getCreatedBy() == null) {
                    attachment.setCreatedBy(username);
                } else {
                    attachment.setUpdatedBy(username);
                }
            }
            master.getBundleAttachments().addAll(dto.getAttachments());
        }

        master = bundleMasterRepository.saveAndFlush(master);
        if (master.getBundleAttachments() != null) {
            for (NpdAttachmentPath attachment : master.getBundleAttachments()) {
                if (attachment.getId() != null) {
                    attachmentPathRepository.updateRefId(attachment.getId(), master.getId());
                }
            }
        }
        return master;
    }

    @Transactional
    public void deleteBundle(Long id) {
        ProductBundleMaster master = getBundleById(id);
        bundleMasterRepository.delete(master);
    }

    private List<ProductBundleDetail> mapDetails(List<ProductBundleDetailDTO> detailDTOs, ProductBundleMaster master, String username) {
        List<ProductBundleDetail> details = new ArrayList<>();
        if (detailDTOs == null) return details;

        for (ProductBundleDetailDTO dDto : detailDTOs) {
            ProductMaster product = productMasterRepository.findById(dDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + dDto.getProductId()));

            ProductBundleDetail detail = new ProductBundleDetail();
            detail.setBundleMaster(master);
            detail.setProduct(product);
            detail.setQty(dDto.getQty());
            detail.setNormalRate(dDto.getNormalRate());
            detail.setBundleRate(dDto.getBundleRate());
            detail.setDiscountPercent(dDto.getDiscountPercent());
            detail.setDiscountAmount(dDto.getDiscountAmount());
            detail.setIsActive(dDto.getIsActive() != null ? dDto.getIsActive() : true);
            detail.setCreatedBy(username);

            details.add(detail);
        }
        return details;
    }

    private String generateBundleCode() {
        List<PrefixCredential> creds = prefixCredentialRepository.findAll();
        PrefixCredential cred = creds.stream().filter(c -> c.getStatus() == 1).findFirst().orElse(null);
        
        String prefix = "BNDL";
        int digit = 5;
        
        if (cred != null && cred.getProductBundlePrefix() != null) {
            prefix = cred.getProductBundlePrefix();
            if (cred.getProductBundleDigit() != null) {
                digit = cred.getProductBundleDigit();
            }
        }
        
        // Find max ID for generating sequence
        long count = bundleMasterRepository.count() + 1;
        String format = "%0" + digit + "d";
        return prefix + String.format(format, count);
    }
}
