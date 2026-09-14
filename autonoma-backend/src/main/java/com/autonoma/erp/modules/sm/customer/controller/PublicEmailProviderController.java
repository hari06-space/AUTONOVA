package com.autonoma.erp.modules.sm.customer.controller;

import com.autonoma.erp.modules.master.commercial.entity.PublicEmailProvider;
import com.autonoma.erp.modules.master.commercial.repository.PublicEmailProviderRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sm/public-email-providers")
public class PublicEmailProviderController {

    private final PublicEmailProviderRepository repository;

    public PublicEmailProviderController(PublicEmailProviderRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<String> getPublicEmailProviders() {
        return repository.findAll().stream()
                .filter(p -> p.getActiveStatus() != null ? p.getActiveStatus() : true)
                .map(p -> p.getDomainName().toLowerCase().trim())
                .collect(Collectors.toList());
    }
}
