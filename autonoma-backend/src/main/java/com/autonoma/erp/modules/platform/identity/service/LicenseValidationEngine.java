package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.platform.identity.entity.CliClientLicense;
import com.autonoma.erp.modules.platform.identity.exception.LicenseValidationException;
import com.autonoma.erp.modules.platform.identity.repository.CliClientLicenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class LicenseValidationEngine {

    @Autowired
    private CliClientLicenseRepository clientLicenseRepository;

    public void validateClientStatusAndExpiry(CompanyCredential client) {
        if (client == null) {
            throw new LicenseValidationException("Client record not found.");
        }
        if (Boolean.FALSE.equals(client.getIsActive())) {
            throw new LicenseValidationException("Client account is inactive.");
        }
        if (clientLicenseRepository != null) {
            Optional<CliClientLicense> licOpt = clientLicenseRepository.findByClientIdAndIsDeletedFalse(client.getId());
            if (licOpt.isPresent()) {
                CliClientLicense lic = licOpt.get();
                if (lic.getExpiryDate() != null && lic.getExpiryDate().isBefore(LocalDate.now())) {
                    throw new LicenseValidationException("License expired.");
                }
            }
        }
    }

    public void validateUserCount(CompanyCredential client, int newUserCount) {
        validateClientStatusAndExpiry(client);
        Integer maxUsers = null;
        if (clientLicenseRepository != null) {
            Optional<CliClientLicense> licOpt = clientLicenseRepository.findByClientIdAndIsDeletedFalse(client.getId());
            if (licOpt.isPresent()) maxUsers = licOpt.get().getMaxUsers();
        }
        if (maxUsers != null && newUserCount > maxUsers) {
            throw new LicenseValidationException("User creation limit exceeded.");
        }
    }

    public void validateBranchCount(CompanyCredential client, int newBranchCount) {
        validateClientStatusAndExpiry(client);
        Integer maxBranches = null;
        if (clientLicenseRepository != null) {
            Optional<CliClientLicense> licOpt = clientLicenseRepository.findByClientIdAndIsDeletedFalse(client.getId());
            if (licOpt.isPresent()) maxBranches = licOpt.get().getMaxBranches();
        }
        if (maxBranches != null && newBranchCount > maxBranches) {
            throw new LicenseValidationException("Maximum branch limit reached.");
        }
    }

    public void validateCompanyCount(CompanyCredential client, int newCompanyCount) {
        validateClientStatusAndExpiry(client);
        Integer maxCompanies = null;
        if (clientLicenseRepository != null) {
            Optional<CliClientLicense> licOpt = clientLicenseRepository.findByClientIdAndIsDeletedFalse(client.getId());
            if (licOpt.isPresent()) maxCompanies = licOpt.get().getMaxCompanies();
        }
        if (maxCompanies != null && newCompanyCount > maxCompanies) {
            throw new LicenseValidationException("Maximum company limit reached.");
        }
    }

    public void validateStorageLimit(CompanyCredential client, int usedStorageMb) {
        validateClientStatusAndExpiry(client);
        Integer maxStorageMb = null;
        if (clientLicenseRepository != null) {
            Optional<CliClientLicense> licOpt = clientLicenseRepository.findByClientIdAndIsDeletedFalse(client.getId());
            if (licOpt.isPresent()) maxStorageMb = licOpt.get().getMaxStorageMb();
        }
        if (maxStorageMb != null && usedStorageMb > maxStorageMb) {
            throw new LicenseValidationException("Storage limit exceeded.");
        }
    }
}
