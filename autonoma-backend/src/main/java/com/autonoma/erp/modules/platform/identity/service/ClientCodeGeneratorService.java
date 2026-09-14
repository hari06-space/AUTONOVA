package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class ClientCodeGeneratorService {

    @Autowired
    private CompanyCredentialRepository companyCredentialRepository;

    private static final SecureRandom random = new SecureRandom();

    /**
     * Generates a unique 6-digit numeric client code and validates that it does not exist in DB.
     */
    public String generateUniqueClientCode() {
        int maxRetries = 100;
        int attempt = 0;

        while (attempt < maxRetries) {
            attempt++;
            int number = 100001 + random.nextInt(899999);
            String candidateCode = String.valueOf(number);

            if (!companyCredentialRepository.existsByClientCode(candidateCode)) {
                return candidateCode;
            }
        }

        throw new IllegalStateException("Unable to generate a unique 6-digit Client Code after multiple attempts.");
    }
}
