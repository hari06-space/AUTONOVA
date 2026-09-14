package com.autonoma.erp.modules.npd.itemtaxonomy.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NPD_ITEM_TYPE")
@Data
@NoArgsConstructor
public class ProductItemType extends BaseAuditEntity {

    @Id
    @Column(name = "ITEM_TYPE", nullable = false, length = 100)
    private String itemType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "GROUP_NAME", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private ProductItemGroup group;

    @Column(name = "GROUP_PREFIX", length = 50)
    private String groupPrefix;

    @Column(name = "ITEM_PREFIX", length = 50)
    private String itemPrefix;

    @Column(name = "IS_AUTO_GENERATE_CODE", nullable = false, length = 10)
    private String isAutoGenerateCode = "NO";

    @Column(name = "PREFIX_BASED", nullable = false, length = 20)
    private String prefixBased = "GROUP";

    @Column(name = "STATUS", nullable = false, columnDefinition = "BIT")
    private Integer status = 1;

    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (status == null)
            status = 1;
        if (isAutoGenerateCode == null)
            isAutoGenerateCode = "NO";
        if (prefixBased == null)
            prefixBased = "GROUP";
    }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public ProductItemGroup getGroup() { return group; }
    public void setGroup(ProductItemGroup group) { this.group = group; }
    public String getGroupPrefix() { return groupPrefix; }
    public void setGroupPrefix(String groupPrefix) { this.groupPrefix = groupPrefix; }
    public String getItemPrefix() { return itemPrefix; }
    public void setItemPrefix(String itemPrefix) { this.itemPrefix = itemPrefix; }
    public String getIsAutoGenerateCode() { return isAutoGenerateCode; }
    public void setIsAutoGenerateCode(String isAutoGenerateCode) { this.isAutoGenerateCode = isAutoGenerateCode; }
    public String getPrefixBased() { return prefixBased; }
    public void setPrefixBased(String prefixBased) { this.prefixBased = prefixBased; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
