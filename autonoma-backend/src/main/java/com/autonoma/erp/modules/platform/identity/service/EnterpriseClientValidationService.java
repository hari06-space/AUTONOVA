package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult;

public interface EnterpriseClientValidationService {

    /**
     * Executes full 10-step validation pipeline against Client Master in Source Database.
     * Uses Fail-Fast approach, connection retries, parameterized queries, and caching.
     *
     * @return EnterpriseValidationResult containing validation status, message, and warnings.
     */
    EnterpriseValidationResult validateClient();

    /**
     * Evicts cached validation results to force re-query on demand.
     */
    void clearValidationCache();

    /**
     * Validates whether a new user login exceeds maximum allowed user license quota.
     *
     * @param currentActiveUsers count of active logged-in users.
     * @return EnterpriseValidationResult containing result status.
     */
    EnterpriseValidationResult validateUserLimit(long currentActiveUsers);

    /**
     * Validates whether active branch/division count exceeds maximum allowed branch license quota.
     *
     * @param currentActiveBranches count of active branches/divisions.
     * @return EnterpriseValidationResult containing result status.
     */
    EnterpriseValidationResult validateBranchLimit(long currentActiveBranches);

    /**
     * Validates whether active company count exceeds maximum allowed company license quota.
     *
     * @param currentActiveCompanies count of active companies.
     * @return EnterpriseValidationResult containing result status.
     */
    EnterpriseValidationResult validateCompanyLimit(long currentActiveCompanies);
}
