package com.autonoma.erp.modules.inventory.product360.service;

import com.autonoma.erp.modules.inventory.product360.dto.Product360SummaryDto;
import com.autonoma.erp.modules.inventory.product360.dto.ProductSearchDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface Product360Service {

    List<ProductSearchDto> searchProducts(String query, int limit);

    List<ProductSearchDto> searchProductsByImage(org.springframework.web.multipart.MultipartFile file);

    List<Map<String, Object>> getDivisions();

    Product360SummaryDto getProduct360Summary(Long productId, Long divisionId, LocalDate startDate, LocalDate endDate);

    List<Map<String, Object>> getRoutingCardsDrilldown(Long productId, Long divisionId);

    List<Map<String, Object>> getProcessWipDrilldown(Long productId, Long divisionId);

    List<Map<String, Object>> getMaterialShortageDrilldown(Long productId, Long divisionId);

    List<Map<String, Object>> getPurchasePipelineDrilldown(Long productId, Long divisionId, String pipelineType);

    List<Map<String, Object>> getQualityInspectionDrilldown(Long productId);

    List<Map<String, Object>> getReservationsDrilldown(Long productId, Long divisionId);

    List<Map<String, Object>> getStockDetailsDrilldown(Long productId, Long divisionId);

    List<Map<String, Object>> getBatchDetails(Long productId, Long divisionId);

    List<Map<String, Object>> getItemTransactions(Long productId, Long divisionId, LocalDate fromDate, LocalDate toDate, String transCategory);
}
