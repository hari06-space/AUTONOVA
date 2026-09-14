package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerConfig;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerLog;
import com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerConfigRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class AuditSchedulerConfigService {

    private final AuditSchedulerConfigRepository repository;
    private final AuditSchedulerLogRepository logRepository;
    private final AuditSchedulerEngine schedulerEngine;
    private final com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    public AuditSchedulerConfigService(
            AuditSchedulerConfigRepository repository,
            AuditSchedulerLogRepository logRepository,
            AuditSchedulerEngine schedulerEngine,
            com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.logRepository = logRepository;
        this.schedulerEngine = schedulerEngine;
        this.auditScheduleRepository = auditScheduleRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @jakarta.annotation.PostConstruct
    public void initSchemaColumns() {
        try {
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[QMS_AUDIT_SCHEDULER_CONFIG]') AND name = N'PARENT_AUDIT_SCHEDULE_ID') " +
                "BEGIN ALTER TABLE QMS_AUDIT_SCHEDULER_CONFIG ADD PARENT_AUDIT_SCHEDULE_ID BIGINT NULL; END"
            );
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[QMS_AUDIT_SCHEDULE]') AND name = N'CONFIG_ID') " +
                "BEGIN ALTER TABLE QMS_AUDIT_SCHEDULE ADD CONFIG_ID BIGINT NULL; END"
            );
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[QMS_AUDIT_SCHEDULE]') AND name = N'UPDATE_CONFIG') " +
                "BEGIN ALTER TABLE QMS_AUDIT_SCHEDULE ADD UPDATE_CONFIG BIT NULL; END"
            );
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuditSchedulerConfigService.class).warn("Auto-migration of schema columns for audit scheduler failed: {}", e.getMessage());
        }
    }

    public List<AuditSchedulerConfig> getAllConfigs() {
        return repository.findAll();
    }

    public AuditSchedulerConfig getConfigById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Transactional
    public AuditSchedulerConfig saveConfig(AuditSchedulerConfig config) {
        if (config.getId() == null) {
            config.setCreatedBy("SYSTEM");
            config.setCreatedDate(new Date());
        } else {
            config.setUpdatedBy("SYSTEM");
            config.setUpdatedDate(new Date());
        }
        AuditSchedulerConfig savedConfig = repository.save(config);

        // Sync changes to existing schedules linked to this config ID or config code
        try {
            List<com.autonoma.erp.modules.qms.audit.entity.AuditSchedule> linkedSchedules = auditScheduleRepository.findByConfigId(savedConfig.getId());
            if (linkedSchedules == null || linkedSchedules.isEmpty()) {
                if (savedConfig.getConfigCode() != null) {
                    com.autonoma.erp.modules.qms.audit.entity.AuditSchedule matchCode = auditScheduleRepository.findByScheduleNoIgnoreCase(savedConfig.getConfigCode()).orElse(null);
                    if (matchCode != null) {
                        matchCode.setConfigId(savedConfig.getId());
                        auditScheduleRepository.save(matchCode);
                        linkedSchedules = java.util.Collections.singletonList(matchCode);
                    }
                }
            }

            if (linkedSchedules != null && !linkedSchedules.isEmpty()) {
                for (com.autonoma.erp.modules.qms.audit.entity.AuditSchedule sch : linkedSchedules) {
                    sch.setConfigId(savedConfig.getId());
                    if (savedConfig.getFrequency() != null) sch.setFrequency(savedConfig.getFrequency());
                    if (savedConfig.getWeekDays() != null) sch.setWeekDays(savedConfig.getWeekDays());
                    if (savedConfig.getStartTime() != null) sch.setStartTime(savedConfig.getStartTime());
                    if (savedConfig.getEndTime() != null) sch.setEndTime(savedConfig.getEndTime());
                    if (savedConfig.getAuditTypeId() != null) sch.setAuditTypeId(savedConfig.getAuditTypeId());
                    if (savedConfig.getDepartmentId() != null) sch.setDepartmentId(savedConfig.getDepartmentId());
                    if (savedConfig.getAuditAreaId() != null) sch.setAuditAreaId(savedConfig.getAuditAreaId());
                    if (savedConfig.getRepeatEveryValue() != null) sch.setRepeatEveryValue(savedConfig.getRepeatEveryValue());
                    if (savedConfig.getRepeatEveryUnit() != null) sch.setRepeatEveryUnit(savedConfig.getRepeatEveryUnit());
                    if (savedConfig.getCriteriaMinCount() != null) sch.setCriteriaMinCount(savedConfig.getCriteriaMinCount());
                    auditScheduleRepository.save(sch);
                }
            }

            // Automatically trigger / process next schedule if active
            if (Boolean.TRUE.equals(savedConfig.getStatus())) {
                try {
                    schedulerEngine.processConfig(savedConfig, new Date());
                } catch (Exception e) {
                    // Ignore duplicate or skip exceptions during auto-sync
                }
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuditSchedulerConfigService.class).error("Error syncing AuditSchedulerConfig to AuditSchedule", e);
        }

        return savedConfig;
    }

    @Transactional
    public void deleteConfig(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public AuditSchedulerConfig toggleActive(Long id) {
        AuditSchedulerConfig config = repository.findById(id).orElse(null);
        if (config != null) {
            config.setStatus(!Boolean.TRUE.equals(config.getStatus()));
            config.setUpdatedBy("SYSTEM");
            config.setUpdatedDate(new Date());
            return repository.save(config);
        }
        return null;
    }

    public List<AuditSchedulerLog> getLogsForConfig(Long configId) {
        return logRepository.findByConfigIdOrderByTriggerTimeDesc(configId);
    }

    @Transactional
    public void runNow(Long id, String dateStr) {
        AuditSchedulerConfig config = repository.findById(id).orElse(null);
        if (config != null) {
            if (config.getFrequency() == null || "NONE".equalsIgnoreCase(config.getFrequency().trim())) {
                org.slf4j.LoggerFactory.getLogger(AuditSchedulerConfigService.class).info("Config ID {} has Frequency NONE or null. Skipping manual trigger.", id);
                return;
            }
            Date targetDate = new Date();
            if (dateStr != null && !dateStr.trim().isEmpty()) {
                try {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                    targetDate = sdf.parse(dateStr);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid date format. Expected yyyy-MM-dd");
                }
            }
            schedulerEngine.processConfig(config, targetDate);
        }
    }

    @Transactional
    public void runAll(String dateStr) {
        Date targetDate = new Date();
        if (dateStr != null && !dateStr.trim().isEmpty()) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                targetDate = sdf.parse(dateStr);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid date format. Expected yyyy-MM-dd");
            }
        }
        schedulerEngine.generateScheduledAudits(targetDate);
    }
}
