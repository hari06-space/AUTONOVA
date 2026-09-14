package com.autonoma.erp.modules.sm.invoice.repository;

import com.autonoma.erp.modules.sm.invoice.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    Optional<ExchangeRate> findByFromCurrencyAndToCurrencyAndRateDate(String fromCurrency, String toCurrency, Date rateDate);
}
