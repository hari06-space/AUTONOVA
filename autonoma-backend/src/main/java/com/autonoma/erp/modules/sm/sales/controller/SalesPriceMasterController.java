package com.autonoma.erp.modules.sm.sales.controller;

import com.autonoma.erp.modules.sm.sales.dto.SalesPriceMasterDTO;
import com.autonoma.erp.modules.sm.sales.dto.UploadSummaryDTO;
import com.autonoma.erp.modules.sm.sales.service.SalesPriceMasterService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/sales/price-master", "/api/sm/price-master"})
@CrossOrigin(origins = "*")
public class SalesPriceMasterController {

    @Autowired
    private SalesPriceMasterService priceMasterService;

    @GetMapping
    @RequirePagePermission(pageCode = "SM1130", action = "read")
    public List<SalesPriceMasterDTO> getAllPriceMasters(
            @RequestParam(required = false) String priceListType,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String verifyStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date effectiveDate,
            @RequestParam(required = false) String priceListNo,
            @RequestParam(required = false) String globalSearch) {
        return priceMasterService.getAllPriceMasters(
                priceListType, customerId, status, verifyStatus, effectiveDate, priceListNo, globalSearch);
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "SM1130", action = "read")
    public ResponseEntity<SalesPriceMasterDTO> getPriceMasterById(@PathVariable Long id) {
        return ResponseEntity.ok(priceMasterService.getPriceMasterById(id));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "SM1130", action = "write")
    public ResponseEntity<SalesPriceMasterDTO> createPriceMaster(@RequestBody SalesPriceMasterDTO dto) {
        return ResponseEntity.ok(priceMasterService.createPriceMaster(dto));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "SM1130", action = "write")
    public ResponseEntity<SalesPriceMasterDTO> updatePriceMaster(@PathVariable Long id, @RequestBody SalesPriceMasterDTO dto) {
        return ResponseEntity.ok(priceMasterService.updatePriceMaster(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "SM1130", action = "delete")
    public ResponseEntity<Void> deletePriceMaster(@PathVariable Long id) {
        priceMasterService.deletePriceMaster(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/verify")
    @RequirePagePermission(pageCode = "SM1130", action = "approval")
    public ResponseEntity<SalesPriceMasterDTO> verifyPriceMaster(
            @PathVariable Long id, 
            @RequestBody(required = false) Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : "";
        return ResponseEntity.ok(priceMasterService.verifyPriceMaster(id, remarks));
    }

    @PutMapping("/{id}/reject")
    @RequirePagePermission(pageCode = "SM1130", action = "approval")
    public ResponseEntity<SalesPriceMasterDTO> rejectPriceMaster(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : "";
        return ResponseEntity.ok(priceMasterService.rejectPriceMaster(id, remarks));
    }

    @GetMapping("/applicable-price")
    public ResponseEntity<Double> getApplicablePrice(
            @RequestParam(required = false) Long customerId,
            @RequestParam Long productId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        Double price = priceMasterService.getApplicablePrice(customerId, productId, date);
        return ResponseEntity.ok(price != null ? price : 0.0);
    }

    @GetMapping("/template")
    @RequirePagePermission(pageCode = "SM1130", action = "read")
    public ResponseEntity<byte[]> downloadTemplate(@RequestParam String type) {
        byte[] bytes = priceMasterService.downloadTemplate(type);
        String filename = "GENERAL_PRICE_LIST".equalsIgnoreCase(type) ? "General_Price_Template.xlsx" : "Customer_Contract_Template.xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    @PostMapping("/upload")
    @RequirePagePermission(pageCode = "SM1130", action = "write")
    public ResponseEntity<UploadSummaryDTO> uploadExcel(
            @RequestParam String type,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(priceMasterService.uploadExcel(type, file));
    }

    @GetMapping("/export")
    @RequirePagePermission(pageCode = "SM1130", action = "export")
    public ResponseEntity<byte[]> exportList(
            @RequestParam String format,
            @RequestParam(required = false) String priceListType,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String verifyStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date effectiveDate,
            @RequestParam(required = false) String priceListNo,
            @RequestParam(required = false) String globalSearch) {
        byte[] bytes = priceMasterService.exportList(
                format, priceListType, customerId, status, verifyStatus, effectiveDate, priceListNo, globalSearch);

        String ext = "EXCEL".equalsIgnoreCase(format) ? "xlsx" : "pdf";
        MediaType mediaType = "EXCEL".equalsIgnoreCase(format) ? MediaType.APPLICATION_OCTET_STREAM : MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Price_Master_Export." + ext)
                .contentType(mediaType)
                .body(bytes);
    }
}
