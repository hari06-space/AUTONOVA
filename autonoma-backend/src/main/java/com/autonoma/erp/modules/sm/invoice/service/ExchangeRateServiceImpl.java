package com.autonoma.erp.modules.sm.invoice.service;

import com.autonoma.erp.modules.sm.invoice.entity.ExchangeRate;
import com.autonoma.erp.modules.sm.invoice.repository.ExchangeRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

@Service
public class ExchangeRateServiceImpl implements ExchangeRateService {

    @Autowired
    private ExchangeRateRepository exchangeRateRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public BigDecimal getExchangeRate(String fromCurrency, String toCurrency) {
        if (fromCurrency == null || toCurrency == null) {
            throw new IllegalArgumentException("Currencies must not be null");
        }
        
        if (fromCurrency.equalsIgnoreCase(toCurrency)) {
            return BigDecimal.ONE;
        }

        LocalDate today = LocalDate.now();
        Date rateDate = java.sql.Date.valueOf(today);

        // 1. Check cache database
        Optional<ExchangeRate> cachedRate = exchangeRateRepository
                .findByFromCurrencyAndToCurrencyAndRateDate(fromCurrency.toUpperCase(), toCurrency.toUpperCase(), rateDate);

        if (cachedRate.isPresent()) {
            return cachedRate.get().getRate();
        }

        // 2. Fetch from external API
        try {
            String url = "https://open.er-api.com/v6/latest/" + fromCurrency.toUpperCase();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && "success".equals(response.get("result"))) {
                Map<String, Object> rates = (Map<String, Object>) response.get("rates");
                if (rates != null && rates.containsKey(toCurrency.toUpperCase())) {
                    Object rateVal = rates.get(toCurrency.toUpperCase());
                    BigDecimal rate = new BigDecimal(rateVal.toString());

                    // Save to cache
                    ExchangeRate exchangeRate = new ExchangeRate();
                    exchangeRate.setFromCurrency(fromCurrency.toUpperCase());
                    exchangeRate.setToCurrency(toCurrency.toUpperCase());
                    exchangeRate.setRate(rate);
                    exchangeRate.setRateDate(rateDate);
                    exchangeRate.setSource("ExchangeRate-API");
                    exchangeRateRepository.save(exchangeRate);

                    return rate;
                }
            }
            throw new RuntimeException("Target currency " + toCurrency + " not found in exchange rate API response");
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch exchange rate for " + fromCurrency + " to " + toCurrency + ": " + e.getMessage(), e);
        }
    }
}
