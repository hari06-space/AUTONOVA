package com.autonoma.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@SpringBootApplication
@EnableScheduling
@org.springframework.scheduling.annotation.EnableAsync
public class AutonomaBackendApplication {

	private final com.autonoma.erp.modules.qms.audit.service.AuditSchedulerEngine auditSchedulerEngine;

	public AutonomaBackendApplication(
			com.autonoma.erp.modules.qms.audit.service.AuditSchedulerEngine auditSchedulerEngine) {
		this.auditSchedulerEngine = auditSchedulerEngine;
	}

	public static void main(String[] args) {
		SpringApplication.run(AutonomaBackendApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void onApplicationReady() {
		System.out.println("\n==================================================");
		System.out.println("application started");
		System.out.println("==================================================\n");
		if (auditSchedulerEngine != null) {
			try {
				auditSchedulerEngine.generateScheduledAudits(new java.util.Date());
			} catch (Exception e) {
				System.err.println("Failed to run startup audit schedule generation: " + e.getMessage());
			}
		}
	}

}
