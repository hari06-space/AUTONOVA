package com.autonoma.erp.modules.aigateway.resolver;

import com.autonoma.erp.modules.aigateway.dto.UserContext;
import com.autonoma.erp.modules.aigateway.dto.ScopeResponse;

public interface ScopeResolver {
    
    /**
     * Resolves whether the user is allowed to perform an operation on a business entity,
     * and returns the scoped database constraints (Row-Level Security) to apply.
     */
    ScopeResponse resolveScope(UserContext user, String entityType, String operation);
}
