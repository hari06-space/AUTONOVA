package com.autonoma.erp.config;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.master.organization.repository.DivisionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
@Order(2)
public class DefaultDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultDataInitializer.class);

    @Autowired
    private CompanyCredentialRepository companyCredentialRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DivisionRepository divisionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            TenantContextHolder.setTenantId("AUTONOMA");
            
            // 1. Ensure default CompanyCredential exists
            CompanyCredential company = null;
            List<CompanyCredential> companies = companyCredentialRepository.findAll();
            if (companies.isEmpty()) {
                CompanyCredential defaultCred = new CompanyCredential();
                defaultCred.setCompanyName("Autonoma");
                defaultCred.setShortName("AUTONOMA");
                defaultCred.setClientCode("123456");
                defaultCred.setDbSourceName("AUTONOMA");
                defaultCred.setIsActive(true);
                company = companyCredentialRepository.save(defaultCred);
                log.info("[DefaultDataInitializer] Seeded default CompanyCredential (clientCode: 123456)");
            } else {
                company = companies.get(0);
                for (CompanyCredential cred : companies) {
                    if (cred.getClientCode() == null || cred.getClientCode().trim().isEmpty()) {
                        cred.setClientCode("123456");
                        companyCredentialRepository.save(cred);
                        log.info("[DefaultDataInitializer] Fixed missing clientCode for company: {}", cred.getCompanyName());
                    }
                }
            }

            // 2. Ensure default admin UserCredential exists
            if (!userRepository.findByUserId("admin").isPresent()) {
                UserCredential adminUser = new UserCredential();
                adminUser.setUserId("admin");
                adminUser.setPassword(passwordEncoder.encode("admin123"));
                adminUser.setStatus(1);
                adminUser.setIsActive(true);
                adminUser.setCreatedBy("SYSTEM");
                adminUser.setCreatedDate(new Date());
                userRepository.save(adminUser);
                log.info("[DefaultDataInitializer] Seeded default admin user (username: admin, password: admin123)");
            }

            // 3. Ensure default Division exists
            List<Division> divisions = divisionRepository.findAll();
            if (divisions.isEmpty() && company != null) {
                Division defaultDiv = new Division();
                defaultDiv.setDivisionName("HEAD OFFICE");
                defaultDiv.setCompanyId(company.getId());
                defaultDiv.setCreatedBy("SYSTEM");
                defaultDiv.setCreatedDate(new Date());
                divisionRepository.save(defaultDiv);
                log.info("[DefaultDataInitializer] Seeded default Division (HEAD OFFICE)");
            }
        } catch (Exception e) {
            log.error("[DefaultDataInitializer] Error seeding default master data", e);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
