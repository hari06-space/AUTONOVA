package com.autonoma.erp.modules.sm.invoice.controller;

import com.autonoma.erp.modules.sm.invoice.service.ExchangeRateService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sm/exchange-rate")
@Tag(name = "Exchange Rate", description = "Exchange Rate APIs")
public class ExchangeRateController {

    @Autowired
    private ExchangeRateService exchangeRateService;

    @GetMapping
    public ResponseEntity<?> getExchangeRate(
            @RequestParam String fromCurrency,
            @RequestParam(defaultValue = "INR") String toCurrency) {
        try {
            BigDecimal rate = exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
            Map<String, Object> result = new HashMap<>();
            result.put("fromCurrency", fromCurrency.toUpperCase());
            result.put("toCurrency", toCurrency.toUpperCase());
            result.put("rate", rate);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
