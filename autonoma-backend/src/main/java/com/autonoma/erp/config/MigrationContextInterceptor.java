package com.autonoma.erp.config;

import com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class MigrationContextInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String secondaryDbName = request.getParameter("secondaryDbName");
        String oldAttachmentPath = request.getParameter("oldAttachmentPath");
        if (secondaryDbName != null || oldAttachmentPath != null) {
            MasterChecklistMigrationService.setMigrationContext(secondaryDbName, oldAttachmentPath);
        }

        String sqlIp = request.getParameter("sqlIp");
        String sqlUsername = request.getParameter("sqlUsername");
        String sqlPassword = request.getParameter("sqlPassword");
        if (sqlIp != null || sqlUsername != null || sqlPassword != null) {
            MigrationCredentialsContext.setCredentials(sqlIp, sqlUsername, sqlPassword);
        }

        // Skip audit trail generation for all migration endpoints
        com.autonoma.erp.util.AuditContextHolder.setSkipAudit(true);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
            Exception ex) {
        MasterChecklistMigrationService.clearMigrationContext();
        MigrationCredentialsContext.clear();
    }
}
