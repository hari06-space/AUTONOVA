package com.autonoma.erp.modules.sm.customer.service;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.entity.CustomerEmailMapping;
import com.autonoma.erp.modules.master.commercial.entity.CustomerDomainMapping;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerMasterService {

    private final AccountLedgerRepository repository;
    private final JdbcTemplate jdbcTemplate;

    public List<java.util.Map<String, Object>> getAllCustomersFromSlsCustomer() {
        String sql = "SELECT ID as id, CODE as customerCode, LEDGER_NAME as customerName, " +
                     "LEDGER_NAME as ledgerName, GSTIN as gstin, " +
                     "ADDRESS as address, CITY as city, STATE as state, COUNTRY as country, PIN_CODE as pinCode, " +
                     "MOBILE_NO as mobileNo, MAIL_ID as emailId, MAIL_ID as mailId, " +
                     "CURRENCY_CODE as currencyCode, PAYMENT_TERMS as paymentTerms, DELIVERY_TERMS as deliveryTerms, " +
                     "'ACTIVE' as status, IS_ACTIVE as isActive FROM FA_ACCOUNT_LEDGER " +
                     "WHERE IS_CUSTOMER = 1 AND (IS_ACTIVE = 1 OR IS_ACTIVE IS NULL)";
        return jdbcTemplate.queryForList(sql);
    }

    public java.util.Map<String, Object> getSlsCustomerById(Long id) {
        String sql = "SELECT ID as id, CODE as customerCode, LEDGER_NAME as customerName, " +
                     "LEDGER_NAME as ledgerName, GSTIN as gstin, " +
                     "ADDRESS as address, CITY as city, STATE as state, COUNTRY as country, PIN_CODE as pinCode, " +
                     "CURRENCY_CODE as currencyCode, PAYMENT_TERMS as paymentTerms, DELIVERY_TERMS as deliveryTerms, " +
                     "'ACTIVE' as status, IS_ACTIVE as isActive FROM FA_ACCOUNT_LEDGER " +
                     "WHERE IS_CUSTOMER = 1 AND ID = ?";
        List<java.util.Map<String, Object>> list = jdbcTemplate.queryForList(sql, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<AccountLedger> getAllCustomers() {
        return repository.findByIsCustomerTrueAndIsActiveTrue();
    }

    public List<AccountLedger> getAllCustomersProjected() {
        return repository.findByIsCustomerTrueAndIsActiveTrue();
    }

    public Optional<AccountLedger> getCustomerById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public AccountLedger saveCustomer(AccountLedger customer) {
        if (customer.getId() == null) {
            if (repository.existsByLedgerNameIgnoreCase(customer.getLedgerName())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
            }
        } else {
            if (repository.existsByLedgerNameIgnoreCaseAndIdNot(customer.getLedgerName(), customer.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
            }
        }

        if (customer.getLedgerCode() == null || customer.getLedgerCode().isEmpty()) {
            customer.setLedgerCode(generateNextCode());
        }

        if (customer.getShortName() == null || customer.getShortName().trim().isEmpty()) {
            customer.setShortName(customer.getLedgerCode());
        }

        if (customer.getIsCustomer() == null)
            customer.setIsCustomer(true);

        if (customer.getEmailMappings() != null) {
            for (CustomerEmailMapping mapping : customer.getEmailMappings()) {
                mapping.setCustomer(customer);
            }
        }

        if (customer.getDomainName() != null) {
            String clean = customer.getDomainName().trim().toLowerCase();
            while (clean.startsWith("@")) {
                clean = clean.substring(1).trim();
            }
            customer.setDomainName(clean);
        }

        if (customer.getDomainMappings() != null) {
            for (CustomerDomainMapping mapping : customer.getDomainMappings()) {
                mapping.setCustomer(customer);
                if (mapping.getDomainName() != null) {
                    String clean = mapping.getDomainName().trim().toLowerCase();
                    while (clean.startsWith("@")) {
                        clean = clean.substring(1).trim();
                    }
                    mapping.setDomainName(clean);
                }
            }
        }

        return repository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        repository.deleteById(id);
    }

    public String getNextCustomerCode() {
        return generateNextCode();
    }

    private String generateNextCode() {
        try {
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            String prefix = "C-" + year + "-";

            Optional<AccountLedger> lastCustomer = repository.findTopByCodeStartingWithOrderByCodeDesc(prefix);

            if (lastCustomer.isEmpty()) {
                return prefix + "00001";
            }

            String lastCode = lastCustomer.get().getLedgerCode();
            String[] parts = lastCode.split("-");
            if (parts.length < 3)
                return prefix + "00001";

            int lastNum = Integer.parseInt(parts[2]);
            return String.format("%s%05d", prefix, lastNum + 1);
        } catch (Exception e) {
            e.printStackTrace();
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            return "C-" + year + "-00001";
        }
    }
}
