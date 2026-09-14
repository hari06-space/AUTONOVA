package com.autonoma.erp.modules.sm.sales.mapper;

import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMaster;
import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMasterDetail;
import com.autonoma.erp.modules.sm.sales.dto.SalesPriceMasterDTO;
import com.autonoma.erp.modules.sm.sales.dto.SalesPriceMasterDetailDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Component
public class SalesPriceMasterMapper {

    public SalesPriceMasterDTO toDTO(SalesPriceMaster entity) {
        if (entity == null) return null;
        SalesPriceMasterDTO dto = new SalesPriceMasterDTO();
        dto.setId(entity.getId());
        dto.setPriceListNo(entity.getPriceListNo());
        dto.setPriceListType(entity.getPriceListType());

        if (entity.getCustomer() != null) {
            dto.setCustomerId(entity.getCustomer().getId());
            dto.setCustomerCode(entity.getCustomer().getCode());
            dto.setCustomerName(entity.getCustomer().getLedgerName());
        }
        if (entity.getCustomerGroup() != null) {
            dto.setCustomerGroupId(entity.getCustomerGroup().getId());
            dto.setCustomerGroupName(entity.getCustomerGroup().getGroupName());
        }
        if (entity.getPaymentTerms() != null) {
            dto.setPaymentTermsId(entity.getPaymentTerms().getId());
            dto.setPaymentTermsCode(entity.getPaymentTerms().getTermCode());
            dto.setPaymentTermsName(entity.getPaymentTerms().getTermName());
        }

        dto.setReferenceNo(entity.getReferenceNo());
        dto.setEffectiveFrom(entity.getEffectiveFrom());
        dto.setEffectiveTo(entity.getEffectiveTo());
        dto.setExchangeRate(entity.getExchangeRate());
        dto.setStatus(entity.getStatus());
        dto.setVerifyStatus(entity.getVerifyStatus() != null ? entity.getVerifyStatus().getName() : null);
        dto.setVerifyRejComments(entity.getVerifyRejComments());
        dto.setRemarks(entity.getRemarks());

        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setUpdatedDate(entity.getUpdatedDate());
        dto.setVerifiedBy(entity.getVerifiedBy());
        dto.setAttachments(entity.getAttachments());
        dto.setVerifiedDate(entity.getVerifiedDate());

        if (entity.getDetails() != null) {
            dto.setDetails(entity.getDetails().stream().map(this::toDetailDTO).collect(Collectors.toList()));
        } else {
            dto.setDetails(new ArrayList<>());
        }

        return dto;
    }

    public SalesPriceMasterDetailDTO toDetailDTO(SalesPriceMasterDetail detail) {
        if (detail == null) return null;
        SalesPriceMasterDetailDTO dto = new SalesPriceMasterDetailDTO();
        dto.setId(detail.getId());
        if (detail.getProduct() != null) {
            dto.setProductId(detail.getProduct().getId());
            dto.setProductCode(detail.getProduct().getItemNo());
            dto.setProductName(detail.getProduct().getItemName());
            dto.setUom(detail.getProduct().getUom() != null && !detail.getProduct().getUom().trim().isEmpty() ? detail.getProduct().getUom() : "NOS");
        }
        dto.setBasePrice(detail.getBasePrice());
        dto.setMinPrice(detail.getMinPrice());
        dto.setMaxPrice(detail.getMaxPrice());
        dto.setContractPrice(detail.getContractPrice());
        dto.setTargetQty(detail.getTargetQty());
        dto.setCurrency(detail.getCurrency());
        dto.setRemarks(detail.getRemarks());
        dto.setStatus(detail.getStatus());
        return dto;
    }
}
