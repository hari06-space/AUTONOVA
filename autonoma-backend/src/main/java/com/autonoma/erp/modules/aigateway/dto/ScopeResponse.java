package com.autonoma.erp.modules.aigateway.dto;

import lombok.Data;

@Data
public class ScopeResponse {
    private boolean allowed;
    private String constraintFilter; // SQL injection filter or RLS predicate
    private String reason;

    public static ScopeResponse allow() {
        ScopeResponse res = new ScopeResponse();
        res.setAllowed(true);
        return res;
    }

    public static ScopeResponse allowFiltered(String constraintFilter) {
        ScopeResponse res = new ScopeResponse();
        res.setAllowed(true);
        res.setConstraintFilter(constraintFilter);
        return res;
    }

    public static ScopeResponse deny(String reason) {
        ScopeResponse res = new ScopeResponse();
        res.setAllowed(false);
        res.setReason(reason);
        return res;
    }

    public boolean isAllowed() { return allowed; }
    public void setAllowed(boolean allowed) { this.allowed = allowed; }
    public String getConstraintFilter() { return constraintFilter; }
    public void setConstraintFilter(String constraintFilter) { this.constraintFilter = constraintFilter; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
