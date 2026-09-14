package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath;

@Data
public class ProductBundleRequestDTO {
    private Long id;
    private String bundleCode;
    private String bundleName;
    private String description;
    private String bundleType;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean isActive;

    private List<ProductBundleDetailDTO> details;
    private List<NpdAttachmentPath> attachments;

    public ProductBundleRequestDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBundleCode() { return bundleCode; }
    public void setBundleCode(String bundleCode) { this.bundleCode = bundleCode; }

    public String getBundleName() { return bundleName; }
    public void setBundleName(String bundleName) { this.bundleName = bundleName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBundleType() { return bundleType; }
    public void setBundleType(String bundleType) { this.bundleType = bundleType; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<ProductBundleDetailDTO> getDetails() { return details; }
    public void setDetails(List<ProductBundleDetailDTO> details) { this.details = details; }

    public List<NpdAttachmentPath> getAttachments() { return attachments; }
    public void setAttachments(List<NpdAttachmentPath> attachments) { this.attachments = attachments; }
}
