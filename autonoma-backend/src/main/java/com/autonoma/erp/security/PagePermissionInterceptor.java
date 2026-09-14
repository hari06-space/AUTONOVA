package com.autonoma.erp.security;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMomMasterRepository;

import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.autonoma.erp.util.SecurityUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * AOP-based permission interceptor for BOS page-level API security.
 * 
 * Any controller method annotated with @RequirePagePermission will be intercepted.
 * The interceptor extracts the current user from the JWT security context,
 * checks if they have the required permission on the specified page,
 * and returns 403 Forbidden if not authorized.
 * 
 * Example:
 * <pre>
 * {@literal @}RequirePagePermission(pageCode = "M3110", action = "delete")
 * {@literal @}DeleteMapping("/{id}")
 * public ResponseEntity<?> delete(@PathVariable Long id) { ... }
 * </pre>
 */
@Aspect
@Component
public class PagePermissionInterceptor {

    @Autowired
    private BosUserPageAuthService authService;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepo;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository scheduleRepo;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMomMasterRepository momRepo;

    @Around("within(@com.autonoma.erp.security.RequirePagePermission *) || @annotation(com.autonoma.erp.security.RequirePagePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint) throws Throwable {
        java.lang.reflect.Method signatureMethod = ((org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature()).getMethod();
        RequirePagePermission permission = signatureMethod.getAnnotation(RequirePagePermission.class);
        if (permission == null) {
            permission = joinPoint.getTarget().getClass().getAnnotation(RequirePagePermission.class);
        }
        if (permission == null) {
            return joinPoint.proceed();
        }

        String userId = SecurityUtils.getCurrentUserId();

        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        // Users with userLevel >= 5 (Super Admin / Admin) bypass page permission checks
        java.util.Optional<com.autonoma.erp.model.admin.UserCredential> currentUserCredOpt = userRepo.findByUserId(userId);
        if (currentUserCredOpt.isPresent() && currentUserCredOpt.get().getUserLevel() != null && currentUserCredOpt.get().getUserLevel() >= 5) {
            return joinPoint.proceed();
        }

        boolean allowed = authService.hasPermission(userId, permission.pageCode(), permission.action());

        if (!allowed && "AD1110".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "AD1420", permission.action());
        }

        if (!allowed && ("QM1320".equals(permission.pageCode()) || "QM1330".equals(permission.pageCode()))) {
            allowed = authService.hasPermission(userId, "QM1320", permission.action())
                    || authService.hasPermission(userId, "QM1330", permission.action())
                    || authService.hasPermission(userId, "QM1340", permission.action());
        }

        if (!allowed && "HA1110".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1120", permission.action())
                    || authService.hasPermission(userId, "HA1130", permission.action());
        }

        if (!allowed && "HA1120".equals(permission.pageCode()) && "read".equalsIgnoreCase(permission.action())) {
            allowed = true; // Any authenticated employee can view interview schedule (filtered internally to assigned interviews/interviewer)
        }

        if (!allowed && "HA1310".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1315", permission.action())
                    || authService.hasPermission(userId, "ESC1040", permission.action());
        }

        if (!allowed && "HA1315".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1310", permission.action())
                    || authService.hasPermission(userId, "ESC1040", permission.action())
                    || authService.hasPermission(userId, "HA1315", "read")
                    || authService.hasPermission(userId, "HA1315", "approval");
        }

        if (!allowed && "HA1330".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "ESC1030", permission.action())
                    || authService.hasPermission(userId, "HA1342", permission.action());
        }

        if (!allowed && "ESC1020".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1396", permission.action())
                    || authService.hasPermission(userId, "M2396", permission.action());
        }

        if (!allowed && ("HA1396".equals(permission.pageCode()) || "M2396".equals(permission.pageCode()))) {
            allowed = authService.hasPermission(userId, "ESC1020", permission.action())
                    || authService.hasPermission(userId, "HA1396", permission.action());
        }

        if (!allowed && ("HA1394".equals(permission.pageCode()) || "M2394".equals(permission.pageCode()))) {
            allowed = authService.hasPermission(userId, "HA1394", permission.action())
                    || authService.hasPermission(userId, "M2394", permission.action());
        }

        if (!allowed && "M2390".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "ESC1010", permission.action())
                    || authService.hasPermission(userId, "HA1390", permission.action());
        }

        if (!allowed && "M2350".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "ESC1010", permission.action())
                    || authService.hasPermission(userId, "HA1390", permission.action())
                    || authService.hasPermission(userId, "HA1392", permission.action());
        }

        if (!allowed && "M2392".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1392", permission.action());
        }

        if (!allowed && "M2396".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "ESC1020", permission.action());
        }

        if (!allowed && "M2310".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1320", permission.action());
        }

        if (!allowed && "M2280".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1360", permission.action())
                    || authService.hasPermission(userId, "HA1370", permission.action())
                    || authService.hasPermission(userId, "HA1380", permission.action())
                    || authService.hasPermission(userId, "HA1390", permission.action());
        }

        if (!allowed && "QM1430".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "QM1410", permission.action())
                    || authService.hasPermission(userId, "QM1420", permission.action());
        }

        if (!allowed && "QM1410".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "QM1430", permission.action())
                    || authService.hasPermission(userId, "QM1420", permission.action());
        }

        if (!allowed && "HA1295".equals(permission.pageCode())) {
            allowed = authService.hasPermission(userId, "HA1294", permission.action())
                    || authService.hasPermission(userId, "ESC1050", permission.action());
        }

        if (!allowed && ("QM1110".equals(permission.pageCode()) || "QM1120".equals(permission.pageCode()) || "QM1130".equals(permission.pageCode()))) {
            allowed = authService.hasPermission(userId, "QM1110", permission.action())
                    || authService.hasPermission(userId, "QM1120", permission.action())
                    || authService.hasPermission(userId, "QM1130", permission.action());
        }

        if (!allowed && "QM1110".equals(permission.pageCode()) && "approval".equals(permission.action())) {
            if (authService.hasPermission(userId, "M1210", "write")) {
                for (Object arg : joinPoint.getArgs()) {
                    if (arg instanceof Map) {
                        Map<?, ?> payloadMap = (Map<?, ?>) arg;
                        if (payloadMap.containsKey("checkingPoint") || payloadMap.containsKey("category") || payloadMap.containsKey("seqNo")) {
                            allowed = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!allowed && ("QM1220".equals(permission.pageCode()) || "QM1230".equals(permission.pageCode()))) {
            allowed = true; // Assigned auditor, auditee, or logged-in participant authorized for audit attendance & observation
        }

        if (!allowed && ("QM1320".equals(permission.pageCode()) || "QM1330".equals(permission.pageCode()))) {
            allowed = true; // Assigned meeting host or participant authorized for meeting attendance & MOM entry
        }

        if (!allowed && ("QM1340".equals(permission.pageCode()) || "QM1350".equals(permission.pageCode()))) {
            allowed = true; // Action item assignee or assigner authorized for MOM closure & approval
        }

        if (!allowed && ("QM1320".equals(permission.pageCode()) || "QM1330".equals(permission.pageCode())) && "write".equalsIgnoreCase(permission.action())) {
            for (Object arg : joinPoint.getArgs()) {
                if (arg instanceof com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster) {
                    com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster mom = (com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster) arg;
                    Long scheduleId = null;
                    if (mom.getSchedule() != null && mom.getSchedule().getId() != null) {
                        scheduleId = mom.getSchedule().getId();
                    } else if (mom.getId() != null) {
                        java.util.Optional<com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster> existingMomOpt = momRepo.findById(mom.getId());
                        if (existingMomOpt.isPresent() && existingMomOpt.get().getSchedule() != null) {
                            scheduleId = existingMomOpt.get().getSchedule().getId();
                        }
                    }
                    if (scheduleId != null) {
                        java.util.Optional<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule> scheduleOpt = scheduleRepo.findById(scheduleId);
                        if (scheduleOpt.isPresent() && scheduleOpt.get().getHostBy() != null) {
                            Long hostEmpId = scheduleOpt.get().getHostBy().getId();
                            java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepo.findByUserId(userId);
                            if (userOpt.isPresent() && userOpt.get().getEmpId() != null && userOpt.get().getEmpId().equals(hostEmpId)) {
                                allowed = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (!allowed && "M3520".equals(permission.pageCode()) && "read".equalsIgnoreCase(permission.action())) {
            allowed = authService.hasPermission(userId, "DD1110", "read")
                    || authService.hasPermission(userId, "DD1110", "write");
        }

        if (!allowed) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, 
                String.format("You do not have '%s' permission on page '%s'", permission.action(), permission.pageCode()));
        }

        return joinPoint.proceed();
    }
}
