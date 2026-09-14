package com.autonoma.erp.modules.induction.service;

import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.induction.entity.InductionReassignmentLog;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.induction.repository.InductionAssignmentRepository;
import com.autonoma.erp.modules.induction.repository.InductionTrainingDetailRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionReassignmentLogRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionRoundMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster;
import com.autonoma.erp.modules.induction.entity.InductionRoundMaster;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;

@Slf4j
@Service
public class InductionAssignmentService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(InductionAssignmentService.class);

    @Autowired
    private InductionAssignmentRepository repository;

    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver statusResolver;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private InductionTrainingDetailRepository trainingDetailRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private InductionReassignmentLogRepository inductionReassignmentLogRepository;

    @Autowired
    private DesignationLevelRepository designationLevelRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private BosUserPageAuthService authService;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private LevelMasterRepository levelMasterRepository;

    @Autowired
    private InductionRoundMasterRepository roundRepository;

    private void resolveTraineeFromMaster(List<InductionAssignment> list) {
        if (list == null || list.isEmpty()) return;
        java.util.Set<String> empCodes = list.stream()
                .map(InductionAssignment::getEmpCode)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        for (String empCode : empCodes) {
            try {
                updateTraineeInductionStatuses(empCode);
            } catch (Exception e) {
                log.error("Failed to update status for empCode: " + empCode, e);
            }
        }
        for (InductionAssignment a : list) {
            java.util.Optional<EmployeeMaster> empOpt = java.util.Optional.empty();
            if (a.getEmpCode() != null && !a.getEmpCode().trim().isEmpty()) {
                empOpt = employeeMasterRepository.findByEmpCode(a.getEmpCode());
                if (!empOpt.isPresent()) {
                    empOpt = employeeMasterRepository.findByOldEmpCode(a.getEmpCode());
                }
            }
            if (!empOpt.isPresent() && a.getOldEmpCode() != null && !a.getOldEmpCode().trim().isEmpty()) {
                empOpt = employeeMasterRepository.findByOldEmpCode(a.getOldEmpCode());
                if (!empOpt.isPresent()) {
                    empOpt = employeeMasterRepository.findByEmpCode(a.getOldEmpCode());
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

    public List<InductionAssignment> getAll() {
        List<InductionAssignment> list = repository.findAll();
        resolveTraineeFromMaster(list);
        return list;
    }

    public List<InductionAssignment> getActiveOnly() {
        List<InductionAssignment> list = repository.findAllActive();
        resolveTraineeFromMaster(list);
        return list;
    }

    public List<InductionAssignment> getByEmpCode(String empCode) {
        List<InductionAssignment> list = repository.findByEmpCode(empCode);
        resolveTraineeFromMaster(list);
        return list;
    }

    public void validateTrainerEligibility(EmployeeMaster trainee, EmployeeMaster trainer, String round) {
        if (trainer == null) {
            throw new RuntimeException("Trainer/Assessor is required.");
        }
        if (trainer.getStatus() == null || !"Active".equalsIgnoreCase(trainer.getStatus().getName())) {
            throw new RuntimeException("Trainer must be Active. Selected trainer is inactive.");
        }
        if (!"YES".equalsIgnoreCase(trainer.getIsInductionEligible())) {
            throw new RuntimeException("Trainer does not have Induction Ability (isInductionEligible must be YES).");
        }

        String deptName = "";
        if (trainer.getDepartment() != null) {
            deptName = trainer.getDepartment().getDepartmentName();
        } else if (trainer.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(trainer.getDepartmentId()).orElse(null);
            if (dept != null) {
                deptName = dept.getDepartmentName();
            }
        }
        if (deptName == null) deptName = "";
        deptName = deptName.toLowerCase().trim();

        if ("HR".equalsIgnoreCase(round)) {
            boolean matchesHR = deptName.contains("hr") || deptName.contains("h.r.") || 
                                 deptName.contains("human resource") || deptName.contains("people operations") || 
                                 deptName.contains("personnel") || deptName.contains("human capital");
            if (!matchesHR) {
                throw new RuntimeException("Trainer must belong to an HR department for the HR round. Department: " + deptName);
            }
        } else if ("QMS".equalsIgnoreCase(round)) {
            boolean matchesQMS = deptName.contains("qms") || deptName.contains("quality") || 
                                 deptName.contains("q.m.s.") || deptName.contains("qm") || 
                                 deptName.contains("q.m.") || deptName.contains("qa");
            if (!matchesQMS) {
                throw new RuntimeException("Trainer must belong to a Quality/QMS department for the QMS round. Department: " + deptName);
            }
        } else if ("DEPARTMENT".equalsIgnoreCase(round)) {
            String traineeDept = "";
            if (trainee.getDepartment() != null) {
                traineeDept = trainee.getDepartment().getDepartmentName();
            } else if (trainee.getDepartmentId() != null) {
                Department dept = departmentRepository.findById(trainee.getDepartmentId()).orElse(null);
                if (dept != null) {
                    traineeDept = dept.getDepartmentName();
                }
            }
            if (traineeDept == null) traineeDept = "";
            if (!deptName.equalsIgnoreCase(traineeDept.toLowerCase().trim())) {
                throw new RuntimeException("Trainer's department (" + deptName + ") must exactly match trainee's department (" + traineeDept + ") for the DEPARTMENT round.");
            }
        } else if ("MANAGEMENT".equalsIgnoreCase(round)) {
            if (trainer.getEmpLevelId() == null) {
                throw new RuntimeException("Trainer must have a designation level assigned for the MANAGEMENT round.");
            }
            List<DesignationLevel> allLevels = designationLevelRepository.findAll();
            List<DesignationLevel> activeSortedLevels = allLevels.stream()
                .filter(l -> l.getIsActive() != null && l.getIsActive())
                .sorted(java.util.Comparator.comparingInt(DesignationLevel::getScreeningLevel))
                .collect(java.util.stream.Collectors.toList());
            if (activeSortedLevels.size() >= 2) {
                List<DesignationLevel> topTwo = activeSortedLevels.subList(activeSortedLevels.size() - 2, activeSortedLevels.size());
                boolean isTopTwo = topTwo.stream().anyMatch(l -> l.getRowId().equals(trainer.getEmpLevelId()));
                if (!isTopTwo) {
                    String topTwoNames = topTwo.stream().map(DesignationLevel::getLevel).collect(java.util.stream.Collectors.joining(", "));
                    throw new RuntimeException("Trainer's level must be one of the top 2 management levels (" + topTwoNames + ") for the MANAGEMENT round.");
                }
            }
        }
    }

    @Transactional
    public InductionAssignment save(InductionAssignment entity, String currentUser) {
        // 0. Permission Check: only write access to HA1410 permitted
        if (!"SYSTEM".equalsIgnoreCase(currentUser) && !authService.hasPermission(currentUser, "HA1410", "write")) {
            throw new RuntimeException("Unauthorized: You do not have permission to assign or reschedule inductions.");
        }
        com.autonoma.erp.util.HolidayValidator.validateDate(entity.getInductionDate());
        resolveRelations(entity);

        // Validate that required relations were resolved
        if (entity.getRoundEntity() == null) {
            throw new RuntimeException("Induction round '" + entity.getInductionRound() + "' not found. Please check the round name.");
        }
        if (entity.getLevelEntity() == null && entity.getScreeningLevel() != null && !entity.getScreeningLevel().trim().isEmpty()) {
            throw new RuntimeException("Screening level '" + entity.getScreeningLevel() + "' not found in HR_LEVEL. Valid values are L1, L2, L3, L4 (or 'Level 1', 'Level 2', etc.).");
        }

        if (entity.getEmpCode() == null || entity.getEmpCode().isEmpty()) {
            throw new RuntimeException("Employee Code is mandatory.");
        }
        if (entity.getInductionRound() == null || entity.getInductionRound().isEmpty()) {
            throw new RuntimeException("Induction Round is mandatory.");
        }
        if (entity.getTrainerEmpCode() == null || entity.getTrainerEmpCode().isEmpty()) {
            throw new RuntimeException("Trainer Employee Code is mandatory.");
        }

        // Fetch Trainee and Trainer
        EmployeeMaster trainee = employeeMasterRepository.findByEmpCode(entity.getEmpCode())
            .orElseThrow(() -> new RuntimeException("Trainee employee not found: " + entity.getEmpCode()));

        EmployeeMaster newTrainer = employeeMasterRepository.findByEmpCode(entity.getTrainerEmpCode())
            .orElseThrow(() -> new RuntimeException("Trainer employee not found: " + entity.getTrainerEmpCode()));

        // Validate Candidate Induction Eligibility
        if (trainee.getFromWhere() != null && "ATS".equalsIgnoreCase(trainee.getFromWhere())) {
            com.autonoma.erp.modules.platform.common.entity.StatusMaster offerStatusObj = trainee.getOfferStatus();
            String offer = offerStatusObj != null ? offerStatusObj.getName() : null;
            if (offer == null || (!"ACCEPTED".equalsIgnoreCase(offer) && !"SUBMITTED".equalsIgnoreCase(offer) && !"TO BE VERIFIED".equalsIgnoreCase(offer) && !"TO BE VERIFY".equalsIgnoreCase(offer))) {
                throw new RuntimeException("Trainee " + entity.getEmpCode() + " has not accepted the offer letter yet (current status: " + (offer != null ? offer : "PENDING") + ").");
            }
            Date joiningDate = trainee.getDateOfJoining();
            if (joiningDate == null) {
                throw new RuntimeException("Trainee " + entity.getEmpCode() + " does not have a confirmed Date of Joining.");
            }
            
            java.util.Calendar todayCal = java.util.Calendar.getInstance();
            todayCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            todayCal.set(java.util.Calendar.MINUTE, 0);
            todayCal.set(java.util.Calendar.SECOND, 0);
            todayCal.set(java.util.Calendar.MILLISECOND, 0);
            Date today = todayCal.getTime();

            java.util.Calendar joiningCal = java.util.Calendar.getInstance();
            joiningCal.setTime(joiningDate);
            joiningCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            joiningCal.set(java.util.Calendar.MINUTE, 0);
            joiningCal.set(java.util.Calendar.SECOND, 0);
            joiningCal.set(java.util.Calendar.MILLISECOND, 0);
            Date joining = joiningCal.getTime();

            if (today.before(joining)) {
                throw new RuntimeException("Cannot assign induction round. Trainee's joining date (" + 
                    new java.text.SimpleDateFormat("yyyy-MM-dd").format(joiningDate) + 
                    ") has not been reached yet.");
            }
        }

        // Validate Trainer Eligibility
        validateTrainerEligibility(trainee, newTrainer, entity.getInductionRound());

        // Check if the screening level is already assigned (active) or completed
        List<InductionAssignment> empAssignments = repository.findByEmpCode(entity.getEmpCode());
        for (InductionAssignment past : empAssignments) {
            if (past.getScreeningLevel() != null && 
                past.getScreeningLevel().trim().equalsIgnoreCase(entity.getScreeningLevel().trim()) &&
                Boolean.TRUE.equals(past.getIsActive())) {
                
                if (entity.getId() == null || !past.getId().equals(entity.getId())) {
                    if ("REJECTED".equalsIgnoreCase(past.getCurrentStatus())) {
                        if (past.getTrainerEmpCode() != null &&
                            past.getTrainerEmpCode().equalsIgnoreCase(entity.getTrainerEmpCode())) {
                            throw new RuntimeException("Trainer " + newTrainer.getEmployeeName() + " previously rejected " + entity.getScreeningLevel() + " and cannot be reassigned to it.");
                        }
                    } else {
                        throw new RuntimeException("Screening level " + entity.getScreeningLevel() + " has already been assigned to this trainee.");
                    }
                }
            }
        }

        // Update trainer name in entity
        entity.setTrainerName(newTrainer.getEmployeeName());

        InductionAssignment savedEntity;

        if (entity.getId() != null) {
            // Edit assignment
            InductionAssignment original = repository.findById(entity.getId())
                    .orElseThrow(() -> new RuntimeException("Assignment not found."));
            
            // Completed inductions cannot be modified
            if ("COMPLETED".equalsIgnoreCase(original.getCurrentStatus())) {
                throw new RuntimeException("Completed inductions cannot be modified.");
            }

            boolean trainerChanged = !original.getTrainerEmpCode().equalsIgnoreCase(entity.getTrainerEmpCode());
            boolean dateOrTimeChanged = (original.getInductionDate() == null || entity.getInductionDate() == null || 
                    !original.getInductionDate().equals(entity.getInductionDate())) ||
                    (original.getInductionTime() == null || entity.getInductionTime() == null || 
                    !original.getInductionTime().equalsIgnoreCase(entity.getInductionTime()));

            if (trainerChanged) {
                // Deactivate any other active assignment for this round
                List<InductionAssignment> existingActive = repository.findActiveAssignmentsByEmpAndRound(entity.getEmpCode(), entity.getInductionRound());
                for (InductionAssignment existing : existingActive) {
                    existing.setIsActive(false);
                    existing.setCurrentStatus("PENDING");
                    existing.setUpdatedAt(new Date());
                    existing.setUpdatedBy(currentUser);
                    repository.save(existing);
                }

                // Deactivate original
                original.setIsActive(false);
                original.setCurrentStatus("PENDING");
                original.setUpdatedAt(new Date());
                original.setUpdatedBy(currentUser);
                repository.save(original);

                // Force execution of updates to clear active unique constraint before insert
                repository.flush();

                // Create new assignment
                InductionAssignment newAssignment = new InductionAssignment();
                newAssignment.setEmpCode(entity.getEmpCode());
                newAssignment.setEmpName(trainee.getEmployeeName());
                newAssignment.setOldEmpCode(trainee.getOldEmpCode());
                
                String traineeDept = trainee.getDepartment() != null ? trainee.getDepartment().getDepartmentName() : null;
                String traineeDesig = trainee.getDesignation() != null ? trainee.getDesignation().getDesignationName() : null;
                newAssignment.setDepartment(traineeDept);
                newAssignment.setDesignation(traineeDesig);

                newAssignment.setInductionRound(entity.getInductionRound());
                newAssignment.setScreeningLevel(entity.getScreeningLevel());
                newAssignment.setInductionDate(entity.getInductionDate());
                newAssignment.setInductionTime(entity.getInductionTime());
                newAssignment.setTrainerName(newTrainer.getEmployeeName());
                newAssignment.setTrainerEmpCode(entity.getTrainerEmpCode());
                newAssignment.setCurrentStatus("PENDING");
                newAssignment.setIsActive(true);
                newAssignment.setRemarks(entity.getRemarks());
                newAssignment.setCreatedAt(new Date());
                newAssignment.setCreatedBy(currentUser);
                resolveRelations(newAssignment);

                savedEntity = repository.save(newAssignment);

                try {
                    notificationService.notifyUserAboutInduction(newTrainer, savedEntity, "REASSIGN");
                } catch (Exception e) {
                    log.error("[INDUCTION] Failed to send REASSIGN notification to trainer {} ({}): {}",
                        newTrainer.getEmployeeName(), newTrainer.getEmpCode(), e.getMessage(), e);
                }

                // Log reassignment
                InductionReassignmentLog log = new InductionReassignmentLog();
                log.setTraineeName(trainee.getEmployeeName());
                log.setTraineeEmpCode(trainee.getEmpCode());
                log.setInductionRound(entity.getInductionRound());
                log.setPreviousAssessor(original.getTrainerName());
                log.setPreviousAssessorEmpCode(original.getTrainerEmpCode());
                log.setNewAssessor(newTrainer.getEmployeeName());
                log.setNewAssessorEmpCode(newTrainer.getEmpCode());
                log.setTrainee(trainee);
                log.setRound(newAssignment.getRoundEntity());
                log.setPreviousAssessorEntity(original.getTrainerEntity());
                log.setNewAssessorEntity(newAssignment.getTrainerEntity());
                log.setReassignmentReason(entity.getRemarks());
                log.setReassignedBy(currentUser);
                log.setReassignedDateTime(new Date());
                inductionReassignmentLogRepository.save(log);
            } else {
                // Same trainer, update original (possibly rescheduled)
                original.setInductionDate(entity.getInductionDate());
                original.setInductionTime(entity.getInductionTime());
                original.setRemarks(entity.getRemarks());
                original.setScreeningLevel(entity.getScreeningLevel());
                original.setInductionRound(entity.getInductionRound());
                
                if (dateOrTimeChanged) {
                    original.setCurrentStatus("PENDING");

                    // Log reschedule
                    InductionReassignmentLog log = new InductionReassignmentLog();
                    log.setTraineeName(trainee.getEmployeeName());
                    log.setTraineeEmpCode(trainee.getEmpCode());
                    log.setInductionRound(entity.getInductionRound());
                    log.setPreviousAssessor(original.getTrainerName());
                    log.setPreviousAssessorEmpCode(original.getTrainerEmpCode());
                    log.setNewAssessor(original.getTrainerName());
                    log.setNewAssessorEmpCode(original.getTrainerEmpCode());
                    log.setTrainee(trainee);
                    log.setRound(original.getRoundEntity());
                    log.setPreviousAssessorEntity(original.getTrainerEntity());
                    log.setNewAssessorEntity(original.getTrainerEntity());
                    log.setReassignmentReason("Rescheduled: " + entity.getRemarks());
                    log.setReassignedBy(currentUser);
                    log.setReassignedDateTime(new Date());
                    inductionReassignmentLogRepository.save(log);
                }
                original.setUpdatedAt(new Date());
                original.setUpdatedBy(currentUser);
                resolveRelations(original);
                savedEntity = repository.save(original);

                if (dateOrTimeChanged) {
                    try {
                        notificationService.notifyUserAboutInduction(original.getTrainerEntity() != null ? original.getTrainerEntity() : newTrainer, savedEntity, "RESCHEDULE");
                    } catch (Exception e) {
                        log.error("[INDUCTION] Failed to send RESCHEDULE notification to trainer {} ({}): {}",
                            newTrainer.getEmployeeName(), newTrainer.getEmpCode(), e.getMessage(), e);
                    }
                }
            }
        } else {
            // Check for other active assignments for this trainee and round
            List<InductionAssignment> allAssignments = repository.findByEmpCode(entity.getEmpCode());
            for (InductionAssignment existing : allAssignments) {
                boolean isSameRound = false;
                if (existing.getRoundEntity() != null && entity.getRoundEntity() != null) {
                    isSameRound = existing.getRoundEntity().getId().equals(entity.getRoundEntity().getId());
                } else {
                    String existingRound = (existing.getRoundEntity() != null)
                        ? existing.getRoundEntity().getRoundName()
                        : existing.getInductionRound();
                    String entityRound = (entity.getRoundEntity() != null)
                        ? entity.getRoundEntity().getRoundName()
                        : entity.getInductionRound();
                    if (existingRound != null && entityRound != null) {
                        isSameRound = existingRound.trim().equalsIgnoreCase(entityRound.trim());
                    }
                }

                if (isSameRound && Boolean.TRUE.equals(existing.getIsActive())) {
                    String roundLabel = entity.getInductionRound();
                    if (entity.getRoundEntity() != null) {
                        roundLabel = entity.getRoundEntity().getRoundName();
                    }
                    throw new RuntimeException("An active induction assignment already exists for employee " 
                        + entity.getEmpCode() + " in the " + roundLabel + " round.");
                }
            }

            // Create new record
            entity.setCreatedAt(new Date());
            entity.setCreatedBy(currentUser);
            if (entity.getCurrentStatus() == null) {
                entity.setCurrentStatus("PENDING");
            }
            entity.setIsActive(true);
            savedEntity = repository.save(entity);

            try {
                notificationService.notifyUserAboutInduction(newTrainer, savedEntity, "ASSIGN");
            } catch (Exception e) {
                log.error("[INDUCTION] Failed to send ASSIGN notification to trainer {} ({}): {}",
                    newTrainer.getEmployeeName(), newTrainer.getEmpCode(), e.getMessage(), e);
            }
        }

        // Update employee's status to Active and inductionStatus to PENDING
        employeeMasterRepository.findByEmpCode(entity.getEmpCode()).ifPresent(emp -> {
            emp.setInductionStatus("PENDING");
            emp.setStatus(statusResolver.get("Active"));
            employeeMasterRepository.save(emp);
        });

        return savedEntity;
    }

    @Transactional
    public void updateStatus(Long id, String newStatus, String currentUser) {
        InductionAssignment existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found."));
        
        String current = existing.getCurrentStatus();
        boolean allowed = false;

        if ("PENDING".equals(current) && "TRAINING GIVEN".equals(newStatus)) allowed = true;
        else if ("TRAINING GIVEN".equals(current) && ("COMPLETED".equals(newStatus) || "PENDING".equals(newStatus))) allowed = true;

        if (allowed) {
            existing.setCurrentStatus(newStatus);
            existing.setUpdatedAt(new Date());
            existing.setUpdatedBy(currentUser);
            repository.save(existing);
        } else {
            throw new RuntimeException("Invalid status transition from " + current + " to " + newStatus);
        }
    }

    @Transactional
    public void deleteAssignment(Long id, String currentUser) {
        if (!"SYSTEM".equalsIgnoreCase(currentUser) && !authService.hasPermission(currentUser, "HA1410", "write")) {
            throw new RuntimeException("Unauthorized: You do not have permission to delete induction assignments.");
        }

        InductionAssignment existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found."));

        if ("COMPLETED".equalsIgnoreCase(existing.getCurrentStatus())) {
            throw new RuntimeException("Completed inductions cannot be deleted.");
        }

        existing.setIsActive(false);
        existing.setCurrentStatus("PENDING");
        existing.setUpdatedBy(currentUser);
        existing.setUpdatedAt(new Date());
        repository.save(existing);
    }

    public List<InductionAssignment> saveAll(List<InductionAssignment> entities, String currentUser) {
        for (InductionAssignment entity : entities) {
            save(entity, currentUser);
        }
        return entities;
    }

    public boolean isUsedInTraining(Long id) {
        List<?> trainingDetails = trainingDetailRepository.findByAssignmentId(id);
        return trainingDetails != null && !trainingDetails.isEmpty();
    }

    @Transactional
    public void delete(Long id) {
        InductionAssignment existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found."));
        
        List<?> trainingDetails = trainingDetailRepository.findByAssignmentId(id);
        if (trainingDetails != null && !trainingDetails.isEmpty()) {
            throw new RuntimeException("Cannot delete this induction assignment because it is already used in training records.");
        }
        
        repository.delete(existing);
    }

    private void resolveRelations(InductionAssignment entity) {
        if (entity.getDepartment() != null && !entity.getDepartment().trim().isEmpty()) {
            departmentRepository.findAll().stream()
                .filter(d -> d.getDepartmentName().equalsIgnoreCase(entity.getDepartment()))
                .findFirst()
                .ifPresent(entity::setDepartmentEntity);
        }
        if (entity.getDesignation() != null && !entity.getDesignation().trim().isEmpty()) {
            designationRepository.findAll().stream()
                .filter(d -> d.getDesignationName().equalsIgnoreCase(entity.getDesignation()))
                .findFirst()
                .ifPresent(entity::setDesignationEntity);
        }
        if (entity.getInductionRound() != null && !entity.getInductionRound().trim().isEmpty()) {
            roundRepository.findByRoundName(entity.getInductionRound())
                .ifPresent(entity::setRoundEntity);
            if (entity.getRoundEntity() == null) {
                roundRepository.findAll().stream()
                    .filter(r -> r.getRoundName().equalsIgnoreCase(entity.getInductionRound()))
                    .findFirst()
                    .ifPresent(entity::setRoundEntity);
            }
        }
        if (entity.getScreeningLevel() != null && !entity.getScreeningLevel().trim().isEmpty()) {
            String screeningLvl = entity.getScreeningLevel().trim();
            levelMasterRepository.findAll().stream()
                .filter(l -> l.getLevelName().equalsIgnoreCase(screeningLvl) || 
                             ("L" + screeningLvl.replaceAll("\\D+", "")).equalsIgnoreCase(l.getLevelName()))
                .findFirst()
                .ifPresent(entity::setLevelEntity);
        }
        if (entity.getTrainerEmpCode() != null && !entity.getTrainerEmpCode().trim().isEmpty()) {
            employeeMasterRepository.findByEmpCode(entity.getTrainerEmpCode())
                .ifPresent(entity::setTrainerEntity);
        } else if (entity.getTrainerName() != null && !entity.getTrainerName().trim().isEmpty()) {
            employeeMasterRepository.findAll().stream()
                .filter(e -> e.getEmployeeName().equalsIgnoreCase(entity.getTrainerName()))
                .findFirst()
                .ifPresent(entity::setTrainerEntity);
        }
    }

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

    private Date getInductionDateTime(Date date, String timeStr) {
        if (date == null) return null;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(date);
        
        int hours = 9;
        int minutes = 0;
        if (timeStr != null && !timeStr.trim().isEmpty()) {
            String trimmed = timeStr.trim();
            java.util.regex.Matcher m12 = java.util.regex.Pattern.compile("^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(trimmed);
            if (m12.matches()) {
                hours = Integer.parseInt(m12.group(1));
                minutes = Integer.parseInt(m12.group(2));
                String ampm = m12.group(3).toUpperCase();
                if ("PM".equals(ampm) && hours < 12) hours += 12;
                if ("AM".equals(ampm) && hours == 12) hours = 0;
            } else {
                java.util.regex.Matcher m24 = java.util.regex.Pattern.compile("^(\\d{1,2}):(\\d{2})(?::\\d{2})?$").matcher(trimmed);
                if (m24.matches()) {
                    hours = Integer.parseInt(m24.group(1));
                    minutes = Integer.parseInt(m24.group(2));
                }
            }
        }
        cal.set(java.util.Calendar.HOUR_OF_DAY, hours);
        cal.set(java.util.Calendar.MINUTE, minutes);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTime();
    }

    @Transactional
    public void updateTraineeInductionStatuses(String empCode) {
        if (empCode == null || empCode.trim().isEmpty()) return;
        List<InductionAssignment> assignments = repository.findByEmpCode(empCode);
        if (assignments.isEmpty()) return;

        List<InductionAssignment> active = assignments.stream()
                .filter(a -> a.getIsActive() != null && a.getIsActive())
                .sorted(java.util.Comparator.comparingInt(a -> parseScreeningLevel(a.getScreeningLevel())))
                .collect(java.util.stream.Collectors.toList());

        if (active.isEmpty()) return;

        InductionAssignment lowestNonCompleted = null;
        for (InductionAssignment a : active) {
            if (!"COMPLETED".equalsIgnoreCase(a.getCurrentStatus())) {
                lowestNonCompleted = a;
                break;
            }
        }

        if (lowestNonCompleted == null) return;

        int levelNum = parseScreeningLevel(lowestNonCompleted.getScreeningLevel());
        String currentStatus = lowestNonCompleted.getCurrentStatus();

        if ("PENDING".equalsIgnoreCase(currentStatus)) {
            if (levelNum == 1) {
                Date scheduledDateTime = getInductionDateTime(lowestNonCompleted.getInductionDate(), lowestNonCompleted.getInductionTime());
                if (scheduledDateTime != null) {
                    long diffMs = scheduledDateTime.getTime() - System.currentTimeMillis();
                    if (diffMs <= 600000) { // 10 minutes prior
                        lowestNonCompleted.setCurrentStatus("WAITING_FOR_PROCESS");
                        lowestNonCompleted.setUpdatedAt(new Date());
                        lowestNonCompleted.setUpdatedBy("SYSTEM");
                        repository.save(lowestNonCompleted);
                    }
                }
            } else if (levelNum >= 2 && levelNum <= 4) {
                lowestNonCompleted.setCurrentStatus("WAITING_FOR_PROCESS");
                lowestNonCompleted.setUpdatedAt(new Date());
                lowestNonCompleted.setUpdatedBy("SYSTEM");
                repository.save(lowestNonCompleted);
            }
        }
    }
}
