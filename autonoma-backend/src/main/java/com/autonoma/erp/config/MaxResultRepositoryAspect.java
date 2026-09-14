package com.autonoma.erp.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class MaxResultRepositoryAspect {

    /**
     * Repositories excluded from the maxResult cap.
     * These are system/configuration tables that must always return complete data.
     * Adding a repository class name here prevents it from being truncated by ?maxResult=N.
     */
    private static final java.util.Set<String> EXCLUDED_REPOSITORIES = java.util.Set.of(
        "com.autonoma.erp.repository.admin.BosPageRepository",
        "com.autonoma.erp.repository.admin.BosUserPageAuthRepository",
        "com.autonoma.erp.repository.admin.UserRepository",
        "com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository",
        "com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository",
        "com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository",
        "com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository",
        "com.autonoma.erp.modules.hra.recruitment.repository.InterviewMasterRepository"
    );

    @Around("execution(* org.springframework.data.repository.CrudRepository+.findAll()) || " +
            "execution(* org.springframework.data.repository.PagingAndSortingRepository+.findAll(org.springframework.data.domain.Sort))")
    public Object aroundFindAll(ProceedingJoinPoint joinPoint) throws Throwable {
        // Always skip excluded repositories — they are metadata/config tables and must
        // return their full dataset regardless of the maxResult query parameter.
        Object proxy = joinPoint.getThis();
        if (proxy != null) {
            for (Class<?> iface : proxy.getClass().getInterfaces()) {
                if (EXCLUDED_REPOSITORIES.contains(iface.getName())) {
                    return joinPoint.proceed();
                }
            }
        }

        ServletRequestAttributes sra = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (sra != null) {
            String maxResultStr = sra.getRequest().getParameter("maxResult");
            if (maxResultStr != null && !maxResultStr.trim().isEmpty()) {
                try {
                    int maxResult = Integer.parseInt(maxResultStr.trim());
                    if (maxResult > 0) {
                        if (proxy instanceof org.springframework.data.repository.PagingAndSortingRepository) {
                            org.springframework.data.repository.PagingAndSortingRepository repo = (org.springframework.data.repository.PagingAndSortingRepository) proxy;

                            Object[] args = joinPoint.getArgs();
                            org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.unsorted();
                            if (args.length > 0 && args[0] instanceof org.springframework.data.domain.Sort) {
                                sort = (org.springframework.data.domain.Sort) args[0];
                            }

                            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest
                                    .of(0, maxResult, sort);

                            org.springframework.data.domain.Page<?> page = repo.findAll(pageable);
                            return page.getContent();
                        }
                    }
                } catch (NumberFormatException e) {
                    // Ignore format exception
                }
            }
        }
        return joinPoint.proceed();
    }
}
