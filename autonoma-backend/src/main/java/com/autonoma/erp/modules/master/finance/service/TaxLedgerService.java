package com.autonoma.erp.modules.master.finance.service;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class TaxLedgerService {

    private final AccountLedgerRepository repository;

    @org.springframework.beans.factory.annotation.Autowired
    public TaxLedgerService(AccountLedgerRepository repository) {
        this.repository = repository;
    }

    private static final List<String> TAX_LEDGER_TYPES = Arrays.asList("GST", "TDS", "TCS");

    public List<AccountLedger> getAllTaxLedgers() {
        return repository.findByLedgerTypeIgnoreCase("TAX");
    }

    public Optional<AccountLedger> getTaxLedgerById(Long id) {
        return repository.findById(id).filter(l -> "TAX".equalsIgnoreCase(l.getLedgerType()));
    }

    @Transactional
    public AccountLedger saveTaxLedger(AccountLedger ledger) {
        if (ledger.getId() == null) {
            if (repository.existsByLedgerNameIgnoreCase(ledger.getLedgerName())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
            }
        } else {
            if (repository.existsByLedgerNameIgnoreCaseAndIdNot(ledger.getLedgerName(), ledger.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Duplicate value! Please check.");
            }
        }

        // Validate category
        if (ledger.getCategory() == null || !TAX_LEDGER_TYPES.contains(ledger.getCategory().toUpperCase())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid Ledger Category. Must be GST, TDS, or TCS.");
        }

        return repository.save(ledger);
    }

    @Transactional
    public void deleteTaxLedger(Long id) {
        repository.deleteById(id);
    }
}
