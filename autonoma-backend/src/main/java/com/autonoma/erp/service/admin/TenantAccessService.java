package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.model.admin.UserCompanyMapping;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.model.admin.UserDivisionMapping;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.repository.admin.UserCompanyMappingRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.admin.UserDivisionMappingRepository;
import com.autonoma.erp.config.TenantContextHolder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TenantAccessService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyCredentialService companyCredentialService;

    @Autowired
    private UserCompanyMappingRepository userCompanyMappingRepository;

    @Autowired
    private UserDivisionMappingRepository userDivisionMappingRepository;

    public boolean canAccess(String userId, String tenantId, String divisionIdStr) {
        if (userId == null) {
            return false;
        }

        String previousTenant = TenantContextHolder.getTenantId();
        TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
        try {
            Optional<UserCredential> userOpt = userRepository.findByUserId(userId);
            if (!userOpt.isPresent()) {
                return false;
            }

            UserCredential user = userOpt.get();
            boolean isSuperUser = "SUPER BOSS".equalsIgnoreCase(user.getUserId()) ||
                    (user.getUserLevel() != null && user.getUserLevel() >= 5);
            if (isSuperUser) {
                return true;
            }

            // Master tenant AUTONOMA is accessible to all authenticated users
            if (tenantId == null || tenantId.trim().isEmpty() || AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME.equalsIgnoreCase(tenantId)) {
                return true;
            }

            // Find the company matching the dbSourceName (tenantId)
            List<CompanyCredential> companies = companyCredentialService.findAll();
            Optional<CompanyCredential> targetCompanyOpt = companies.stream()
                    .filter(c -> tenantId.equalsIgnoreCase(c.getDbSourceName()))
                    .findFirst();
            if (!targetCompanyOpt.isPresent()) {
                return false;
            }
            CompanyCredential targetCompany = targetCompanyOpt.get();

            // Check company mapping
            List<UserCompanyMapping> compMappings = userCompanyMappingRepository.findByUserId(userId);
            boolean isMappedToCompany = compMappings.stream()
                    .anyMatch(m -> targetCompany.getId().equals(m.getCompanyId()));
            if (!isMappedToCompany) {
                return false;
            }

            // Check division mapping if division is requested
            if (divisionIdStr != null && !divisionIdStr.trim().isEmpty()) {
                try {
                    Long divisionId = Long.parseLong(divisionIdStr.trim());
                    List<UserDivisionMapping> divMappings = userDivisionMappingRepository.findByUserId(userId);
                    boolean isMappedToDivision = divMappings.stream()
                            .anyMatch(m -> divisionId.equals(m.getDivisionId()));
                    if (!isMappedToDivision) {
                        return false;
                    }
                } catch (NumberFormatException e) {
                    return false;
                }
            }

            return true;
        } finally {
            if (previousTenant != null) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
    }
}
