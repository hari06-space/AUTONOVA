package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, Long> {
    boolean existsByCurrencyCodeIgnoreCase(String currencyCode);
    boolean existsByCurrencyNameIgnoreCase(String currencyName);
}
