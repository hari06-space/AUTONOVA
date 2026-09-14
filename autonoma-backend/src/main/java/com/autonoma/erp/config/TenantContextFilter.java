package com.autonoma.erp.config;

import com.autonoma.erp.util.SecurityUtils;


import com.autonoma.erp.service.admin.TenantAccessService;
import com.autonoma.erp.service.admin.TenantDataSourceService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;

public class TenantContextFilter implements Filter {

    @Autowired
    private TenantDataSourceService tenantDataSourceService;

    @Autowired
    private TenantAccessService tenantAccessService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        String tenantId = req.getHeader("X-Tenant-ID");
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = req.getParameter("tenantId");
        }
        String divisionIdStr = req.getHeader("X-Division-ID");
        if (divisionIdStr == null || divisionIdStr.trim().isEmpty()) {
            divisionIdStr = req.getParameter("divisionId");
        }

        String uri = req.getRequestURI();
        if (uri.startsWith("/api/users") || 
            uri.startsWith("/api/account") || 
            uri.startsWith("/api/user-page-auth") || 
            uri.startsWith("/api/bos-pages") || 
            uri.startsWith("/api/preferences") || 
            uri.startsWith("/api/user-column-preferences") || 
            uri.startsWith("/api/theme-settings") || 
            uri.startsWith("/api/company-profile") || 
            uri.startsWith("/api/prefix-credentials") || 
            uri.startsWith("/api/audit-trail") || 
            uri.startsWith("/api/analytics/sessions") || 
            uri.startsWith("/api/audit/sessions")) {
            tenantId = AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME;
        }

        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            if (!tenantAccessService.canAccess(currentUserId, tenantId, divisionIdStr)) {
                jakarta.servlet.http.HttpServletResponse httpRes = (jakarta.servlet.http.HttpServletResponse) response;
                if (!httpRes.isCommitted()) {
                    httpRes.sendError(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN, "Access Denied to Tenant/Division");
                }
                return;
            }
        }

        try {
            if (tenantId != null && !tenantId.trim().isEmpty() && !tenantId.equalsIgnoreCase(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME)) {
                try {
                    tenantDataSourceService.createTenantDataSource(tenantId.trim());
                    TenantContextHolder.setTenantId(tenantId.trim());
                } catch (Exception e) {
                    // Fallback if datasource creation fails
                    TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
                }
            } else {
                TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            }

            if (divisionIdStr != null && !divisionIdStr.trim().isEmpty()) {
                try {
                    DivisionContextHolder.setDivisionId(Long.parseLong(divisionIdStr.trim()));
                } catch (NumberFormatException ignored) {
                }
            }

            if (currentUserId != null) {
                com.autonoma.erp.util.SecurityUtils.resolveAndCacheEmployeeName(currentUserId);
            }

            try {
                chain.doFilter(request, response);
            } catch (Exception e) {
                // If the request fails specifically due to a connection issue with the tenant DB,
                // and we haven't already fallen back, we might want to log it.
                // However, usually the exception will propagate up to the GlobalExceptionHandler.
                throw e;
            }
        } finally {
            TenantContextHolder.clear();
            DivisionContextHolder.clear();
        }
    }
}
