package com.autonoma.erp.modules.sm.customer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerMasterListDto {
    private Long id;
    private String gstin;
    private String customerCode;
    private String customerName;
    private String invoiceName;
    private String shortName;
    private String address;
    private String pincode;
    private String city;
    private String state;
    private String country;
    private String dispatchMode;
    private String vendorCode;
    private String isoNumber;
    private String isoExpiry;
    private String ndaRequired;
    private String currency;
    private String segment;
    private String subSegment;
    private String paymentTerms;
    private String deliveryTerms;
    private String domainName;
    private String stateCode;
    private String status;
    private String distance;
    private String negotiateCustomer;
    private String dailyDispatchMail;
    private String createdBy;
    private java.util.Date createdDate;
    private String updatedBy;
    private java.util.Date updatedDate;
}
