package com.autonoma.erp.modules.platform.notification.service;

import com.autonoma.erp.modules.platform.notification.entity.EmailContent;
import com.autonoma.erp.modules.platform.notification.repository.EmailContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class EmailContentService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "CALL LETTER",
        "OFFER LETTER",
        "DOCUMENT REUPLOAD",
        "BACKGROUND VERIFICATION",
        "REJECTION"
    );

    @Autowired
    private EmailContentRepository repository;

    @Autowired
    private EmailDefaultTemplates defaultTemplates;

    public List<EmailContent> getAll() {
        return repository.findAll();
    }

    public Optional<EmailContent> getById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    public Optional<EmailContent> getActiveTemplateByType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return Optional.empty();
        }
        List<EmailContent> list = repository.findByTypeIgnoreCaseAndIsActiveOrderByIdDesc(type.trim(), true);
        if ((list == null || list.isEmpty()) && "REJECTION".equalsIgnoreCase(type.trim())) {
            list = repository.findByTypeIgnoreCaseAndIsActiveOrderByIdDesc("REJECTED", true);
        } else if ((list == null || list.isEmpty()) && "REJECTED".equalsIgnoreCase(type.trim())) {
            list = repository.findByTypeIgnoreCaseAndIsActiveOrderByIdDesc("REJECTION", true);
        }
        if (list == null || list.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(list.get(0));
    }

    @Autowired
    private EmailTemplateEngine emailTemplateEngine;

    public EmailContent getTemplateOrApplicationDefault(String type) {
        if (type == null || type.trim().isEmpty()) {
            return defaultTemplates.getDefaultTemplate("GENERAL");
        }
        EmailContent template = null;
        Optional<EmailContent> activeOpt = getActiveTemplateByType(type.trim());
        if (activeOpt.isPresent()) {
            template = activeOpt.get();
        }

        if (template == null) {
            template = defaultTemplates.getDefaultTemplate(type.trim());
        } else {
            // Return a sanitized copy so legacy DB templates don't show duplicate sections
            EmailContent copy = new EmailContent();
            copy.setId(template.getId());
            copy.setType(template.getType());
            copy.setSubject(template.getSubject());
            copy.setYoursWindfully(template.getYoursWindfully());
            copy.setIsActive(template.getIsActive());
            copy.setIncludeCompanyFooter(template.getIncludeCompanyFooter());
            copy.setIncludeWebsite(template.getIncludeWebsite());
            copy.setIncludeLocation(template.getIncludeLocation());
            copy.setFooterHeader(template.getFooterHeader());
            copy.setFooterContent(template.getFooterContent());
            copy.setUseCurrentUserCredentials(template.getUseCurrentUserCredentials());
            copy.setBodyContent(emailTemplateEngine.sanitizeLegacyBodyContent(template.getBodyContent()));
            template = copy;
        }

        return template;
    }

    public EmailContent getTemplateOrThrow(String type) {
        if (type == null || type.trim().isEmpty()) {
            throw new RuntimeException("Email template type is not specified.");
        }
        Optional<EmailContent> activeOpt = getActiveTemplateByType(type.trim());
        if (activeOpt.isEmpty()) {
            String displayName = type.trim();
            if ("CALL LETTER".equalsIgnoreCase(displayName)) displayName = "Call Letter";
            else if ("OFFER LETTER".equalsIgnoreCase(displayName)) displayName = "Offer Letter";
            else if ("BACKGROUND VERIFICATION".equalsIgnoreCase(displayName)) displayName = "Background Verification";
            else if ("DOCUMENT REUPLOAD".equalsIgnoreCase(displayName)) displayName = "Document Reupload";
            else if ("REJECTION".equalsIgnoreCase(displayName) || "REJECTED".equalsIgnoreCase(displayName)) displayName = "Rejection";
            
            throw new RuntimeException("There is no Email Content configured for " + displayName + ".");
        }
        
        EmailContent template = activeOpt.get();
        EmailContent copy = new EmailContent();
        copy.setId(template.getId());
        copy.setType(template.getType());
        copy.setSubject(template.getSubject());
        copy.setYoursWindfully(template.getYoursWindfully());
        copy.setIsActive(template.getIsActive());
        copy.setIncludeCompanyFooter(template.getIncludeCompanyFooter());
        copy.setIncludeWebsite(template.getIncludeWebsite());
        copy.setIncludeLocation(template.getIncludeLocation());
        copy.setFooterHeader(template.getFooterHeader());
        copy.setFooterContent(template.getFooterContent());
        copy.setUseCurrentUserCredentials(template.getUseCurrentUserCredentials());
        copy.setBodyContent(emailTemplateEngine.sanitizeLegacyBodyContent(template.getBodyContent()));
        return copy;
    }


    @Autowired(required = false)
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Transactional
    public EmailContent save(EmailContent entity, String currentUser) {
        if (entity != null) {
            emailTemplateEngine.validateSenderProfile(entity);
        }
        // Validation
        if (entity.getType() == null || entity.getType().trim().isEmpty()) {
            throw new RuntimeException("Type is mandatory.");
        }

        String targetType = entity.getType().trim().toUpperCase();
        if (entity.getId() == null) {
            if (!ALLOWED_TYPES.contains(targetType)) {
                throw new RuntimeException("Invalid Email Content type: " + entity.getType() + ". Only CALL LETTER, OFFER LETTER, DOCUMENT REUPLOAD, BACKGROUND VERIFICATION, and REJECTION are allowed.");
            }
        } else {
            EmailContent existing = repository.findById(entity.getId())
                    .orElseThrow(() -> new RuntimeException("Email Content not found."));
            if (!existing.getType().trim().equalsIgnoreCase(entity.getType().trim())) {
                if (!ALLOWED_TYPES.contains(targetType)) {
                    throw new RuntimeException("Invalid Email Content type: " + entity.getType() + ". Only CALL LETTER, OFFER LETTER, DOCUMENT REUPLOAD, BACKGROUND VERIFICATION, and REJECTION are allowed.");
                }
            }
        }
        if (entity.getSubject() == null || entity.getSubject().trim().isEmpty()) {
            throw new RuntimeException("Subject is mandatory.");
        }
        if (entity.getBodyContent() == null || entity.getBodyContent().trim().isEmpty()) {
            throw new RuntimeException("Body/Content is mandatory.");
        }

        // Validate Company Profile settings for Website & Location toggles
        if (!Boolean.FALSE.equals(entity.getIncludeCompanyFooter())) {
            com.autonoma.erp.model.admin.CompanyCredential company = null;
            if (companyCredentialService != null) {
                company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            }

            if (Boolean.TRUE.equals(entity.getIncludeWebsite())) {
                String site = (company != null && company.getWebsite() != null) ? company.getWebsite().trim() : "";
                if (site.isBlank() || "#".equals(site)) {
                    throw new RuntimeException("Cannot enable Website button: Company Website is not configured in Company Profile (Administration → Company Profile → Contact & Web).");
                }
            }

            if (Boolean.TRUE.equals(entity.getIncludeLocation())) {
                String map = (company != null && company.getGmaplink() != null) ? company.getGmaplink().trim() : "";
                if (map.isBlank() || "#".equals(map)) {
                    throw new RuntimeException("Cannot enable Location button: Company Location Map Link is not configured in Company Profile (Administration → Company Profile → Contact & Web).");
                }
            }
        }


        // Apply rules for active status:
        // When a new record is created duplicately(type) the previous record(original record) should become inactive on its own
        if (Boolean.TRUE.equals(entity.getIsActive())) {
            List<EmailContent> allOthers = repository.findByTypeIgnoreCaseAndIsActiveOrderByIdDesc(entity.getType().trim(), true);
            for (EmailContent other : allOthers) {
                if (entity.getId() == null || !other.getId().equals(entity.getId())) {
                    if (Boolean.TRUE.equals(other.getIsActive())) {
                        other.setIsActive(false);
                        repository.save(other);
                    }
                }
            }
        }

        if (entity.getId() == null) {
            entity.setCreatedAt(new Date());
            entity.setCreatedBy(currentUser);
            if (entity.getIsActive() == null) {
                entity.setIsActive(true);
            }
        } else {
            Long entityId = entity.getId();
            if (entityId == null) {
                throw new RuntimeException("ID is mandatory for update.");
            }
            EmailContent existing = repository.findById(entityId)
                    .orElseThrow(() -> new RuntimeException("Email Content not found."));
            existing.setType(entity.getType());
            existing.setSubject(entity.getSubject());
            existing.setBodyContent(entity.getBodyContent());
            existing.setYoursWindfully(entity.getYoursWindfully());
            existing.setIncludeCompanyFooter(entity.getIncludeCompanyFooter());
            existing.setIncludeWebsite(entity.getIncludeWebsite());
            existing.setIncludeLocation(entity.getIncludeLocation());
            existing.setFooterHeader(entity.getFooterHeader());
            existing.setFooterContent(entity.getFooterContent());
            existing.setUseCurrentUserCredentials(entity.getUseCurrentUserCredentials());
            existing.setIsActive(entity.getIsActive() != null ? entity.getIsActive() : existing.getIsActive());
            existing.setUpdatedAt(new Date());
            existing.setUpdatedBy(currentUser);
            entity = existing;
        }

        if (Boolean.TRUE.equals(entity.getUseCurrentUserCredentials())) {
            entity.setFooterContent(null);
        }
        return repository.save(entity);
    }

    public Long getNextSequence() {
        Long maxId = repository.findMaxId();
        return (maxId == null ? 0L : maxId) + 1;
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) {
            throw new RuntimeException("ID is mandatory for delete.");
        }
        repository.deleteById(id);
    }

    public java.util.Map<String, String> getSenderPreviewDetails() {
        return emailTemplateEngine.getSenderPreviewDetails();
    }
}
