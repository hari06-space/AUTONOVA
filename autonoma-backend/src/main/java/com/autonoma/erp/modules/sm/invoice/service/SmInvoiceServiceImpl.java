package com.autonoma.erp.modules.sm.invoice.service;

import com.autonoma.erp.modules.sm.invoice.dto.SmInvoiceDetailDto;
import com.autonoma.erp.modules.sm.invoice.dto.SmInvoiceHeaderDto;
import com.autonoma.erp.modules.sm.invoice.entity.SmInvoiceDetail;
import com.autonoma.erp.modules.sm.invoice.entity.SmInvoiceHeader;
import com.autonoma.erp.modules.sm.invoice.repository.SmInvoiceHeaderRepository;
import com.autonoma.erp.modules.sm.invoice.repository.SmInvoiceDetailRepository;
import com.autonoma.erp.modules.sm.customer.entity.CustomerAddress;
import com.autonoma.erp.modules.sm.customer.repository.CustomerAddressRepository;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderHeader;
import com.autonoma.erp.modules.sm.sales.entity.SmCustomerOrderDetail;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderHeaderRepository;
import com.autonoma.erp.modules.sm.sales.repository.SmCustomerOrderDetailRepository;
import com.autonoma.erp.modules.inventory.transaction.entity.ItemTransaction;
import com.autonoma.erp.modules.inventory.transaction.repository.ItemTransactionRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;

import com.autonoma.erp.modules.sm.invoice.dto.SmInvoiceChargeDto;
import com.autonoma.erp.modules.sm.invoice.entity.SmInvoiceCharge;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import jakarta.persistence.EntityManager;
import com.autonoma.erp.modules.finance.service.FinancePostingService;
import com.autonoma.erp.modules.finance.dto.FinancePostingDTO;

import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmInvoiceServiceImpl implements SmInvoiceService {

    private final SmInvoiceHeaderRepository headerRepository;
    private final SmInvoiceDetailRepository detailRepository;
    private final AccountLedgerRepository ledgerRepository;
    private final CustomerAddressRepository addressRepository;
    private final SmCustomerOrderHeaderRepository orderHeaderRepository;
    private final SmCustomerOrderDetailRepository orderDetailRepository;
    private final ItemTransactionRepository itemTransactionRepository;
    private final ProductMasterRepository productMasterRepository;
    private final PrefixCredentialRepository prefixCredentialRepository;
    private final com.autonoma.erp.service.admin.PrefixCredentialService prefixCredentialService;
    private final EntityManager entityManager;
    private final FinancePostingService financePostingService;

    public SmInvoiceServiceImpl(
            SmInvoiceHeaderRepository headerRepository,
            SmInvoiceDetailRepository detailRepository,
            AccountLedgerRepository ledgerRepository,
            CustomerAddressRepository addressRepository,
            SmCustomerOrderHeaderRepository orderHeaderRepository,
            SmCustomerOrderDetailRepository orderDetailRepository,
            ItemTransactionRepository itemTransactionRepository,
            ProductMasterRepository productMasterRepository,
            PrefixCredentialRepository prefixCredentialRepository,
            com.autonoma.erp.service.admin.PrefixCredentialService prefixCredentialService,
            EntityManager entityManager,
            FinancePostingService financePostingService) {
        this.headerRepository = headerRepository;
        this.detailRepository = detailRepository;
        this.ledgerRepository = ledgerRepository;
        this.addressRepository = addressRepository;
        this.orderHeaderRepository = orderHeaderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.itemTransactionRepository = itemTransactionRepository;
        this.productMasterRepository = productMasterRepository;
        this.prefixCredentialRepository = prefixCredentialRepository;
        this.prefixCredentialService = prefixCredentialService;
        this.entityManager = entityManager;
        this.financePostingService = financePostingService;
    }

    @Override
    public String generateInvoiceNo() {
        return generateDocNo("INVOICE");
    }

    @Override
    public String generateDocNo(String docType) {
        String type = (docType != null && !docType.trim().isEmpty()) ? docType.trim() : "INVOICE";
        Calendar cal = Calendar.getInstance();
        int year = cal.get(Calendar.YEAR);
        String currentAccountYear = year + "-" + (year + 1);

        String configuredPrefix = null;
        int digits = 6;
        String configuredSuffix = "";

        try {
            List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialService != null
                    ? prefixCredentialService.getAllPrefixCredentials()
                    : prefixCredentialRepository.findAll();
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                .findFirst()
                .orElse(allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .findFirst().orElse(null));

            if ("DELIVERY_RECEIPT".equalsIgnoreCase(type)) {
                if (cred != null && cred.getDcPrefix() != null && !cred.getDcPrefix().trim().isEmpty()) {
                    configuredPrefix = cred.getDcPrefix().trim();
                    if (cred.getDcSuffix() != null) {
                        configuredSuffix = cred.getDcSuffix().trim();
                    }
                    digits = cred.getDcDigit() != null ? cred.getDcDigit() : 6;
                }
            } else {
                if (cred != null && cred.getInvoicePrefix() != null && !cred.getInvoicePrefix().trim().isEmpty()) {
                    configuredPrefix = cred.getInvoicePrefix().trim();
                    if (cred.getInvoiceSuffix() != null) {
                        configuredSuffix = cred.getInvoiceSuffix().trim();
                    }
                    digits = cred.getInvoiceDigit() != null ? cred.getInvoiceDigit() : 6;
                }
            }
        } catch (Exception ex) {
            // Log warning
        }

        if (configuredPrefix == null) {
            if ("DELIVERY_RECEIPT".equalsIgnoreCase(type)) {
                configuredPrefix = "DC-" + year + "/";
                configuredSuffix = "";
                digits = 6;
            } else {
                configuredPrefix = "INP/";
                configuredSuffix = "/-" + year;
                digits = 4;
            }
        }

        String finalPrefix = configuredPrefix.replaceAll("/+", "/");
        String finalSuffix = configuredSuffix.replaceAll("/+", "/");
        String searchPattern = finalPrefix + "%" + finalSuffix;

        String queryStr;
        if ("DELIVERY_RECEIPT".equalsIgnoreCase(type)) {
            queryStr = "SELECT TOP 1 INVOICE_NO FROM SM_INVOICE_HEADER WHERE DOC_TYPE = 'DELIVERY_RECEIPT' AND INVOICE_NO LIKE :pattern ORDER BY ID DESC";
        } else {
            queryStr = "SELECT TOP 1 INVOICE_NO FROM SM_INVOICE_HEADER WHERE (DOC_TYPE = 'INVOICE' OR DOC_TYPE IS NULL) AND INVOICE_NO LIKE :pattern ORDER BY ID DESC";
        }

        Object seqResult = entityManager.createNativeQuery(queryStr)
              .setParameter("pattern", searchPattern)
              .getResultList().stream().findFirst().orElse(null);

        long nextNum = 1;
        if (seqResult != null) {
            String numStr = (String) seqResult;
            if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                numStr = numStr.substring(finalPrefix.length());
            }
            if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
            }
            try {
                nextNum = Long.parseLong(numStr) + 1;
            } catch(Exception e) {}
        }
        return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
    }

    @Override
    @Transactional
    public SmInvoiceHeaderDto createInvoice(SmInvoiceHeaderDto dto) {
        String docType = (dto.getDocType() != null && !dto.getDocType().trim().isEmpty()) ? dto.getDocType().trim() : "INVOICE";
        dto.setDocType(docType);

        // Safe Backend Generation of Doc No and Date
        String invoiceNo = (dto.getInvoiceNo() != null && !dto.getInvoiceNo().trim().isEmpty())
                ? dto.getInvoiceNo().trim()
                : generateDocNo(docType);
        dto.setInvoiceNo(invoiceNo);
        if (dto.getInvoiceDate() == null) {
            dto.setInvoiceDate(new Date());
        }

        if (headerRepository.existsByInvoiceNoAndDocType(invoiceNo, docType)) {
            throw new RuntimeException("Document number already exists: " + invoiceNo);
        }

        // Validate Customer
        AccountLedger customer = ledgerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found."));
        if (!Boolean.TRUE.equals(customer.getIsActive())) {
            throw new RuntimeException("Customer is inactive.");
        }

        boolean isInvoice = "INVOICE".equalsIgnoreCase(docType);

        // Validate Billing Address
        if (dto.getBillingAddressId() != null) {
            CustomerAddress billAddr = addressRepository.findById(dto.getBillingAddressId())
                    .orElseThrow(() -> new RuntimeException("Billing address not found."));
            if (!billAddr.getCustomerId().equals(dto.getCustomerId())) {
                throw new RuntimeException("Billing address does not belong to the selected customer.");
            }
        } else if (isInvoice) {
            throw new RuntimeException("Billing address is required for Sales Invoice.");
        }

        // Validate Shipping Address
        if (dto.getShippingAddressId() != null) {
            CustomerAddress shipAddr = addressRepository.findById(dto.getShippingAddressId())
                    .orElseThrow(() -> new RuntimeException("Shipping address not found."));
            if (!shipAddr.getCustomerId().equals(dto.getCustomerId())) {
                throw new RuntimeException("Shipping address does not belong to the selected customer.");
            }
        } else if (isInvoice) {
            throw new RuntimeException("Shipping address is required for Sales Invoice.");
        }

        SmInvoiceHeader header = new SmInvoiceHeader();
        BeanUtils.copyProperties(dto, header, "invoiceDetails", "invoiceCharges");
        header.setInvoiceNo(invoiceNo);
        header.setDocType(docType);
        header.setInvoiceDate(dto.getInvoiceDate());

        // Default the exchange rate freeze values if they are missing
        if (header.getBaseCurrency() == null) {
            header.setBaseCurrency("INR");
        }
        if (header.getRateDate() == null) {
            header.setRateDate(new Date());
        }
        if (header.getExchangeRateSource() == null) {
            if ("INR".equalsIgnoreCase(header.getCurrencyCode())) {
                header.setExchangeRateSource("Local / Default");
            } else {
                header.setExchangeRateSource("ExchangeRate-API");
            }
        }

        if (dto.getInvoiceDetails() == null || dto.getInvoiceDetails().isEmpty()) {
            throw new RuntimeException("Document must contain at least one detail line.");
        }

        boolean isFromDc = (dto.getDcIds() != null && !dto.getDcIds().isEmpty()) || (dto.getRefDcNos() != null && !dto.getRefDcNos().trim().isEmpty());

        // Validate details
        for (SmInvoiceDetailDto detailDto : dto.getInvoiceDetails()) {
            if (detailDto.getQty() == null || detailDto.getQty() <= 0) {
                throw new RuntimeException("Quantity must be greater than 0.");
            }

            ProductMaster part = null;
            if (detailDto.getPartId() != null) {
                part = productMasterRepository.findById(detailDto.getPartId()).orElse(null);
            }

            if (isInvoice) {
                boolean isLineFromDc = isFromDc || (detailDto.getSalesOrderNo() != null && detailDto.getSalesOrderNo().startsWith("DC-"));
                if (!isLineFromDc) {
                    // Strict validation for standard SO-based Sales Invoices
                    if (detailDto.getSalesOrderLineId() == null) {
                        throw new RuntimeException("Sales invoice lines must be linked to a sales order line.");
                    }
                    SmCustomerOrderDetail orderLine = orderDetailRepository.findById(detailDto.getSalesOrderLineId())
                            .orElseThrow(() -> new RuntimeException("Sales order line not found: " + detailDto.getSalesOrderLineId()));

                    if (!orderLine.getOrderHeader().getCustId().equals(dto.getCustomerId())) {
                        throw new RuntimeException("Sales order line does not belong to the selected customer.");
                    }

                    if (part == null) {
                        throw new RuntimeException("Part/Product not found: " + detailDto.getPartId());
                    }

                    // Concurrency-safe remaining quantity check
                    Integer ordered = orderLine.getQty() != null ? orderLine.getQty() : 0;
                    Integer alreadyInvoiced = detailRepository.getAlreadyInvoicedQuantity(detailDto.getSalesOrderLineId(), null);
                    int remaining = ordered - alreadyInvoiced;

                    if (detailDto.getQty() > remaining) {
                        throw new RuntimeException("Cannot invoice " + detailDto.getQty() + " units for part " + part.getItemNo() + ". Maximum available quantity is " + remaining);
                    }

                    // Price validation (must match SO pricing)
                    BigDecimal orderLinePrice = orderLine.getPrice() != null ? orderLine.getPrice() : BigDecimal.ZERO;
                    if (detailDto.getPrice() != null && detailDto.getPrice().compareTo(orderLinePrice) != 0) {
                        throw new RuntimeException("Invoice Unit Price (" + detailDto.getPrice() + ") must match Sales Order price (" + orderLinePrice + ") for part: " + part.getItemNo());
                    }
                }

                // Stock validation for all Sales Invoices (SO or DC based)
                if (detailDto.getPartId() != null) {
                    BigDecimal availableStock = itemTransactionRepository.findAvailableStock(1L, detailDto.getPartId());
                    if (availableStock == null) availableStock = BigDecimal.ZERO;
                    if (availableStock.compareTo(BigDecimal.valueOf(detailDto.getQty())) < 0) {
                        String pNo = part != null ? part.getItemNo() : (detailDto.getPartNo() != null ? detailDto.getPartNo() : "Part");
                        throw new RuntimeException("Insufficient stock for part: " + pNo + ". Available: " + availableStock + ", Requested: " + detailDto.getQty());
                    }
                }
            } else {
                // Delivery Receipt (DC): No stock validation, editable price and quantity
                if (part == null && detailDto.getPartId() != null) {
                    part = productMasterRepository.findById(detailDto.getPartId()).orElse(null);
                }
            }

            SmInvoiceDetail detail = new SmInvoiceDetail();
            BeanUtils.copyProperties(detailDto, detail, "id");
            detail.setInvoiceHeader(header);
            header.getInvoiceDetails().add(detail);
        }

        // Save invoice additional charges
        if (dto.getInvoiceCharges() != null) {
            for (SmInvoiceChargeDto chargeDto : dto.getInvoiceCharges()) {
                SmInvoiceCharge charge = new SmInvoiceCharge();
                BeanUtils.copyProperties(chargeDto, charge, "id");
                charge.setInvoiceHeader(header);
                header.getInvoiceCharges().add(charge);
            }
        }

        SmInvoiceHeader saved = headerRepository.save(header);

        if (isInvoice) {
            // Save stock transactions and post to finance only for Invoices
            saveItemTransactions(saved);
            postToFinance(saved);

            // Update originating DCs to INVOICED status
            if (dto.getDcIds() != null && !dto.getDcIds().isEmpty()) {
                for (Long dcId : dto.getDcIds()) {
                    headerRepository.findById(dcId).ifPresent(dc -> {
                        dc.setRefInvoiceNo(saved.getInvoiceNo());
                        dc.setRefInvoiceDate(saved.getInvoiceDate());
                        dc.setDcStatus("INVOICED");
                        headerRepository.save(dc);
                    });
                }
            }
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public SmInvoiceHeaderDto updateInvoice(Long id, SmInvoiceHeaderDto dto) {
        SmInvoiceHeader header = headerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found."));

        String docType = header.getDocType() != null ? header.getDocType() : (dto.getDocType() != null ? dto.getDocType() : "INVOICE");

        if (headerRepository.existsByInvoiceNoAndDocTypeAndIdNot(dto.getInvoiceNo(), docType, id)) {
            throw new RuntimeException("Document number already exists: " + dto.getInvoiceNo());
        }

        // Validate Customer
        AccountLedger customer = ledgerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found."));
        if (!Boolean.TRUE.equals(customer.getIsActive())) {
            throw new RuntimeException("Customer is inactive.");
        }

        boolean isInvoice = "INVOICE".equalsIgnoreCase(docType);

        // Validate Billing Address
        if (dto.getBillingAddressId() != null) {
            CustomerAddress billAddr = addressRepository.findById(dto.getBillingAddressId())
                    .orElseThrow(() -> new RuntimeException("Billing address not found."));
            if (!billAddr.getCustomerId().equals(dto.getCustomerId())) {
                throw new RuntimeException("Billing address does not belong to the selected customer.");
            }
        } else if (isInvoice) {
            throw new RuntimeException("Billing address is required for Sales Invoice.");
        }

        // Validate Shipping Address
        if (dto.getShippingAddressId() != null) {
            CustomerAddress shipAddr = addressRepository.findById(dto.getShippingAddressId())
                    .orElseThrow(() -> new RuntimeException("Shipping address not found."));
            if (!shipAddr.getCustomerId().equals(dto.getCustomerId())) {
                throw new RuntimeException("Shipping address does not belong to the selected customer.");
            }
        } else if (isInvoice) {
            throw new RuntimeException("Shipping address is required for Sales Invoice.");
        }

        if (isInvoice) {
            // Delete old item transactions before recalculating stock
            deleteItemTransactions(header.getInvoiceNo());
        }

        // Update header details
        BeanUtils.copyProperties(dto, header, "id", "invoiceNo", "docType", "invoiceDate", "createdBy", "createdDate", "invoiceDetails", "invoiceCharges");
        header.setDocType(docType);

        // Default the exchange rate freeze values if they are missing
        if (header.getBaseCurrency() == null) {
            header.setBaseCurrency("INR");
        }
        if (header.getRateDate() == null) {
            header.setRateDate(new Date());
        }
        if (header.getExchangeRateSource() == null) {
            if ("INR".equalsIgnoreCase(header.getCurrencyCode())) {
                header.setExchangeRateSource("Local / Default");
            } else {
                header.setExchangeRateSource("ExchangeRate-API");
            }
        }

        header.getInvoiceDetails().clear();
        if (dto.getInvoiceDetails() == null || dto.getInvoiceDetails().isEmpty()) {
            throw new RuntimeException("Document must contain at least one detail line.");
        }

        for (SmInvoiceDetailDto detailDto : dto.getInvoiceDetails()) {
            if (detailDto.getQty() == null || detailDto.getQty() <= 0) {
                throw new RuntimeException("Quantity must be greater than 0.");
            }

            ProductMaster part = null;
            if (detailDto.getPartId() != null) {
                part = productMasterRepository.findById(detailDto.getPartId()).orElse(null);
            }

            if (isInvoice) {
                if (detailDto.getSalesOrderLineId() == null) {
                    throw new RuntimeException("Sales invoice lines must be linked to a sales order line.");
                }
                SmCustomerOrderDetail orderLine = orderDetailRepository.findById(detailDto.getSalesOrderLineId())
                        .orElseThrow(() -> new RuntimeException("Sales order line not found: " + detailDto.getSalesOrderLineId()));

                if (!orderLine.getOrderHeader().getCustId().equals(dto.getCustomerId())) {
                    throw new RuntimeException("Sales order line does not belong to the selected customer.");
                }

                if (part == null) {
                    throw new RuntimeException("Part/Product not found: " + detailDto.getPartId());
                }

                Integer ordered = orderLine.getQty() != null ? orderLine.getQty() : 0;
                Integer alreadyInvoiced = detailRepository.getAlreadyInvoicedQuantity(detailDto.getSalesOrderLineId(), id);
                int remaining = ordered - alreadyInvoiced;

                if (detailDto.getQty() > remaining) {
                    throw new RuntimeException("Cannot invoice " + detailDto.getQty() + " units for part " + part.getItemNo() + ". Maximum available quantity is " + remaining);
                }

                // Price validation
                BigDecimal orderLinePrice = orderLine.getPrice() != null ? orderLine.getPrice() : BigDecimal.ZERO;
                if (detailDto.getPrice() != null && detailDto.getPrice().compareTo(orderLinePrice) != 0) {
                    throw new RuntimeException("Invoice Unit Price (" + detailDto.getPrice() + ") must match Sales Order price (" + orderLinePrice + ") for part: " + part.getItemNo());
                }

                // Stock Validation
                BigDecimal availableStock = itemTransactionRepository.findAvailableStock(1L, detailDto.getPartId());
                if (availableStock == null) availableStock = BigDecimal.ZERO;
                if (availableStock.compareTo(BigDecimal.valueOf(detailDto.getQty())) < 0) {
                    throw new RuntimeException("Insufficient stock for part: " + part.getItemNo() + ". Available: " + availableStock + ", Requested: " + detailDto.getQty());
                }
            }

            SmInvoiceDetail detail = new SmInvoiceDetail();
            BeanUtils.copyProperties(detailDto, detail, "id");
            detail.setInvoiceHeader(header);
            header.getInvoiceDetails().add(detail);
        }

        // Update additional charges
        header.getInvoiceCharges().clear();
        if (dto.getInvoiceCharges() != null) {
            for (SmInvoiceChargeDto chargeDto : dto.getInvoiceCharges()) {
                SmInvoiceCharge charge = new SmInvoiceCharge();
                BeanUtils.copyProperties(chargeDto, charge, "id");
                charge.setInvoiceHeader(header);
                header.getInvoiceCharges().add(charge);
            }
        }

        SmInvoiceHeader saved = headerRepository.save(header);

        if (isInvoice) {
            // Save new item transactions only for Invoices
            saveItemTransactions(saved);
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SmInvoiceHeaderDto getInvoiceById(Long id) {
        return headerRepository.findById(id).map(this::mapToDto).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SmInvoiceHeaderDto> getAllInvoices(Pageable pageable) {
        return getAllInvoices("INVOICE", pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SmInvoiceHeaderDto> getAllInvoices(String docType, Pageable pageable) {
        if (docType == null || "INVOICE".equalsIgnoreCase(docType)) {
            return headerRepository.findByDocTypeOrDocTypeIsNull("INVOICE", pageable).map(this::mapToDto);
        }
        return headerRepository.findByDocType(docType, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {
        SmInvoiceHeader header = headerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found."));
        if (header.getDocType() != null && "INVOICE".equalsIgnoreCase(header.getDocType())) {
            deleteItemTransactions(header.getInvoiceNo());
        }
        headerRepository.delete(header);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getAlreadyInvoicedQuantity(Long orderLineId, Long excludeInvoiceId) {
        return detailRepository.getAlreadyInvoicedQuantity(orderLineId, excludeInvoiceId);
    }

    private void saveItemTransactions(SmInvoiceHeader header) {
        for (SmInvoiceDetail detail : header.getInvoiceDetails()) {
            ItemTransaction trans = new ItemTransaction();
            trans.setTransCategory("OUT");
            trans.setTransType("SALES_INVOICE");
            trans.setInventoryType("FINISHED_GOODS");
            trans.setProductId(detail.getPartId());
            trans.setTransDate(LocalDate.now());
            trans.setTransNo(header.getInvoiceNo());
            trans.setQtyIn(BigDecimal.ZERO);
            trans.setQtyOut(BigDecimal.valueOf(detail.getQty()));
            trans.setPrice(detail.getPrice());
            trans.setUom(detail.getUom());
            trans.setStatus("POSTED");
            trans.setActiveStatus("Active");
            trans.setDivisionId(1L);
            trans.setRemarks("SO-based Invoice: " + header.getInvoiceNo());
            itemTransactionRepository.save(trans);
        }
    }

    private void deleteItemTransactions(String invoiceNo) {
        // Find existing transactions by invoiceNo and remove them
        List<ItemTransaction> transList = itemTransactionRepository.findAll().stream()
                .filter(t -> invoiceNo.equals(t.getTransNo()) && "SALES_INVOICE".equals(t.getTransType()))
                .collect(Collectors.toList());
        itemTransactionRepository.deleteAll(transList);
    }

    private SmInvoiceHeaderDto mapToDto(SmInvoiceHeader header) {
        SmInvoiceHeaderDto dto = new SmInvoiceHeaderDto();
        BeanUtils.copyProperties(header, dto, "invoiceDetails", "invoiceCharges");

        if (header.getCustomerId() != null) {
            ledgerRepository.findById(header.getCustomerId())
                    .ifPresent(cust -> dto.setCustomerName(cust.getLedgerName()));
        }
        
        List<SmInvoiceDetailDto> detailDtos = header.getInvoiceDetails().stream().map(d -> {
            SmInvoiceDetailDto dDto = new SmInvoiceDetailDto();
            BeanUtils.copyProperties(d, dDto);
            return dDto;
        }).collect(Collectors.toList());
        
        dto.setInvoiceDetails(detailDtos);

        if (header.getInvoiceCharges() != null) {
            List<SmInvoiceChargeDto> chargeDtos = header.getInvoiceCharges().stream().map(c -> {
                SmInvoiceChargeDto cDto = new SmInvoiceChargeDto();
                BeanUtils.copyProperties(c, cDto);
                return cDto;
            }).collect(Collectors.toList());
            dto.setInvoiceCharges(chargeDtos);
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public SmInvoiceHeaderDto prepareInvoiceFromDcs(List<Long> dcIds) {
        if (dcIds == null || dcIds.isEmpty()) {
            throw new RuntimeException("No Delivery Receipts selected.");
        }

        List<SmInvoiceHeader> dcs = headerRepository.findAllById(dcIds);
        if (dcs.isEmpty()) {
            throw new RuntimeException("Selected Delivery Receipts not found.");
        }

        Long customerId = dcs.get(0).getCustomerId();
        for (SmInvoiceHeader dc : dcs) {
            if (!Objects.equals(dc.getCustomerId(), customerId)) {
                throw new RuntimeException("All selected Delivery Receipts must belong to the same customer.");
            }
            if ("INVOICED".equalsIgnoreCase(dc.getDcStatus())) {
                throw new RuntimeException("Delivery Receipt " + dc.getInvoiceNo() + " has already been invoiced.");
            }
        }

        SmInvoiceHeader baseDc = dcs.get(0);
        SmInvoiceHeaderDto draft = new SmInvoiceHeaderDto();
        draft.setDocType("INVOICE");
        draft.setCustomerId(baseDc.getCustomerId());
        draft.setBillingAddressId(baseDc.getBillingAddressId());
        draft.setShippingAddressId(baseDc.getShippingAddressId());
        draft.setPaymentTerms(baseDc.getPaymentTerms());
        draft.setDeliveryTerms(baseDc.getDeliveryTerms());
        draft.setCurrencyCode(baseDc.getCurrencyCode());
        draft.setExchangeRate(baseDc.getExchangeRate());
        draft.setBaseCurrency(baseDc.getBaseCurrency());
        draft.setDcIds(dcIds);

        ledgerRepository.findById(baseDc.getCustomerId())
                .ifPresent(cust -> draft.setCustomerName(cust.getLedgerName()));

        Set<String> dcNos = new LinkedHashSet<>();
        Set<String> poNos = new LinkedHashSet<>();
        List<SmInvoiceDetailDto> allLines = new ArrayList<>();
        List<SmInvoiceChargeDto> allCharges = new ArrayList<>();

        for (SmInvoiceHeader dc : dcs) {
            if (dc.getInvoiceNo() != null) dcNos.add(dc.getInvoiceNo());
            if (dc.getCustomerPo() != null && !dc.getCustomerPo().trim().isEmpty()) poNos.add(dc.getCustomerPo().trim());

            for (SmInvoiceDetail detail : dc.getInvoiceDetails()) {
                SmInvoiceDetailDto lineDto = new SmInvoiceDetailDto();
                BeanUtils.copyProperties(detail, lineDto, "id");
                lineDto.setSalesOrderNo(dc.getInvoiceNo()); // Set DC number as Order/Reference No
                allLines.add(lineDto);
            }

            if (dc.getInvoiceCharges() != null) {
                for (SmInvoiceCharge charge : dc.getInvoiceCharges()) {
                    SmInvoiceChargeDto chargeDto = new SmInvoiceChargeDto();
                    BeanUtils.copyProperties(charge, chargeDto, "id");
                    allCharges.add(chargeDto);
                }
            }
        }

        draft.setRefDcNos(String.join(", ", dcNos));
        draft.setCustomerPo(String.join(", ", poNos));
        draft.setInvoiceDetails(allLines);
        draft.setInvoiceCharges(allCharges);

        // Calculate totals
        BigDecimal subTotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal cgstAmount = BigDecimal.ZERO;
        BigDecimal sgstAmount = BigDecimal.ZERO;
        BigDecimal igstAmount = BigDecimal.ZERO;

        for (SmInvoiceDetailDto l : allLines) {
            if (l.getPrice() != null && l.getQty() != null) {
                BigDecimal lineVal = l.getPrice().multiply(BigDecimal.valueOf(l.getQty()));
                BigDecimal disc = (l.getDiscountPer() != null) ? lineVal.multiply(l.getDiscountPer()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
                subTotal = subTotal.add(lineVal);
                discountAmount = discountAmount.add(disc);
            }
            if (l.getCgstAmount() != null) cgstAmount = cgstAmount.add(l.getCgstAmount());
            if (l.getSgstAmount() != null) sgstAmount = sgstAmount.add(l.getSgstAmount());
            if (l.getIgstAmount() != null) igstAmount = igstAmount.add(l.getIgstAmount());
        }

        BigDecimal additionalCharges = BigDecimal.ZERO;
        for (SmInvoiceChargeDto c : allCharges) {
            if (c.getAmount() != null) additionalCharges = additionalCharges.add(c.getAmount());
        }

        BigDecimal taxableAmount = subTotal.subtract(discountAmount);
        BigDecimal totalTax = cgstAmount.add(sgstAmount).add(igstAmount);
        BigDecimal rawGrandTotal = taxableAmount.add(totalTax).add(additionalCharges);
        BigDecimal roundedGrandTotal = rawGrandTotal.setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedGrandTotal.subtract(rawGrandTotal);

        draft.setSubTotal(subTotal);
        draft.setDiscountAmount(discountAmount);
        draft.setTaxableAmount(taxableAmount);
        draft.setCgstAmount(cgstAmount);
        draft.setSgstAmount(sgstAmount);
        draft.setIgstAmount(igstAmount);
        draft.setAdditionalCharges(additionalCharges);
        draft.setRoundOff(roundOff);
        draft.setGrandTotal(roundedGrandTotal);

        return draft;
    }

    private void postToFinance(SmInvoiceHeader invoice) {
        if (invoice == null || invoice.getCustomerId() == null) return;
        
        FinancePostingDTO dto = new FinancePostingDTO();
        dto.setTransDate(invoice.getInvoiceDate() != null ? invoice.getInvoiceDate() : new java.util.Date());
        dto.setTransType("CUSTOMER_INVOICE");
        dto.setRefId(invoice.getId().intValue());
        dto.setVrName("Sales Invoice");
        dto.setVrNo(invoice.getInvoiceNo());
        
        dto.setHeadId(1L); // Placeholder for Sales Ledger
        dto.setHeadName("Sales Account");
        
        dto.setPartyId(invoice.getCustomerId());
        
        dto.setDrAmt(invoice.getGrandTotal());
        dto.setCrAmt(java.math.BigDecimal.ZERO);
        
        dto.setTaxableAmt(invoice.getTaxableAmount());
        dto.setBillAmt(invoice.getGrandTotal());
        
        dto.setNarration(invoice.getRemarks());
        dto.setPartyBillNo(invoice.getInvoiceNo());
        dto.setPartyBillDate(invoice.getInvoiceDate());
        
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(dto.getTransDate());
        cal.add(java.util.Calendar.DAY_OF_MONTH, 30);
        dto.setDueDate(cal.getTime());
        
        dto.setDivisionId(1L); // Default division
        dto.setUserId(invoice.getCreatedUser());
        
        financePostingService.postInvoice(dto);
    }
}
