package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.dto.SalesPriceMasterDTO;
import com.autonoma.erp.modules.sm.sales.dto.UploadSummaryDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;

public interface SalesPriceMasterService {
    SalesPriceMasterDTO createPriceMaster(SalesPriceMasterDTO dto);
    SalesPriceMasterDTO updatePriceMaster(Long id, SalesPriceMasterDTO dto);
    SalesPriceMasterDTO getPriceMasterById(Long id);
    List<SalesPriceMasterDTO> getAllPriceMasters(
            String priceListType,
            Long customerId,
            String status,
            String verifyStatus,
            Date effectiveDate,
            String priceListNo,
            String globalSearch);
    void deletePriceMaster(Long id);
    SalesPriceMasterDTO verifyPriceMaster(Long id, String remarks);
    SalesPriceMasterDTO rejectPriceMaster(Long id, String remarks);
    Double getApplicablePrice(Long customerId, Long productId, Date date);
    byte[] downloadTemplate(String type);
    UploadSummaryDTO uploadExcel(String type, MultipartFile file);
    byte[] exportList(
            String format,
            String priceListType,
            Long customerId,
            String status,
            String verifyStatus,
            Date effectiveDate,
            String priceListNo,
            String globalSearch);
}
