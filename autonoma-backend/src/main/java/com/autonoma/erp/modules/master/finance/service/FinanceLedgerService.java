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
public class FinanceLedgerService {

    private final AccountLedgerRepository repository;

    @org.springframework.beans.factory.annotation.Autowired
    public FinanceLedgerService(AccountLedgerRepository repository) {
        this.repository = repository;
    }

    private static final List<String> FINANCE_LEDGER_TYPES = Arrays.asList("purchase", "service", "others");

    public List<AccountLedger> getAllFinanceLedgers() {
        return repository.findByLedgerTypeIgnoreCase("FINANCE");
    }

    public Optional<AccountLedger> getFinanceLedgerById(Long id) {
        return repository.findById(id).filter(l -> "FINANCE".equalsIgnoreCase(l.getLedgerType()));
    }

    @Transactional
    public AccountLedger saveFinanceLedger(AccountLedger ledger) {
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
        if (ledger.getCategory() == null || !FINANCE_LEDGER_TYPES.contains(ledger.getCategory())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid Ledger Category. Must be purchase, service, or others.");
        }

        return repository.save(ledger);
    }

    @Transactional
    public void deleteFinanceLedger(Long id) {
        repository.deleteById(id);
    }
}
