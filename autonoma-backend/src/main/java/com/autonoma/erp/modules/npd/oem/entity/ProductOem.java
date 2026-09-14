package com.autonoma.erp.modules.npd.oem.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_OEM")
@Getter
@Setter
public class ProductOem extends BaseAuditEntity {

    @Id
    @Column(name = "OEM_SHORT_NAME", nullable = false, length = 100)
    private String oemShortName;

    @Column(name = "OEM_PREFIX", length = 50)
    private String oemPrefix;

    @Column(name = "OEM_DESCRIPTION", length = Integer.MAX_VALUE)
    private String oemDescription;

    @Column(name = "ORIGIN_COUNTRY", length = 100)
    private String originCountry;

    @Column(name = "STATUS_YEAR", length = 100)
    private String statusYear;

    @Column(name = "STATUS", nullable = false)
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
    }

    public String getOemShortName() { return oemShortName; }
    public void setOemShortName(String oemShortName) { this.oemShortName = oemShortName; }
    public String getOemPrefix() { return oemPrefix; }
    public void setOemPrefix(String oemPrefix) { this.oemPrefix = oemPrefix; }
    public String getOemDescription() { return oemDescription; }
    public void setOemDescription(String oemDescription) { this.oemDescription = oemDescription; }
    public String getOriginCountry() { return originCountry; }
    public void setOriginCountry(String originCountry) { this.originCountry = originCountry; }
    public String getStatusYear() { return statusYear; }
    public void setStatusYear(String statusYear) { this.statusYear = statusYear; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
