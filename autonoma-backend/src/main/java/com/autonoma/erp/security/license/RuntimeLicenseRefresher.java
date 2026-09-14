package com.autonoma.erp.security.license;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RuntimeLicenseRefresher {

    private static final Logger log = LoggerFactory.getLogger(RuntimeLicenseRefresher.class);

    @Autowired
    private SystemStateVerifier verifier;

    @Autowired
    private ConfigurableApplicationContext applicationContext;

    /**
     * Executes periodic licensing health check every hour (3,600,000 milliseconds).
     */
    @Scheduled(fixedRate = 3600000)
    public void executeContextRefresh() {
        try {
            // Invokes the obfuscated verification logic
            verifier.refreshContextState();
        } catch (Exception e) {
            log.error("License validation failed during periodic check: {}. Application will terminate.", e.getMessage());
            shutdownSystem();
        }
    }

    private void shutdownSystem() {
        log.warn("Terminating Spring context gracefully...");
        try {
            applicationContext.close();
        } catch (Exception e) {
            log.error("Error closing application context", e);
        } finally {
            System.exit(1);
        }
    }
}
