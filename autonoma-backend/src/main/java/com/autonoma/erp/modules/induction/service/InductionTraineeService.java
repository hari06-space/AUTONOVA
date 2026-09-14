package com.autonoma.erp.modules.induction.service;

import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.induction.entity.InductionTrainingDetail;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionAssignmentRepository;
import com.autonoma.erp.modules.induction.repository.InductionMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionTrainingDetailRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class InductionTraineeService {

    @Autowired
    private InductionAssignmentRepository assignmentRepo;

    @Autowired
    private InductionTrainingDetailRepository detailRepo;

    @Autowired
    private InductionMasterRepository masterRepo;

    @Autowired
    private EmployeeMasterRepository empRepo;

    @Autowired
    private DesignationLevelRepository designationLevelRepo;

    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver statusResolver;

    private void resolveTraineeFromMaster(List<InductionAssignment> list) {
        if (list == null || list.isEmpty()) return;
        for (InductionAssignment a : list) {
            java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = java.util.Optional.empty();
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
     * Get trainee records for the current employee (login-filtered).
     * Only shows records with currentStatus = 'TRAINING GIVEN'.
     */
    public List<InductionAssignment> getForTrainee(String empCode) {
        List<InductionAssignment> list;
        if ("*".equals(empCode)) {
            list = assignmentRepo.findAllTraineeRecords();
        } else {
            list = assignmentRepo.findTraineeRecords(empCode);
        }
        resolveTraineeFromMaster(list);
        return list;
    }

    /**
     * Get training detail items for a specific assignment (trainee view).
     * Enriches with InductionMaster data.
     */
    public List<InductionTrainingDetail> getDetails(Long assignmentId) {
        List<InductionTrainingDetail> details = detailRepo.findByAssignmentId(assignmentId);

        for (InductionTrainingDetail detail : details) {
            masterRepo.findById(detail.getInductionMasterId()).ifPresent(master -> {
                detail.setInductionDetails(master.getInductionDetails());
                detail.setAnswer(master.getAnswer());
                detail.setInductionRound(master.getInductionRound());
                detail.setAttachmentRequired(master.getAttachmentRequired());
            });
        }
        return details;
    }

    /**
     * Submit trainee responses:
     * - If ALL items = UNDERSTOOD → assignment status = COMPLETED
     * - If ANY item = NEED MORE TRAINING → assignment status = REJECTED
     * - Also checks if ALL rounds completed → updates EmployeeMaster.inductionStatus
     */
    @Transactional
    public InductionAssignment submitResponses(Long assignmentId, List<InductionTrainingDetail> responses, String currentUser) {
        InductionAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!"TRAINING GIVEN".equalsIgnoreCase(assignment.getCurrentStatus())) {
            throw new RuntimeException("Can only submit responses for 'TRAINING GIVEN' assignments. Current: " + assignment.getCurrentStatus());
        }

        // Update each detail with trainee response
        boolean hasRejection = false;
        for (InductionTrainingDetail response : responses) {
            InductionTrainingDetail existing = detailRepo.findById(response.getId())
                    .orElseThrow(() -> new RuntimeException("Detail item not found: " + response.getId()));

            if (!existing.getAssignmentId().equals(assignmentId)) {
                throw new RuntimeException("Detail item does not belong to this assignment");
            }

            // Validate trainee status is set
            if (response.getTraineeStatus() == null || response.getTraineeStatus().isEmpty()) {
                throw new RuntimeException("Please select trainee status for all items.");
            }

            // Validate trainee comments are not empty
            if (response.getTraineeComments() == null || response.getTraineeComments().trim().isEmpty()) {
                throw new RuntimeException("Comments should not be empty for all items.");
            }

            existing.setTraineeStatus(response.getTraineeStatus());
            existing.setTraineeComments(response.getTraineeComments());
            existing.setUpdatedBy(currentUser);
            existing.setUpdatedAt(new Date());
            detailRepo.save(existing);

            if ("NEED MORE TRAINING".equalsIgnoreCase(response.getTraineeStatus())) {
                hasRejection = true;
            }
        }

        assignment.setFeedbackTokenActive(false);
        if (hasRejection) {
            // REJECTION flow: revert to PENDING, needs retraining/rescheduling
            assignment.setCurrentStatus("PENDING");
            assignment.setUpdatedBy(currentUser);
            assignment.setUpdatedAt(new Date());
            assignmentRepo.save(assignment);
        } else {
            // ALL UNDERSTOOD: mark as COMPLETED
            assignment.setCurrentStatus("COMPLETED");
            assignment.setTrainingCompletedAt(new Date());
            assignment.setUpdatedBy(currentUser);
            assignment.setUpdatedAt(new Date());
            assignmentRepo.save(assignment);

            // Check if ALL rounds are now completed for this employee
            checkAndCompleteInduction(assignment.getEmpCode());
        }

        return assignment;
    }

    /**
     * Checks if ALL active induction rounds for an employee are COMPLETED.
     * If so, and minimum 2 levels are completed, updates EmployeeMaster.inductionStatus = 'COMPLETED'
     * and status = 'Active'.
     */
    private void checkAndCompleteInduction(String empCode) {
        long incompleteCount = assignmentRepo.countIncompleteByEmpCode(empCode);
        if (incompleteCount == 0) {
            long completedLevels = assignmentRepo.countCompletedLevelsByEmpCode(empCode);
            empRepo.findByEmpCode(empCode).ifPresent(emp -> {
                int requiredLevels = 2; // fallback default
                if (emp.getEmpLevelId() != null) {
                    java.util.Optional<DesignationLevel> levelOpt = designationLevelRepo.findById(emp.getEmpLevelId());
                    if (levelOpt.isPresent()) {
                        requiredLevels = levelOpt.get().getScreeningLevel();
                    }
                }
                if (completedLevels >= requiredLevels) {
                    emp.setInductionStatus("COMPLETED");
                    emp.setStatus(statusResolver.get("Active"));
                    emp.setUpdatedAt(new Date());
                    empRepo.save(emp);
                }
            });
        }
    }
}
