package com.autonoma.erp.config;


import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class HibernateFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* com.autonoma.erp.repository..*Repository.*(..)) && !execution(* com.autonoma.erp.modules.master.organization.repository.DivisionRepository.*(..))")
    public void enableDivisionFilter() {
        Long currentDivisionId = DivisionContextHolder.getDivisionId();
        if (currentDivisionId != null) {
            try {
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("divisionFilter").setParameter("activeDivisionId", currentDivisionId);
            } catch (Exception ignored) {
            }
        }
    }
}
