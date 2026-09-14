package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMaster;
import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMasterDetail;
import com.autonoma.erp.modules.sm.sales.dto.SalesPriceMasterDTO;
import com.autonoma.erp.modules.sm.sales.dto.SalesPriceMasterDetailDTO;
import com.autonoma.erp.modules.sm.sales.dto.UploadSummaryDTO;
import com.autonoma.erp.modules.sm.sales.mapper.SalesPriceMasterMapper;
import com.autonoma.erp.modules.sm.sales.repository.SalesPriceMasterRepository;
import com.autonoma.erp.modules.sm.sales.repository.SalesPriceMasterDetailRepository;
import com.autonoma.erp.modules.sm.sales.repository.SalesAttachmentPathRepository;
import com.autonoma.erp.modules.sm.sales.specification.SalesPriceMasterSpecification;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.master.finance.ledgergroup.entity.LedgerGroup;
import com.autonoma.erp.modules.master.finance.ledgergroup.repository.LedgerGroupRepository;
import com.autonoma.erp.modules.master.commercial.entity.TermsMaster;
import com.autonoma.erp.modules.master.commercial.repository.TermsMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.itextpdf.text.Document;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Element;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfPCell;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SalesPriceMasterServiceImpl implements SalesPriceMasterService {

    @Autowired
    private SalesPriceMasterRepository priceMasterRepository;

    @Autowired
    private SalesPriceMasterDetailRepository priceMasterDetailRepository;

    @Autowired
    private SalesAttachmentPathRepository attachmentRepository;

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private AccountLedgerRepository accountLedgerRepository;

    @Autowired
    private LedgerGroupRepository ledgerGroupRepository;

    @Autowired
    private TermsMasterRepository termsMasterRepository;

    @Autowired
    private StatusMasterRepository statusMasterRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalesPriceMasterMapper mapper;

    @Autowired
    private PrefixCredentialRepository prefixCredentialRepository;

    @Override
    public SalesPriceMasterDTO createPriceMaster(SalesPriceMasterDTO dto) {
        SalesPriceMaster entity = new SalesPriceMaster();
        entity.setPriceListNo(generatePriceListNo(dto.getPriceListType()));
        mapDTOToEntity(dto, entity);

        String currentUserId = SecurityUtils.getCurrentUserId();
        String safeUser = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "admin";

        entity.setCreatedBy(safeUser);
        entity.setCreatedDate(new Date());

        StatusMaster pendingStatus = statusMasterRepository.findByNameIgnoreCase("Pending").orElse(null);
        entity.setVerifyStatus(pendingStatus);

        if (dto.getDetails() != null && !dto.getDetails().isEmpty()) {
            entity.getDetails().clear();
            for (SalesPriceMasterDetailDTO detailDTO : dto.getDetails()) {
                SalesPriceMasterDetail detail = new SalesPriceMasterDetail();
                detail.setPriceMaster(entity);
                detail.setBasePrice(detailDTO.getBasePrice());
                detail.setMinPrice(detailDTO.getMinPrice());
                detail.setMaxPrice(detailDTO.getMaxPrice());
                detail.setContractPrice(detailDTO.getContractPrice());
                detail.setTargetQty(detailDTO.getTargetQty());
                detail.setCurrency(detailDTO.getCurrency() != null ? detailDTO.getCurrency() : "INR");
                detail.setRemarks(detailDTO.getRemarks());
                detail.setStatus(detailDTO.getStatus() != null ? detailDTO.getStatus() : "ACTIVE");

                ProductMaster prod = null;
                if (detailDTO.getProductId() != null) {
                    prod = productMasterRepository.findById(detailDTO.getProductId()).orElse(null);
                } else if (detailDTO.getProductCode() != null) {
                    prod = productMasterRepository.findByItemNo(detailDTO.getProductCode()).orElse(null);
                }
                detail.setProduct(prod);
                detail.setCreatedBy(safeUser);
                detail.setCreatedDate(new Date());
                entity.getDetails().add(detail);
            }
        }

        deactivateOldPriceListItems(entity);
        SalesPriceMaster saved = priceMasterRepository.save(entity);

        List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> attachments = dto.getAttachments();
        if (attachments != null) {
            attachmentRepository.deleteByPageCodeAndRefId("SM1130", saved.getId());
            for (com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath att : attachments) {
                att.setId(null);
                att.setPageCode("SM1130");
                att.setRefId(saved.getId());
                attachmentRepository.save(att);
            }
            saved.setAttachments(attachments);
        }

        return mapper.toDTO(saved);
    }

    @Override
    public SalesPriceMasterDTO updatePriceMaster(Long id, SalesPriceMasterDTO dto) {
        SalesPriceMaster entity = priceMasterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Price Master not found"));

        if (entity.getVerifyStatus() != null && "Verified".equalsIgnoreCase(entity.getVerifyStatus().getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verified price list cannot be modified");
        }

        mapDTOToEntity(dto, entity);

        String currentUserId = SecurityUtils.getCurrentUserId();
        String safeUser = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "admin";

        entity.setUpdatedBy(safeUser);
        entity.setUpdatedDate(new Date());

        // Refresh details
        entity.getDetails().clear();
        if (dto.getDetails() != null) {
            for (SalesPriceMasterDetailDTO detailDTO : dto.getDetails()) {
                SalesPriceMasterDetail detail = new SalesPriceMasterDetail();
                detail.setPriceMaster(entity);
                detail.setBasePrice(detailDTO.getBasePrice());
                detail.setMinPrice(detailDTO.getMinPrice());
                detail.setMaxPrice(detailDTO.getMaxPrice());
                detail.setContractPrice(detailDTO.getContractPrice());
                detail.setTargetQty(detailDTO.getTargetQty());
                detail.setCurrency(detailDTO.getCurrency() != null ? detailDTO.getCurrency() : "INR");
                detail.setRemarks(detailDTO.getRemarks());
                detail.setStatus(detailDTO.getStatus() != null ? detailDTO.getStatus() : "ACTIVE");

                ProductMaster prod = null;
                if (detailDTO.getProductId() != null) {
                    prod = productMasterRepository.findById(detailDTO.getProductId()).orElse(null);
                } else if (detailDTO.getProductCode() != null) {
                    prod = productMasterRepository.findByItemNo(detailDTO.getProductCode()).orElse(null);
                }
                detail.setProduct(prod);
                detail.setCreatedBy(entity.getCreatedBy() != null ? entity.getCreatedBy() : safeUser);
                detail.setCreatedDate(entity.getCreatedDate() != null ? entity.getCreatedDate() : new Date());
                detail.setUpdatedBy(safeUser);
                detail.setUpdatedDate(new Date());
                entity.getDetails().add(detail);
            }
        }

        deactivateOldPriceListItems(entity);
        SalesPriceMaster saved = priceMasterRepository.save(entity);

        List<com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath> attachments = dto.getAttachments();
        if (attachments != null) {
            attachmentRepository.deleteByPageCodeAndRefId("SM1130", saved.getId());
            for (com.autonoma.erp.modules.sm.sales.entity.SalesAttachmentPath att : attachments) {
                att.setId(null);
                att.setPageCode("SM1130");
                att.setRefId(saved.getId());
                attachmentRepository.save(att);
            }
            saved.setAttachments(attachments);
        }

        return mapper.toDTO(saved);
    }

    private void deactivateOldPriceListItems(SalesPriceMaster entity) {
        List<SalesPriceMasterDetail> toDeactivate = new ArrayList<>();
        
        for (SalesPriceMasterDetail currentDetail : entity.getDetails()) {
            if ("INACTIVE".equalsIgnoreCase(currentDetail.getStatus()) || currentDetail.getProduct() == null) {
                continue;
            }
            
            List<SalesPriceMasterDetail> existingActive = new ArrayList<>();
            if ("CUSTOMER PRICE LIST".equalsIgnoreCase(entity.getPriceListType()) && entity.getCustomer() != null && entity.getCustomer().getId() != null) {
                existingActive = priceMasterDetailRepository.findActiveCustomerPriceDetails(
                    entity.getCustomer().getId(), currentDetail.getProduct().getId(), entity.getId()
                );
            } else if ("GENERAL PRICE LIST".equalsIgnoreCase(entity.getPriceListType())) {
                existingActive = priceMasterDetailRepository.findActiveGeneralPriceDetails(
                    currentDetail.getProduct().getId(), entity.getId()
                );
            }
            
            for (SalesPriceMasterDetail existing : existingActive) {
                existing.setStatus("INACTIVE");
                existing.setUpdatedBy(entity.getCreatedBy());
                existing.setUpdatedDate(new Date());
                toDeactivate.add(existing);
            }
        }
        
        if (!toDeactivate.isEmpty()) {
            priceMasterDetailRepository.saveAll(toDeactivate);
        }
    }

    @Override
    public SalesPriceMasterDTO getPriceMasterById(Long id) {
        SalesPriceMaster entity = priceMasterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Price Master not found"));
        entity.setAttachments(attachmentRepository.findByPageCodeAndRefId("SM1130", entity.getId()));
        return mapper.toDTO(entity);
    }

    @Override
    public List<SalesPriceMasterDTO> getAllPriceMasters(
            String priceListType,
            Long customerId,
            String status,
            String verifyStatus,
            Date effectiveDate,
            String priceListNo,
            String globalSearch) {

        Specification<SalesPriceMaster> spec = SalesPriceMasterSpecification.getSpecification(
                priceListType, customerId, status, verifyStatus, effectiveDate, priceListNo, globalSearch);

        return priceMasterRepository.findAll(spec)
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deletePriceMaster(Long id) {
        SalesPriceMaster entity = priceMasterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Price Master not found"));
        if (entity.getVerifyStatus() != null && "Verified".equalsIgnoreCase(entity.getVerifyStatus().getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verified price list cannot be deleted");
        }
        priceMasterRepository.delete(entity);
    }

    @Override
    public SalesPriceMasterDTO verifyPriceMaster(Long id, String remarks) {
        SalesPriceMaster entity = priceMasterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Price Master not found"));

        String currentUserId = SecurityUtils.getCurrentUserId();
        String safeUser = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "admin";

        StatusMaster verifiedStatus = statusMasterRepository.findByNameIgnoreCase("Verified").orElse(null);
        entity.setVerifyStatus(verifiedStatus);
        entity.setVerifyRejComments(remarks);
        entity.setVerifiedBy(safeUser);
        entity.setVerifiedDate(new Date());

        SalesPriceMaster saved = priceMasterRepository.save(entity);
        return mapper.toDTO(saved);
    }

    @Override
    public SalesPriceMasterDTO rejectPriceMaster(Long id, String remarks) {
        if (remarks == null || remarks.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification Remarks is mandatory for rejection");
        }

        SalesPriceMaster entity = priceMasterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Price Master not found"));

        String currentUserId = SecurityUtils.getCurrentUserId();
        String safeUser = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "admin";

        StatusMaster rejectedStatus = statusMasterRepository.findByNameIgnoreCase("Rejected").orElse(null);
        entity.setVerifyStatus(rejectedStatus);
        entity.setVerifyRejComments(remarks);
        entity.setVerifiedBy(safeUser);
        entity.setVerifiedDate(new Date());

        SalesPriceMaster saved = priceMasterRepository.save(entity);
        return mapper.toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getApplicablePrice(Long customerId, Long productId, Date date) {
        if (date == null) date = new Date();

        // 1. Priority 1: Check CUSTOMER PRICE CONTRACT for this specific customer
        if (customerId != null) {
            List<SalesPriceMaster> contracts = priceMasterRepository.findAll(
                    SalesPriceMasterSpecification.getSpecification(
                            "CUSTOMER PRICE LIST", customerId, "ACTIVE", "Verified", date, null, null)
            );
            for (SalesPriceMaster contract : contracts) {
                if (contract.getDetails() != null) {
                    for (SalesPriceMasterDetail d : contract.getDetails()) {
                        if (d.getProduct() != null && d.getProduct().getId().equals(productId) && "ACTIVE".equalsIgnoreCase(d.getStatus())) {
                            if (d.getContractPrice() != null && d.getContractPrice() > 0) {
                                return d.getContractPrice();
                            } else if (d.getBasePrice() != null && d.getBasePrice() > 0) {
                                return d.getBasePrice();
                            }
                        }
                    }
                }
            }
        }

        // 2. Priority 2: Check GENERAL PRICE LIST
        List<SalesPriceMaster> generalLists = priceMasterRepository.findAll(
                SalesPriceMasterSpecification.getSpecification(
                        "GENERAL PRICE LIST", null, "ACTIVE", "Verified", date, null, null)
        );
        for (SalesPriceMaster gen : generalLists) {
            if (gen.getDetails() != null) {
                for (SalesPriceMasterDetail d : gen.getDetails()) {
                    if (d.getProduct() != null && d.getProduct().getId().equals(productId) && "ACTIVE".equalsIgnoreCase(d.getStatus())) {
                        if (d.getBasePrice() != null && d.getBasePrice() > 0) {
                            return d.getBasePrice();
                        }
                    }
                }
            }
        }

        // 3. Priority 3: Check Product Master base price
        Optional<ProductMaster> productOpt = productMasterRepository.findById(productId);
        if (productOpt.isPresent()) {
            ProductMaster pm = productOpt.get();
            if (pm.getSellingRate() != null && pm.getSellingRate() > 0) {
                return pm.getSellingRate();
            }
        }

        // 4. Priority 4: Fallback to -1.0 to indicate price not mapped
        return -1.0;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadTemplate(String type) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Price Template");
            Row headerRow = sheet.createRow(0);

            String[] headers;
            if ("GENERAL PRICE LIST".equalsIgnoreCase(type)) {
                headers = new String[]{"Product Code", "Base Price", "Minimum Price", "Maximum Price", "Currency", "Remarks", "Status"};
            } else {
                headers = new String[]{"Product Code", "Contract Price", "Target Sales Qty", "Currency", "Remarks", "Status"};
            }

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build Excel template");
        }
    }

    @Override
    public UploadSummaryDTO uploadExcel(String type, MultipartFile file) {
        List<String> errors = new ArrayList<>();
        int totalRows = 0;
        int successCount = 0;
        int failedCount = 0;

        List<SalesPriceMasterDetailDTO> validDetails = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            if (rowIterator.hasNext()) {
                rowIterator.next(); // Skip header row
            }

            Set<String> seenProductCodes = new HashSet<>();

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                
                boolean isRowEmpty = true;
                for (int i = 0; i < Math.max(1, row.getLastCellNum()); i++) {
                    Cell c = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    if (c != null && !c.toString().trim().isEmpty()) {
                        isRowEmpty = false;
                        break;
                    }
                }
                if (isRowEmpty) {
                    continue; // Skip empty rows silently
                }
                
                totalRows++;

                try {
                    Cell productCodeCell = row.getCell(0);
                    if (productCodeCell == null || productCodeCell.toString().trim().isEmpty()) {
                        errors.add("Row " + (row.getRowNum() + 1) + ": Product Code is mandatory");
                        failedCount++;
                        continue;
                    }

                    String itemNo = productCodeCell.toString().trim();
                    if (seenProductCodes.contains(itemNo)) {
                        errors.add("Row " + (row.getRowNum() + 1) + ": Duplicate Product Code [" + itemNo + "] in Excel file");
                        failedCount++;
                        continue;
                    }
                    seenProductCodes.add(itemNo);

                    Optional<ProductMaster> prodOpt = productMasterRepository.findByItemNo(itemNo);
                    if (prodOpt.isEmpty()) {
                        errors.add("Row " + (row.getRowNum() + 1) + ": Invalid Product Code [" + itemNo + "]");
                        failedCount++;
                        continue;
                    }

                    ProductMaster product = prodOpt.get();

                    SalesPriceMasterDetailDTO d = new SalesPriceMasterDetailDTO();
                    d.setProductId(product.getId());
                    d.setProductCode(product.getItemNo());
                    d.setProductName(product.getItemName());
                    d.setUom(product.getUom());

                    if ("GENERAL PRICE LIST".equalsIgnoreCase(type)) {
                        Cell baseCell = row.getCell(1);
                        if (baseCell == null || getNumericValue(baseCell) <= 0) {
                            errors.add("Row " + (row.getRowNum() + 1) + ": Base Price must be greater than 0");
                            failedCount++;
                            continue;
                        }
                        
                        Double minP = getNumericValue(row.getCell(2));
                        Double maxP = getNumericValue(row.getCell(3));
                        
                        if (minP == null || minP <= 0) {
                            errors.add("Row " + (row.getRowNum() + 1) + ": Min Price is mandatory for General Price List");
                            failedCount++;
                            continue;
                        }
                        if (maxP == null || maxP <= 0) {
                            errors.add("Row " + (row.getRowNum() + 1) + ": Max Price is mandatory for General Price List");
                            failedCount++;
                            continue;
                        }

                        d.setBasePrice(getNumericValue(baseCell));
                        d.setMinPrice(minP);
                        d.setMaxPrice(maxP);
                        d.setCurrency(getStringValue(row.getCell(4), "INR"));
                        d.setRemarks(getStringValue(row.getCell(5), ""));
                        d.setStatus(getStringValue(row.getCell(6), "ACTIVE"));
                    } else {
                        Cell contractCell = row.getCell(1);
                        if (contractCell == null || getNumericValue(contractCell) <= 0) {
                            errors.add("Row " + (row.getRowNum() + 1) + ": Contract Price must be greater than 0");
                            failedCount++;
                            continue;
                        }
                        d.setContractPrice(getNumericValue(contractCell));
                        d.setTargetQty(getNumericValue(row.getCell(2)));
                        d.setCurrency(getStringValue(row.getCell(3), "INR"));
                        d.setRemarks(getStringValue(row.getCell(4), ""));
                        d.setStatus(getStringValue(row.getCell(5), "ACTIVE"));
                    }

                    validDetails.add(d);
                    successCount++;
                } catch (Exception ex) {
                    errors.add("Row " + (row.getRowNum() + 1) + ": " + ex.getMessage());
                    failedCount++;
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to parse Excel file: " + e.getMessage());
        }

        UploadSummaryDTO summary = new UploadSummaryDTO();
        summary.setTotalRows(totalRows);
        summary.setSuccessCount(successCount);
        summary.setFailedCount(failedCount);
        summary.setErrors(errors);
        summary.setRows(validDetails);

        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportList(
            String format,
            String priceListType,
            Long customerId,
            String status,
            String verifyStatus,
            Date effectiveDate,
            String priceListNo,
            String globalSearch) {

        List<SalesPriceMasterDTO> list = getAllPriceMasters(
                priceListType, customerId, status, verifyStatus, effectiveDate, priceListNo, globalSearch);

        if ("EXCEL".equalsIgnoreCase(format)) {
            return generateExcelReport(list);
        } else {
            return generatePdfReport(list);
        }
    }

    private String generatePriceListNo(String type) {
        String prefix = "PL";
        String accountYear = "26-27";
        int digits = 3;

        try {
            List<PrefixCredential> allCreds = prefixCredentialRepository.findAll();
            PrefixCredential activeCred = allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .findFirst()
                    .orElse(null);

            if (activeCred != null) {
                if (activeCred.getAccountYear() != null && !activeCred.getAccountYear().trim().isEmpty()) {
                    accountYear = activeCred.getAccountYear();
                }
                if (activeCred.getPriceListDigit() != null) {
                    digits = activeCred.getPriceListDigit();
                }
                if ("GENERAL PRICE LIST".equalsIgnoreCase(type)) {
                    if (activeCred.getGplPrefix() != null && !activeCred.getGplPrefix().trim().isEmpty()) {
                        prefix = activeCred.getGplPrefix();
                    } else {
                        prefix = "GPL";
                    }
                } else {
                    if (activeCred.getCpcPrefix() != null && !activeCred.getCpcPrefix().trim().isEmpty()) {
                        prefix = activeCred.getCpcPrefix();
                    } else {
                        prefix = "CPC";
                    }
                }
            } else {
                prefix = "GENERAL PRICE LIST".equalsIgnoreCase(type) ? "GPL" : "CPC";
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch prefix credential: " + e.getMessage());
            prefix = "GENERAL PRICE LIST".equalsIgnoreCase(type) ? "GPL" : "CPC";
        }

        String finalPrefix = prefix + "/" + accountYear + "/";
        String prefixPattern = finalPrefix + "%";
        
        String lastPl = null;
        try {
            lastPl = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 PRICE_LIST_NO FROM SALES_PRICE_LIST_MASTER WHERE PRICE_LIST_NO LIKE ? ORDER BY ID DESC", 
                    String.class, prefixPattern);
        } catch (Exception e) {}
        
        long nextSeq = 1;
        if (lastPl != null) {
            try {
                String numStr = lastPl;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                nextSeq = Long.parseLong(numStr) + 1;
            } catch (Exception e) {}
        }

        return finalPrefix + String.format("%0" + digits + "d", nextSeq);
    }

    private void mapDTOToEntity(SalesPriceMasterDTO dto, SalesPriceMaster entity) {
        entity.setPriceListType(dto.getPriceListType());

        if (dto.getCustomerId() != null) {
            AccountLedger customer = accountLedgerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer not found"));
            entity.setCustomer(customer);
        } else {
            entity.setCustomer(null);
        }

        if (dto.getCustomerGroupId() != null) {
            LedgerGroup cg = ledgerGroupRepository.findById(dto.getCustomerGroupId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer Group not found"));
            entity.setCustomerGroup(cg);
        } else {
            entity.setCustomerGroup(null);
        }

        if (dto.getPaymentTermsId() != null) {
            TermsMaster pt = termsMasterRepository.findById(dto.getPaymentTermsId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment Terms not found"));
            entity.setPaymentTerms(pt);
        } else {
            entity.setPaymentTerms(null);
        }

        entity.setReferenceNo(dto.getReferenceNo());
        entity.setRemarks(dto.getRemarks());
        entity.setVerifyRejComments(dto.getVerifyRejComments());
        entity.setEffectiveFrom(dto.getEffectiveFrom());
        entity.setEffectiveTo(dto.getEffectiveTo());
        entity.setExchangeRate(dto.getExchangeRate() != null ? dto.getExchangeRate() : 1.0);
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");

        // Validate Effective Dates
        if (entity.getEffectiveTo() != null && entity.getEffectiveFrom() != null) {
            if (entity.getEffectiveTo().before(entity.getEffectiveFrom())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Effective To date cannot be earlier than Effective From date");
            }
        }
    }

    private Double getNumericValue(Cell cell) {
        if (cell == null) return 0.0;
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        try {
            return Double.parseDouble(cell.toString().trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String getStringValue(Cell cell, String fallback) {
        if (cell == null) return fallback;
        String val = cell.toString().trim();
        return val.isEmpty() ? fallback : val;
    }

    private byte[] generateExcelReport(List<SalesPriceMasterDTO> list) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Price Lists");
            Row header = sheet.createRow(0);

            String[] columns = {"Price List No", "Type", "Customer", "Customer Group", "Effective From", "Effective To", "Status", "Verify Status"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (SalesPriceMasterDTO dto : list) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(dto.getPriceListNo());
                row.createCell(1).setCellValue(dto.getPriceListType());
                row.createCell(2).setCellValue(dto.getCustomerName() != null ? dto.getCustomerName() : "N/A");
                row.createCell(3).setCellValue(dto.getCustomerGroupName() != null ? dto.getCustomerGroupName() : "N/A");
                row.createCell(4).setCellValue(dto.getEffectiveFrom() != null ? dto.getEffectiveFrom().toString() : "");
                row.createCell(5).setCellValue(dto.getEffectiveTo() != null ? dto.getEffectiveTo().toString() : "");
                row.createCell(6).setCellValue(dto.getStatus());
                row.createCell(7).setCellValue(dto.getVerifyStatus());
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to export Excel report");
        }
    }

    private byte[] generatePdfReport(List<SalesPriceMasterDTO> list) {
        try {
            Document document = new Document(PageSize.A4.rotate());
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, bos);

            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
            Paragraph title = new Paragraph("Sales Price Master Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 2.5f, 2.5f, 2f, 2f, 1.5f, 1.5f});

            String[] columns = {"Price List No", "Type", "Customer", "Customer Group", "Effective From", "Effective To", "Status", "Verify Status"};
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
            for (String col : columns) {
                PdfPCell cell = new PdfPCell(new Phrase(col, headerFont));
                cell.setBackgroundColor(new BaseColor(33, 150, 243));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);
            for (SalesPriceMasterDTO dto : list) {
                table.addCell(new Phrase(dto.getPriceListNo(), cellFont));
                table.addCell(new Phrase(dto.getPriceListType(), cellFont));
                table.addCell(new Phrase(dto.getCustomerName() != null ? dto.getCustomerName() : "N/A", cellFont));
                table.addCell(new Phrase(dto.getCustomerGroupName() != null ? dto.getCustomerGroupName() : "N/A", cellFont));
                table.addCell(new Phrase(dto.getEffectiveFrom() != null ? dto.getEffectiveFrom().toString() : "", cellFont));
                table.addCell(new Phrase(dto.getEffectiveTo() != null ? dto.getEffectiveTo().toString() : "", cellFont));
                table.addCell(new Phrase(dto.getStatus(), cellFont));
                table.addCell(new Phrase(dto.getVerifyStatus(), cellFont));
            }

            document.add(table);
            document.close();
            return bos.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to export PDF report");
        }
    }
}
