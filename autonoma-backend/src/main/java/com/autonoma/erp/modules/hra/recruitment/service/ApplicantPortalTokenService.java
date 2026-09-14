package com.autonoma.erp.modules.hra.recruitment.service;

import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantPortalToken;
import com.autonoma.erp.modules.hra.recruitment.repository.ApplicantPortalTokenRepository;
import com.autonoma.erp.modules.platform.identity.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicantPortalTokenService {

    @Autowired
    private ApplicantPortalTokenRepository tokenRepository;

    @Autowired
    private JwtService jwtService;

    @Transactional
    public String generateAndSaveToken(Long employeeId, String portalType, String applicantCode, String currentUserId) {
        return generateAndSaveToken(employeeId, portalType, applicantCode, currentUserId, InvalidationStrategy.INVALIDATE_ALL_ACTIVE);
    }

    @Transactional
    public String generateAndSaveToken(Long employeeId, String portalType, String applicantCode, String currentUserId, InvalidationStrategy strategy) {
        System.out.println("[TOKEN_DEBUG] generateAndSaveToken: empId=" + employeeId + ", type=" + portalType + ", code=" + applicantCode + ", strategy=" + strategy);
        if (employeeId == null) {
            throw new IllegalArgumentException("Employee ID cannot be null when generating a portal token!");
        }
        String auditUser = (currentUserId != null && !"SYSTEM".equalsIgnoreCase(currentUserId)) ? currentUserId : "SUPER BOSS";

        // Step 1: Invalidate previously active tokens for this employee and type if strategy is INVALIDATE_ALL_ACTIVE
        if (strategy == InvalidationStrategy.INVALIDATE_ALL_ACTIVE && employeeId != null) {
            List<ApplicantPortalToken> activeTokens = tokenRepository.findByEmployeeIdAndPortalTypeAndIsActive(employeeId, portalType, true);
            for (ApplicantPortalToken t : activeTokens) {
                t.setIsActive(false);
                t.setUpdatedBy(auditUser);
                t.setUpdatedDate(new Date());
                tokenRepository.save(t);
            }
        }

        // Step 2: Generate a completely new JWT token
        String token = jwtService.generateApplicantToken(applicantCode);

        // Step 3: Store the new active portal token
        ApplicantPortalToken newToken = new ApplicantPortalToken();
        newToken.setEmployeeId(employeeId);
        newToken.setPortalType(portalType);
        newToken.setToken(token);
        // Expiry matches 48 hours (same as JWT)
        newToken.setExpiryDate(new Date(System.currentTimeMillis() + 172800000L));
        newToken.setIsActive(true);
        newToken.setCreatedBy(auditUser);
        newToken.setCreatedDate(new Date());
        
        tokenRepository.save(newToken);
        return token;
    }

    @Transactional
    public void invalidateToken(String token, String currentUserId) {
        if (token == null || token.trim().isEmpty()) return;
        System.out.println("[TOKEN_DEBUG] invalidateToken: token=" + token + ", user=" + currentUserId);
        String auditUser = (currentUserId != null && !"SYSTEM".equalsIgnoreCase(currentUserId)) ? currentUserId : "SUPER BOSS";
        tokenRepository.findByToken(token).ifPresent(t -> {
            if (Boolean.TRUE.equals(t.getIsActive())) {
                t.setIsActive(false);
                t.setUpdatedBy(auditUser);
                t.setUpdatedDate(new Date());
                tokenRepository.save(t);
            }
        });
    }

    public boolean isTokenActiveAndValid(String token, String expectedType) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        Optional<ApplicantPortalToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            // Backward compatibility fallback for valid JWT tokens sent via email without DB tracking
            try {
                String subject = jwtService.extractUsername(token);
                if (subject != null && jwtService.validateToken(token, subject)) {
                    return true;
                }
            } catch (Exception ignored) {}
            return false;
        }
        ApplicantPortalToken t = tokenOpt.get();
        if (t.getExpiryDate() != null && t.getExpiryDate().before(new Date())) {
            return false;
        }
        if (!Boolean.TRUE.equals(t.getIsActive())) {
            // Unexpired JWT token fallback
            try {
                String subject = jwtService.extractUsername(token);
                if (subject != null && !jwtService.isTokenExpired(token)) {
                    return true;
                }
            } catch (Exception ignored) {}
            return false;
        }
        String actualType = t.getPortalType();
        if (actualType == null || expectedType == null) {
            return true;
        }
        if (expectedType.equalsIgnoreCase("CALL_LETTER") || expectedType.equalsIgnoreCase("OFFER_LETTER")) {
            return actualType.equalsIgnoreCase("CALL_LETTER") || actualType.equalsIgnoreCase("OFFER_LETTER") || actualType.equalsIgnoreCase("REJECTED_DOCUMENT");
        }
        return actualType.equalsIgnoreCase(expectedType);
    }
}
