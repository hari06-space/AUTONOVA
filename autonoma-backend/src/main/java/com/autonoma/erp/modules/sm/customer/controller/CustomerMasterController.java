package com.autonoma.erp.modules.sm.customer.controller;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.entity.CustomerEmailMapping;
import com.autonoma.erp.modules.master.commercial.entity.CustomerDomainMapping;
import com.autonoma.erp.modules.sm.customer.service.CustomerMasterService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/sm/customers")
@Tag(name = "Customer Master", description = "Customer Master Management APIs")
public class CustomerMasterController {

    private final CustomerMasterService service;

    @org.springframework.beans.factory.annotation.Autowired
    public CustomerMasterController(CustomerMasterService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable String id) {
        if ("next-code".equals(id)) {
            return ResponseEntity.ok(service.getNextCustomerCode());
        }
        try {
            Long numericId = Long.parseLong(id);
            java.util.Map<String, Object> customer = service.getSlsCustomerById(numericId);
            if (customer != null) {
                return ResponseEntity.ok(customer);
            }
            return ResponseEntity.notFound().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid ID format");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllCustomers() {
        return ResponseEntity.ok(service.getAllCustomersFromSlsCustomer());
    }
    
    @GetMapping("/next-code")
    public String getNextCode() {
        return service.getNextCustomerCode();
    }

    @RequirePagePermission(pageCode = "M5130", action = "write")
    @PostMapping
    public AccountLedger createCustomer(@RequestBody AccountLedger customer) {
        return service.saveCustomer(customer);
    }

    @RequirePagePermission(pageCode = "M5130", action = "write")
    @PutMapping("/{id}")
    public ResponseEntity<AccountLedger> updateCustomer(@PathVariable Long id, @RequestBody AccountLedger customerDetails) {
        return service.getCustomerById(id)
                .map(customer -> {
                    customer.setLedgerCode(customerDetails.getLedgerCode());
                    customer.setLedgerName(customerDetails.getLedgerName());
                    customer.setPrintName(customerDetails.getPrintName());
                    customer.setShortName(customerDetails.getShortName());
                    customer.setSegment(customerDetails.getSegment());
                    customer.setSubSegment(customerDetails.getSubSegment());
                    customer.setDomainName(customerDetails.getDomainName());
                    customer.setAddress(customerDetails.getAddress());
                    customer.setPinCode(customerDetails.getPinCode());
                    customer.setCity(customerDetails.getCity());
                    customer.setState(customerDetails.getState());
                    customer.setStateCode(customerDetails.getStateCode());
                    customer.setCountry(customerDetails.getCountry());
                    customer.setPrimeVendor(customerDetails.getPrimeVendor());
                    customer.setPanNo(customerDetails.getPanNo());
                    customer.setWebsite(customerDetails.getWebsite());
                    customer.setRegisterNo(customerDetails.getRegisterNo());
                    customer.setCinNo(customerDetails.getCinNo());
                    customer.setIsoNumber(customerDetails.getIsoNumber());
                    customer.setIsoExpiryDate(customerDetails.getIsoExpiryDate());
                    customer.setNdaRequired(customerDetails.getNdaRequired());
                    customer.setCurrencyCode(customerDetails.getCurrencyCode());
                    customer.setPaymentTerms(customerDetails.getPaymentTerms());
                    customer.setDeliveryTerms(customerDetails.getDeliveryTerms());
                    customer.setFrieightApplicable(customerDetails.getFrieightApplicable());
                    customer.setDistance(customerDetails.getDistance());
                    customer.setLocation(customerDetails.getLocation());
                    customer.setLdApplicable(customerDetails.getLdApplicable());
                    customer.setNegotiateRequired(customerDetails.getNegotiateRequired());
                    customer.setIsActive(customerDetails.getIsActive());
                    
                    // Extra new fields from Account Ledger payload
                    customer.setGroupId(customerDetails.getGroupId());
                    customer.setSalesLedgerId(customerDetails.getSalesLedgerId());
                    customer.setPurchaseLedgerId(customerDetails.getPurchaseLedgerId());
                    customer.setLedgerType(customerDetails.getLedgerType());

                    // Update email mappings
                    customer.getEmailMappings().clear();
                    if (customerDetails.getEmailMappings() != null) {
                        for (CustomerEmailMapping mapping : customerDetails.getEmailMappings()) {
                            mapping.setCustomer(customer);
                            customer.getEmailMappings().add(mapping);
                        }
                    }

                    // Update domain mappings
                    customer.getDomainMappings().clear();
                    if (customerDetails.getDomainMappings() != null) {
                        for (CustomerDomainMapping mapping : customerDetails.getDomainMappings()) {
                            mapping.setCustomer(customer);
                            customer.getDomainMappings().add(mapping);
                        }
                    }

                    return ResponseEntity.ok(service.saveCustomer(customer));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @RequirePagePermission(pageCode = "M5130", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        service.deleteCustomer(id);
        return ResponseEntity.ok().build();
    }
}
