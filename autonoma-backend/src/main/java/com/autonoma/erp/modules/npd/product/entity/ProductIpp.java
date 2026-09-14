package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NPD_PRODUCT_IPP")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class ProductIpp extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CUSTOMER_ID", nullable = false)
    private Long customerId;

    @Column(name = "CUSTOMER_NAME", length = 200)
    private String customerName;

    @Column(name = "CUSTOMER_GROUP", length = 200)
    private String customerGroup;

    @Column(name = "CUST_PART_NO", length = 100)
    private String custPartNo;

    @Column(name = "PART_NO", length = 100)
    private String partNo;

    @Column(name = "OEM_PART_NO", length = 100)
    private String oemPartNo;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerGroup() { return customerGroup; }
    public void setCustomerGroup(String customerGroup) { this.customerGroup = customerGroup; }
    public String getCustPartNo() { return custPartNo; }
    public void setCustPartNo(String custPartNo) { this.custPartNo = custPartNo; }
    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }
    public String getOemPartNo() { return oemPartNo; }
    public void setOemPartNo(String oemPartNo) { this.oemPartNo = oemPartNo; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

