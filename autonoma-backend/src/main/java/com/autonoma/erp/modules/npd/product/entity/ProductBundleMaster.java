package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.autonoma.erp.modules.npd.product.entity.NpdAttachmentPath;

@Entity
@Table(name = "NPD_PRODUCT_BUNDLE_MASTER")
@Data
@EqualsAndHashCode(callSuper = true, exclude = "details")
@ToString(exclude = "details")
@NoArgsConstructor
public class ProductBundleMaster extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "BUNDLE_CODE", unique = true, nullable = false, length = 100)
    private String bundleCode;

    @Column(name = "BUNDLE_NAME", nullable = false, length = 255)
    private String bundleName;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "BUNDLE_TYPE", length = 50)
    private String bundleType;

    @Column(name = "EFFECTIVE_FROM")
    private LocalDate effectiveFrom;

    @Column(name = "EFFECTIVE_TO")
    private LocalDate effectiveTo;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "bundleMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ProductBundleDetail> details = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "REF_ID", referencedColumnName = "ID", nullable = false, insertable = false, updatable = false)
    @org.hibernate.annotations.Where(clause = "PAGE_CODE = 'DD1112'")
    private List<NpdAttachmentPath> bundleAttachments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (isActive == null) isActive = true;
    }

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

    public java.time.LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(java.time.LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public java.time.LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(java.time.LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public java.util.List<ProductBundleDetail> getDetails() { return details; }
    public void setDetails(java.util.List<ProductBundleDetail> details) { this.details = details; }

    public java.util.List<NpdAttachmentPath> getBundleAttachments() { return bundleAttachments; }
    public void setBundleAttachments(java.util.List<NpdAttachmentPath> bundleAttachments) { this.bundleAttachments = bundleAttachments; }
}
