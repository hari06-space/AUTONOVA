package com.autonoma.erp.config;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class HibernateConfig {

    @Autowired
    @org.springframework.context.annotation.Lazy
    private GlobalAuditInterceptor globalAuditInterceptor;

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return (Map<String, Object> hibernateProperties) -> {
            hibernateProperties.put(AvailableSettings.INTERCEPTOR, globalAuditInterceptor);
        };
    }
}
