package com.autonoma.erp.modules.qmt.entity;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.hr.asset.entity.AssetGroup;
import com.autonoma.erp.modules.hr.asset.entity.AssetType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.Date;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "QMT_ASSET_MASTER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"assetGroup", "assetType", "supplier", "createdByRef", "updatedByRef", "criterialSpares"})
@EqualsAndHashCode(exclude = {"assetGroup", "assetType", "supplier", "createdByRef", "updatedByRef", "criterialSpares"})
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ASSET_GROUP_ID")
    private Long assetGroupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSET_GROUP_ID", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AssetGroup assetGroup;

    @Column(name = "ASSET_TYPE_ID")
    private Long assetTypeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSET_TYPE_ID", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AssetType assetType;

    @Column(name = "ASSET_ID", nullable = false, unique = true, length = 50)
    private String assetId;

    @Column(name = "ASSET_NAME", nullable = false, unique = true, length = 100)
    private String assetName;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "PRINT_NAME", length = 150)
    private String printName;

    @Column(name = "DIVISION")
    private Integer division;

    @Column(name = "UOM", length = 20)
    private String uom;

    @Column(name = "SEQ_NO")
    private Integer seqNo;

    @Column(name = "PURCHASE_RATE")
    private BigDecimal purchaseRate;

    @Column(name = "PRICE")
    private BigDecimal price;

    @Column(name = "SUPPLIER_ID")
    private Long supplierId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AccountLedger supplier;

    @Column(name = "SUPPLY_DATE")
    @Temporal(TemporalType.DATE)
    private Date supplyDate;

    @Column(name = "PURCHASE_YEAR")
    private Integer purchaseYear;

    @Column(name = "WARRANTY_AVAIL", nullable = false)
    private Boolean warrantyAvail = false;

    @Column(name = "WARRANTY_EXPIRY_DATE")
    @Temporal(TemporalType.DATE)
    private Date warrantyExpiryDate;

    @Column(name = "OWNER_TYPE", length = 50)
    private String ownerType;

    @Column(name = "OWNER_ID")
    private Long ownerId;

    @Column(name = "ASSET_SPEC", length = 500)
    private String assetSpec;

    @Column(name = "MODEL_NO", length = 100)
    private String modelNo;

    @Column(name = "SERIAL_NO", length = 100)
    private String serialNo;

    @Column(name = "CAPACITY", length = 100)
    private String capacity;

    @Column(name = "DIMENSION", length = 100)
    private String dimension;

    @Column(name = "POWER", length = 100)
    private String power;

    @Column(name = "HSN_CODE", length = 50)
    private String hsnCode;

    @Column(name = "SAC_CODE", length = 50)
    private String sacCode;

    @Column(name = "IP_ADDRESS", length = 50)
    private String ipAddress;

    @Column(name = "PORT_NO")
    private Integer portNo;

    @Column(name = "CALIBR_FREQUENCY", length = 50)
    private String calibrFrequency;

    @Column(name = "LAST_CALIBR_DATE")
    @Temporal(TemporalType.DATE)
    private Date lastCalibrDate;

    @Column(name = "NEXT_CALIBR_DATE")
    @Temporal(TemporalType.DATE)
    private Date nextCalibrDate;

    @Column(name = "AMC_FREQUENCY", length = 50)
    private String amcFrequency;

    @Column(name = "LAST_AMC_DATE")
    @Temporal(TemporalType.DATE)
    private Date lastAmcDate;

    @Column(name = "NEXT_AMC_DATE")
    @Temporal(TemporalType.DATE)
    private Date nextAmcDate;

    @Column(name = "DEPRECIATION_PERCENTAGE")
    private BigDecimal depreciationPercentage;

    @Column(name = "DEPRECIATION_METHOD", length = 50)
    private String depreciationMethod;

    @Column(name = "ASSET_LIFE", length = 50)
    private String assetLife;

    @Column(name = "OEE_REQ", nullable = false)
    private Boolean oeeReq = false;

    @Column(name = "MAKE", length = 100)
    private String make;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @OneToMany(mappedBy = "machine", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private List<MachineCriterialSpare> criterialSpares = new ArrayList<>();

    // Audit fields
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CREATED_BY", referencedColumnName = "USER_ID", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UserCredential createdByRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UPDATED_BY", referencedColumnName = "USER_ID", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UserCredential updatedByRef;

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String user = resolveCurrentUser();
        this.updatedBy = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public void addCriterialSpare(MachineCriterialSpare spare) {
        criterialSpares.add(spare);
        spare.setMachine(this);
    }

    public void removeCriterialSpare(MachineCriterialSpare spare) {
        criterialSpares.remove(spare);
        spare.setMachine(null);
    }
}
