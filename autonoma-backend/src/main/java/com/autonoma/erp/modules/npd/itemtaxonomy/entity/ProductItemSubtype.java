package com.autonoma.erp.modules.npd.itemtaxonomy.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_ITEM_SUBTYPE")
@Getter
@Setter
public class ProductItemSubtype extends BaseAuditEntity {

    @Id
    @Column(name = "SUB_TYPE", nullable = false, length = 100)
    private String subType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ITEM_TYPE", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private ProductItemType type;


    @Column(name = "SUB_ITEM_PREFIX", length = 50)
    private String subItemPrefix;

    @Column(name = "IS_AUTO_GENERATE_CODE", nullable = false, length = 10)
    private String isAutoGenerateCode = "YES";

    @Column(name = "PREFIX_BASED", nullable = false, length = 20)
    private String prefixBased = "SUB ITEM";

    @Column(name = "STATUS", nullable = false, columnDefinition = "BIT")
    private Integer status = 1;


    @Override
    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        super.onCreate();
        if (this.status == null) {
            this.status = 1;
        }
        if (this.isAutoGenerateCode == null) {
            this.isAutoGenerateCode = "YES";
        }
        if (this.prefixBased == null) {
            this.prefixBased = "SUB ITEM";
        }
    }

    public String getSubType() { return subType; }
    public void setSubType(String subType) { this.subType = subType; }
    public ProductItemType getType() { return type; }
    public void setType(ProductItemType type) { this.type = type; }
    public String getSubItemPrefix() { return subItemPrefix; }
    public void setSubItemPrefix(String subItemPrefix) { this.subItemPrefix = subItemPrefix; }
    public String getIsAutoGenerateCode() { return isAutoGenerateCode; }
    public void setIsAutoGenerateCode(String isAutoGenerateCode) { this.isAutoGenerateCode = isAutoGenerateCode; }
    public String getPrefixBased() { return prefixBased; }
    public void setPrefixBased(String prefixBased) { this.prefixBased = prefixBased; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
