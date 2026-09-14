package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "SM_CUSTOMER_ORDER_HEADER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmCustomerOrderHeader extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ORDER_NO", nullable = false, length = 50)
    private String orderNo;

    @Column(name = "ORDER_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date orderDate;

    @Column(name = "ORDER_TYPE", length = 25)
    private String orderType;

    @Column(name = "ORDER_CATEGORY", length = 100)
    private String orderCategory;


    @Column(name = "ORDER_REC_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date orderRecDate;

    @Column(name = "PAYMENT_TERMS", length = 50)
    private String paymentTerms;

    @Column(name = "CURRENCY_CODE", length = 15)
    private String currencyCode;

    @Column(name = "EXCHANGE_RATE", length = 15)
    private String exchangeRate;



    @Column(name = "MODE_OF_DESPATCH", length = 20)
    private String modeOfDespatch;

    @Column(name = "SUPPLY_CONDITION", length = 30)
    private String supplyCondition;

    @Column(name = "DELIVERY_TERMS", length = 50)
    private String deliveryTerms;

    @Column(name = "CUST_ID")
    private Long custId;

    @Column(name = "BILL_CUST_ID")
    private Long billCustId;

    @Column(name = "BILL_ADDRESS", length = 250)
    private String billAddress;

    @Column(name = "SHIP_CUST_ID")
    private Long shipCustId;

    @Column(name = "SHIP_ADDRESS", length = 250)
    private String shipAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private StatusMaster statusMaster;

    @OneToMany(mappedBy = "orderHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<SmCustomerOrderDetail> orderDetails = new ArrayList<>();

    @OneToMany(mappedBy = "orderHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<SmCustomerOrderCharge> orderCharges = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public Date getOrderDate() { return orderDate; }
    public void setOrderDate(Date orderDate) { this.orderDate = orderDate; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public String getOrderCategory() { return orderCategory; }
    public void setOrderCategory(String orderCategory) { this.orderCategory = orderCategory; }
    public Date getOrderRecDate() { return orderRecDate; }
    public void setOrderRecDate(Date orderRecDate) { this.orderRecDate = orderRecDate; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(String exchangeRate) { this.exchangeRate = exchangeRate; }

    public String getModeOfDespatch() { return modeOfDespatch; }
    public void setModeOfDespatch(String modeOfDespatch) { this.modeOfDespatch = modeOfDespatch; }
    public String getSupplyCondition() { return supplyCondition; }
    public void setSupplyCondition(String supplyCondition) { this.supplyCondition = supplyCondition; }
    public String getDeliveryTerms() { return deliveryTerms; }
    public void setDeliveryTerms(String deliveryTerms) { this.deliveryTerms = deliveryTerms; }
    public Long getCustId() { return custId; }
    public void setCustId(Long custId) { this.custId = custId; }
    public Long getBillCustId() { return billCustId; }
    public void setBillCustId(Long billCustId) { this.billCustId = billCustId; }
    public String getBillAddress() { return billAddress; }
    public void setBillAddress(String billAddress) { this.billAddress = billAddress; }
    public Long getShipCustId() { return shipCustId; }
    public void setShipCustId(Long shipCustId) { this.shipCustId = shipCustId; }
    public String getShipAddress() { return shipAddress; }
    public void setShipAddress(String shipAddress) { this.shipAddress = shipAddress; }
    public StatusMaster getStatusMaster() { return statusMaster; }
    public void setStatusMaster(StatusMaster statusMaster) { this.statusMaster = statusMaster; }
    public List<SmCustomerOrderDetail> getOrderDetails() { return orderDetails; }
    public void setOrderDetails(List<SmCustomerOrderDetail> orderDetails) { this.orderDetails = orderDetails; }
    public List<SmCustomerOrderCharge> getOrderCharges() { return orderCharges; }
    public void setOrderCharges(List<SmCustomerOrderCharge> orderCharges) { this.orderCharges = orderCharges; }
}
