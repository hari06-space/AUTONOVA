package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository;
import com.autonoma.erp.modules.qms.audit.entity.AuditCriteria;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.entity.AuditScheduleCriteria;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerConfig;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerLog;
import com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerConfigRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditSchedulerLogRepository;
import com.autonoma.erp.util.HolidayValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class AuditSchedulerEngine {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditSchedulerEngine.class);

    private final AuditSchedulerConfigRepository configRepository;
    private final AuditSchedulerLogRepository logRepository;
    private final AuditScheduleRepository auditScheduleRepository;
    private final EmployeeMasterRepository employeeMasterRepository;
    private final LeaveEntryRepository leaveEntryRepository;
    private final AuditCriteriaRepository auditCriteriaRepository;
    private final AuditScheduleService auditScheduleService;

    @org.springframework.beans.factory.annotation.Autowired
    public AuditSchedulerEngine(
            AuditSchedulerConfigRepository configRepository,
            AuditSchedulerLogRepository logRepository,
            AuditScheduleRepository auditScheduleRepository,
            EmployeeMasterRepository employeeMasterRepository,
            LeaveEntryRepository leaveEntryRepository,
            AuditCriteriaRepository auditCriteriaRepository,
            AuditScheduleService auditScheduleService) {
        this.configRepository = configRepository;
        this.logRepository = logRepository;
        this.auditScheduleRepository = auditScheduleRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.leaveEntryRepository = leaveEntryRepository;
        this.auditCriteriaRepository = auditCriteriaRepository;
        this.auditScheduleService = auditScheduleService;
    }

    @Transactional
    public void generateScheduledAudits(Date targetDate) {
        log.info("Starting Auto-Generation & Rotation engine run for target date: {}", targetDate);
        List<AuditSchedulerConfig> configs = configRepository.findAll();

        for (AuditSchedulerConfig config : configs) {
            if (config.getStatus() != null && config.getStatus()) {
                if (config.getFrequency() == null || "NONE".equalsIgnoreCase(config.getFrequency().trim())) {
                    log.info("Config ID {} has Frequency NONE or null. Skipping auto-trigger.", config.getId());
                    continue;
                }
                try {
                    processConfig(config, targetDate);
                } catch (Exception e) {
                    log.error("Failed executing configuration code: {}", config.getConfigCode(), e);
                }
            }
        }
    }

    @Transactional
    public void processConfig(AuditSchedulerConfig config, Date targetDate) {
        if (config == null || config.getFrequency() == null || "NONE".equalsIgnoreCase(config.getFrequency().trim())) {
            log.info("Config has Frequency NONE or null. Skipping trigger processing.");
            return;
        }
        long startTime = System.currentTimeMillis();
        int successCount = 0;
        int failureCount = 0;
        String errorMsg = null;
        String status = "COMPLETED";

        try {
            LocalDate localTarget = convertToLocalDate(targetDate != null ? targetDate : new Date());
            LocalDate targetHorizon = localTarget.plusMonths(1).with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

            List<AuditSchedule> existingSchedules = auditScheduleRepository.findByFiltersLikeList(null, null).stream()
                    .filter(s -> (config.getId() != null && config.getId().equals(s.getConfigId()))
                            || (config.getParentAuditScheduleId() != null && (config.getParentAuditScheduleId().equals(s.getParentId()) || config.getParentAuditScheduleId().equals(s.getId())))
                            || (config.getAuditTypeId() != null && config.getAuditTypeId().equals(s.getAuditTypeId())
                                    && Objects.equals(config.getDepartmentId(), s.getDepartmentId())
                                    && Objects.equals(config.getAuditAreaId(), s.getAuditAreaId())))
                    .filter(s -> s.getAuditDate() != null && !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                    .sorted((s1, s2) -> s2.getAuditDate().compareTo(s1.getAuditDate()))
                    .toList();

            LocalDate candidateDate;
            if (!existingSchedules.isEmpty()) {
                LocalDate latestAuditDate = convertToLocalDate(existingSchedules.get(0).getAuditDate());
                candidateDate = computeNextAuditDate(latestAuditDate, config.getFrequency(), config.getRepeatEveryValue(), config.getRepeatEveryUnit());
            } else if (config.getParentAuditScheduleId() != null) {
                Optional<AuditSchedule> parentOpt = auditScheduleRepository.findById(config.getParentAuditScheduleId());
                if (parentOpt.isPresent() && parentOpt.get().getAuditDate() != null) {
                    LocalDate parentDate = convertToLocalDate(parentOpt.get().getAuditDate());
                    candidateDate = computeNextAuditDate(parentDate, config.getFrequency(), config.getRepeatEveryValue(), config.getRepeatEveryUnit());
                } else {
                    candidateDate = localTarget;
                }
            } else {
                candidateDate = localTarget;
            }

            while (candidateDate != null && !candidateDate.isAfter(targetHorizon)) {
                LocalDate adjustedDate = adjustToNextWorkingDay(candidateDate);
                Date executionDate = Date.from(adjustedDate.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant());

                // Check duplicates for this candidate date or same month for monthly frequency
                boolean duplicateExists = auditScheduleRepository.findByFiltersLikeList(null, null).stream()
                        .filter(s -> s.getAuditDate() != null && !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                        .filter(s -> (config.getId() != null && config.getId().equals(s.getConfigId()))
                                || (config.getParentAuditScheduleId() != null && config.getParentAuditScheduleId().equals(s.getParentId()))
                                || (config.getAuditTypeId() != null && config.getAuditTypeId().equals(s.getAuditTypeId())
                                        && Objects.equals(config.getDepartmentId(), s.getDepartmentId())
                                        && Objects.equals(config.getAuditAreaId(), s.getAuditAreaId())))
                        .anyMatch(s -> {
                            LocalDate sDate = convertToLocalDate(s.getAuditDate());
                            if ("MONTHLY".equalsIgnoreCase(config.getFrequency())) {
                                return sDate.getYear() == adjustedDate.getYear() && sDate.getMonthValue() == adjustedDate.getMonthValue();
                            }
                            return sDate.isEqual(adjustedDate);
                        });

                if (duplicateExists) {
                    log.info("Schedule already exists for config ID {} on/around {}. Skipping candidate date.",
                            config.getId(), adjustedDate);
                } else {
                    // Choose auditor and auditee via rotation
                    EmployeeMaster auditor = selectNextRotatedEmployee(config, executionDate, true);
                    EmployeeMaster auditee = selectNextRotatedEmployee(config, executionDate, false);
                    EmployeeMaster ncrApprover = selectNextRotatedNcrApprover(config, executionDate, auditor, auditee);

                    if (auditor == null || auditee == null) {
                        log.warn("Could not find eligible and available Auditor / Auditee for config ID {}. Skipping generation for date {}.", config.getId(), adjustedDate);
                    } else {
                        // Generate audit schedule
                        AuditSchedule schedule = new AuditSchedule();
                        schedule.setConfigId(config.getId());
                        Long effectiveParentId = config.getParentAuditScheduleId();
                        if (effectiveParentId == null && config.getConfigCode() != null) {
                            Optional<AuditSchedule> parentOpt = auditScheduleRepository.findByScheduleNoIgnoreCase(config.getConfigCode());
                            if (parentOpt.isPresent()) {
                                effectiveParentId = parentOpt.get().getId();
                                config.setParentAuditScheduleId(effectiveParentId);
                                try {
                                    configRepository.save(config);
                                } catch (Exception ignored) {}
                            }
                        }
                        schedule.setParentId(effectiveParentId);
                        schedule.setScheduleNo(auditScheduleService.getNextScheduleNo());
                        schedule.setScheduleDate(new Date());
                        schedule.setAuditDate(executionDate);
                        schedule.setStartTime(config.getStartTime());
                        schedule.setEndTime(config.getEndTime());
                        
                        schedule.setFrequency(config.getFrequency());
                        schedule.setWeekDays(config.getWeekDays());
                        schedule.setRepeatEveryValue(config.getRepeatEveryValue());
                        schedule.setRepeatEveryUnit(config.getRepeatEveryUnit());
                        LocalDate today = LocalDate.now();
                        if (adjustedDate.isAfter(today)) {
                            schedule.setStatus("DRAFT");
                        } else {
                            schedule.setStatus("OPEN");
                        }
                        schedule.setIsActive(true);

                        schedule.setAuditTypeId(config.getAuditTypeId());
                        schedule.setAuditTypeEntity(config.getAuditTypeEntity());
                        schedule.setAuditType(
                                config.getAuditTypeEntity() != null ? config.getAuditTypeEntity().getAuditType() : "");

                        schedule.setDepartmentId(config.getDepartmentId());
                        schedule.setDepartmentEntity(config.getDepartmentEntity());
                        schedule.setDepartment(
                                config.getDepartmentEntity() != null ? config.getDepartmentEntity().getDepartmentName() : "");

                        schedule.setAuditAreaId(config.getAuditAreaId());
                        schedule.setAuditAreaEntity(config.getAuditAreaEntity());
                        schedule.setAuditArea(
                                config.getAuditAreaEntity() != null ? config.getAuditAreaEntity().getDescription() : "");

                        schedule.setAuditorId(auditor.getId());
                        schedule.setAuditorEntity(auditor);
                        schedule.setAuditor(auditor.getEmployeeName() + " - " + auditor.getEmpCode());

                        schedule.setAuditeeId(auditee.getId());
                        schedule.setAuditeeEntity(auditee);
                        schedule.setAuditee(auditee.getEmployeeName() + " - " + auditee.getEmpCode());

                        schedule.setNcrApprovedById(ncrApprover != null ? ncrApprover.getId() : null);
                        schedule.setNcrApprovedByEntity(ncrApprover);
                        schedule.setNcrApprovedBy(
                                ncrApprover != null ? (ncrApprover.getEmployeeName() + " - " + ncrApprover.getEmpCode()) : "");

                        schedule.setCriteriaMinCount(config.getCriteriaMinCount());

                        // Populate default criteria if possible
                        if (config.getAuditTypeId() != null) {
                            List<AuditCriteria> defaults;
                            if (config.getDepartmentId() != null) {
                                defaults = auditCriteriaRepository.findByAuditTypeContainingAndDepartmentId(
                                        config.getAuditTypeEntity() != null ? config.getAuditTypeEntity().getAuditType() : "",
                                        config.getDepartmentId());
                            } else {
                                defaults = auditCriteriaRepository.findByAuditTypeContaining(
                                        config.getAuditTypeEntity() != null ? config.getAuditTypeEntity().getAuditType() : "");
                            }
                            if (defaults != null && !defaults.isEmpty()) {
                                List<AuditCriteria> mandatoryList = new ArrayList<>();
                                List<AuditCriteria> nonMandatoryList = new ArrayList<>();
                                for (AuditCriteria ac : defaults) {
                                    if (ac.getMandatoryCriteria() != null && ac.getMandatoryCriteria() == 1) {
                                        mandatoryList.add(ac);
                                    } else {
                                        nonMandatoryList.add(ac);
                                    }
                                }

                                java.util.Collections.shuffle(nonMandatoryList);

                                List<AuditCriteria> orderedPool = new ArrayList<>();
                                orderedPool.addAll(mandatoryList);
                                orderedPool.addAll(nonMandatoryList);

                                int totalSize = orderedPool.size();
                                int targetCount = Math.min(totalSize, 10);
                                if (targetCount < mandatoryList.size()) {
                                    targetCount = mandatoryList.size();
                                }

                                List<AuditCriteria> selectedSubset = orderedPool.subList(0, targetCount);

                                List<AuditScheduleCriteria> mapped = new ArrayList<>();
                                int seq = 1;
                                for (AuditCriteria ac : selectedSubset) {
                                    AuditScheduleCriteria sc = new AuditScheduleCriteria();
                                    sc.setAuditSchedule(schedule);
                                    sc.setSeqNo(String.valueOf(seq++));
                                    sc.setClause(ac.getClause());
                                    sc.setCriteriaDetails(ac.getCriteriaText());
                                    sc.setAttachmentReq(
                                            ac.getAttachmentRequired() != null && ac.getAttachmentRequired() ? "YES" : "NO");
                                    sc.setIsActive(true);
                                    mapped.add(sc);
                                }
                                schedule.setCriteriaList(mapped);
                            }
                        }

                        AuditSchedule savedSch = auditScheduleRepository.save(schedule);
                        successCount++;
                        log.info("Successfully generated Audit Schedule: {} (ID: {}, Parent ID: {}) for date {} from Config: {}",
                                savedSch.getScheduleNo(), savedSch.getId(), savedSch.getParentId(), adjustedDate, config.getConfigCode());
                        try {
                            com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher publisher = 
                                com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher.class);
                            if (publisher != null) {
                                publisher.publishMutation("AuditSchedule", "CREATED");
                            }
                        } catch (Exception ignored) {}
                    }
                }

                LocalDate nextDate = computeNextAuditDate(candidateDate, config.getFrequency(), config.getRepeatEveryValue(), config.getRepeatEveryUnit());
                if (nextDate == null || nextDate.isEqual(candidateDate) || nextDate.isBefore(candidateDate)) {
                    break;
                }
                candidateDate = nextDate;
            }
        } catch (Exception e) {
            status = "FAILED";
            failureCount = 1;
            errorMsg = e.getMessage();
            log.error("Error running config engine execution", e);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            AuditSchedulerLog auditLog = AuditSchedulerLog.builder()
                    .configId(config.getId())
                    .triggerTime(new Date())
                    .status(status)
                    .successCount(successCount)
                    .failureCount(failureCount)
                    .durationMs(duration)
                    .errorDetails(errorMsg)
                    .build();
            auditLog.setCreatedBy("SUPER BOSS");
            auditLog.setCreatedDate(new Date());
            logRepository.save(auditLog);
        }
    }

    private LocalDate getLatestAuditDateForConfig(AuditSchedulerConfig config) {
        List<AuditSchedule> existingSchedules = auditScheduleRepository.findByFiltersLikeList(null, null);
        Optional<Date> latestDate = existingSchedules.stream()
                .filter(s -> (config.getId() != null && config.getId().equals(s.getConfigId()))
                        || (config.getParentAuditScheduleId() != null && config.getParentAuditScheduleId().equals(s.getParentId()))
                        || (config.getParentAuditScheduleId() != null && config.getParentAuditScheduleId().equals(s.getId())))
                .map(AuditSchedule::getAuditDate)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder());

        if (latestDate.isPresent()) {
            return convertToLocalDate(latestDate.get());
        }

        if (config.getParentAuditScheduleId() != null) {
            Optional<AuditSchedule> parentOpt = auditScheduleRepository.findById(config.getParentAuditScheduleId());
            if (parentOpt.isPresent() && parentOpt.get().getAuditDate() != null) {
                return convertToLocalDate(parentOpt.get().getAuditDate());
            }
        }

        if (config.getCreatedDate() != null) {
            return convertToLocalDate(config.getCreatedDate());
        }

        return LocalDate.now(ZoneId.of("Asia/Kolkata"));
    }

    private LocalDate computeNextAuditDate(LocalDate baseDate, String frequency, Integer repeatVal, String repeatUnit) {
        if (baseDate == null) {
            return LocalDate.now(ZoneId.of("Asia/Kolkata"));
        }
        if (frequency == null || "NONE".equalsIgnoreCase(frequency)) {
            return baseDate;
        }

        int val = (repeatVal != null && repeatVal > 0) ? repeatVal : 1;
        String unit = (repeatUnit != null) ? repeatUnit.trim().toUpperCase() : "DAYS";

        return switch (frequency.trim().toUpperCase()) {
            case "DAILY" -> baseDate.plusDays(1);
            case "WEEKLY" -> baseDate.plusWeeks(1);
            case "MONTHLY" -> baseDate.plusMonths(1);
            case "QUARTERLY" -> baseDate.plusMonths(3);
            case "HALF_YEARLY", "HALF YEARLY", "BI_ANNUAL", "BI-ANNUAL" -> baseDate.plusMonths(6);
            case "YEARLY", "ANNUAL" -> baseDate.plusYears(1);
            case "CUSTOM" -> switch (unit) {
                case "DAYS" -> baseDate.plusDays(val);
                case "WEEKS" -> baseDate.plusWeeks(val);
                case "MONTHS" -> baseDate.plusMonths(val);
                default -> baseDate.plusDays(val);
            };
            default -> baseDate.plusDays(1);
        };
    }

    private boolean isHolidayOrSunday(LocalDate date) {
        if (date == null) return false;
        if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) return true;
        try {
            HolidayValidator.validateDate(date);
            return false;
        } catch (Exception e) {
            return true;
        }
    }

    private LocalDate adjustToNextWorkingDay(LocalDate candidateDate) {
        LocalDate current = candidateDate;
        int maxAttempts = 60;
        int attempts = 0;

        while (attempts < maxAttempts) {
            if (isHolidayOrSunday(current)) {
                current = current.plusDays(1);
                attempts++;
                continue;
            }

            return current;
        }

        return current;
    }

    private EmployeeMaster selectNextRotatedEmployee(AuditSchedulerConfig config, Date date, boolean isAuditor) {
        String auditType = config.getAuditTypeEntity() != null ? config.getAuditTypeEntity().getAuditType() : null;
        if (auditType == null)
            return null;

        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = config.getDepartmentEntity() != null ? config.getDepartmentEntity().getDepartmentName()
                : null;

        List<EmployeeMaster> pool = employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName())
                        && Boolean.TRUE.equals(e.getIsActive()))
                .filter(e -> {
                    if (isAuditor) {
                        return "YES".equalsIgnoreCase(e.getIsAuditor())
                                && hasEligibilityType(e.getAuditorType(), cleanAuditType);
                    } else {
                        return "YES".equalsIgnoreCase(e.getIsAuditee())
                                && hasEligibilityType(e.getAuditeeType(), cleanAuditType);
                    }
                })
                .filter(e -> {
                    if (isAuditor) {
                        // Auditor must not be from audited department
                        return scheduleDept == null || e.getDepartment() == null
                                || !scheduleDept.equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    } else {
                        // Auditee must be from audited department
                        return scheduleDept != null && e.getDepartment() != null
                                && scheduleDept.equalsIgnoreCase(e.getDepartment().getDepartmentName());
                    }
                })
                .sorted(Comparator.comparing(EmployeeMaster::getId))
                .toList();

        if (pool.isEmpty())
            return null;

        if (pool.size() == 1) {
            return pool.get(0);
        }

        // Apply Leave Validation
        List<EmployeeMaster> availablePool = pool;
        if (Boolean.TRUE.equals(config.getLeaveValidation())) {
            availablePool = pool.stream()
                    .filter(e -> leaveEntryRepository.findByEmployeeIdAndDateAndIsActiveTrue(e.getId(), date).isEmpty())
                    .toList();
        }

        if (availablePool.isEmpty()) {
            return null; // All rotated workers on leave
        }

        // Find last child audit generated from this config to continue rotation
        Optional<AuditSchedule> lastChild = auditScheduleRepository.findByFiltersLikeList(null, null).stream()
                .filter(s -> scheduleDept == null || s.getDepartment() == null
                        || scheduleDept.equalsIgnoreCase(s.getDepartment()))
                .filter(s -> config.getAuditTypeId() != null && config.getAuditTypeId().equals(s.getAuditTypeId()))
                .max(Comparator.comparing(AuditSchedule::getId));

        Long lastEmpId = null;
        if (lastChild.isPresent()) {
            lastEmpId = isAuditor ? lastChild.get().getAuditorId() : lastChild.get().getAuditeeId();
        }

        if (lastEmpId == null) {
            return availablePool.get(0);
        }

        final Long targetLastEmpId = lastEmpId;
        int index = -1;
        for (int i = 0; i < availablePool.size(); i++) {
            if (availablePool.get(i).getId().equals(targetLastEmpId)) {
                index = i;
                break;
            }
        }

        int nextIndex = (index + 1) % availablePool.size();
        return availablePool.get(nextIndex);
    }

    private boolean hasEligibilityType(String types, String targetType) {
        if (types == null || types.trim().isEmpty() || targetType == null) {
            return false;
        }
        for (String t : types.split(",")) {
            if (t.trim().equalsIgnoreCase(targetType.trim())) {
                return true;
            }
        }
        return false;
    }



    private EmployeeMaster selectNextRotatedNcrApprover(AuditSchedulerConfig config, Date date, EmployeeMaster auditor,
            EmployeeMaster auditee) {
        String auditType = config.getAuditTypeEntity() != null ? config.getAuditTypeEntity().getAuditType() : null;
        if (auditType == null)
            return null;

        String cleanAuditType = auditType.trim().toUpperCase();
        String scheduleDept = config.getDepartmentEntity() != null ? config.getDepartmentEntity().getDepartmentName()
                : null;

        List<EmployeeMaster> pool = employeeMasterRepository.findAll().stream()
                .filter(e -> e.getStatus() != null && "Active".equalsIgnoreCase(e.getStatus().getName())
                        && Boolean.TRUE.equals(e.getIsActive()))
                .filter(e -> "YES".equalsIgnoreCase(e.getIsNcrApprover())
                        && hasEligibilityType(e.getNcrApproverType(), cleanAuditType))
                .filter(e -> {
                    if (auditor != null && e.getId().equals(auditor.getId()))
                        return false;
                    if (auditee != null && e.getId().equals(auditee.getId()))
                        return false;
                    return scheduleDept == null || e.getDepartment() == null
                            || !scheduleDept.equalsIgnoreCase(e.getDepartment().getDepartmentName());
                })
                .sorted(Comparator.comparing(EmployeeMaster::getId))
                .toList();

        if (pool.isEmpty()) {
            return auditor;
        }

        if (pool.size() == 1) {
            return pool.get(0);
        }

        List<EmployeeMaster> availablePool = pool;
        if (Boolean.TRUE.equals(config.getLeaveValidation())) {
            availablePool = pool.stream()
                    .filter(e -> leaveEntryRepository.findByEmployeeIdAndDateAndIsActiveTrue(e.getId(), date).isEmpty())
                    .toList();
        }

        if (availablePool.isEmpty()) {
            return pool.get(0);
        }

        Optional<AuditSchedule> lastChild = auditScheduleRepository.findByFiltersLikeList(null, null).stream()
                .filter(s -> scheduleDept == null || s.getDepartment() == null
                        || scheduleDept.equalsIgnoreCase(s.getDepartment()))
                .filter(s -> config.getAuditTypeId() != null && config.getAuditTypeId().equals(s.getAuditTypeId()))
                .max(Comparator.comparing(AuditSchedule::getId));

        Long lastEmpId = null;
        if (lastChild.isPresent()) {
            lastEmpId = lastChild.get().getNcrApprovedById();
        }

        if (lastEmpId == null) {
            return availablePool.get(0);
        }

        final Long targetLastEmpId = lastEmpId;
        int index = -1;
        for (int i = 0; i < availablePool.size(); i++) {
            if (availablePool.get(i).getId().equals(targetLastEmpId)) {
                index = i;
                break;
            }
        }

        int nextIndex = (index + 1) % availablePool.size();
        return availablePool.get(nextIndex);
    }

    private LocalDate convertToLocalDate(Date date) {
        if (date instanceof java.sql.Date) {
            return ((java.sql.Date) date).toLocalDate();
        }
        return date.toInstant().atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
    }
}
