package com.autonoma.erp.modules.induction.service;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.induction.entity.InductionMaster;
import com.autonoma.erp.modules.induction.entity.InductionTrainingDetail;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionAssignmentRepository;
import com.autonoma.erp.modules.induction.repository.InductionMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionTrainingDetailRepository;

import com.autonoma.erp.modules.induction.entity.InductionDepartmentMapping;
import com.autonoma.erp.modules.induction.entity.InductionLevelMapping;
import com.autonoma.erp.modules.induction.entity.HrAttachmentPath;
import com.autonoma.erp.modules.induction.repository.InductionDepartmentMappingRepository;
import com.autonoma.erp.modules.induction.repository.InductionLevelMappingRepository;
import com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.service.admin.EmailSendingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InductionTrainingService {

    @Autowired
    private InductionAssignmentRepository assignmentRepo;

    @Autowired
    private EmailSendingService emailSendingService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailContentService emailContentService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine;

    @Autowired
    private InductionTrainingDetailRepository detailRepo;

    @Autowired
    private InductionMasterRepository masterRepo;

    @Autowired
    private EmployeeMasterRepository empRepo;

    @Autowired
    private DepartmentRepository departmentRepo;

    @Autowired
    private InductionDepartmentMappingRepository deptMappingRepo;

    @Autowired
    private InductionLevelMappingRepository levelMappingRepo;

    @Autowired
    private LevelMasterRepository levelMasterRepository;

    @Autowired
    private HrAttachmentPathRepository attachmentRepo;
    
    @Autowired
    private InductionAssignmentService assignmentService;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository personalRepo;

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;

    private int parseScreeningLevel(String level) {
        if (level == null) return 0;
        String digits = level.replaceAll("\\D+", "");
        if (digits.isEmpty()) return 0;
        try {
            return Integer.parseInt(digits);
        } catch (Exception e) {
            return 0;
        }
    }

    public boolean isAssignmentReady(InductionAssignment assignment) {
        if (assignment == null || assignment.getIsActive() == null || !assignment.getIsActive()) {
            return false;
        }
        
        List<InductionAssignment> traineeAssignments = assignmentRepo.findByEmpCode(assignment.getEmpCode());
        
        List<InductionAssignment> sortedActive = traineeAssignments.stream()
                .filter(a -> a.getIsActive() != null && a.getIsActive())
                .sorted(java.util.Comparator.comparingInt(a -> parseScreeningLevel(a.getScreeningLevel())))
                .collect(java.util.stream.Collectors.toList());
        
        int currentLevelNum = parseScreeningLevel(assignment.getScreeningLevel());
        
        // For each level lower than currentLevelNum, verify that there is at least one active assignment that has currentStatus = 'COMPLETED'
        for (int lvl = 1; lvl < currentLevelNum; lvl++) {
            final int targetLvl = lvl;
            boolean levelCompleted = sortedActive.stream()
                    .filter(a -> parseScreeningLevel(a.getScreeningLevel()) == targetLvl)
                    .anyMatch(a -> "COMPLETED".equalsIgnoreCase(a.getCurrentStatus()));
            if (!levelCompleted) {
                return false;
            }
        }
        return true;
    }

    private void resolveTraineeFromMaster(List<InductionAssignment> list) {
        if (list == null || list.isEmpty()) return;
        java.util.Set<String> empCodes = list.stream()
                .map(InductionAssignment::getEmpCode)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        for (String empCode : empCodes) {
            try {
                assignmentService.updateTraineeInductionStatuses(empCode);
            } catch (Exception e) {
                // Ignore or log
            }
        }
        for (InductionAssignment a : list) {
            Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = Optional.empty();
            if (a.getEmpCode() != null && !a.getEmpCode().trim().isEmpty()) {
                empOpt = empRepo.findByEmpCode(a.getEmpCode());
                if (!empOpt.isPresent()) {
                    empOpt = empRepo.findByOldEmpCode(a.getEmpCode());
                }
            }
            if (!empOpt.isPresent() && a.getOldEmpCode() != null && !a.getOldEmpCode().trim().isEmpty()) {
                empOpt = empRepo.findByOldEmpCode(a.getOldEmpCode());
                if (!empOpt.isPresent()) {
                    empOpt = empRepo.findByEmpCode(a.getOldEmpCode());
                }
            }
            if (empOpt.isPresent()) {
                String codeToUse = empOpt.get().getEmpCode();
                if (codeToUse == null || codeToUse.trim().isEmpty()) {
                    codeToUse = empOpt.get().getOldEmpCode();
                }
                a.setCodeInMaster(codeToUse);
                a.setEmpName(empOpt.get().getEmployeeName());
                if (empOpt.get().getDepartment() != null) {
                    a.setDepartment(empOpt.get().getDepartment().getDepartmentName());
                }
                if (empOpt.get().getDesignation() != null) {
                    a.setDesignation(empOpt.get().getDesignation().getDesignationName());
                }
            } else {
                a.setCodeInMaster(a.getEmpCode());
            }
        }
    }

    /**
     * Get assignments for a specific trainer (login-filtered).
     */
    public List<InductionAssignment> getForTrainer(String trainerEmpCode) {
        List<InductionAssignment> list = assignmentRepo.findByTrainerEmpCode(trainerEmpCode);
        List<InductionAssignment> readyList = list.stream()
                .filter(this::isAssignmentReady)
                .collect(Collectors.toList());
        resolveTraineeFromMaster(readyList);
        return readyList;
    }

    public List<InductionAssignment> getAll() {
        List<InductionAssignment> list = assignmentRepo.findAllActive();
        resolveTraineeFromMaster(list);
        return list;
    }

    /**
     * Get sequential active assignments that are ready (Admin/HR dashboard view).
     */
    public List<InductionAssignment> getAllReady() {
        List<InductionAssignment> list = assignmentRepo.findAllActive();
        List<InductionAssignment> readyList = list.stream()
                .filter(this::isAssignmentReady)
                .collect(Collectors.toList());
        resolveTraineeFromMaster(readyList);
        return readyList;
    }

    private void populateTransientFields(List<InductionMaster> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> inductionIds = list.stream().map(InductionMaster::getId).collect(Collectors.toList());

        // Batch fetch master lookups
        List<Department> allDepts = departmentRepo.findAll();
        Map<Long, String> deptIdToNoMap = allDepts.stream()
                .filter(d -> d.getId() != null)
                .collect(Collectors.toMap(Department::getId, Department::getDepartmentNo, (v1, v2) -> v1));

        List<LevelMaster> allLevels = levelMasterRepository.findAll();
        Map<Long, String> levelIdToNameMap = allLevels.stream()
                .filter(l -> l.getId() != null)
                .collect(Collectors.toMap(LevelMaster::getId, LevelMaster::getLevelName, (v1, v2) -> v1));

        // Batch fetch mappings
        List<InductionDepartmentMapping> allDeptMappings = deptMappingRepo.findByInductionIdIn(inductionIds);
        Map<Long, List<InductionDepartmentMapping>> deptMappingsGrouped = allDeptMappings.stream()
                .collect(Collectors.groupingBy(InductionDepartmentMapping::getInductionId));

        List<InductionLevelMapping> allLevelMappings = levelMappingRepo.findByInductionIdIn(inductionIds);
        Map<Long, List<InductionLevelMapping>> levelMappingsGrouped = allLevelMappings.stream()
                .collect(Collectors.groupingBy(InductionLevelMapping::getInductionId));

        List<HrAttachmentPath> allAttachments = attachmentRepo.findByPageCodeAndRefIdInAndDocType("M2140", inductionIds, "INDUCTION_ATTACHMENT");
        // Group by refId and deduplicate paths (LinkedHashSet preserves insertion order
        // and eliminates duplicate file paths that may exist from prior saves)
        Map<Long, String> attachmentMap = allAttachments.stream()
                .filter(a -> a.getPath() != null && !a.getPath().trim().isEmpty())
                .collect(Collectors.groupingBy(
                        HrAttachmentPath::getRefId,
                        Collectors.collectingAndThen(
                                Collectors.mapping(a -> a.getPath().trim(),
                                        Collectors.toCollection(java.util.LinkedHashSet::new)),
                                paths -> String.join(",", paths)
                        )
                ));

        // Perform in-memory mapping
        for (InductionMaster m : list) {
            List<InductionDepartmentMapping> deptMappings = deptMappingsGrouped.getOrDefault(m.getId(), List.of());
            String deptCodes = deptMappings.stream()
                    .map(mapping -> {
                        String dno = deptIdToNoMap.get(mapping.getDepartmentId());
                        if (dno != null && !dno.trim().isEmpty()) return dno;
                        return mapping.getDepartmentId() != null ? mapping.getDepartmentId().toString() : null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(","));
            m.setDepartmentCodes(deptCodes);

            List<InductionLevelMapping> lvlMappings = levelMappingsGrouped.getOrDefault(m.getId(), List.of());
            String lvlCodes = lvlMappings.stream()
                    .map(mapping -> levelIdToNameMap.get(mapping.getLevelId()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(","));
            m.setLevelCodes(lvlCodes);

            String ap = attachmentMap.get(m.getId());
            m.setInductionAttachment(ap != null ? ap : "");
        }
    }

    private void populateTransientFields(InductionMaster m) {
        if (m == null) return;
        populateTransientFields(Collections.singletonList(m));
    }

    private static final Date NEW_LOGIC_CUTOFF;
    static {
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("GMT+5:30"));
        cal.clear();
        cal.set(2026, Calendar.JUNE, 20, 9, 0, 0);
        NEW_LOGIC_CUTOFF = cal.getTime();
    }

    /**
     * Helper method to get matching criteria from InductionMaster based on assignment details.
     */
    private List<InductionMaster> getMatchingCriteria(InductionAssignment assignment) {
        String round = assignment.getInductionRound();
        List<InductionMaster> criteria = masterRepo.findByRoundAndActive(round);
        populateTransientFields(criteria);

        String empDept = assignment.getDepartment();
        String empDeptId = null;
        String empDeptCode = null;
        if (empDept != null && !empDept.trim().isEmpty()) {
            Optional<Department> deptOpt = departmentRepo.findByDepartmentName(empDept);
            if (!deptOpt.isPresent()) {
                deptOpt = departmentRepo.findByDepartmentNo(empDept);
            }
            if (deptOpt.isPresent()) {
                empDeptId = String.valueOf(deptOpt.get().getId());
                empDeptCode = deptOpt.get().getDepartmentNo();
            }
        }

        String screeningLevel = assignment.getScreeningLevel();
        String empLevelCode = null;
        if (screeningLevel != null) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\d+").matcher(screeningLevel);
            if (matcher.find()) {
                empLevelCode = "L" + matcher.group();
            }
        }

        final String finalDeptId = empDeptId;
        final String finalDeptCode = empDeptCode;
        final String finalLevelCode = empLevelCode;

        boolean useStrictLogic = assignment.getCreatedAt() != null && assignment.getCreatedAt().after(NEW_LOGIC_CUTOFF);

        return criteria.stream()
                .filter(c -> {
                    if (useStrictLogic) {
                        // Strict Department Mapping: must exist and must match
                        if (c.getDepartmentCodes() == null || c.getDepartmentCodes().trim().isEmpty() || empDept == null || empDept.isEmpty()) {
                            return false;
                        }
                        List<String> codes = Arrays.stream(c.getDepartmentCodes().split(","))
                                .map(String::trim)
                                .map(String::toUpperCase)
                                .collect(Collectors.toList());
                        boolean deptMatch = codes.contains("ALL") || 
                                             (finalDeptId != null && codes.contains(finalDeptId)) ||
                                             (finalDeptCode != null && codes.contains(finalDeptCode.toUpperCase())) ||
                                             codes.contains(empDept.trim().toUpperCase());
                        if (!deptMatch) {
                            return false;
                        }

                        // Strict Level Mapping: must exist and must match
                        if (c.getLevelCodes() == null || c.getLevelCodes().trim().isEmpty() || screeningLevel == null || screeningLevel.isEmpty()) {
                            return false;
                        }
                        List<String> lCodes = Arrays.stream(c.getLevelCodes().split(","))
                                .map(String::trim)
                                .map(String::toUpperCase)
                                .collect(Collectors.toList());
                        boolean levelMatch = lCodes.contains("ALL") || 
                                             (finalLevelCode != null && lCodes.contains(finalLevelCode.toUpperCase())) ||
                                             lCodes.contains(screeningLevel.trim().toUpperCase());
                        if (!levelMatch) {
                            return false;
                        }
                    } else {
                        // Old logic: preserve existing/historical matching behavior (department and level check are optional/lenient if not set)
                        // Department match
                        if (c.getDepartmentCodes() != null && !c.getDepartmentCodes().trim().isEmpty() && empDept != null && !empDept.isEmpty()) {
                            List<String> codes = Arrays.stream(c.getDepartmentCodes().split(","))
                                    .map(String::trim)
                                    .map(String::toUpperCase)
                                    .collect(Collectors.toList());
                            boolean deptMatch = codes.contains("ALL") || 
                                                 (finalDeptId != null && codes.contains(finalDeptId)) ||
                                                 (finalDeptCode != null && codes.contains(finalDeptCode.toUpperCase())) ||
                                                 codes.contains(empDept.trim().toUpperCase());
                            if (!deptMatch) {
                                return false;
                            }
                        }
                        // Level match
                        if (c.getLevelCodes() != null && !c.getLevelCodes().trim().isEmpty()) {
                            List<String> codes = Arrays.stream(c.getLevelCodes().split(","))
                                    .map(String::trim)
                                    .map(String::toUpperCase)
                                    .collect(Collectors.toList());
                            boolean levelMatch = codes.contains("ALL") || 
                                                 (finalLevelCode != null && codes.contains(finalLevelCode.toUpperCase())) ||
                                                 (screeningLevel != null && codes.contains(screeningLevel.trim().toUpperCase()));
                            if (!levelMatch) {
                                return false;
                            }
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get training detail items for a specific assignment.
     * Enriches each detail row with the criteria text from InductionMaster.
     * Automatically synchronizes with the source of truth (InductionMaster criteria).
     */
    @Transactional
    public List<InductionTrainingDetail> getDetails(Long assignmentId) {
        InductionAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!isAssignmentReady(assignment)) {
            throw new RuntimeException("This assignment is locked. All previous induction rounds must be completed first.");
        }

        List<InductionTrainingDetail> details = detailRepo.findByAssignmentId(assignmentId);

        // Synchronize with InductionMaster if training has started (details exist) and is in PENDING or TRAINING GIVEN status
        if (!details.isEmpty() && ("PENDING".equalsIgnoreCase(assignment.getCurrentStatus()) || "TRAINING GIVEN".equalsIgnoreCase(assignment.getCurrentStatus()))) {
            List<InductionMaster> activeCriteria = getMatchingCriteria(assignment);
            Set<Long> activeCriteriaIds = activeCriteria.stream().map(InductionMaster::getId).collect(Collectors.toSet());
            Set<Long> existingMasterIds = details.stream().map(InductionTrainingDetail::getInductionMasterId).collect(Collectors.toSet());

            boolean changed = false;

            // 1. Add new criteria that were added to the master
            for (InductionMaster master : activeCriteria) {
                if (!existingMasterIds.contains(master.getId())) {
                    InductionTrainingDetail detail = new InductionTrainingDetail();
                    detail.setAssignmentId(assignmentId);
                    detail.setInductionMasterId(master.getId());
                    detail.setTrainerStatus("PENDING");
                    detail.setAttachmentPath(null);
                    detail.setCreatedBy("admin");
                    detail.setCreatedAt(new Date());
                    detailRepo.save(detail);
                    changed = true;
                }
            }

            // 2. Remove criteria that are no longer active/matching in the master
            for (InductionTrainingDetail detail : details) {
                if (!activeCriteriaIds.contains(detail.getInductionMasterId())) {
                    detailRepo.delete(detail);
                    changed = true;
                }
            }

            if (changed) {
                details = detailRepo.findByAssignmentId(assignmentId);
            }
        }

        // Enrich with InductionMaster data (transient fields)
        Set<Long> masterIds = details.stream()
                .map(InductionTrainingDetail::getInductionMasterId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!masterIds.isEmpty()) {
            List<InductionMaster> masters = masterRepo.findAllById(masterIds);
            populateTransientFields(masters);
            Map<Long, InductionMaster> masterMap = masters.stream()
                    .collect(Collectors.toMap(InductionMaster::getId, m -> m));
            for (InductionTrainingDetail detail : details) {
                InductionMaster master = masterMap.get(detail.getInductionMasterId());
                if (master != null) {
                    detail.setInductionDetails(master.getInductionDetails());
                    detail.setAnswer(master.getAnswer());
                    detail.setInductionRound(master.getInductionRound());
                    detail.setAttachmentRequired(master.getAttachmentRequired());
                    detail.setCriteriaAttachment(master.getInductionAttachment());
                }
            }
        }

        // Load trainee-specific verification documents (docType = VERIFICATION_DOCUMENT)
        List<Long> detailIds = details.stream().map(InductionTrainingDetail::getId).collect(Collectors.toList());
        if (!detailIds.isEmpty()) {
            List<HrAttachmentPath> verificationAttachments = attachmentRepo.findByPageCodeAndRefIdInAndDocType(
                "HRA_INDUCTION_INDUCTION_TRAINING", detailIds, "VERIFICATION_DOCUMENT"
            );
            Map<Long, List<HrAttachmentPath>> verificationMap = verificationAttachments.stream()
                .collect(Collectors.groupingBy(HrAttachmentPath::getRefId));
            
            for (InductionTrainingDetail detail : details) {
                List<HrAttachmentPath> paths = verificationMap.getOrDefault(detail.getId(), List.of());
                String joinedPaths = paths.stream()
                    .map(HrAttachmentPath::getPath)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(","));
                detail.setAttachmentPath(joinedPaths);
            }
        }

        return details;
    }

    /**
     * Start a training session:
     * 1. Validate scheduled time has been reached
     * 2. Load matching criteria from InductionMaster
     * 3. Create detail rows for each criteria
     * 4. Update assignment status to TRAINING_STARTED
     */
    @Transactional
    public InductionAssignment startTraining(Long assignmentId, String currentUser) {
        InductionAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!isAssignmentReady(assignment)) {
            throw new RuntimeException("This assignment is locked. All previous induction rounds must be completed first.");
        }

        if (!"PENDING".equalsIgnoreCase(assignment.getCurrentStatus()) 
            && !"RESCHEDULE".equalsIgnoreCase(assignment.getCurrentStatus())
            && !"WAITING_FOR_PROCESS".equalsIgnoreCase(assignment.getCurrentStatus())) {
            throw new RuntimeException("Training can only be started from PENDING, RESCHEDULE or WAITING_FOR_PROCESS status. Current: " + assignment.getCurrentStatus());
        }

        // Clear any existing training detail rows (re-start/reschedule case) to ensure fresh criteria are loaded
        List<InductionTrainingDetail> existing = detailRepo.findByAssignmentId(assignmentId);
        if (!existing.isEmpty()) {
            detailRepo.deleteAll(existing);
        }

        // Load matching criteria from InductionMaster
        List<InductionMaster> criteria = getMatchingCriteria(assignment);

        if (criteria.isEmpty()) {
            throw new RuntimeException("No active induction criteria configured in the master for round: " + assignment.getInductionRound() +
                    ", department: " + assignment.getDepartment() + ", level: " + assignment.getScreeningLevel() + ". Please define criteria first.");
        }

        // Create detail rows
        for (InductionMaster master : criteria) {
            InductionTrainingDetail detail = new InductionTrainingDetail();
            detail.setAssignmentId(assignmentId);
            detail.setInductionMasterId(master.getId());
            detail.setTrainerStatus("PENDING");
            detail.setAttachmentPath(null);
            detail.setCreatedBy(currentUser);
            detail.setCreatedAt(new Date());
            detailRepo.save(detail);
        }

        // Update assignment
        assignment.setCurrentStatus("PENDING");
        assignment.setTrainingStartedAt(new Date());
        assignment.setUpdatedBy(currentUser);
        assignment.setUpdatedAt(new Date());
        return assignmentRepo.save(assignment);
    }

    /**
     * Save training progress (batch update detail items).
     */
    @Transactional
    public void saveProgress(Long assignmentId, List<InductionTrainingDetail> updates, String currentUser) {
        InductionAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!isAssignmentReady(assignment)) {
            throw new RuntimeException("This assignment is locked. All previous induction rounds must be completed first.");
        }

        for (InductionTrainingDetail update : updates) {
            InductionTrainingDetail existing = detailRepo.findById(update.getId())
                    .orElseThrow(() -> new RuntimeException("Detail item not found: " + update.getId()));

            if (!existing.getAssignmentId().equals(assignmentId)) {
                throw new RuntimeException("Detail item does not belong to this assignment");
            }

            existing.setTrainerStatus(update.getTrainerStatus());
            existing.setTrainerComments(update.getTrainerComments());
            existing.setSkillRating(update.getSkillRating());
            existing.setUpdatedBy(currentUser);
            existing.setUpdatedAt(new Date());
            detailRepo.save(existing);

            // Update verification documents in attachmentRepo
            attachmentRepo.deleteByPageCodeAndRefIdAndDocType(
                "HRA_INDUCTION_INDUCTION_TRAINING", existing.getId(), "VERIFICATION_DOCUMENT"
            );
            if (update.getAttachmentPath() != null && !update.getAttachmentPath().trim().isEmpty()) {
                String[] filePaths = update.getAttachmentPath().split(",");
                for (String filePath : filePaths) {
                    if (filePath.trim().isEmpty()) continue;
                    HrAttachmentPath path = new HrAttachmentPath();
                    path.setPageCode("HRA_INDUCTION_INDUCTION_TRAINING");
                    path.setRefId(existing.getId());
                    path.setDocType("VERIFICATION_DOCUMENT");
                    path.setPath(filePath.trim());
                    String fileName = filePath.trim();
                    if (fileName.contains("/")) {
                        fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
                    }
                    path.setFileName(fileName);
                    path.setCreatedBy(currentUser);
                    path.setCreatedDate(new Date());
                    attachmentRepo.save(path);
                }
            }
        }
    }

    /**
     * Complete training:
     * 1. Validate all items have trainerStatus = COMPLETED
     * 2. Validate all items have skillRating
     * 3. Calculate average rating
     * 4. Update assignment to TRAINING GIVEN
     */
    @Transactional
    public InductionAssignment completeTraining(Long assignmentId, String currentUser) {
        InductionAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!isAssignmentReady(assignment)) {
            throw new RuntimeException("This assignment is locked. All previous induction rounds must be completed first.");
        }

        List<InductionTrainingDetail> details = detailRepo.findByAssignmentId(assignmentId);

        if (details.isEmpty()) {
            throw new RuntimeException("No training details found. Please start training first.");
        }

        // Validate all items completed
        long pendingCount = details.stream()
                .filter(d -> !"COMPLETED".equalsIgnoreCase(d.getTrainerStatus()))
                .count();
        if (pendingCount > 0) {
            throw new RuntimeException("Please complete all trainer status. " + pendingCount + " items still pending.");
        }

        // Validate all items have skill rating
        long noRating = details.stream()
                .filter(d -> d.getSkillRating() == null || d.getSkillRating() < 1)
                .count();
        if (noRating > 0) {
            throw new RuntimeException("Please select skill matrix rating for all items. " + noRating + " items without rating.");
        }

        // Calculate average rating
        double avgRating = details.stream()
                .mapToInt(InductionTrainingDetail::getSkillRating)
                .average()
                .orElse(0.0);

        // Update assignment
        assignment.setCurrentStatus("TRAINING GIVEN");
        assignment.setAverageRating(avgRating);
        assignment.setUpdatedBy(currentUser);
        assignment.setUpdatedAt(new Date());
        InductionAssignment saved = assignmentRepo.save(assignment);

        // Check if screening level is present and send feedback email
        String screeningLevel = saved.getScreeningLevel();
        if (screeningLevel != null && !screeningLevel.trim().isEmpty()) {
            String token = UUID.randomUUID().toString();
            saved.setFeedbackToken(token);
            saved.setFeedbackTokenActive(true);
            assignmentRepo.save(saved);

            // Fetch trainer and trainee details
            EmployeeMaster trainer = empRepo.findByEmpCode(saved.getTrainerEmpCode()).orElse(null);
            EmployeeMaster trainee = empRepo.findByEmpCode(saved.getEmpCode()).orElse(null);

            if (trainee != null) {
                String traineeEmail = null;
                Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail> personalOpt = personalRepo.findByEmployeeId(trainee.getId());
                if (personalOpt.isPresent()) {
                    traineeEmail = personalOpt.get().getPersonalEmail();
                }
                if (traineeEmail == null || traineeEmail.trim().isEmpty()) {
                    java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> traineeJp = 
                        employeeJobProfileRepository.findByEmployeeId(trainee.getId());
                    if (traineeJp.isPresent() && traineeJp.get().getOfficeEmail() != null) {
                        traineeEmail = traineeJp.get().getOfficeEmail().trim();
                    }
                }

                if (traineeEmail != null && !traineeEmail.trim().isEmpty()) {
                    String trainerEmail = "no-reply@autonoma.com";
                    if (trainer != null) {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> trainerJp = 
                            employeeJobProfileRepository.findByEmployeeId(trainer.getId());
                        if (trainerJp.isPresent() && trainerJp.get().getOfficeEmail() != null) {
                            trainerEmail = trainerJp.get().getOfficeEmail().trim();
                        }
                    }
                    String trainerName = (trainer != null) ? trainer.getEmployeeName() : "Trainer";
                    String trainerDesignation = (trainer != null && trainer.getDesignation() != null) ? trainer.getDesignation().getDesignationName() : "";
                    
                    com.autonoma.erp.model.admin.CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
                    String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName() : "NUTECH WIND PARTS PVT LTD";

                    String origin = getRequestOrigin();
                    String feedbackUrl = String.format("%s/hra/ats/induction-trainee?token=%s", origin, token);

                    Map<String, Object> placeholders = new HashMap<>();
                    placeholders.put("candidateName", com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.getCandidateFirstName(trainee.getEmployeeName()));
                    placeholders.put("candidateFirstName", com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.getCandidateFirstName(trainee.getEmployeeName()));
                    placeholders.put("candidateFullName", trainee.getEmployeeName() != null ? trainee.getEmployeeName() : "");
                    placeholders.put("inductionBatchName", screeningLevel != null ? screeningLevel : "Induction Program");
                    placeholders.put("inductionDate", new java.text.SimpleDateFormat("dd-MM-yyyy").format(new Date()));
                    placeholders.put("trainerName", trainerName);
                    placeholders.put("actionPortalLink", feedbackUrl);
                    placeholders.put("actionButtonText", "Provide Feedback");
                    placeholders.put("validityDays", "2");
                    placeholders.put("companyName", companyName);
                    placeholders.put("hrName", trainerName);
                    placeholders.put("currentDate", new java.text.SimpleDateFormat("dd-MM-yyyy").format(new Date()));
                    placeholders.put("currentYear", String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));

                    String finalSubject = String.format("Induction Training Feedback Required — %s", screeningLevel);
                    String finalHtmlBody = "";

                    if (emailContentService != null && emailTemplateEngine != null) {
                        try {
                            com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService.getTemplateOrApplicationDefault("ASSIGN INDUCTION");
                            com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(
                                    finalSubject,
                                    template.getBodyContent(),
                                    template.getYoursWindfully(),
                                    placeholders
                            );
                            finalSubject = rendered.getSubject();
                            finalHtmlBody = rendered.getFullMasterHtml();
                        } catch (Exception ex) {
                            System.err.println("Failed to render induction email via EmailTemplateEngine: " + ex.getMessage());
                        }
                    }

                    if (finalHtmlBody.isBlank()) {
                        finalHtmlBody = String.format(
                            "<p>Dear %s,</p><p>Thank you for attending the training session. Please submit your feedback regarding the trainer and overall program using the link below:</p><p><a href=\"%s\">Provide Feedback</a></p>",
                            trainee.getEmployeeName(), feedbackUrl
                        );
                    }

                    try {
                        emailSendingService.sendInductionFeedbackEmail(trainerEmail, trainerName, traineeEmail, finalSubject, finalHtmlBody);
                    } catch (Exception e) {
                        System.err.println("Failed to send induction feedback email: " + e.getMessage());
                    }
                }
            }
        }

        return saved;
    }

    private String getRequestOrigin() {
        try {
            jakarta.servlet.http.HttpServletRequest request = 
                ((org.springframework.web.context.request.ServletRequestAttributes) 
                 org.springframework.web.context.request.RequestContextHolder.getRequestAttributes())
                .getRequest();
            String origin = request.getHeader("Origin");
            if (origin == null || origin.trim().isEmpty()) {
                origin = request.getHeader("Referer");
                if (origin != null && !origin.trim().isEmpty()) {
                    try {
                        java.net.URI uri = new java.net.URI(origin);
                        origin = uri.getScheme() + "://" + uri.getAuthority();
                    } catch (Exception e) {
                        origin = "http://localhost:3001";
                    }
                } else {
                    origin = "http://localhost:3001";
                }
            }
            if (origin.endsWith("/")) {
                origin = origin.substring(0, origin.length() - 1);
            }
            return origin;
        } catch (Exception e) {
            return "http://localhost:3001";
        }
    }

    private InductionMaster createDefaultMaster(String details, String answer, String round, String currentUser) {
        InductionMaster m = new InductionMaster();
        m.setInductionDetails(details);
        m.setAnswer(answer);
        m.setDepartmentCodes("ALL");
        m.setLevelCodes("ALL");
        m.setInductionRound(round);
        m.setAttachmentRequired("NO");
        m.setIsActive(true);
        m.setCreatedBy(currentUser);
        m.setCreatedAt(new Date());
        return m;
    }
}
