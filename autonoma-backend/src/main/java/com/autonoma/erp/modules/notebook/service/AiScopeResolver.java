package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.IntentResult.DataScope;
import com.autonoma.erp.repository.admin.UserRepository;
import AppUtil.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Set;

/**
 * Resolves the data visibility scope for a user in the AI context.
 *
 * Scope hierarchy:
 *   GLOBAL > COMPANY > DIVISION > DEPARTMENT > TEAM > SELF
 *
 * Every user gets SELF by default. Additional scopes are granted based on their role
 * in the HR hierarchy (manager, division manager, senior management, admin).
 */
@Service
public class AiScopeResolver {

    @Autowired
    private UserRepository userRepository;

    /**
     * Returns the full set of DataScopes the user is allowed to access.
     * A user with COMPANY scope also implicitly has DIVISION, DEPARTMENT, TEAM, and SELF.
     */
    public Set<DataScope> resolveAllowedScopes(String userId, Long empId, boolean isPrivileged) {
        Set<DataScope> scopes = EnumSet.of(DataScope.SELF);

        if (isPrivileged) {
            // Admins and Super Admins see everything
            scopes.addAll(EnumSet.allOf(DataScope.class));
            return scopes;
        }

        if (isSeniorManagement(userId)) {
            scopes.add(DataScope.COMPANY);
            scopes.add(DataScope.DIVISION);
            scopes.add(DataScope.DEPARTMENT);
            scopes.add(DataScope.TEAM);
        } else if (isDivisionManager(userId, empId)) {
            scopes.add(DataScope.DIVISION);
            scopes.add(DataScope.DEPARTMENT);
            scopes.add(DataScope.TEAM);
        } else if (isManager(userId, empId)) {
            scopes.add(DataScope.TEAM);
            scopes.add(DataScope.DEPARTMENT);
        }

        return scopes;
    }

    /**
     * Checks if the user is a direct manager (has team members reporting to them).
     * Simplified: HR/Admin users are treated as managers.
     */
    public boolean isManager(String userId, Long empId) {
        if (userId == null) return false;
        return userRepository.findByUserId(userId)
            .map(u -> u.getUserLevel() != null && u.getUserLevel() >= AppConstants.USER_LEVEL_ADMIN - 1)
            .orElse(false);
    }

    /**
     * Checks if the user is a division-level manager.
     */
    public boolean isDivisionManager(String userId, Long empId) {
        if (userId == null) return false;
        return userRepository.findByUserId(userId)
            .map(u -> u.getUserLevel() != null && u.getUserLevel() >= AppConstants.USER_LEVEL_ADMIN)
            .orElse(false);
    }

    /**
     * Checks if the user is senior management (company-wide visibility).
     */
    public boolean isSeniorManagement(String userId) {
        if (userId == null) return false;
        return userRepository.findByUserId(userId)
            .map(u -> u.getUserLevel() != null && u.getUserLevel() >= AppConstants.USER_LEVEL_BOS_ADMIN)
            .orElse(false);
    }
}
