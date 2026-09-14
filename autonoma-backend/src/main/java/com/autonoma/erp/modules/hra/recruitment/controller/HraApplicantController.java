package com.autonoma.erp.modules.hra.recruitment.controller;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.service.admin.EmailSendingService;
import com.autonoma.erp.model.VisitorGatePass;
import com.autonoma.erp.repository.VisitorGatePassRepository;
import com.autonoma.erp.service.VisitorGatePassService;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeActivity;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeContact;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeEducation;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeExperience;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeKycDocument;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeOfficeMailCredentials;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeActivityRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeEducationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeExperienceRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeKycDocumentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeTypeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeTypeMaster;
import com.autonoma.erp.modules.hra.recruitment.repository.HraApplicantInterviewRepository;
import com.autonoma.erp.modules.hr.employee.service.EmployeeMasterService;
import com.autonoma.erp.modules.induction.repository.InductionAssignmentRepository;
import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.hra.recruitment.entity.InterviewMaster;
import com.autonoma.erp.modules.hra.recruitment.repository.InterviewMasterRepository;
import com.autonoma.erp.modules.hra.recruitment.service.AtsEmailService;
import com.autonoma.erp.modules.hra.recruitment.service.InvalidationStrategy;
import com.autonoma.erp.modules.qms.audit.entity.VerificationCriteria;
import com.autonoma.erp.modules.qms.audit.repository.VerificationCriteriaRepository;
import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantVerificationSubmission;
import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantVerificationResponse;
import com.autonoma.erp.modules.hra.recruitment.repository.ApplicantVerificationSubmissionRepository;
import com.autonoma.erp.modules.hra.recruitment.repository.ApplicantVerificationResponseRepository;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.hra.recruitment.constant.AtsRejectionStage;
import com.autonoma.erp.modules.hra.recruitment.entity.AtsRejectedDocument;
import com.autonoma.erp.modules.hra.recruitment.repository.AtsRejectedDocumentRepository;
import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantPortalToken;
import com.autonoma.erp.modules.hra.recruitment.repository.ApplicantPortalTokenRepository;

import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.platform.identity.service.JwtService;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Properties;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/hra/applicants")
@CrossOrigin(origins = "*")
@Tag(name = "HRA - Application Tracking System", description = "Endpoints for applicant management")
@Slf4j
public class HraApplicantController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HraApplicantController.class);

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private VisitorGatePassRepository visitorPassRepo;

    @Autowired
    private VisitorGatePassService visitorPassService;

    @Autowired
    private EmployeePersonalDetailRepository personalRepo;

    @Autowired
    private EmployeeContactRepository contactRepo;

    @Autowired
    private EmployeeJobProfileRepository jobProfileRepo;

    @Autowired
    private EmployeeExperienceRepository experienceRepo;

    @Autowired
    private EmployeeEducationRepository educationRepo;

    @Autowired
    private EmployeeKycDocumentRepository kycDocumentRepo;

    @Autowired
    private EmployeeActivityRepository activityRepo;

    @Autowired
    private HraApplicantInterviewRepository applicantInterviewRepo;

    @Autowired
    private InductionAssignmentRepository inductionAssignmentRepo;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.service.EmployeeMasterService employeeMasterService;

    @Autowired
    private com.autonoma.erp.service.admin.AutoIdGenerationService autoIdGenerationService;

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DepartmentRepository departmentRepo;

    @Autowired
    private ShiftMasterRepository shiftMasterRepo;

    @Autowired
    private com.autonoma.erp.modules.platform.files.service.FileService fileService;

    @Autowired
    private DesignationLevelRepository designationLevelRepo;

    @Autowired
    private InterviewMasterRepository interviewMasterRepo;

    @Autowired
    private EmployeeTypeMasterRepository employeeTypeRepo;

    @Autowired
    private DesignationRepository designationRepo;

    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.AtsAttachmentService atsAttachmentService;

    @Autowired
    private VerificationCriteriaRepository verificationCriteriaRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.common.repository.CategoryMasterRepository categoryMasterRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.EmpGradeRepository empGradeRepo;

    @Autowired
    private ApplicantVerificationSubmissionRepository verificationSubmissionRepo;

    @Autowired
    private ApplicantVerificationResponseRepository verificationResponseRepo;

    @Autowired(required = false)
    private AtsEmailService atsEmailService;

    @Autowired(required = false)
    private EmailSendingService emailSendingService;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.EmailContentService emailContentService;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.EmailDefaultTemplates emailDefaultTemplates;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.NotificationService notificationService;

    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver statusResolver;

    @Autowired
    private com.autonoma.erp.modules.hra.recruitment.service.ApplicantPortalTokenService portalTokenService;

    @Autowired
    private AtsRejectedDocumentRepository rejectedDocumentRepo;

    @Autowired
    private ApplicantPortalTokenRepository tokenRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.modules.master.geography.repository.CountryMasterRepository countryRepo;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @GetMapping("/eligible-for-offer")
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    @Operation(summary = "Get ATS applicants eligible for offer letter")
    @Transactional(readOnly = true)
    public ResponseEntity<java.util.List<com.autonoma.erp.modules.hra.letters.dto.EligibleApplicantDto>> getEligibleApplicantsForOffer() {
        List<EmployeeMaster> eligible = employeeRepo.findAtsApplicantsEligibleForOffer();
        if (eligible != null && !eligible.isEmpty()) {
            List<Long> empIds = eligible.stream()
                    .map(EmployeeMaster::getId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            if (!empIds.isEmpty()) {
                List<EmployeePersonalDetail> personals = personalRepo.findByEmployeeIdIn(empIds);
                Map<Long, EmployeePersonalDetail> personalMap = personals.stream()
                        .filter(p -> p.getEmployeeId() != null)
                        .collect(java.util.stream.Collectors.toMap(EmployeePersonalDetail::getEmployeeId, p -> p, (p1, p2) -> p1));
                for (EmployeeMaster emp : eligible) {
                    EmployeePersonalDetail p = personalMap.get(emp.getId());
                    if (p != null) {
                        if (p.getPersonalEmail() != null && !p.getPersonalEmail().isBlank()) {
                            if (emp.getOfficeMail() == null || emp.getOfficeMail().isBlank()) {
                                emp.setOfficeMail(p.getPersonalEmail().trim());
                            }
                        }
                    }
                }
            }
        }
        java.util.List<com.autonoma.erp.modules.hra.letters.dto.EligibleApplicantDto> dtos = eligible == null
                ? java.util.Collections.emptyList()
                : eligible.stream()
                        .map(com.autonoma.erp.modules.hra.letters.dto.EligibleApplicantDto::fromEntity)
                        .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get all applicants")
    @Transactional(readOnly = true)
    public Object getAllApplicants(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        List<EmployeeMaster> applicants;
        long totalElements = 0;
        int totalPages = 1;
        boolean isPaginated = (page != null && size != null && size > 0);

        if (isPaginated) {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                    page, size,
                    org.springframework.data.domain.Sort
                            .by(org.springframework.data.domain.Sort.Direction.DESC, "applicantDate")
                            .and(org.springframework.data.domain.Sort
                                    .by(org.springframework.data.domain.Sort.Direction.DESC, "id")));
            org.springframework.data.domain.Page<EmployeeMaster> applicantPage = employeeRepo
                    .findAtsApplicants(pageable);
            applicants = applicantPage.getContent();
            totalElements = applicantPage.getTotalElements();
            totalPages = applicantPage.getTotalPages();
        } else {
            applicants = employeeRepo.findAtsApplicants();
            totalElements = applicants.size();
        }

        List<Long> empIds = new ArrayList<>();
        for (EmployeeMaster emp : applicants) {
            if (emp.getIsActive() != null && !emp.getIsActive()) {
                continue;
            }
            empIds.add(emp.getId());
        }

        Map<Long, String> aadharMap = new HashMap<>();
        Map<Long, String> emailMap = new HashMap<>();
        if (!empIds.isEmpty()) {
            List<EmployeePersonalDetail> personals = personalRepo.findByEmployeeIdIn(empIds);
            for (EmployeePersonalDetail p : personals) {
                if (p.getEmployeeId() != null) {
                    aadharMap.put(p.getEmployeeId(), p.getAadharNumber() != null ? p.getAadharNumber() : "");
                    emailMap.put(p.getEmployeeId(), p.getPersonalEmail() != null ? p.getPersonalEmail() : "");
                }
            }
            // Fallback: check EmployeeKycDocument table for missing Aadhar numbers
            List<EmployeeKycDocument> kycDocs = kycDocumentRepo.findByEmployeeIdIn(empIds);
            for (EmployeeKycDocument kyc : kycDocs) {
                if (kyc.getEmployeeId() != null && "AADHAR CARD".equalsIgnoreCase(kyc.getDocumentName())) {
                    if (kyc.getDocumentNumber() != null && !kyc.getDocumentNumber().isBlank()) {
                        if (aadharMap.getOrDefault(kyc.getEmployeeId(), "").isBlank()) {
                            aadharMap.put(kyc.getEmployeeId(), kyc.getDocumentNumber());
                        }
                    }
                }
            }
        }

        // Cache designations and designation levels in bulk
        List<com.autonoma.erp.modules.hr.orgstructure.entity.Designation> designations = designationRepo.findAll();
        Map<Long, com.autonoma.erp.modules.hr.orgstructure.entity.Designation> designationMap = new HashMap<>();
        for (com.autonoma.erp.modules.hr.orgstructure.entity.Designation d : designations) {
            designationMap.put(d.getId(), d);
        }

        List<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevels = designationLevelRepo
                .findAll();
        Map<Long, com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevelMap = new HashMap<>();
        Map<String, com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevelByNameMap = new HashMap<>();
        for (com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl : designationLevels) {
            designationLevelMap.put(dl.getId(), dl);
            if (dl.getLevel() != null) {
                designationLevelByNameMap.put(dl.getLevel().trim().toLowerCase(), dl);
            }
        }

        // Cache interviews in bulk ONLY for the requested page empIds
        Map<Long, List<HraApplicantInterview>> interviewsByEmpId = new HashMap<>();
        List<HraApplicantInterview> allInterviews = empIds.isEmpty() ? new ArrayList<>()
                : applicantInterviewRepo.findByEmployeeIdIn(empIds);
        for (HraApplicantInterview iv : allInterviews) {
            if (iv.getEmployeeId() != null) {
                interviewsByEmpId.computeIfAbsent(iv.getEmployeeId(), k -> new ArrayList<>()).add(iv);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (EmployeeMaster emp : applicants) {
            if (emp.getIsActive() != null && !emp.getIsActive()) {
                continue;
            }
            String aadharNo = aadharMap.getOrDefault(emp.getId(), "");
            String emailId = emailMap.getOrDefault(emp.getId(), "");
            List<HraApplicantInterview> empInterviews = interviewsByEmpId.getOrDefault(emp.getId(), new ArrayList<>());

            // Resolve required screening level
            int required = 1;
            if (emp.getEmpLevelId() != null) {
                com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl = designationLevelMap
                        .get(emp.getEmpLevelId());
                if (dl != null) {
                    required = dl.getScreeningLevel();
                }
            } else if (emp.getDesignationId() != null) {
                com.autonoma.erp.modules.hr.orgstructure.entity.Designation desig = designationMap
                        .get(emp.getDesignationId());
                if (desig != null) {
                    String subCategoryLevel = desig.getSubCategoryLevel();
                    if (subCategoryLevel != null && !subCategoryLevel.trim().isEmpty()) {
                        com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl = designationLevelByNameMap
                                .get(subCategoryLevel.trim().toLowerCase());
                        if (dl != null) {
                            required = dl.getScreeningLevel();
                        } else {
                            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+")
                                    .matcher(subCategoryLevel);
                            if (m.find()) {
                                required = Integer.parseInt(m.group());
                            }
                        }
                    }
                }
            }

            InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(emp, required, empInterviews);
            result.add(mapEmployeeToSummaryMap(emp, aadharNo, emailId, eligibility, designationLevelMap, designationMap,
                    designationLevelByNameMap, empInterviews));
        }

        if (isPaginated) {
            Map<String, Object> pageResponse = new HashMap<>();
            pageResponse.put("content", result);
            pageResponse.put("totalElements", totalElements);
            pageResponse.put("totalPages", totalPages);
            pageResponse.put("page", page);
            pageResponse.put("size", size);
            return pageResponse;
        }

        return result;
    }

    private HraApplicantInterview getScheduledOrCurrentInterview(List<HraApplicantInterview> empInterviews) {
        if (empInterviews == null || empInterviews.isEmpty()) {
            return null;
        }

        // Filter to only active and scheduled/upcoming interviews
        List<HraApplicantInterview> candidates = new ArrayList<>();
        for (HraApplicantInterview iv : empInterviews) {
            // Check active
            boolean isActive = (iv.getIsActive() == null || iv.getIsActive())
                    && isInterviewStatusActive(iv.getStatus());
            if (!isActive) {
                continue;
            }

            // Check scheduled/upcoming (neither terminal/finished nor cancelled)
            com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusObj = iv.getInterviewStatus();
            String ivStatus = ivStatusObj != null ? ivStatusObj.getName() : null;
            if (ivStatus == null) {
                ivStatus = "PENDING";
            }

            boolean isTerminal = "COMPLETED".equalsIgnoreCase(ivStatus)
                    || "SELECTED".equalsIgnoreCase(ivStatus)
                    || "HOLD".equalsIgnoreCase(ivStatus)
                    || "ON HOLD".equalsIgnoreCase(ivStatus)
                    || "ON_HOLD".equalsIgnoreCase(ivStatus)
                    || "REJECTED".equalsIgnoreCase(ivStatus)
                    || "CANCELLED".equalsIgnoreCase(ivStatus);

            boolean hasFeedback = iv.getFeedbackJson() != null
                    && !iv.getFeedbackJson().trim().isEmpty()
                    && !"[]".equals(iv.getFeedbackJson().trim());

            if (!isTerminal && !hasFeedback) {
                candidates.add(iv);
            }
        }

        if (candidates.isEmpty()) {
            return null;
        }

        // Sort according to business sequence rules
        candidates.sort((a, b) -> {
            try {
                int aVal = Integer.parseInt(a.getScreeningLevel());
                int bVal = Integer.parseInt(b.getScreeningLevel());
                if (aVal != bVal) {
                    return Integer.compare(aVal, bVal);
                }
            } catch (Exception e) {
                String aStr = a.getScreeningLevel() != null ? a.getScreeningLevel().trim() : "";
                String bStr = b.getScreeningLevel() != null ? b.getScreeningLevel().trim() : "";
                if (!aStr.equalsIgnoreCase(bStr)) {
                    return aStr.compareToIgnoreCase(bStr);
                }
            }
            Long aId = a.getId() != null ? a.getId() : 0L;
            Long bId = b.getId() != null ? b.getId() : 0L;
            return aId.compareTo(bId);
        });

        return candidates.get(0);
    }

    private InterviewEligibilitySummary getInterviewEligibilitySummary(EmployeeMaster emp,
            int required, List<HraApplicantInterview> empInterviews) {
        if (emp == null || emp.getId() == null) {
            return new InterviewEligibilitySummary(1, 0, 0, false);
        }
        List<HraApplicantInterview> rawInterviews = empInterviews;
        if (rawInterviews == null) {
            rawInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
        }
        int assigned = getAssignedActiveInterviewRoundsCount(rawInterviews);
        int completed = getCompletedInterviewRoundsCount(rawInterviews);
        boolean eligible = computeFinalResolutionEligibility(rawInterviews);
        return new InterviewEligibilitySummary(required, assigned, completed, eligible);
    }

    private int getAssignedActiveInterviewRoundsCount(List<HraApplicantInterview> rawInterviews) {
        if (rawInterviews == null) {
            return 0;
        }
        int count = 0;
        for (HraApplicantInterview iv : rawInterviews) {
            boolean active = (iv.getIsActive() == null || iv.getIsActive())
                    && isInterviewStatusActive(iv.getStatus());
            if (active) {
                count++;
            }
        }
        return count;
    }

    private int getCompletedInterviewRoundsCount(List<HraApplicantInterview> rawInterviews) {
        if (rawInterviews == null) {
            return 0;
        }
        int completed = 0;
        for (HraApplicantInterview iv : rawInterviews) {
            boolean active = (iv.getIsActive() == null || iv.getIsActive())
                    && isInterviewStatusActive(iv.getStatus());
            if (active) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusObj = iv.getInterviewStatus();
                String ivStatus = ivStatusObj != null ? ivStatusObj.getName() : null;
                boolean isTerminalStatus = ivStatus != null
                        && !"PENDING".equalsIgnoreCase(ivStatus.trim())
                        && !"WAITING FOR PROGRESS".equalsIgnoreCase(ivStatus.trim())
                        && !"WAITING FOR PROCESS".equalsIgnoreCase(ivStatus.trim());
                boolean hasBeenEvaluated = iv.getFeedbackJson() != null
                        && !iv.getFeedbackJson().trim().isEmpty()
                        && !"[]".equals(iv.getFeedbackJson().trim());
                if (isTerminalStatus || hasBeenEvaluated) {
                    completed++;
                }
            }
        }
        return completed;
    }

    private Map<String, Object> mapEmployeeToSummaryMap(EmployeeMaster emp, String aadharNo, String emailId,
            InterviewEligibilitySummary eligibility,
            Map<Long, com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevelMap,
            Map<Long, com.autonoma.erp.modules.hr.orgstructure.entity.Designation> designationMap,
            Map<String, com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevelByNameMap,
            List<HraApplicantInterview> empInterviews) {
        Map<String, Object> map = new HashMap<>();
        HraApplicantInterview scheduledIv = getScheduledOrCurrentInterview(empInterviews);
        if (scheduledIv != null) {
            map.put("scheduledInterviewDate", scheduledIv.getInterviewDate());
            map.put("scheduledInterviewTime", scheduledIv.getStartTime());
        } else if (empInterviews != null && !empInterviews.isEmpty()) {
            HraApplicantInterview latestIv = null;
            for (HraApplicantInterview iv : empInterviews) {
                boolean isActive = (iv.getIsActive() == null || iv.getIsActive())
                        && isInterviewStatusActive(iv.getStatus());
                if (isActive) {
                    if (latestIv == null
                            || (iv.getId() != null && latestIv.getId() != null && iv.getId() > latestIv.getId())) {
                        latestIv = iv;
                    }
                }
            }
            if (latestIv != null && latestIv.getInterviewDate() != null) {
                map.put("scheduledInterviewDate", latestIv.getInterviewDate());
                map.put("scheduledInterviewTime", latestIv.getStartTime());
            } else {
                map.put("scheduledInterviewDate", emp.getCallLetterDate());
                map.put("scheduledInterviewTime", emp.getCallLetterTime());
            }
        } else {
            map.put("scheduledInterviewDate", emp.getCallLetterDate());
            map.put("scheduledInterviewTime", emp.getCallLetterTime());
        }
        map.put("id", emp.getId());
        map.put("applicantCode", emp.getApplicantCode());
        map.put("empCode", emp.getEmpCode());
        String atsDisplayCode = emp.getApplicantCode() != null && !emp.getApplicantCode().trim().isEmpty()
                ? emp.getApplicantCode()
                : emp.getEmpCode();
        map.put("enRolledNo", atsDisplayCode);
        map.put("displayCode", atsDisplayCode);
        map.put("applicantDate", emp.getApplicantDate() != null ? emp.getApplicantDate() : emp.getCreatedDate());
        map.put("designationId", emp.getDesignationId());
        map.put("positionLookFor",
                emp.getDesignationId() != null ? emp.getDesignationId().toString() : "");
        map.put("title", emp.getTitle());
        map.put("firstName", emp.getFirstName());
        map.put("lastName", emp.getLastName());
        map.put("departmentId", emp.getDepartmentId());
        map.put("department", emp.getDepartmentId() != null ? emp.getDepartmentId().toString() : "");
        map.put("aadharNo", aadharNo);
        map.put("emailId", emailId != null ? emailId : "");

        map.put("callStatus", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");
        map.put("call", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");

        String candStatus = emp.getStatus() != null ? emp.getStatus().getName() : "Pending";
        String candStatusUpper = candStatus != null ? candStatus.toUpperCase().trim() : "";
        com.autonoma.erp.modules.platform.common.entity.StatusMaster empIvSM = emp.getInterviewStatus();
        String interviewStatus = "Pending";

        if (statusResolver.isSelected(empIvSM) || statusResolver.isCompleted(empIvSM)) {
            interviewStatus = empIvSM.getName();
        } else if (statusResolver.isRejected(empIvSM)) {
            interviewStatus = "Rejected";
        } else if (statusResolver.isHold(empIvSM)) {
            interviewStatus = "Hold";
        } else if ("SELECTED".equals(candStatusUpper) || "OFFERED".equals(candStatusUpper)
                || "ON-ROLL".equals(candStatusUpper)) {
            interviewStatus = "SELECTED";
        } else if ("REJECTED".equals(candStatusUpper)) {
            interviewStatus = "Rejected";
        } else if ("CANCELLED".equals(candStatusUpper)) {
            if (statusResolver.isSelected(empIvSM) || statusResolver.isCompleted(empIvSM)) {
                interviewStatus = empIvSM.getName();
            } else {
                interviewStatus = "CANCELLED";
            }
        } else if (eligibility != null
                && (eligibility.getAssignedActiveRounds() > 0 || eligibility.getCompletedActiveRounds() > 0)) {
            interviewStatus = "In Progress";
        } else {
            interviewStatus = "Pending";
        }
        map.put("interviewStatus", interviewStatus);
        map.put("interview", interviewStatus);

        String offerStatus = emp.getOfferStatus() != null ? emp.getOfferStatus().getName() : "Pending";
        if ("REJECTED".equals(candStatusUpper)) {
            offerStatus = "Rejected";
        } else if ("CANCELLED".equals(candStatusUpper)) {
            offerStatus = "CANCELLED";
        }
        map.put("offerStatus", offerStatus);
        map.put("offer", offerStatus);

        map.put("atsOverallStatus",
                emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getName() : "Pending");

        if (candStatus == null || "APPLIED".equalsIgnoreCase(candStatus) || "PENDING".equalsIgnoreCase(candStatus)
                || "IN PROGRESS".equalsIgnoreCase(candStatus) || "IN_PROGRESS".equalsIgnoreCase(candStatus)) {
            if (eligibility != null && eligibility.isEligible()) {
                candStatus = "Waiting For Progress";
            }
        }
        map.put("status", candStatus);

        map.put("q21_is_experienced", emp.getQ21_isExperienced());
        map.put("q21_isExperienced", emp.getQ21_isExperienced());

        String verificationStatus = emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName()
                : "Pending";
        if ("REJECTED".equals(candStatusUpper)) {
            verificationStatus = "Rejected";
        } else if ("CANCELLED".equalsIgnoreCase(candStatus)) {
            verificationStatus = "CANCELLED";
        } else if ("YES".equalsIgnoreCase(emp.getQ21_isExperienced())) {
            if (verificationStatus == null || verificationStatus.isEmpty()
                    || "N/A".equalsIgnoreCase(verificationStatus)
                    || "Not Applicable".equalsIgnoreCase(verificationStatus)) {
                verificationStatus = "Pending";
            }
        } else {
            verificationStatus = "Not Applicable";
        }
        map.put("verificationStatus", verificationStatus);
        map.put("verification", verificationStatus);

        com.autonoma.erp.modules.platform.common.entity.StatusMaster rejectedSM = statusResolver.get("REJECTED");
        com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledSM = statusResolver.get("CANCELLED");
        com.autonoma.erp.modules.platform.common.entity.StatusMaster onRollSM = statusResolver.get("ON-ROLL");
        com.autonoma.erp.modules.platform.common.entity.StatusMaster selectedSM = statusResolver.get("SELECTED");

        map.put("statusId", emp.getStatus() != null ? emp.getStatus().getId() : null);
        map.put("atsOverallStatusId", emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getId() : null);
        map.put("interviewStatusId", emp.getInterviewStatus() != null ? emp.getInterviewStatus().getId() : null);
        map.put("callStatusId", emp.getCallStatus() != null ? emp.getCallStatus().getId() : null);
        map.put("offerStatusId", emp.getOfferStatus() != null ? emp.getOfferStatus().getId() : null);
        map.put("verificationStatusId",
                emp.getVerificationStatus() != null ? emp.getVerificationStatus().getId() : null);

        map.put("rejectedStatusId", rejectedSM != null ? rejectedSM.getId() : null);
        map.put("cancelledStatusId", cancelledSM != null ? cancelledSM.getId() : null);
        map.put("onRollStatusId", onRollSM != null ? onRollSM.getId() : null);
        map.put("selectedStatusId", selectedSM != null ? selectedSM.getId() : null);

        boolean isRejectionEmailPending = (rejectedSM != null && emp.getOfferStatus() != null
                && emp.getOfferStatus().getId().equals(rejectedSM.getId()))
                && !(emp.getStatus() != null && rejectedSM.getId().equals(emp.getStatus().getId()));
        map.put("isRejectionEmailPending", isRejectionEmailPending);
        if (isRejectionEmailPending) {
            map.put("finalDecision", "REJECTED");
            map.put("finalDecisionStatusId", rejectedSM.getId());
        }

        boolean isRejectedBool = (emp.getStatus() != null && rejectedSM != null
                && emp.getStatus().getId().equals(rejectedSM.getId()))
                || (emp.getAtsOverallStatus() != null && rejectedSM != null
                        && emp.getAtsOverallStatus().getId().equals(rejectedSM.getId()))
                || "REJECTED".equalsIgnoreCase(candStatusUpper);
        boolean isCancelledBool = (emp.getStatus() != null && cancelledSM != null
                && emp.getStatus().getId().equals(cancelledSM.getId()))
                || (emp.getAtsOverallStatus() != null && cancelledSM != null
                        && emp.getAtsOverallStatus().getId().equals(cancelledSM.getId()))
                || "CANCELLED".equalsIgnoreCase(candStatusUpper);
        boolean isAlreadyOnRollBool = (emp.getStatus() != null && onRollSM != null
                && emp.getStatus().getId().equals(onRollSM.getId()))
                || (emp.getAtsOverallStatus() != null && onRollSM != null
                        && emp.getAtsOverallStatus().getId().equals(onRollSM.getId()))
                || "ON-ROLL".equalsIgnoreCase(candStatusUpper);

        map.put("isRejected", isRejectedBool);
        map.put("isCancelled", isCancelledBool);
        map.put("isAlreadyOnRoll", isAlreadyOnRollBool);

        // Call letter dates – needed by Assign Interview dialog to pre-fill Interview
        // Date
        map.put("callLetterDate", emp.getCallLetterDate());
        map.put("callLetterTime", emp.getCallLetterTime());

        // Resolve Level and Screen Level from Designation Master
        String resolvedLevel = null;
        int resolvedScreenLevel = 0;
        if (eligibility != null) {
            resolvedScreenLevel = eligibility.getRequiredScreeningLevel();
        }
        if (emp.getEmpLevelId() != null) {
            com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl = designationLevelMap
                    .get(emp.getEmpLevelId());
            if (dl != null) {
                resolvedLevel = dl.getLevel();
                if (resolvedScreenLevel == 0) {
                    resolvedScreenLevel = dl.getScreeningLevel();
                }
            }
        }
        if (resolvedLevel == null && emp.getDesignationId() != null) {
            com.autonoma.erp.modules.hr.orgstructure.entity.Designation desig = designationMap
                    .get(emp.getDesignationId());
            if (desig != null) {
                String subCatLvl = desig.getSubCategoryLevel();
                if (subCatLvl != null && !subCatLvl.trim().isEmpty()) {
                    com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl = designationLevelByNameMap
                            .get(subCatLvl.trim().toLowerCase());
                    if (dl != null) {
                        resolvedLevel = dl.getLevel();
                        if (resolvedScreenLevel == 0) {
                            resolvedScreenLevel = dl.getScreeningLevel();
                        }
                    }
                }
            }
        }
        map.put("level", resolvedLevel);
        map.put("screenLevel", resolvedScreenLevel > 0 ? String.valueOf(resolvedScreenLevel) : null);

        // Document verification statuses – needed for doc review workspace
        map.put("photoVerifiedStatus", mapStatusMaster(emp.getPhotoVerifiedStatus()));
        map.put("photoRejectReason", emp.getPhotoRejectReason());
        map.put("candidatePhoto", emp.getEmployeePhotoUpload());
        map.put("employeePhotoUpload", emp.getEmployeePhotoUpload());
        map.put("photoUpload", emp.getEmployeePhotoUpload());
        map.put("photo", emp.getEmployeePhotoUpload());
        map.put("resumeVerifiedStatus", mapStatusMaster(emp.getResumeVerifiedStatus()));
        map.put("resumeRejectReason", emp.getResumeRejectReason());
        map.put("payslipVerifiedStatus", mapStatusMaster(emp.getPayslipVerifiedStatus()));
        map.put("payslipRejectReason", emp.getPayslipRejectReason());
        map.put("aadharVerifiedStatus", mapStatusMaster(emp.getAadharVerifiedStatus()));
        map.put("aadharRejectReason", emp.getAadharRejectReason());

        // Assessment – Reporting Manager & Vertical Head emails (needed for Initiate
        // Reference Verification)
        map.put("q42_hr_mgr_email", emp.getQ42_hrMgrEmail());
        map.put("q42_rep_mgr_email", emp.getQ42_hrMgrEmail());
        map.put("q45_vert_head_email", emp.getQ45_vertHeadEmail());

        map.put("cancellationReason", emp.getExitReason() != null ? emp.getExitReason() : "");
        map.put("exitReason", emp.getExitReason() != null ? emp.getExitReason() : "");

        map.put("createdBy", emp.getCreatedBy());
        map.put("createdAt", emp.getCreatedDate() != null ? emp.getCreatedDate() : emp.getApplicantDate());
        map.put("updatedBy", emp.getUpdatedBy());
        map.put("updatedAt", emp.getUpdatedDate());

        return map;
    }

    public static class InterviewEligibilitySummary {
        private final int requiredScreeningLevel;
        private final int assignedActiveRounds;
        private final int completedActiveRounds;
        private final boolean eligible;

        public InterviewEligibilitySummary(int requiredScreeningLevel, int assignedActiveRounds,
                int completedActiveRounds, boolean eligible) {
            this.requiredScreeningLevel = requiredScreeningLevel;
            this.assignedActiveRounds = assignedActiveRounds;
            this.completedActiveRounds = completedActiveRounds;
            this.eligible = eligible;
        }

        public int getRequiredScreeningLevel() {
            return requiredScreeningLevel;
        }

        public int getAssignedActiveRounds() {
            return assignedActiveRounds;
        }

        public int getCompletedActiveRounds() {
            return completedActiveRounds;
        }

        public boolean isEligible() {
            return eligible;
        }
    }

    public static class EmailSenderDetails {
        private final String username;
        private final String password;
        private final String senderName;
        private final boolean isCompanyFallback;

        public EmailSenderDetails(String username, String password, String senderName, boolean isCompanyFallback) {
            this.username = username;
            this.password = password;
            this.senderName = senderName;
            this.isCompanyFallback = isCompanyFallback;
        }

        public String getUsername() {
            return username;
        }

        public String getPassword() {
            return password;
        }

        public String getSenderName() {
            return senderName;
        }

        public boolean isCompanyFallback() {
            return isCompanyFallback;
        }
    }

    private EmailSenderDetails resolveEmailSenderDetails(String currentUserId) {
        String username = null;
        String password = null;
        String senderName = null;
        boolean isFallback = false;

        if (currentUserId != null) {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    EmployeeMaster senderEmp = senderEmpOpt.get();
                    EmployeeOfficeMailCredentials credentials = employeeMasterService.getOfficeMailCredentials(empId);
                    if (credentials.getOfficeEmail() != null && !credentials.getOfficeEmail().trim().isEmpty()) {
                        username = credentials.getOfficeEmail();
                        password = credentials.getOfficialPassword();
                        senderName = senderEmp.getEmployeeName();
                    }
                }
            }
        }

        if (username == null) {
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            if (company != null && company.getSmtpUsername() != null && !company.getSmtpUsername().trim().isEmpty() &&
                    company.getSmtpPassword() != null && !company.getSmtpPassword().trim().isEmpty()) {
                username = company.getSmtpUsername().trim();
                password = company.getSmtpPassword().trim();
                senderName = company.getCompanyName();
                isFallback = true;
            }
        }

        return new EmailSenderDetails(username, password, senderName, isFallback);
    }

    @GetMapping("/email-sender-info")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get resolved email sender info for ATS dialogs")
    public ResponseEntity<?> getEmailSenderInfo() {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        EmailSenderDetails details = resolveEmailSenderDetails(currentUserId);
        return ResponseEntity.ok(Map.of(
                "email", details.getUsername() != null ? details.getUsername() : "",
                "isCompanyFallback", details.isCompanyFallback()));
    }

    @GetMapping("/next-code")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Calculate next autogenerated candidate code")
    public ResponseEntity<?> getNextEnrolledNo() {
        try {
            String nextCode = autoIdGenerationService.previewNextCode("ATS_APPLICANT", new Date());
            return ResponseEntity.ok(nextCode);
        } catch (Exception e) {
            log.error("Failed to generate preview next code: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id:[0-9]+}")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get applicant by ID")
    public ResponseEntity<Map<String, Object>> getApplicantById(@PathVariable Long id) {
        return employeeRepo.findById(id)
                .map(emp -> ResponseEntity.ok(mapEmployeeToFullMap(emp)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id:[0-9]+}/summary")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get applicant summary by ID")
    public ResponseEntity<?> getApplicantSummaryById(@PathVariable Long id) {
        return employeeRepo.findById(id).map(emp -> {
            String aadharNo = "";
            String emailId = "";
            Optional<EmployeePersonalDetail> pOpt = personalRepo.findFirstByEmployeeId(emp.getId());
            if (pOpt.isPresent()) {
                aadharNo = pOpt.get().getAadharNumber() != null ? pOpt.get().getAadharNumber() : "";
                emailId = pOpt.get().getPersonalEmail() != null ? pOpt.get().getPersonalEmail() : "";
            }
            InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(emp, null);
            Map<String, Object> map = mapEmployeeToSummaryMap(emp, aadharNo, emailId, eligibility);
            return ResponseEntity.ok(map);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id:[0-9]+}/interviews")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get candidate interview history")
    public List<Map<String, Object>> getApplicantInterviews(@PathVariable Long id) {
        List<HraApplicantInterview> interviews = applicantInterviewRepo.findByEmployeeId(id);
        List<Map<String, Object>> result = new ArrayList<>();
        for (HraApplicantInterview interview : interviews) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", interview.getId());
            map.put("employeeId", interview.getEmployeeId());
            map.put("screeningLevel", interview.getScreeningLevel());
            map.put("round", interview.getRound());
            map.put("interviewDate", interview.getInterviewDate());
            map.put("startTime", interview.getStartTime());
            map.put("endTime", interview.getEndTime());
            map.put("interviewPerson", interview.getInterviewPerson());
            com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusSM = computeDynamicStatus(interview,
                    interviews);
            map.put("interviewStatus", ivStatusSM);
            map.put("interviewStatusId", ivStatusSM != null ? ivStatusSM.getId() : null);
            map.put("interviewStatusName", ivStatusSM != null ? ivStatusSM.getName() : null);
            map.put("interviewResult",
                    interview.getInterviewResult() != null ? interview.getInterviewResult() : "PENDING");
            map.put("interviewResultId",
                    interview.getInterviewResult() != null ? interview.getInterviewResult().getId() : null);
            map.put("createdBy", interview.getCreatedBy());
            map.put("createdDate", interview.getCreatedDate());
            com.autonoma.erp.modules.platform.common.entity.StatusMaster stObj = statusResolver
                    .get(interview.getStatus());
            map.put("status", stObj != null ? stObj.getName().toUpperCase()
                    : (interview.getStatus() != null ? interview.getStatus().toUpperCase() : "ACTIVE"));
            map.put("statusId", stObj != null ? stObj.getId() : null);
            map.put("statusName", stObj != null ? stObj.getName() : interview.getStatus());
            boolean isAct = (interview.getIsActive() == null || interview.getIsActive())
                    && isInterviewStatusActive(interview.getStatus());
            map.put("isActive", isAct);
            map.put("expSalary", interview.getExpSalary());
            map.put("suggestedSalary", interview.getSuggestedSalary());
            map.put("comments", interview.getComments());
            map.put("attachmentRequired", interview.getAttachmentRequired());
            String ivPath = atsAttachmentService.getInterviewAttachmentPath(interview.getId());
            map.put("attachmentPath", ivPath != null ? ivPath : interview.getAttachmentPath());
            map.put("feedbackJson", interview.getFeedbackJson());
            result.add(map);
        }
        result.sort((r1, r2) -> {
            boolean active1 = "ACTIVE".equalsIgnoreCase((String) r1.get("status"));
            boolean active2 = "ACTIVE".equalsIgnoreCase((String) r2.get("status"));

            if (active1 && !active2) {
                return -1; // active first
            }
            if (!active1 && active2) {
                return 1; // active first
            }

            // If both have the same active status, sort by business rules
            try {
                int lv1 = Integer.parseInt(String.valueOf(r1.get("screeningLevel")).trim());
                int lv2 = Integer.parseInt(String.valueOf(r2.get("screeningLevel")).trim());
                if (lv1 != lv2) {
                    return Integer.compare(lv1, lv2);
                }
            } catch (Exception e) {
                String s1 = r1.get("screeningLevel") != null ? String.valueOf(r1.get("screeningLevel")).trim() : "";
                String s2 = r2.get("screeningLevel") != null ? String.valueOf(r2.get("screeningLevel")).trim() : "";
                if (!s1.equalsIgnoreCase(s2)) {
                    return s1.compareToIgnoreCase(s2);
                }
            }

            // Deterministic tie-breaker: ID ascending
            Long id1 = r1.get("id") != null ? (Long) r1.get("id") : 0L;
            Long id2 = r2.get("id") != null ? (Long) r2.get("id") : 0L;
            return id1.compareTo(id2);
        });
        return result;
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Create new applicant")
    @Transactional
    public ResponseEntity<?> saveApplicant(@RequestBody Map<String, Object> payload) {
        String refMode = getStringValue(payload, "refMode");
        if (refMode == null || refMode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Ref Mode is required.");
        }
        // Validation for unique Aadhaar number if duplicateAadhar is false
        String aadharNo = getStringValue(payload, "aadharNo");
        if (aadharNo != null && !aadharNo.isEmpty()) {
            if (!aadharNo.matches("^\\d{12}$")) {
                return ResponseEntity.badRequest().body("Aadhaar number must contain exactly 12 digits.");
            }
        }
        Boolean duplicateAadhar = (Boolean) payload.get("duplicateAadhar");
        if (aadharNo != null && !aadharNo.isEmpty() && !Boolean.TRUE.equals(duplicateAadhar)) {
            if (personalRepo.existsByAadharNumber(aadharNo)) {
                return ResponseEntity.badRequest().body("Aadhaar Number already exists in records!");
            }
        }

        // Unique EnRolledNo check — use lightweight native SQL projection
        // to avoid loading full entities into Hibernate session
        String enRolledNo;
        try {
            enRolledNo = autoIdGenerationService.generateNextCode("ATS_APPLICANT", new Date(),
                    com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        } catch (Exception e) {
            log.error("Failed to generate authoritative applicant code: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        if (employeeRepo.existsByApplicantCode(enRolledNo) || employeeRepo.existsByEmpCode(enRolledNo)) {
            return ResponseEntity.badRequest().body("Enrollment Number " + enRolledNo + " already exists!");
        }

        EmployeeMaster emp = new EmployeeMaster();
        emp.setApplicantCode(enRolledNo);
        emp.setFromWhere("ATS");
        emp.setEmpCode(null);
        emp.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

        saveOrUpdateApplicantDetails(emp, payload);

        return ResponseEntity.ok(mapEmployeeToFullMap(emp));
    }

    private String resolveOrigin(HttpServletRequest request) {
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
    }

    @RequestMapping(value = "/email-template-preview", method = { RequestMethod.POST, RequestMethod.GET })
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Generate applicant email preview with dynamic placeholders and master layout")
    public ResponseEntity<?> previewEmailTemplate(@RequestBody(required = false) Map<String, Object> payload,
            HttpServletRequest request) {
        if (payload == null) {
            payload = new HashMap<>();
        }
        String applicantIdStr = getStringValue(payload, "applicantId");
        Long applicantId = (applicantIdStr != null && !applicantIdStr.isBlank()) ? Long.valueOf(applicantIdStr) : null;

        String emailType = getStringValue(payload, "emailType");
        if (emailType == null || emailType.isBlank()) {
            emailType = "CALL LETTER";
        }

        EmployeeMaster applicant = null;
        if (applicantId != null) {
            applicant = employeeRepo.findById(applicantId).orElse(null);
        }
        if (applicant == null) {
            List<EmployeeMaster> all = employeeRepo.findAll();
            applicant = all.isEmpty() ? new EmployeeMaster() : all.get(0);
        }

        com.autonoma.erp.modules.platform.notification.entity.EmailContent template;
        if ("REJECTED".equalsIgnoreCase(emailType) || "REJECTION".equalsIgnoreCase(emailType)) {
            Optional<com.autonoma.erp.modules.platform.notification.entity.EmailContent> configuredOpt = emailContentService
                    .getActiveTemplateByType("REJECTION");
            if (configuredOpt.isEmpty()) {
                configuredOpt = emailContentService.getActiveTemplateByType("REJECTED");
            }
            template = configuredOpt.orElseGet(() -> emailDefaultTemplates.getDefaultTemplate("REJECTION"));
        } else {
            template = emailContentService.getTemplateOrThrow(emailType);
        }
        String subjectTemplate = template.getSubject();
        String bodyTemplate = template.getBodyContent();
        String yoursWindfullyTemplate = template.getYoursWindfully();

        String interviewDateStr = getStringValue(payload, "interviewDate");
        String interviewTimeStr = getStringValue(payload, "interviewTime");
        String formattedDate = interviewDateStr;
        try {
            if (interviewDateStr != null && !interviewDateStr.isBlank()) {
                Date parsedDate = new SimpleDateFormat("yyyy-MM-dd").parse(interviewDateStr);
                formattedDate = new SimpleDateFormat("dd-MM-yyyy").format(parsedDate);
            }
        } catch (Exception e) {
            // fallback
        }

        String departmentName = "HR";
        if (applicant.getDepartmentId() != null) {
            Optional<Department> deptOpt = departmentRepo.findById(applicant.getDepartmentId());
            if (deptOpt.isPresent()) {
                departmentName = deptOpt.get().getDepartmentName();
            }
        }

        String origin = resolveOrigin(request);
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                : "NUTECH WIND PARTS PVT LTD";
        String companyAddress = company != null ? ((company.getAddress() != null ? company.getAddress() : "") + ", " +
                (company.getCity() != null ? company.getCity() : "") + " - " +
                (company.getPincode() != null ? company.getPincode() : "")) : "Tamil Nadu, India";

        String tokenSubject = (applicant.getApplicantCode() != null && !applicant.getApplicantCode().isBlank())
                ? applicant.getApplicantCode().trim()
                : ((applicant.getEmpCode() != null && !applicant.getEmpCode().isBlank())
                        ? applicant.getEmpCode().trim()
                        : (applicant.getId() != null ? String.valueOf(applicant.getId())
                                : (applicant.getOfficeMail() != null ? applicant.getOfficeMail()
                                        : "APP_" + applicant.getId())));
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String pType = "OFFER LETTER".equalsIgnoreCase(emailType) ? "OFFER_LETTER" : "CALL_LETTER";
        String token = portalTokenService.generateAndSaveToken(applicant.getId(), pType, tokenSubject,
                currentUserId != null ? currentUserId : "SYSTEM");
        String portalLink;
        if ("OFFER LETTER".equalsIgnoreCase(emailType)) {
            portalLink = String.format("%s/candidate/onboarding?token=%s", origin, token);
        } else {
            portalLink = String.format("%s/candidate/assessment?token=%s", origin, token);
        }
        String senderName = "NUTECH HR TEAM";
        String hrEmail = "hr@nutechwindparts.com";
        if (currentUserId != null) {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    senderName = senderEmpOpt.get().getEmployeeName();
                    hrEmail = senderEmpOpt.get().getOfficeMail() != null ? senderEmpOpt.get().getOfficeMail()
                            : "hr@nutechwindparts.com";
                }
            }
        }

        String candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
        if (candidateFullName.isEmpty()) {
            candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                    : "Shortlisted Candidate";
        }
        String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                .getCandidateFirstName(candidateFullName);

        Optional<EmployeePersonalDetail> candidatePersonalOpt = applicant.getId() != null
                ? personalRepo.findFirstByEmployeeId(applicant.getId())
                : Optional.empty();
        Optional<EmployeeContact> candidateContactOpt = applicant.getId() != null
                ? contactRepo.findByEmployeeId(applicant.getId())
                : Optional.empty();
        String candidateEmail = candidatePersonalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                .orElse(applicant.getOfficeMail() != null ? applicant.getOfficeMail() : "candidate@example.com");
        String candidateMobile = candidateContactOpt.map(EmployeeContact::getMobile).orElse("9876543210");

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("candidateName", candidateFirstName);
        placeholders.put("candidateFirstName", candidateFirstName);
        placeholders.put("candidateFullName", candidateFullName);
        placeholders.put("candidateEmail", candidateEmail);
        placeholders.put("candidatePhone", candidateMobile);
        String previewPosition = "";
        if (applicant.getDesignationId() != null) {
            previewPosition = designationRepo.findById(applicant.getDesignationId())
                    .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                    .orElse("");
        }
        if (previewPosition.isEmpty()) {
            previewPosition = "Senior Engineer";
        }
        placeholders.put("position", previewPosition);
        placeholders.put("designation", previewPosition);
        placeholders.put("department", departmentName);
        placeholders.put("interviewDate", formattedDate != null && !formattedDate.isBlank() ? formattedDate
                : new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("interviewTime",
                interviewTimeStr != null && !interviewTimeStr.isBlank() ? interviewTimeStr : "10:30 AM");
        placeholders.put("venue", companyAddress.isBlank() ? "Office Venue" : companyAddress);
        placeholders.put("companyName", companyName);
        placeholders.put("companyAddress", companyAddress);
        placeholders.put("assessmentPortalLink", portalLink);
        placeholders.put("onboardingPortalLink", portalLink);
        placeholders.put("validityDays", "2");
        placeholders.put("hrName", senderName);
        placeholders.put("hrEmail", hrEmail);
        placeholders.put("hrPhone", "");
        placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("currentYear", String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));
        placeholders.put("websiteUrl", "https://www.autonomaerp.com");
        placeholders.put("locationMapUrl", "https://maps.google.com/?q=Autonoma+ERP+Corp");

        com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                .render(template, placeholders);

        return ResponseEntity.ok(Map.of(
                "subject", rendered.getSubject(),
                "bodyContent", rendered.getBodyContent(),
                "htmlPreview", rendered.getFullMasterHtml(),
                "fullMasterHtml", rendered.getFullMasterHtml(),
                "yoursWindfully", rendered.getYoursWindfully() != null ? rendered.getYoursWindfully() : "",
                "emailType", emailType));
    }

    @PostMapping("/send-call-letter")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Send applicant call letter email")
    @Transactional
    public ResponseEntity<?> sendCallLetter(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        Long applicantId = Long.valueOf(payload.get("id").toString());
        String interviewDateStr = getStringValue(payload, "interviewDate");
        com.autonoma.erp.util.HolidayValidator.validateDate(interviewDateStr);
        String interviewTimeStr = getStringValue(payload, "interviewTime");
        String fromEmail = getStringValue(payload, "fromEmail");
        String toEmail = getStringValue(payload, "toEmail");
        String ccEmail = getStringValue(payload, "ccEmail");

        String customSubject = getStringValue(payload, "customSubject");
        String customBody = getStringValue(payload, "customBody");

        EmployeeMaster applicant = employeeRepo.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found with ID: " + applicantId));

        String formattedDate = interviewDateStr;
        try {
            Date parsedDate = new SimpleDateFormat("yyyy-MM-dd").parse(interviewDateStr);
            formattedDate = new SimpleDateFormat("dd-MM-yyyy").format(parsedDate);
        } catch (Exception e) {
            // fallback
        }

        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String senderName = "NUTECH HR TEAM";
        if (currentUserId != null) {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    senderName = senderEmpOpt.get().getEmployeeName();
                }
            }
        }

        String departmentName = "HR";
        if (applicant.getDepartmentId() != null) {
            Optional<Department> deptOpt = departmentRepo.findById(applicant.getDepartmentId());
            if (deptOpt.isPresent()) {
                departmentName = deptOpt.get().getDepartmentName();
            }
        }

        String origin = resolveOrigin(request);
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                : "NUTECH WIND PARTS PVT LTD";
        String companyAddress = company != null ? ((company.getAddress() != null ? company.getAddress() : "") + ", " +
                (company.getCity() != null ? company.getCity() : "") + " - " +
                (company.getPincode() != null ? company.getPincode() : "")) : "Tamil Nadu, India";

        String tokenSubject = (applicant.getApplicantCode() != null && !applicant.getApplicantCode().isBlank())
                ? applicant.getApplicantCode().trim()
                : ((applicant.getEmpCode() != null && !applicant.getEmpCode().isBlank())
                        ? applicant.getEmpCode().trim()
                        : (applicant.getId() != null ? String.valueOf(applicant.getId())
                                : (applicant.getOfficeMail() != null ? applicant.getOfficeMail()
                                        : "APP_" + applicant.getId())));
        String token = portalTokenService.generateAndSaveToken(applicantId, "CALL_LETTER", tokenSubject, currentUserId);
        String portalLink = String.format("%s/candidate/assessment?token=%s", origin, token);

        String candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
        if (candidateFullName.isEmpty()) {
            candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                    : "Shortlisted Candidate";
        }
        String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                .getCandidateFirstName(candidateFullName);

        Optional<EmployeePersonalDetail> candidatePersonalOpt2 = personalRepo.findFirstByEmployeeId(applicant.getId());
        Optional<EmployeeContact> candidateContactOpt2 = contactRepo.findByEmployeeId(applicant.getId());
        String candidateEmail2 = candidatePersonalOpt2.map(EmployeePersonalDetail::getPersonalEmail)
                .orElse(applicant.getOfficeMail() != null ? applicant.getOfficeMail() : "");
        String candidateMobile2 = candidateContactOpt2.map(EmployeeContact::getMobile).orElse("");

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("candidateName", candidateFirstName);
        placeholders.put("candidateFirstName", candidateFirstName);
        placeholders.put("candidateFullName", candidateFullName);
        placeholders.put("candidateEmail", candidateEmail2);
        placeholders.put("candidatePhone", candidateMobile2);
        String callLetterPosition = "";
        if (applicant.getDesignationId() != null) {
            callLetterPosition = designationRepo.findById(applicant.getDesignationId())
                    .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                    .orElse("");
        }
        if (callLetterPosition.isEmpty()) {
            callLetterPosition = "Shortlisted Position";
        }
        placeholders.put("position", callLetterPosition);
        placeholders.put("designation", callLetterPosition);
        placeholders.put("department", departmentName);
        placeholders.put("interviewDate", formattedDate);
        placeholders.put("interviewTime", interviewTimeStr != null ? interviewTimeStr : "");
        placeholders.put("venue", companyAddress.isBlank() ? "Office Venue" : companyAddress);
        placeholders.put("companyName", companyName);
        placeholders.put("companyAddress", companyAddress);
        placeholders.put("assessmentPortalLink", portalLink);
        placeholders.put("validityDays", "2");
        placeholders.put("hrName", senderName);
        placeholders.put("hrEmail", fromEmail);
        placeholders.put("hrPhone", "");
        placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("currentYear", String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));

        com.autonoma.erp.modules.platform.notification.entity.EmailContent templateEntity = emailContentService
                .getTemplateOrThrow("CALL LETTER");
        emailTemplateEngine.validateSenderProfile(templateEntity);

        if (customSubject != null && !customSubject.isBlank()) {
            templateEntity.setSubject(customSubject);
        }
        if (customBody != null && !customBody.isBlank()) {
            templateEntity.setBodyContent(customBody);
        }

        com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                .render(templateEntity, placeholders);

        String finalSubject = rendered.getSubject();
        String finalHtmlBody = rendered.getFullMasterHtml();

        // Verify SMTP configuration is present
        if (company == null || company.getSmtpHost() == null || company.getSmtpHost().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email could not be sent: SMTP host is not configured in Company Profile."));
        }

        Boolean useCompanyMail = payload.get("useCompanyMail") != null &&
                ("true".equalsIgnoreCase(payload.get("useCompanyMail").toString()) ||
                        Boolean.TRUE.equals(payload.get("useCompanyMail")));

        String smtpUsername = null;
        String smtpPassword = null;
        if (useCompanyMail) {
            if (company != null) {
                smtpUsername = company.getSmtpUsername();
                smtpPassword = company.getSmtpPassword();
                senderName = company.getCompanyName() != null ? company.getCompanyName() : "Company HR";
            }
        } else {
            EmailSenderDetails senderDetails = resolveEmailSenderDetails(currentUserId);
            smtpUsername = senderDetails.getUsername();
            smtpPassword = senderDetails.getPassword();
            if (senderDetails.getSenderName() != null) {
                senderName = senderDetails.getSenderName();
            }
        }

        if (smtpUsername == null || smtpPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Email could not be sent: Neither individual office email/password is configured in your Employee Profile, nor is a default company SMTP username/password set in Company Profile."));
        }

        // Override fromEmail to match the authenticated sender
        fromEmail = smtpUsername;

        // Configure JavaMailSender dynamically
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(company.getSmtpHost());
        if (company.getSmtpPort() != null) {
            mailSender.setPort(company.getSmtpPort());
        }
        mailSender.setUsername(smtpUsername);
        mailSender.setPassword(smtpPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
            props.put("mail.smtp.ssl.enable", "true");
        }
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String cleanFrom = fromEmail != null ? fromEmail.trim() : smtpUsername;
            String cleanDisplayName = "NUTECH HR TEAM";

            try {
                helper.setFrom(new jakarta.mail.internet.InternetAddress(cleanFrom, cleanDisplayName));
            } catch (Exception ex) {
                helper.setFrom(cleanFrom);
            }

            if (toEmail != null && !toEmail.trim().isEmpty()) {
                String[] toList = java.util.Arrays.stream(toEmail.split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.contains("@"))
                        .toArray(String[]::new);
                if (toList.length > 0) {
                    helper.setTo(toList);
                } else {
                    helper.setTo(toEmail.trim());
                }
            }

            if (ccEmail != null && !ccEmail.trim().isEmpty()) {
                String[] ccList = java.util.Arrays.stream(ccEmail.split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.contains("@"))
                        .toArray(String[]::new);
                if (ccList.length > 0) {
                    helper.setCc(ccList);
                }
            }

            helper.setSubject(finalSubject);
            helper.setText(finalHtmlBody, true);
            mailSender.send(mimeMessage);
            System.out.println("[SMTP Call Letter] Successfully sent call letter email to: " + toEmail);

            // Update applicant call letter status and interview details after successful
            // transmission
            com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatusObj = applicant.getCallStatus();
            String currentStatus = currentStatusObj != null ? currentStatusObj.getName() : null;
            if (currentStatus != null && "SENT".equalsIgnoreCase(currentStatus.trim())) {
                applicant.setCallStatus(statusResolver.get("Resent"));
            } else {
                applicant.setCallStatus(statusResolver.get("Sent"));
            }
            applicant.setCallLetterDate(interviewDateStr);
            applicant.setCallLetterTime(interviewTimeStr);
            employeeRepo.save(applicant);
        } catch (Exception e) {
            log.error("[SMTP Call Letter] Failed to send call letter email: {}", e.getMessage(), e);
            String friendlyMsg = com.autonoma.erp.service.admin.EmailSendingService.translateMailException(e);
            return ResponseEntity.badRequest().body(
                    Map.of("message", friendlyMsg,
                            "portalLink", portalLink));
        }

        return ResponseEntity.ok(Map.of("message", "Call letter email successfully sent to " + toEmail + "."));
    }

    @PostMapping("/send-offer-letter")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Send applicant offer letter email")
    @Transactional
    public ResponseEntity<?> sendOfferLetter(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        Long applicantId = Long.valueOf(payload.get("id").toString());
        String fromEmail = getStringValue(payload, "fromEmail");
        String toEmail = getStringValue(payload, "toEmail");
        String ccEmail = getStringValue(payload, "ccEmail");

        String customSubject = getStringValue(payload, "customSubject");
        String customBody = getStringValue(payload, "customBody");

        EmployeeMaster applicant = employeeRepo.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found with ID: " + applicantId));

        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String senderName = "NUTECH HR TEAM";
        if (currentUserId != null) {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    senderName = senderEmpOpt.get().getEmployeeName();
                }
            }
        }

        String departmentName = "HR";
        if (applicant.getDepartmentId() != null) {
            Optional<Department> deptOpt = departmentRepo.findById(applicant.getDepartmentId());
            if (deptOpt.isPresent()) {
                departmentName = deptOpt.get().getDepartmentName();
            }
        }

        String origin = resolveOrigin(request);
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                : "NUTECH WIND PARTS PVT LTD";
        String companyAddress = company != null ? ((company.getAddress() != null ? company.getAddress() : "") + ", " +
                (company.getCity() != null ? company.getCity() : "") + " - " +
                (company.getPincode() != null ? company.getPincode() : "")) : "Tamil Nadu, India";

        String tokenSubject = (applicant.getApplicantCode() != null && !applicant.getApplicantCode().isBlank())
                ? applicant.getApplicantCode().trim()
                : ((applicant.getEmpCode() != null && !applicant.getEmpCode().isBlank())
                        ? applicant.getEmpCode().trim()
                        : (applicant.getId() != null ? String.valueOf(applicant.getId())
                                : (applicant.getOfficeMail() != null ? applicant.getOfficeMail()
                                        : "APP_" + applicant.getId())));
        String token = portalTokenService.generateAndSaveToken(applicantId, "OFFER_LETTER", tokenSubject,
                currentUserId);
        String portalLink = String.format("%s/candidate/onboarding?token=%s", origin, token);

        String candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
        if (candidateFullName.isEmpty()) {
            candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                    : "Shortlisted Candidate";
        }
        String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                .getCandidateFirstName(candidateFullName);

        Optional<EmployeePersonalDetail> candidatePersonalOpt2 = personalRepo.findFirstByEmployeeId(applicant.getId());
        Optional<EmployeeContact> candidateContactOpt2 = contactRepo.findByEmployeeId(applicant.getId());
        String candidateEmail2 = candidatePersonalOpt2.map(EmployeePersonalDetail::getPersonalEmail)
                .orElse(applicant.getOfficeMail() != null ? applicant.getOfficeMail() : "");
        String candidateMobile2 = candidateContactOpt2.map(EmployeeContact::getMobile).orElse("");

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("candidateName", candidateFirstName);
        placeholders.put("candidateFirstName", candidateFirstName);
        placeholders.put("candidateFullName", candidateFullName);
        placeholders.put("candidateEmail", candidateEmail2);
        placeholders.put("candidatePhone", candidateMobile2);
        String offerLetterPosition = "";
        if (applicant.getDesignationId() != null) {
            offerLetterPosition = designationRepo.findById(applicant.getDesignationId())
                    .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                    .orElse("");
        }
        if (offerLetterPosition.isEmpty()) {
            offerLetterPosition = "Shortlisted Position";
        }
        placeholders.put("position", offerLetterPosition);
        placeholders.put("designation", offerLetterPosition);
        placeholders.put("department", departmentName);
        placeholders.put("companyName", companyName);
        placeholders.put("companyAddress", companyAddress);
        placeholders.put("onboardingPortalLink", portalLink);
        placeholders.put("validityDays", "2");
        placeholders.put("hrName", senderName);
        placeholders.put("hrEmail", fromEmail);
        placeholders.put("hrPhone", "");
        placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("currentYear", String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));

        com.autonoma.erp.modules.platform.notification.entity.EmailContent templateEntity = emailContentService
                .getTemplateOrThrow("OFFER LETTER");
        emailTemplateEngine.validateSenderProfile(templateEntity);

        if (customSubject != null && !customSubject.isBlank()) {
            templateEntity.setSubject(customSubject);
        }
        if (customBody != null && !customBody.isBlank()) {
            templateEntity.setBodyContent(customBody);
        }

        com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                .render(templateEntity, placeholders);

        String finalSubject = rendered.getSubject();
        String finalHtmlBody = rendered.getFullMasterHtml();

        // Verify SMTP configuration is present
        if (company == null || company.getSmtpHost() == null || company.getSmtpHost().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email could not be sent: SMTP host is not configured in Company Profile."));
        }

        Boolean useCompanyMail = payload.get("useCompanyMail") != null &&
                ("true".equalsIgnoreCase(payload.get("useCompanyMail").toString()) ||
                        Boolean.TRUE.equals(payload.get("useCompanyMail")));

        String smtpUsername = null;
        String smtpPassword = null;
        if (useCompanyMail) {
            if (company != null) {
                smtpUsername = company.getSmtpUsername();
                smtpPassword = company.getSmtpPassword();
                senderName = company.getCompanyName() != null ? company.getCompanyName() : "Company HR";
            }
        } else {
            EmailSenderDetails senderDetails = resolveEmailSenderDetails(currentUserId);
            smtpUsername = senderDetails.getUsername();
            smtpPassword = senderDetails.getPassword();
            if (senderDetails.getSenderName() != null) {
                senderName = senderDetails.getSenderName();
            }
        }

        if (smtpUsername == null || smtpPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Email could not be sent: Neither individual office email/password is configured in your Employee Profile, nor is a default company SMTP username/password set in Company Profile."));
        }

        // Override fromEmail to match the authenticated sender
        fromEmail = smtpUsername;

        // Configure JavaMailSender dynamically
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(company.getSmtpHost());
        if (company.getSmtpPort() != null) {
            mailSender.setPort(company.getSmtpPort());
        }
        mailSender.setUsername(smtpUsername);
        mailSender.setPassword(smtpPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
            props.put("mail.smtp.ssl.enable", "true");
        }
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String cleanFrom = fromEmail != null ? fromEmail.trim() : smtpUsername;
            String cleanDisplayName = "NUTECH HR TEAM";

            try {
                helper.setFrom(new jakarta.mail.internet.InternetAddress(cleanFrom, cleanDisplayName));
            } catch (Exception ex) {
                helper.setFrom(cleanFrom);
            }

            if (toEmail != null && !toEmail.trim().isEmpty()) {
                String[] toList = java.util.Arrays.stream(toEmail.split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.contains("@"))
                        .toArray(String[]::new);
                if (toList.length > 0) {
                    helper.setTo(toList);
                } else {
                    helper.setTo(toEmail.trim());
                }
            }

            if (ccEmail != null && !ccEmail.trim().isEmpty()) {
                String[] ccList = java.util.Arrays.stream(ccEmail.split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.contains("@"))
                        .toArray(String[]::new);
                if (ccList.length > 0) {
                    helper.setCc(ccList);
                }
            }

            helper.setSubject(finalSubject);
            helper.setText(finalHtmlBody, true);
            mailSender.send(mimeMessage);
            System.out.println("[SMTP Offer Letter] Successfully sent offer letter email to: " + toEmail);

            // Update applicant offer status after successful transmission
            com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatusObj = applicant.getOfferStatus();
            String currentStatus = currentStatusObj != null ? currentStatusObj.getName() : null;
            if (currentStatus != null && "SENT".equalsIgnoreCase(currentStatus.trim())) {
                applicant.setOfferStatus(statusResolver.get("Resent"));
            } else {
                applicant.setOfferStatus(statusResolver.get("Sent"));
            }
            employeeRepo.save(applicant);
        } catch (Exception e) {
            log.error("[SMTP Offer Letter] Failed to send offer letter email: {}", e.getMessage(), e);
            String friendlyMsg = com.autonoma.erp.service.admin.EmailSendingService.translateMailException(e);
            return ResponseEntity.badRequest().body(
                    Map.of("message", friendlyMsg,
                            "portalLink", portalLink));
        }

        return ResponseEntity.ok(Map.of("message", "Offer letter email successfully sent to " + toEmail + "."));
    }

    @PostMapping("/send-rejection-letter")
    @RequirePagePermission(pageCode = "HA1130", action = "write")
    @Operation(summary = "Send applicant rejection letter email")
    @Transactional
    public ResponseEntity<?> sendRejectionLetter(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        if (payload == null || !payload.containsKey("id") || payload.get("id") == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Applicant ID is required."));
        }
        Long applicantId = Long.valueOf(payload.get("id").toString());
        String fromEmail = getStringValue(payload, "fromEmail");
        String toEmail = getStringValue(payload, "toEmail");
        String ccEmail = getStringValue(payload, "ccEmail");

        String customSubject = getStringValue(payload, "customSubject");
        String customBody = getStringValue(payload, "customBody");

        EmployeeMaster applicant = employeeRepo.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found with ID: " + applicantId));

        // 1. Mandatory Status ID-Based Validation:
        // Dynamically resolve canonical REJECTED status from Status Master architecture
        com.autonoma.erp.modules.platform.common.entity.StatusMaster canonicalRejectedStatus = statusResolver
                .get("Rejected");
        if (canonicalRejectedStatus == null || canonicalRejectedStatus.getId() == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "System error: Canonical REJECTED status is not configured in Status Master."));
        }

        Long rejectedStatusId = canonicalRejectedStatus.getId();
        Long currentStatusId = applicant.getStatus() != null ? applicant.getStatus().getId() : null;
        Long currentInterviewStatusId = applicant.getInterviewStatus() != null ? applicant.getInterviewStatus().getId()
                : null;
        Long currentAtsOverallStatusId = applicant.getAtsOverallStatus() != null
                ? applicant.getAtsOverallStatus().getId()
                : null;
        Long currentOfferStatusId = applicant.getOfferStatus() != null ? applicant.getOfferStatus().getId() : null;
        Long currentVerificationStatusId = applicant.getVerificationStatus() != null
                ? applicant.getVerificationStatus().getId()
                : null;

        boolean isActuallyRejected = (rejectedStatusId != null) && (rejectedStatusId.equals(currentOfferStatusId)
                || rejectedStatusId.equals(currentVerificationStatusId)
                || rejectedStatusId.equals(currentStatusId)
                || rejectedStatusId.equals(currentInterviewStatusId)
                || rejectedStatusId.equals(currentAtsOverallStatusId));

        if (!isActuallyRejected) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Cannot send rejection email: Candidate has not been rejected in Final Resolution."));
        }

        // 2. Authoritative candidate recipient resolution from backend entity
        Optional<EmployeePersonalDetail> candidatePersonalOpt = personalRepo.findFirstByEmployeeId(applicant.getId());
        String candidateEmail = candidatePersonalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                .orElse(applicant.getOfficeMail() != null ? applicant.getOfficeMail() : "");
        if (candidateEmail == null || candidateEmail.trim().isEmpty()) {
            candidateEmail = toEmail != null ? toEmail.trim() : "";
        }
        if (candidateEmail == null || candidateEmail.trim().isEmpty() || !candidateEmail.contains("@")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Cannot send rejection email: Candidate email is missing or invalid."));
        }
        toEmail = candidateEmail.trim();

        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String senderName = "NUTECH HR TEAM";
        if (currentUserId != null) {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    senderName = senderEmpOpt.get().getEmployeeName();
                }
            }
        }

        String departmentName = "HR";
        if (applicant.getDepartmentId() != null) {
            Optional<Department> deptOpt = departmentRepo.findById(applicant.getDepartmentId());
            if (deptOpt.isPresent()) {
                departmentName = deptOpt.get().getDepartmentName();
            }
        }

        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                : "NUTECH WIND PARTS PVT LTD";
        String companyAddress = company != null ? ((company.getAddress() != null ? company.getAddress() : "") + ", " +
                (company.getCity() != null ? company.getCity() : "") + " - " +
                (company.getPincode() != null ? company.getPincode() : "")) : "Tamil Nadu, India";

        String candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
        if (candidateFullName.isEmpty()) {
            candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                    : "Candidate";
        }
        String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                .getCandidateFirstName(candidateFullName);

        String position = "";
        if (applicant.getDesignationId() != null) {
            position = designationRepo.findById(applicant.getDesignationId())
                    .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                    .orElse("");
        }
        if (position.isEmpty()) {
            position = "Position";
        }

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("candidateName", candidateFirstName);
        placeholders.put("candidateFirstName", candidateFirstName);
        placeholders.put("candidateFullName", candidateFullName);
        placeholders.put("candidateEmail", toEmail.trim());
        placeholders.put("position", position);
        placeholders.put("designation", position);
        placeholders.put("department", departmentName);
        placeholders.put("companyName", companyName);
        placeholders.put("companyAddress", companyAddress);
        placeholders.put("companyMail",
                (company != null && company.getEmailId() != null && !company.getEmailId().isBlank())
                        ? company.getEmailId().trim()
                        : (fromEmail != null ? fromEmail : "hr@nutechwindparts.com"));
        placeholders.put("hrName", senderName);
        placeholders.put("hrEmail", fromEmail != null ? fromEmail : "hr@nutechwindparts.com");
        placeholders.put("officeEmail", fromEmail != null ? fromEmail : "hr@nutechwindparts.com");
        placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("currentYear", String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));

        com.autonoma.erp.modules.platform.notification.entity.EmailContent templateEntity = null;
        Optional<com.autonoma.erp.modules.platform.notification.entity.EmailContent> configuredOpt = emailContentService
                .getActiveTemplateByType("REJECTION");
        if (configuredOpt.isEmpty()) {
            configuredOpt = emailContentService.getActiveTemplateByType("REJECTED");
        }
        templateEntity = configuredOpt.orElseGet(() -> emailDefaultTemplates.getDefaultTemplate("REJECTION"));

        if (customSubject != null && !customSubject.isBlank()) {
            templateEntity.setSubject(customSubject);
        }
        if (customBody != null && !customBody.isBlank()) {
            templateEntity.setBodyContent(customBody);
        }

        com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                .render(templateEntity, placeholders);

        String finalSubject = rendered.getSubject();
        String finalHtmlBody = rendered.getFullMasterHtml();

        // Verify SMTP configuration is present
        if (company == null || company.getSmtpHost() == null || company.getSmtpHost().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email could not be sent: SMTP host is not configured in Company Profile."));
        }

        Boolean useCompanyMail = payload.get("useCompanyMail") != null &&
                ("true".equalsIgnoreCase(payload.get("useCompanyMail").toString()) ||
                        Boolean.TRUE.equals(payload.get("useCompanyMail")));

        String smtpUsername = null;
        String smtpPassword = null;
        if (useCompanyMail) {
            if (company != null) {
                smtpUsername = company.getSmtpUsername();
                smtpPassword = company.getSmtpPassword();
                senderName = company.getCompanyName() != null ? company.getCompanyName() : "Company HR";
            }
        } else {
            EmailSenderDetails senderDetails = resolveEmailSenderDetails(currentUserId);
            smtpUsername = senderDetails.getUsername();
            smtpPassword = senderDetails.getPassword();
            if (senderDetails.getSenderName() != null) {
                senderName = senderDetails.getSenderName();
            }
        }

        if (smtpUsername == null || smtpPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Email could not be sent: Neither individual office email/password is configured in your Employee Profile, nor is a default company SMTP username/password set in Company Profile."));
        }

        // Override fromEmail to match the authenticated sender
        fromEmail = smtpUsername;

        // Configure JavaMailSender dynamically
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(company.getSmtpHost());
        if (company.getSmtpPort() != null) {
            mailSender.setPort(company.getSmtpPort());
        }
        mailSender.setUsername(smtpUsername);
        mailSender.setPassword(smtpPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
            props.put("mail.smtp.ssl.enable", "true");
        }
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String cleanFrom = fromEmail != null ? fromEmail.trim() : smtpUsername;
            String cleanDisplayName = "NUTECH HR TEAM";

            try {
                helper.setFrom(new jakarta.mail.internet.InternetAddress(cleanFrom, cleanDisplayName));
            } catch (Exception ex) {
                helper.setFrom(cleanFrom);
            }

            if (toEmail != null && !toEmail.trim().isEmpty()) {
                String[] toList = java.util.Arrays.stream(toEmail.split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.contains("@"))
                        .toArray(String[]::new);
                if (toList.length > 0) {
                    helper.setTo(toList);
                } else {
                    helper.setTo(toEmail.trim());
                }
            }

            if (ccEmail != null && !ccEmail.trim().isEmpty()) {
                String[] ccList = java.util.Arrays.stream(ccEmail.split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && s.contains("@"))
                        .toArray(String[]::new);
                if (ccList.length > 0) {
                    helper.setCc(ccList);
                }
            }

            helper.setSubject(finalSubject);
            helper.setText(finalHtmlBody, true);
            mailSender.send(mimeMessage);
            System.out.println("[SMTP Rejection Letter] Successfully sent rejection letter email to: " + toEmail);

            // Transition applicant status to REJECTED ONLY after successful transmission
            applicant.setStatus(canonicalRejectedStatus);
            applicant.setInterviewStatus(canonicalRejectedStatus);
            applicant.setAtsOverallStatus(canonicalRejectedStatus);
            applicant.setOfferStatus(canonicalRejectedStatus);
            applicant.setVerificationStatus(canonicalRejectedStatus);
            employeeRepo.save(applicant);
        } catch (Exception e) {
            log.error("[SMTP Rejection Letter] Failed to send rejection letter email: {}", e.getMessage(), e);
            String friendlyMsg = com.autonoma.erp.service.admin.EmailSendingService.translateMailException(e);
            return ResponseEntity.badRequest().body(Map.of("message", friendlyMsg));
        }

        InterviewEligibilitySummary postEligibility = getInterviewEligibilitySummary(applicant, null);
        Map<String, Object> respMap = mapEmployeeToFullMap(applicant, postEligibility);
        respMap.put("message", "Rejection email successfully sent to " + toEmail + ".");
        return ResponseEntity.ok(respMap);
    }

    @GetMapping("/portal/branding")
    @Operation(summary = "Get company branding for candidate portal")
    public ResponseEntity<?> getPortalBranding() {
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);

        String companyName = (company != null && company.getCompanyName() != null
                && !company.getCompanyName().isBlank())
                        ? company.getCompanyName().trim()
                        : "Autonoma ERP Corp";
        String logoFileName = (company != null && company.getLogoFileName() != null
                && !company.getLogoFileName().isBlank())
                        ? company.getLogoFileName().trim()
                        : "";
        String shortName = (company != null && company.getShortName() != null && !company.getShortName().isBlank())
                ? company.getShortName().trim()
                : "";
        String address = (company != null && company.getAddress() != null && !company.getAddress().isBlank())
                ? company.getAddress().trim()
                : "";
        String city = (company != null && company.getCity() != null && !company.getCity().isBlank())
                ? company.getCity().trim()
                : "";
        String state = (company != null && company.getState() != null && !company.getState().isBlank())
                ? company.getState().trim()
                : "";
        String country = (company != null && company.getCountry() != null && !company.getCountry().isBlank())
                ? company.getCountry().trim()
                : "";
        String pincode = (company != null && company.getPincode() != null && !company.getPincode().isBlank())
                ? company.getPincode().trim()
                : "";
        String emailId = (company != null && company.getEmailId() != null && !company.getEmailId().isBlank())
                ? company.getEmailId().trim()
                : "";
        String mobileNo = (company != null && company.getMobileNo() != null && !company.getMobileNo().isBlank())
                ? company.getMobileNo().trim()
                : "";
        String phoneNo = (company != null && company.getPhoneNo() != null && !company.getPhoneNo().isBlank())
                ? company.getPhoneNo().trim()
                : "";
        String website = (company != null && company.getWebsite() != null && !company.getWebsite().isBlank())
                ? company.getWebsite().trim()
                : "";
        String supportEmail = (company != null && company.getSupportEmail() != null
                && !company.getSupportEmail().isBlank())
                        ? company.getSupportEmail().trim()
                        : "";
        String supportPhone = (company != null && company.getSupportPhone() != null
                && !company.getSupportPhone().isBlank())
                        ? company.getSupportPhone().trim()
                        : "";

        Map<String, Object> data = new HashMap<>();
        data.put("companyName", companyName);
        data.put("logoFileName", logoFileName);
        data.put("shortName", shortName);
        data.put("address", address);
        data.put("city", city);
        data.put("state", state);
        data.put("country", country);
        data.put("pincode", pincode);
        data.put("emailId", emailId);
        data.put("mobileNo", mobileNo);
        data.put("phoneNo", phoneNo);
        data.put("website", website);
        data.put("supportEmail", supportEmail);
        data.put("supportPhone", supportPhone);

        return ResponseEntity.ok(data);
    }

    @GetMapping("/portal/masters")
    @Operation(summary = "Get active departments and shift masters for portal forms")
    public ResponseEntity<?> getPortalMasters() {
        List<String> departments = departmentRepo.findAll().stream()
                .filter(d -> d.getStatus() == null || "Active".equalsIgnoreCase(d.getStatus())
                        || "ACTIVE".equalsIgnoreCase(d.getStatus()))
                .map(Department::getDepartmentName)
                .filter(name -> name != null && !name.trim().isEmpty())
                .distinct()
                .sorted()
                .toList();

        List<String> shifts = shiftMasterRepo.findByIsActiveTrue().stream()
                .map(s -> s.getShiftName() != null && !s.getShiftName().trim().isEmpty() ? s.getShiftName().trim()
                        : s.getShiftCode())
                .filter(name -> name != null && !name.trim().isEmpty())
                .distinct()
                .sorted()
                .toList();

        return ResponseEntity.ok(Map.of(
                "departments", departments,
                "shifts", shifts));
    }

    private EmployeeMaster findApplicantBySubject(String subject) {
        if (subject == null || subject.trim().isEmpty())
            return null;
        String s = subject.trim();
        EmployeeMaster applicant = employeeRepo.findByApplicantCode(s)
                .or(() -> employeeRepo.findByEmpCode(s)).orElse(null);
        if (applicant == null) {
            try {
                Long id = Long.parseLong(s);
                applicant = employeeRepo.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {
            }
        }
        if (applicant == null) {
            java.util.List<EmployeePersonalDetail> personals = personalRepo.findByPersonalEmailIgnoreCase(s);
            if (personals != null && !personals.isEmpty()) {
                applicant = employeeRepo.findById(personals.get(0).getEmployeeId()).orElse(null);
            }
        }
        if (applicant == null) {
            Optional<EmployeeJobProfile> jpOpt = jobProfileRepo.findByOfficeEmailIgnoreCase(s);
            if (jpOpt.isPresent()) {
                applicant = employeeRepo.findById(jpOpt.get().getEmployeeId()).orElse(null);
            }
        }
        if (applicant == null) {
            List<EmployeeMaster> matches = employeeRepo.findByOfficeMailIgnoreCase(s);
            if (matches != null && !matches.isEmpty()) {
                applicant = matches.get(0);
            }
        }
        return applicant;
    }

    @GetMapping("/portal/verify-token")
    @Operation(summary = "Verify candidate portal assessment token")
    public ResponseEntity<?> portalVerifyToken(@RequestParam String token) {
        if (token == null || token.isEmpty()) {
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            String companyName = (company != null && company.getCompanyName() != null
                    && !company.getCompanyName().isBlank())
                            ? company.getCompanyName().trim()
                            : "Autonoma ERP Corp";
            String logoFileName = (company != null && company.getLogoFileName() != null
                    && !company.getLogoFileName().isBlank())
                            ? company.getLogoFileName().trim()
                            : "";
            return ResponseEntity.status(401).body(Map.of(
                    "valid", false,
                    "error", "Missing verification token!",
                    "companyName", companyName,
                    "logoFileName", logoFileName));
        }

        try {
            // Validate the token signature and expiration
            String subject = jwtService.extractUsername(token);
            if (subject == null) {
                CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
                String companyName = (company != null && company.getCompanyName() != null
                        && !company.getCompanyName().isBlank())
                                ? company.getCompanyName().trim()
                                : "Autonoma ERP Corp";
                String logoFileName = (company != null && company.getLogoFileName() != null
                        && !company.getLogoFileName().isBlank())
                                ? company.getLogoFileName().trim()
                                : "";
                return ResponseEntity.status(401).body(Map.of(
                        "valid", false,
                        "error", "Invalid token subject.",
                        "companyName", companyName,
                        "logoFileName", logoFileName));
            }

            if (!portalTokenService.isTokenActiveAndValid(token, "CALL_LETTER")) {
                CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
                String companyName = (company != null && company.getCompanyName() != null
                        && !company.getCompanyName().isBlank())
                                ? company.getCompanyName().trim()
                                : "Autonoma ERP Corp";
                String logoFileName = (company != null && company.getLogoFileName() != null
                        && !company.getLogoFileName().isBlank())
                                ? company.getLogoFileName().trim()
                                : "";
                return ResponseEntity.status(401).body(Map.of(
                        "valid", false,
                        "error", "This assessment link is invalid or has expired. Please contact HR.",
                        "companyName", companyName,
                        "logoFileName", logoFileName));
            }

            // Load candidate via multi-strategy lookup
            EmployeeMaster applicant = findApplicantBySubject(subject);

            if (applicant == null) {
                CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
                String companyName = (company != null && company.getCompanyName() != null
                        && !company.getCompanyName().isBlank())
                                ? company.getCompanyName().trim()
                                : "Autonoma ERP Corp";
                String logoFileName = (company != null && company.getLogoFileName() != null
                        && !company.getLogoFileName().isBlank())
                                ? company.getLogoFileName().trim()
                                : "";
                return ResponseEntity.status(401).body(Map.of(
                        "valid", false,
                        "error", "Applicant record not found.",
                        "companyName", companyName,
                        "logoFileName", logoFileName));
            }

            // Check if already completed (by checking if selfAssessmentStatus is SUBMITTED
            // and status is not RESEND or RESENT)
            com.autonoma.erp.modules.platform.common.entity.StatusMaster callStatusObj = applicant.getCallStatus();
            String callStatus = callStatusObj != null ? callStatusObj.getName() : null;
            boolean alreadySubmitted = applicant.getSelfAssessmentStatus() != null
                    && "SUBMITTED".equalsIgnoreCase(applicant.getSelfAssessmentStatus().getName())
                    && !"RESEND".equalsIgnoreCase(callStatus)
                    && !"RESENT".equalsIgnoreCase(callStatus);

            // Fetch Company Profile for dynamic candidate portal branding
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            String companyName = (company != null && company.getCompanyName() != null
                    && !company.getCompanyName().isBlank())
                            ? company.getCompanyName().trim()
                            : "Autonoma ERP Corp";
            String logoFileName = (company != null && company.getLogoFileName() != null
                    && !company.getLogoFileName().isBlank())
                            ? company.getLogoFileName().trim()
                            : "";

            // Authorization check: if token is REJECTED_DOCUMENT, confirm they actually
            // have active assessment rejections
            Optional<ApplicantPortalToken> tokenOpt = tokenRepository.findByToken(token);
            if (tokenOpt.isPresent() && "REJECTED_DOCUMENT".equalsIgnoreCase(tokenOpt.get().getPortalType())) {
                List<AtsRejectedDocument> activeRejs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                        applicant.getId(), AtsRejectionStage.ASSESSMENT, statusResolver.get("Active"));
                if (activeRejs.isEmpty()) {
                    return ResponseEntity.status(401).body(Map.of(
                            "valid", false,
                            "error", "Unauthorized access. No active rejected documents found for Assessment stage.",
                            "companyName", companyName,
                            "logoFileName", logoFileName));
                }
            }

            // Expose active rejected documents list in the response map
            List<AtsRejectedDocument> rejectedDocs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                    applicant.getId(), AtsRejectionStage.ASSESSMENT, statusResolver.get("Active"));
            List<Map<String, Object>> rejectedDocsList = new java.util.ArrayList<>();
            for (AtsRejectedDocument rd : rejectedDocs) {
                rejectedDocsList.add(Map.of(
                        "documentName", rd.getDocumentName(),
                        "rejectReason", rd.getRejectReason()));
            }

            if (!rejectedDocsList.isEmpty()) {
                alreadySubmitted = false;
            }

            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "alreadySubmitted", alreadySubmitted,
                    "selfAssessmentStatus",
                    applicant.getSelfAssessmentStatus() != null ? applicant.getSelfAssessmentStatus().getName()
                            : "DRAFT",
                    "currentStep", applicant.getCurrentStep() != null ? applicant.getCurrentStep() : 1,
                    "companyName", companyName,
                    "logoFileName", logoFileName,
                    "rejectedDocuments", rejectedDocsList,
                    "applicant", mapEmployeeToFullMap(applicant)));
        } catch (Exception e) {
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            String companyName = (company != null && company.getCompanyName() != null
                    && !company.getCompanyName().isBlank())
                            ? company.getCompanyName().trim()
                            : "Autonoma ERP Corp";
            String logoFileName = (company != null && company.getLogoFileName() != null
                    && !company.getLogoFileName().isBlank())
                            ? company.getLogoFileName().trim()
                            : "";
            return ResponseEntity.status(401).body(Map.of(
                    "valid", false,
                    "error", "This assessment link is invalid or has expired. Please contact HR.",
                    "companyName", companyName,
                    "logoFileName", logoFileName));
        }
    }

    public static class CountryPortalDTO {
        public Long id;
        public String countryName;
        public String countryCode;
        public String isd;
        public Integer phoneMinLength;
        public Integer phoneMaxLength;

        public CountryPortalDTO(com.autonoma.erp.modules.master.geography.entity.CountryMaster c) {
            this.id = c.getId();
            this.countryName = c.getCountryName();
            this.countryCode = c.getCountryCode();
            this.isd = c.getIsd();
            this.phoneMinLength = c.getPhoneMinLength();
            this.phoneMaxLength = c.getPhoneMaxLength();
        }
    }

    @GetMapping("/portal/countries")
    @Operation(summary = "Get active countries for candidate portal")
    public List<CountryPortalDTO> getPortalCountries() {
        return countryRepo.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .map(CountryPortalDTO::new)
                .collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/portal/submit")
    @Operation(summary = "Submit candidate self-assessment answers")
    @Transactional
    public ResponseEntity<?> portalSubmit(@RequestBody Map<String, Object> payload) {
        String token = getStringValue(payload, "token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Authentication token missing!");
        }
        if (!portalTokenService.isTokenActiveAndValid(token, "CALL_LETTER")) {
            return ResponseEntity.status(401)
                    .body("This assessment link is invalid or has expired. Please contact HR.");
        }

        String subject;
        try {
            subject = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Session expired or invalid!");
        }

        EmployeeMaster applicant = findApplicantBySubject(subject);
        if (applicant == null) {
            return ResponseEntity.status(401).body("Applicant record not found for session!");
        }

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "SYSTEM", null, java.util.Collections.emptyList()));
        try {
            boolean hasRejectedDocs = (applicant.getPhotoVerifiedStatus() != null
                    && "REJECTED".equalsIgnoreCase(applicant.getPhotoVerifiedStatus().getName()))
                    || (applicant.getResumeVerifiedStatus() != null
                            && "REJECTED".equalsIgnoreCase(applicant.getResumeVerifiedStatus().getName()))
                    || (applicant.getAadharVerifiedStatus() != null
                            && "REJECTED".equalsIgnoreCase(applicant.getAadharVerifiedStatus().getName()))
                    || (applicant.getPayslipVerifiedStatus() != null
                            && "REJECTED".equalsIgnoreCase(applicant.getPayslipVerifiedStatus().getName()));

            com.autonoma.erp.modules.platform.common.entity.StatusMaster callStatObj = applicant.getCallStatus();
            String callStat = callStatObj != null ? callStatObj.getName() : null;
            boolean isReuploadAllowed = hasRejectedDocs
                    || "TO BE VERIFY".equalsIgnoreCase(callStat)
                    || "TO BE VERIFIED".equalsIgnoreCase(callStat)
                    || "RESEND".equalsIgnoreCase(callStat)
                    || "RESENT".equalsIgnoreCase(callStat);

            if (applicant.getSelfAssessmentStatus() != null
                    && "SUBMITTED".equalsIgnoreCase(applicant.getSelfAssessmentStatus().getName())
                    && !isReuploadAllowed) {
                return ResponseEntity.badRequest().body("Self-assessment has already been submitted.");
            }

            // --- Validate ALL inputs BEFORE modifying entity (prevents partial saves via
            // @Transactional dirty-checking) ---
            String noticePeriodStr = getStringValue(payload, "q34_notice_period");
            if (noticePeriodStr != null && !noticePeriodStr.trim().isEmpty()) {
                if (!noticePeriodStr.trim().matches("^\\d+$")) {
                    return ResponseEntity.badRequest().body("Notice Period must be a positive whole number of days.");
                }
            }
            Long mgrCountryId = getLongValue(payload, "q43_hr_mgr_country_id");
            String mgrPhone = getStringValue(payload, "q43_hr_mgr_phone");
            Long vertCountryId = getLongValue(payload, "q46_vert_head_country_id");
            String vertPhone = getStringValue(payload, "q46_vert_head_phone");
            try {
                validatePhoneByCountryId(mgrCountryId, mgrPhone, "HR Manager");
                validatePhoneByCountryId(vertCountryId, vertPhone, "Vertical Head");
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(ex.getMessage());
            }

            // --- All validations passed: now set ALL fields on entity ---
            savePersonalDetailsFromPayload(applicant, payload);

            applicant.setQ1_native(getStringValue(payload, "q1_native"));
            applicant.setQ2_presentAddress(getStringValue(payload, "q2_present_address"));
            applicant.setQ3_permanentAddress(getStringValue(payload, "q3_permanent_address"));
            applicant.setSameAsCurrentAddress(getStringValue(payload, "same_as_current_address"));
            applicant.setQ4_fatherOccupation(getStringValue(payload, "q4_father_occupation"));
            applicant.setQ5_motherOccupation(getStringValue(payload, "q5_mother_occupation"));
            applicant.setQ6_maritalStatus(getStringValue(payload, "q6_marital_status"));
            applicant.setQ7_spouseOccupation(getStringValue(payload, "q7_spouse_occupation"));
            applicant.setQ8_children(getStringValue(payload, "q8_children"));
            applicant.setQ9_hasRelativesInCompany(getStringValue(payload, "q9_has_relatives"));
            applicant.setQ10_relativesDetails(getStringValue(payload, "q10_relatives_details"));
            applicant.setQ11_siblingsOccupations(getStringValue(payload, "q11_siblings_occupations"));
            applicant.setQ12_hasTwoWheeler(getStringValue(payload, "q12_has_two_wheeler"));
            applicant.setQ13_hasAndroidPhone(getStringValue(payload, "q13_has_android_phone"));
            applicant.setQ14_knowsCarDriving(getStringValue(payload, "q14_knows_car_driving"));
            applicant.setQ15_willingToTravel(getStringValue(payload, "q15_willing_to_travel"));
            applicant.setQ16_covidVaccination(getStringValue(payload, "q16_covid_vaccination"));
            applicant.setQ47_hasInsurance(getStringValue(payload, "q47_has_insurance"));
            applicant.setQ48_insuranceNumber(getStringValue(payload, "q48_insurance_number"));
            applicant.setQ17_positivePoints(getStringValue(payload, "q17_positive_points"));
            applicant.setQ18_negativePoints(getStringValue(payload, "q18_negative_points"));
            applicant.setQ19_lifeGoals(getStringValue(payload, "q19_life_goals"));
            applicant.setQ20_willingRotationalShifts(getStringValue(payload, "q20_willing_rotational_shifts"));
            applicant.setQ20_improvementSuggestions(getStringValue(payload, "q20_improvement_suggestions"));
            applicant.setQ21_isExperienced(getStringValue(payload, "q21_is_experienced"));
            applicant.setQ22_totalExperience(getStringValue(payload, "q22_total_experience"));
            applicant.setQ23_coreExperience(getStringValue(payload, "q23_core_experience"));
            applicant.setQ24_prevNetSalary(getStringValue(payload, "q24_prev_net_salary"));
            applicant.setQ25_prevGrossSalary(getStringValue(payload, "q25_prev_gross_salary"));
            applicant.setQ26_expectedNetSalary(getStringValue(payload, "q26_expected_net_salary"));
            applicant.setQ27_expectedGrossSalary(getStringValue(payload, "q27_expected_gross_salary"));
            applicant.setQ28_pfHigherPension(getStringValue(payload, "q28_pf_higher_pension"));
            applicant.setQ29_pfDeductionAmount(getStringValue(payload, "q29_pf_deduction_amount"));
            applicant.setQ30_alternativeDepartment(getStringValue(payload, "q30_alternative_department"));
            applicant.setQ31_prevLocation(getStringValue(payload, "q31_prev_location"));
            applicant.setQ32_prevShift(getStringValue(payload, "q32_prev_shift"));
            applicant.setQ33_reasonForLeaving(getStringValue(payload, "q33_reason_for_leaving"));
            applicant.setQ34_noticePeriod(getStringValue(payload, "q34_notice_period"));
            applicant.setQ35_prevDeptPosition(getStringValue(payload, "q35_prev_dept_position"));
            applicant.setQ36_prevDeptCount(getStringValue(payload, "q36_prev_dept_count"));
            applicant.setQ38_handleMistake(getStringValue(payload, "q38_handle_mistake"));
            applicant.setQ39_handleOpinionDifference(getStringValue(payload, "q39_handle_opinion_difference"));
            applicant.setQ40_computerSelfRating(getStringValue(payload, "q40_computer_self_rating"));
            applicant.setQ41_hrMgrName(getStringValue(payload, "q41_hr_mgr_name"));
            applicant.setQ42_hrMgrEmail(getStringValue(payload, "q42_hr_mgr_email"));
            applicant.setQ43_hrMgrPhone(mgrPhone);
            applicant.setMgrCountryId(mgrCountryId);
            applicant.setQ44_vertHeadName(getStringValue(payload, "q44_vert_head_name"));
            applicant.setQ45_vertHeadEmail(getStringValue(payload, "q45_vert_head_email"));
            applicant.setQ46_vertHeadPhone(vertPhone);
            applicant.setVertHeadCountryId(vertCountryId);
            applicant.setEmployeePhotoUpload(getStringValue(payload, "employeePhotoUpload"));
            applicant.setResumePath(getStringValue(payload, "resumePath"));
            applicant.setPayslipPath(getStringValue(payload, "payslipPath"));
            applicant.setAadharPath(getStringValue(payload, "aadharPath"));
            syncAadharAndPayslipAttachments(applicant);

            // Reset rejected statuses back to PENDING if resubmitted
            if (applicant.getPhotoVerifiedStatus() != null
                    && "REJECTED".equalsIgnoreCase(applicant.getPhotoVerifiedStatus().getName())) {
                applicant.setPhotoVerifiedStatus(statusResolver.get("Pending"));
                applicant.setPhotoRejectReason(null);
            }
            if (applicant.getResumeVerifiedStatus() != null
                    && "REJECTED".equalsIgnoreCase(applicant.getResumeVerifiedStatus().getName())) {
                applicant.setResumeVerifiedStatus(statusResolver.get("Pending"));
                applicant.setResumeRejectReason(null);
            }
            if (applicant.getPayslipVerifiedStatus() != null
                    && "REJECTED".equalsIgnoreCase(applicant.getPayslipVerifiedStatus().getName())) {
                applicant.setPayslipVerifiedStatus(statusResolver.get("Pending"));
                applicant.setPayslipRejectReason(null);
            }
            if (applicant.getAadharVerifiedStatus() != null
                    && "REJECTED".equalsIgnoreCase(applicant.getAadharVerifiedStatus().getName())) {
                applicant.setAadharVerifiedStatus(statusResolver.get("Pending"));
                applicant.setAadharRejectReason(null);
            }

            applicant.setCallStatus(statusResolver.get("To Be Verified"));
            applicant.setSelfAssessmentStatus(statusResolver.get("SUBMITTED"));
            applicant.setCurrentStep(null);

            // Transition active assessment rejections to SUBMITTED
            List<AtsRejectedDocument> activeRejs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                    applicant.getId(), AtsRejectionStage.ASSESSMENT, statusResolver.get("Active"));
            for (AtsRejectedDocument doc : activeRejs) {
                doc.setActiveStatus(statusResolver.get("SUBMITTED"));
                doc.setUpdatedBy(doc.getCreatedBy() != null ? doc.getCreatedBy() : "SUPER BOSS");
                doc.setUpdatedDate(new Date());
                rejectedDocumentRepo.save(doc);
            }

            employeeRepo.saveAndFlush(applicant);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }

        return ResponseEntity.ok(Map.of("message", "Self assessment submitted successfully!"));
    }

    @PostMapping("/portal/save-draft")
    @Operation(summary = "Save candidate self-assessment draft answers to database")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> portalSaveDraft(@RequestBody Map<String, Object> payload) {
        String token = getStringValue(payload, "token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Authentication token missing!");
        }
        if (!portalTokenService.isTokenActiveAndValid(token, "CALL_LETTER")) {
            return ResponseEntity.status(401)
                    .body("This assessment link is invalid or has expired. Please contact HR.");
        }

        String subject;
        try {
            subject = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Session expired or invalid!");
        }

        EmployeeMaster applicant = findApplicantBySubject(subject);
        if (applicant == null) {
            return ResponseEntity.status(401).body("Applicant record not found for session!");
        }

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "SYSTEM", null, java.util.Collections.emptyList()));
        try {
            boolean hasRejectedDocs = (applicant.getPhotoVerifiedStatus() != null
                    && "REJECTED".equalsIgnoreCase(applicant.getPhotoVerifiedStatus().getName()))
                    || (applicant.getResumeVerifiedStatus() != null
                            && "REJECTED".equalsIgnoreCase(applicant.getResumeVerifiedStatus().getName()))
                    || (applicant.getAadharVerifiedStatus() != null
                            && "REJECTED".equalsIgnoreCase(applicant.getAadharVerifiedStatus().getName()))
                    || (applicant.getPayslipVerifiedStatus() != null
                            && "REJECTED".equalsIgnoreCase(applicant.getPayslipVerifiedStatus().getName()));

            com.autonoma.erp.modules.platform.common.entity.StatusMaster callStatObj = applicant.getCallStatus();
            String callStat = callStatObj != null ? callStatObj.getName() : null;
            boolean isReuploadAllowed = hasRejectedDocs
                    || "TO BE VERIFY".equalsIgnoreCase(callStat)
                    || "TO BE VERIFIED".equalsIgnoreCase(callStat)
                    || "RESEND".equalsIgnoreCase(callStat)
                    || "RESENT".equalsIgnoreCase(callStat);

            if (applicant.getSelfAssessmentStatus() != null
                    && "SUBMITTED".equalsIgnoreCase(applicant.getSelfAssessmentStatus().getName())
                    && !isReuploadAllowed) {
                return ResponseEntity.badRequest().body("Self-assessment has already been submitted.");
            }

            // Transition status if DRAFT or null
            if (applicant.getSelfAssessmentStatus() == null
                    || "DRAFT".equalsIgnoreCase(applicant.getSelfAssessmentStatus().getName())) {
                applicant.setSelfAssessmentStatus(statusResolver.get("In Progress"));
            }

            // Save current step if provided
            if (payload.get("currentStep") != null) {
                applicant.setCurrentStep(Integer.valueOf(payload.get("currentStep").toString()));
            }

            // Track last save timestamp
            applicant.setLastDraftSavedDate(new java.util.Date());

            // --- Validate format for draft inputs if provided ---
            String noticePeriodStr = getStringValue(payload, "q34_notice_period");
            if (noticePeriodStr != null && !noticePeriodStr.trim().isEmpty()) {
                if (!noticePeriodStr.trim().matches("^\\d+$")) {
                    return ResponseEntity.badRequest().body("Notice Period must be a positive whole number of days.");
                }
            }
            Long mgrCountryId = getLongValue(payload, "q43_hr_mgr_country_id");
            String mgrPhone = getStringValue(payload, "q43_hr_mgr_phone");
            Long vertCountryId = getLongValue(payload, "q46_vert_head_country_id");
            String vertPhone = getStringValue(payload, "q46_vert_head_phone");

            // Save self assessment fields (Q1 to Q46)
            savePersonalDetailsFromPayload(applicant, payload);

            applicant.setQ1_native(getStringValue(payload, "q1_native"));
            applicant.setQ2_presentAddress(getStringValue(payload, "q2_present_address"));
            applicant.setQ3_permanentAddress(getStringValue(payload, "q3_permanent_address"));
            applicant.setSameAsCurrentAddress(getStringValue(payload, "same_as_current_address"));
            applicant.setQ4_fatherOccupation(getStringValue(payload, "q4_father_occupation"));
            applicant.setQ5_motherOccupation(getStringValue(payload, "q5_mother_occupation"));
            applicant.setQ6_maritalStatus(getStringValue(payload, "q6_marital_status"));
            applicant.setQ7_spouseOccupation(getStringValue(payload, "q7_spouse_occupation"));
            applicant.setQ8_children(getStringValue(payload, "q8_children"));
            applicant.setQ9_hasRelativesInCompany(getStringValue(payload, "q9_has_relatives"));
            applicant.setQ10_relativesDetails(getStringValue(payload, "q10_relatives_details"));
            applicant.setQ11_siblingsOccupations(getStringValue(payload, "q11_siblings_occupations"));
            applicant.setQ12_hasTwoWheeler(getStringValue(payload, "q12_has_two_wheeler"));
            applicant.setQ13_hasAndroidPhone(getStringValue(payload, "q13_has_android_phone"));
            applicant.setQ14_knowsCarDriving(getStringValue(payload, "q14_knows_car_driving"));
            applicant.setQ15_willingToTravel(getStringValue(payload, "q15_willing_to_travel"));
            applicant.setQ16_covidVaccination(getStringValue(payload, "q16_covid_vaccination"));
            applicant.setQ17_positivePoints(getStringValue(payload, "q17_positive_points"));
            applicant.setQ18_negativePoints(getStringValue(payload, "q18_negative_points"));
            applicant.setQ19_lifeGoals(getStringValue(payload, "q19_life_goals"));
            applicant.setQ20_willingRotationalShifts(getStringValue(payload, "q20_willing_rotational_shifts"));
            applicant.setQ20_improvementSuggestions(getStringValue(payload, "q20_improvement_suggestions"));
            applicant.setQ21_isExperienced(getStringValue(payload, "q21_is_experienced"));
            applicant.setQ22_totalExperience(getStringValue(payload, "q22_total_experience"));
            applicant.setQ23_coreExperience(getStringValue(payload, "q23_core_experience"));
            applicant.setQ24_prevNetSalary(getStringValue(payload, "q24_prev_net_salary"));
            applicant.setQ25_prevGrossSalary(getStringValue(payload, "q25_prev_gross_salary"));
            applicant.setQ26_expectedNetSalary(getStringValue(payload, "q26_expected_net_salary"));
            applicant.setQ27_expectedGrossSalary(getStringValue(payload, "q27_expected_gross_salary"));
            applicant.setQ28_pfHigherPension(getStringValue(payload, "q28_pf_higher_pension"));
            applicant.setQ29_pfDeductionAmount(getStringValue(payload, "q29_pf_deduction_amount"));
            applicant.setQ30_alternativeDepartment(getStringValue(payload, "q30_alternative_department"));
            applicant.setQ31_prevLocation(getStringValue(payload, "q31_prev_location"));
            applicant.setQ32_prevShift(getStringValue(payload, "q32_prev_shift"));
            applicant.setQ33_reasonForLeaving(getStringValue(payload, "q33_reason_for_leaving"));
            applicant.setQ34_noticePeriod(getStringValue(payload, "q34_notice_period"));
            applicant.setQ35_prevDeptPosition(getStringValue(payload, "q35_prev_dept_position"));
            applicant.setQ36_prevDeptCount(getStringValue(payload, "q36_prev_dept_count"));
            applicant.setQ38_handleMistake(getStringValue(payload, "q38_handle_mistake"));
            applicant.setQ39_handleOpinionDifference(getStringValue(payload, "q39_handle_opinion_difference"));
            applicant.setQ40_computerSelfRating(getStringValue(payload, "q40_computer_self_rating"));
            applicant.setQ41_hrMgrName(getStringValue(payload, "q41_hr_mgr_name"));
            applicant.setQ42_hrMgrEmail(getStringValue(payload, "q42_hr_mgr_email"));
            applicant.setQ43_hrMgrPhone(mgrPhone);
            applicant.setMgrCountryId(mgrCountryId);
            applicant.setQ44_vertHeadName(getStringValue(payload, "q44_vert_head_name"));
            applicant.setQ45_vertHeadEmail(getStringValue(payload, "q45_vert_head_email"));
            applicant.setQ46_vertHeadPhone(vertPhone);
            applicant.setVertHeadCountryId(vertCountryId);
            String newPhoto = getStringValue(payload, "employeePhotoUpload");
            String newResume = getStringValue(payload, "resumePath");
            String newPayslip = getStringValue(payload, "payslipPath");
            String newAadhar = getStringValue(payload, "aadharPath");

            if (newPhoto != null && !newPhoto.isBlank()
                    && !newPhoto.equalsIgnoreCase(applicant.getEmployeePhotoUpload())) {
                applicant.setEmployeePhotoUpload(newPhoto);
                if (applicant.getPhotoVerifiedStatus() != null
                        && "REJECTED".equalsIgnoreCase(applicant.getPhotoVerifiedStatus().getName())) {
                    applicant.setPhotoVerifiedStatus(statusResolver.get("Pending"));
                    applicant.setPhotoRejectReason(null);
                }
            } else if (newPhoto != null) {
                applicant.setEmployeePhotoUpload(newPhoto);
            }

            if (newResume != null && !newResume.isBlank() && !newResume.equalsIgnoreCase(applicant.getResumePath())) {
                applicant.setResumePath(newResume);
                if (applicant.getResumeVerifiedStatus() != null
                        && "REJECTED".equalsIgnoreCase(applicant.getResumeVerifiedStatus().getName())) {
                    applicant.setResumeVerifiedStatus(statusResolver.get("Pending"));
                    applicant.setResumeRejectReason(null);
                }
            } else if (newResume != null) {
                applicant.setResumePath(newResume);
            }

            if (newPayslip != null && !newPayslip.isBlank()
                    && !newPayslip.equalsIgnoreCase(applicant.getPayslipPath())) {
                applicant.setPayslipPath(newPayslip);
                if (applicant.getPayslipVerifiedStatus() != null
                        && "REJECTED".equalsIgnoreCase(applicant.getPayslipVerifiedStatus().getName())) {
                    applicant.setPayslipVerifiedStatus(statusResolver.get("Pending"));
                    applicant.setPayslipRejectReason(null);
                }
            } else if (newPayslip != null) {
                applicant.setPayslipPath(newPayslip);
            }

            if (newAadhar != null && !newAadhar.isBlank() && !newAadhar.equalsIgnoreCase(applicant.getAadharPath())) {
                applicant.setAadharPath(newAadhar);
                if (applicant.getAadharVerifiedStatus() != null
                        && "REJECTED".equalsIgnoreCase(applicant.getAadharVerifiedStatus().getName())) {
                    applicant.setAadharVerifiedStatus(statusResolver.get("Pending"));
                    applicant.setAadharRejectReason(null);
                }
            } else if (newAadhar != null) {
                applicant.setAadharPath(newAadhar);
            }
            syncAadharAndPayslipAttachments(applicant);

            employeeRepo.saveAndFlush(applicant);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }

        return ResponseEntity.ok(Map.of("message", "Draft saved successfully!"));
    }

    @GetMapping("/portal/generate-test-token")
    @Operation(summary = "Generate test token for candidate onboarding (dev only)")
    public ResponseEntity<?> generateTestToken(@RequestParam String empCode,
            @RequestParam(required = false, defaultValue = "CALL_LETTER") String type,
            @RequestParam(required = false, defaultValue = "REPORTING_MANAGER") String role) {
        Optional<EmployeeMaster> empOpt = employeeRepo.findByApplicantCode(empCode)
                .or(() -> employeeRepo.findByEmpCode(empCode));
        String token;
        if ("BGV_VERIFICATION".equalsIgnoreCase(type) || "VERIFICATION".equalsIgnoreCase(type)) {
            String pType = "BGV_VERIFICATION";
            String subRole = "VERTICAL_HEAD".equalsIgnoreCase(role) ? "VERTICAL_HEAD" : "REPORTING_MANAGER";
            String tokenSub = empCode + ("VERTICAL_HEAD".equals(subRole) ? "_VERTHEAD" : "_REPMGR");
            if (empOpt.isPresent()) {
                EmployeeMaster emp = empOpt.get();
                token = portalTokenService.generateAndSaveToken(emp.getId(), pType, tokenSub, "SUPER BOSS",
                        InvalidationStrategy.KEEP_ALL_ACTIVE);
                ApplicantVerificationSubmission sub = verificationSubmissionRepo
                        .findByEmployeeIdAndRole(emp.getId(), subRole).orElse(null);
                if (sub == null) {
                    String name = "VERTICAL_HEAD".equals(subRole) ? emp.getQ44_vertHeadName() : emp.getQ41_hrMgrName();
                    String email = "VERTICAL_HEAD".equals(subRole) ? emp.getQ45_vertHeadEmail()
                            : emp.getQ42_hrMgrEmail();
                    String phone = "VERTICAL_HEAD".equals(subRole) ? emp.getQ46_vertHeadPhone()
                            : emp.getQ43_hrMgrPhone();
                    sub = new ApplicantVerificationSubmission(null, emp.getId(), subRole,
                            name != null ? name : "Reference Manager", email, phone, false, null, token);
                } else {
                    sub.setToken(token);
                }
                verificationSubmissionRepo.save(sub);
            } else {
                token = jwtService.generateApplicantToken(tokenSub);
            }
        } else {
            String pType = "OFFER_LETTER".equalsIgnoreCase(type) ? "OFFER_LETTER" : "CALL_LETTER";
            if (empOpt.isPresent()) {
                token = portalTokenService.generateAndSaveToken(empOpt.get().getId(), pType, empCode,
                        "SUPER BOSS");
            } else {
                token = jwtService.generateApplicantToken(empCode);
            }
        }
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/verification/initiate/{applicantId}")
    @RequirePagePermission(pageCode = "HA1130", action = "write")
    @Operation(summary = "Initiate candidate reference verification checks")
    @Transactional
    public ResponseEntity<?> initiateVerification(@PathVariable Long applicantId,
            @RequestParam(required = false, defaultValue = "false") boolean useCompanyMail,
            HttpServletRequest request) {
        com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService
                .getTemplateOrThrow("BACKGROUND VERIFICATION");
        emailTemplateEngine.validateSenderProfile(template);
        EmployeeMaster applicant = employeeRepo.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        if (!"YES".equalsIgnoreCase(applicant.getQ21_isExperienced())) {
            return ResponseEntity.badRequest().body("Applicant is not registered as experienced.");
        }

        // Determine if this is a first send or a resend
        List<ApplicantVerificationSubmission> existing = verificationSubmissionRepo.findByEmployeeId(applicantId);
        boolean isResend = !existing.isEmpty();

        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }

        // Invalidate old tokens explicitly for each existing submission before deleting
        // them
        for (ApplicantVerificationSubmission oldSub : existing) {
            if (oldSub.getToken() != null) {
                portalTokenService.invalidateToken(oldSub.getToken(), currentUserId);
            }
        }
        verificationSubmissionRepo.deleteAll(existing);

        boolean sentAny = false;
        String origin = resolveOrigin(request);

        try {
            // 1. Process HR Manager (Reporting Manager)
            String repMgrEmail = applicant.getQ42_hrMgrEmail();
            if (repMgrEmail != null && !repMgrEmail.trim().isEmpty()) {
                String tokenSubject = applicant.getEmpCode() + "_REPMGR";
                String token = portalTokenService.generateAndSaveToken(
                        applicantId, "BGV_VERIFICATION", tokenSubject, currentUserId,
                        InvalidationStrategy.KEEP_ALL_ACTIVE);
                ApplicantVerificationSubmission sub = new ApplicantVerificationSubmission(
                        null, applicantId, "REPORTING_MANAGER",
                        applicant.getQ41_hrMgrName(), repMgrEmail, applicant.getQ43_hrMgrPhone(),
                        false, null, token);
                verificationSubmissionRepo.save(sub);
                sendVerificationEmail(sub, applicant, useCompanyMail, origin);
                sentAny = true;
            }

            // 2. Process Vertical Head
            String vertHeadEmail = applicant.getQ45_vertHeadEmail();
            if (vertHeadEmail != null && !vertHeadEmail.trim().isEmpty()) {
                String tokenSubject = applicant.getEmpCode() + "_VERTHEAD";
                String token = portalTokenService.generateAndSaveToken(
                        applicantId, "BGV_VERIFICATION", tokenSubject, currentUserId,
                        InvalidationStrategy.KEEP_ALL_ACTIVE);
                ApplicantVerificationSubmission sub = new ApplicantVerificationSubmission(
                        null, applicantId, "VERTICAL_HEAD",
                        applicant.getQ44_vertHeadName(), vertHeadEmail, applicant.getQ46_vertHeadPhone(),
                        false, null, token);
                verificationSubmissionRepo.save(sub);
                sendVerificationEmail(sub, applicant, useCompanyMail, origin);
                sentAny = true;
            }
        } catch (Exception e) {
            log.error("Failed to send reference verification emails: {}", e.getMessage(), e);
            String friendlyMsg = com.autonoma.erp.service.admin.EmailSendingService.translateMailException(e);
            return ResponseEntity.badRequest().body(Map.of("message", friendlyMsg));
        }

        if (!sentAny) {
            return ResponseEntity.badRequest().body("No reference contact details (email) found for this candidate.");
        }

        // Set verification status: Sent on first send, Resent on subsequent sends
        applicant.setVerificationStatus(statusResolver.get(isResend ? "Resent" : "Sent"));
        employeeRepo.save(applicant);

        return ResponseEntity.ok(Map.of(
                "message",
                isResend ? "Verification emails resent successfully." : "Verification emails sent successfully.",
                "isResend", isResend));
    }

    private void sendVerificationEmail(ApplicantVerificationSubmission sub, EmployeeMaster applicant,
            boolean useCompanyMail, String origin) {
        String roleName = "REPORTING_MANAGER".equals(sub.getRole()) ? "HR Manager" : "Vertical Head";
        String link = origin + "/public/candidate-verification?token=" + sub.getToken();

        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        String companyNameStr = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                : "NUTECH WIND PARTS PVT LTD";

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("recipientName", sub.getName() != null ? sub.getName() : "Manager");
        placeholders.put("candidateFullName",
                applicant.getEmployeeName() != null ? applicant.getEmployeeName() : "Applicant");
        String verificationPosition = "";
        if (applicant.getDesignationId() != null) {
            verificationPosition = designationRepo.findById(applicant.getDesignationId())
                    .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                    .orElse("");
        }
        if (verificationPosition.isEmpty()) {
            verificationPosition = "Shortlisted Position";
        }
        placeholders.put("position", verificationPosition);
        placeholders.put("roleName", roleName);
        placeholders.put("verificationPortalLink", link);
        placeholders.put("validityDays", "2");
        placeholders.put("hrName", "HR Verification Team");
        placeholders.put("companyName", companyNameStr);
        placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("currentYear", String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));

        try {
            com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService
                    .getTemplateOrThrow("BACKGROUND VERIFICATION");
            com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                    .render(template, placeholders);

            if (emailSendingService != null) {
                emailSendingService.sendEmailWithAttachments(sub.getEmail(), null, null, rendered.getSubject(),
                        rendered.getFullMasterHtml(), null, useCompanyMail);
                log.info("Background Verification email sent to {} with link {}", sub.getEmail(), link);
            } else {
                log.info("Mock Email Sent to {} with link {}", sub.getEmail(), link);
            }
        } catch (Exception e) {
            log.error("Failed to send reference verification email to {}: {}", sub.getEmail(), e.getMessage());
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/verification/verify-token")
    @Operation(summary = "Verify a manager's verification token")
    @Transactional(readOnly = true)
    public ResponseEntity<?> verifyVerificationToken(@RequestParam String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(400).body("Missing token.");
        }

        String subject = null;
        try {
            subject = jwtService.extractUsername(token); // check JWT signature/expiry
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Invalid or expired verification token.");
        }

        // Guard: check if this BGV token has been invalidated (e.g. HR resent the
        // email)
        if (!portalTokenService.isTokenActiveAndValid(token, "BGV_VERIFICATION")) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "reason", "LINK_INVALIDATED",
                    "message",
                    "This verification link has been deactivated. A new link may have been sent to your email."));
        }

        // 1. Direct token lookup
        ApplicantVerificationSubmission sub = verificationSubmissionRepo.findByToken(token)
                .orElse(null);

        // 2. Fallback: via ApplicantPortalToken repository
        if (sub == null) {
            Optional<ApplicantPortalToken> pTokenOpt = tokenRepository.findByToken(token);
            if (pTokenOpt.isPresent()) {
                Long empId = pTokenOpt.get().getEmployeeId();
                String role = (subject != null && subject.endsWith("_VERTHEAD")) ? "VERTICAL_HEAD"
                        : "REPORTING_MANAGER";
                sub = verificationSubmissionRepo.findByEmployeeIdAndRole(empId, role).orElse(null);
                if (sub == null) {
                    List<ApplicantVerificationSubmission> subs = verificationSubmissionRepo.findByEmployeeId(empId);
                    if (!subs.isEmpty()) {
                        sub = subs.get(0);
                    }
                }
            }
        }

        // 3. Fallback: via token subject (e.g. EMPCODE_REPMGR / EMPCODE_VERTHEAD /
        // EMPCODE)
        if (sub == null && subject != null) {
            String role = subject.endsWith("_VERTHEAD") ? "VERTICAL_HEAD" : "REPORTING_MANAGER";
            String baseCode = subject.replace("_VERTHEAD", "").replace("_REPMGR", "");
            EmployeeMaster emp = findApplicantBySubject(baseCode);
            if (emp != null) {
                sub = verificationSubmissionRepo.findByEmployeeIdAndRole(emp.getId(), role).orElse(null);
                if (sub == null) {
                    List<ApplicantVerificationSubmission> subs = verificationSubmissionRepo
                            .findByEmployeeId(emp.getId());
                    if (!subs.isEmpty()) {
                        sub = subs.get(0);
                    }
                }
            }
        }

        // Auto-heal / synchronize token on submission if found via fallback
        if (sub != null && (sub.getToken() == null || !sub.getToken().equals(token))) {
            sub.setToken(token);
            verificationSubmissionRepo.save(sub);
        }

        if (sub == null) {
            return ResponseEntity.status(404).body("Verification request not found.");
        }

        EmployeeMaster applicant = employeeRepo.findById(sub.getEmployeeId())
                .orElse(null);
        if (applicant == null) {
            return ResponseEntity.status(404).body("Applicant not found.");
        }

        List<VerificationCriteria> questions = verificationCriteriaRepo.findAll().stream()
                .filter(q -> q.getIsActive() == null || q.getIsActive())
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("alreadySubmitted", sub.getIsSubmitted());
        response.put("role", sub.getRole());
        response.put("name", sub.getName());
        response.put("applicantName", applicant.getEmployeeName());
        response.put("applicantId", applicant.getId());
        response.put("applicantCode", applicant.getApplicantCode());
        response.put("empCode", applicant.getEmpCode());
        response.put("department",
                applicant.getDepartment() != null ? applicant.getDepartment().getDepartmentName() : "N/A");
        response.put("designation",
                applicant.getDesignation() != null ? applicant.getDesignation().getDesignationName() : "N/A");
        response.put("verificationStatus",
                applicant.getVerificationStatus() != null ? applicant.getVerificationStatus().getName() : "PENDING");
        response.put("questions", questions);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verification/submit")
    @Operation(summary = "Submit manager's verification response")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> submitVerificationResponse(@RequestBody Map<String, Object> payload) {
        String token = getStringValue(payload, "token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(400).body("Missing token.");
        }

        String subject = null;
        try {
            subject = jwtService.extractUsername(token);
        } catch (Exception ignored) {
        }

        ApplicantVerificationSubmission sub = verificationSubmissionRepo.findByToken(token)
                .orElse(null);

        // Fallback: lookup submission if token was generated or mapped via subject
        if (sub == null) {
            Optional<ApplicantPortalToken> pTokenOpt = tokenRepository.findByToken(token);
            if (pTokenOpt.isPresent()) {
                Long empId = pTokenOpt.get().getEmployeeId();
                String role = (subject != null && subject.endsWith("_VERTHEAD")) ? "VERTICAL_HEAD"
                        : "REPORTING_MANAGER";
                sub = verificationSubmissionRepo.findByEmployeeIdAndRole(empId, role).orElse(null);
                if (sub == null) {
                    List<ApplicantVerificationSubmission> subs = verificationSubmissionRepo.findByEmployeeId(empId);
                    if (!subs.isEmpty()) {
                        sub = subs.get(0);
                    }
                }
            }
        }

        if (sub == null && subject != null) {
            String role = subject.endsWith("_VERTHEAD") ? "VERTICAL_HEAD" : "REPORTING_MANAGER";
            String baseCode = subject.replace("_VERTHEAD", "").replace("_REPMGR", "");
            EmployeeMaster emp = findApplicantBySubject(baseCode);
            if (emp != null) {
                sub = verificationSubmissionRepo.findByEmployeeIdAndRole(emp.getId(), role).orElse(null);
                if (sub == null) {
                    List<ApplicantVerificationSubmission> subs = verificationSubmissionRepo
                            .findByEmployeeId(emp.getId());
                    if (!subs.isEmpty()) {
                        sub = subs.get(0);
                    }
                }
            }
        }

        if (sub == null) {
            return ResponseEntity.status(404).body("Verification request not found.");
        }

        if (sub.getIsSubmitted()) {
            return ResponseEntity.status(400).body("This verification has already been submitted.");
        }

        List<Map<String, Object>> responsesList = (List<Map<String, Object>>) payload.get("responses");
        if (responsesList == null || responsesList.isEmpty()) {
            return ResponseEntity.status(400).body("Feedback responses are missing.");
        }

        for (Map<String, Object> item : responsesList) {
            Long questionId = Long.valueOf(item.get("questionId").toString());
            Integer rating = item.get("rating") != null ? Integer.valueOf(item.get("rating").toString()) : null;
            String feedback = (String) item.get("feedback");
            String reason = (String) item.get("reason");

            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.status(400).body("Rating must be between 1 and 5 stars for all criteria.");
            }

            String normalizedFeedback = (feedback == null || feedback.trim().isEmpty()) ? null : feedback.trim();
            String normalizedReason = (reason == null || reason.trim().isEmpty()) ? null : reason.trim();

            ApplicantVerificationResponse resp = new ApplicantVerificationResponse(
                    null,
                    sub.getEmployeeId(),
                    sub.getRole(),
                    questionId,
                    rating,
                    normalizedFeedback,
                    normalizedReason,
                    new Date());
            verificationResponseRepo.save(resp);
        }

        sub.setIsSubmitted(true);
        sub.setSubmittedDate(new Date());
        verificationSubmissionRepo.save(sub);

        // Update verification status based on submission progress
        List<ApplicantVerificationSubmission> allSubs = verificationSubmissionRepo
                .findByEmployeeId(sub.getEmployeeId());
        long total = allSubs.size();
        long completed = allSubs.stream().filter(ApplicantVerificationSubmission::getIsSubmitted).count();

        EmployeeMaster applicant = employeeRepo.findById(sub.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        if (completed == 0) {
            // should not happen since we just completed one
        } else if (completed < total) {
            // One verifier has submitted — HR still needs to review
            applicant.setVerificationStatus(statusResolver.get("Partially Verified"));
        } else {
            // All verifiers submitted — waiting for HR to review and decide
            applicant.setVerificationStatus(statusResolver.get("TO BE VERIFIED"));
            // DO NOT call computeAndSetAtsOverallStatus() — Overall Status must ONLY change
            // through explicit HR decision via POST /verification/confirm/{id}
        }
        employeeRepo.save(applicant);

        return ResponseEntity.ok(Map.of("message", "Verification details submitted successfully!"));
    }

    @GetMapping("/verification/reviews/{applicantId}")
    @Operation(summary = "Get HR Manager, Vertical Head, and HR manual reviews for candidate")
    public ResponseEntity<?> getVerificationReviews(@PathVariable Long applicantId) {
        List<ApplicantVerificationSubmission> subs = verificationSubmissionRepo.findByEmployeeId(applicantId);
        List<ApplicantVerificationResponse> resps = verificationResponseRepo.findByEmployeeId(applicantId);

        List<VerificationCriteria> allCriteria = verificationCriteriaRepo.findAll();
        Map<Long, String> criteriaMap = new HashMap<>();
        for (VerificationCriteria vc : allCriteria) {
            criteriaMap.put(vc.getId(), vc.getDescription());
        }

        Map<String, Object> response = new HashMap<>();

        for (String role : List.of("REPORTING_MANAGER", "VERTICAL_HEAD")) {
            Optional<ApplicantVerificationSubmission> subOpt = subs.stream()
                    .filter(s -> role.equals(s.getRole()))
                    .findFirst();

            Map<String, Object> roleData = new HashMap<>();
            if (subOpt.isPresent()) {
                ApplicantVerificationSubmission sub = subOpt.get();
                roleData.put("name", sub.getName());
                roleData.put("email", sub.getEmail());
                roleData.put("phone", sub.getPhone());
                roleData.put("isSubmitted", sub.getIsSubmitted());
                roleData.put("submittedDate", sub.getSubmittedDate());

                List<Map<String, Object>> reviews = new ArrayList<>();
                List<ApplicantVerificationResponse> roleResps = resps.stream()
                        .filter(r -> role.equals(r.getRole()))
                        .toList();

                for (ApplicantVerificationResponse r : roleResps) {
                    Map<String, Object> rMap = new HashMap<>();
                    rMap.put("questionId", r.getQuestionId());
                    rMap.put("question", criteriaMap.getOrDefault(r.getQuestionId(), "Verification Question"));
                    rMap.put("rating", r.getRating());
                    rMap.put("feedback", r.getFeedback());
                    rMap.put("reason", r.getReason());
                    reviews.add(rMap);
                }
                roleData.put("reviews", reviews);
            }
            response.put(role.toLowerCase(), roleData);
        }

        // Add HR manual review details if they exist
        List<ApplicantVerificationResponse> hrResps = resps.stream()
                .filter(r -> "HR_MANUAL".equals(r.getRole()))
                .toList();
        if (!hrResps.isEmpty()) {
            Map<String, Object> hrData = new HashMap<>();
            hrData.put("name", "HR (Manual Verification)");
            hrData.put("isSubmitted", true);
            hrData.put("submittedDate", hrResps.isEmpty() ? null : hrResps.get(0).getSubmittedDate());

            List<Map<String, Object>> reviews = new ArrayList<>();
            for (ApplicantVerificationResponse r : hrResps) {
                Map<String, Object> rMap = new HashMap<>();
                rMap.put("questionId", r.getQuestionId());
                rMap.put("question", criteriaMap.getOrDefault(r.getQuestionId(), "Verification Question"));
                rMap.put("rating", r.getRating());
                rMap.put("feedback", r.getFeedback());
                rMap.put("reason", r.getReason());
                reviews.add(rMap);
            }
            hrData.put("reviews", reviews);
            response.put("hr_manual", hrData);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verification/confirm/{applicantId}")
    @RequirePagePermission(pageCode = "HA1130", action = "write")
    @Operation(summary = "HR confirms BGV decision — sets Overall Status and marks verification complete")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> confirmVerification(
            @PathVariable Long applicantId,
            @RequestBody(required = false) Map<String, Object> payload) {
        EmployeeMaster applicant = employeeRepo.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        // Always mark verification as complete
        applicant.setVerificationStatus(statusResolver.get("Verified"));

        if (payload != null && !payload.isEmpty()) {
            // HR has provided a decision (SELECTED / HOLD / REJECTED)
            String decision = getStringValue(payload, "decision");
            if (decision != null && !decision.trim().isEmpty()) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster resolvedDecision = statusResolver
                        .get(decision);
                if ("SELECTED".equalsIgnoreCase(decision)) {
                    applicant.setBackgroundVerificationStatus(statusResolver.get("Verified"));
                    applicant.setAtsOverallStatus(statusResolver.get("Waiting For Progress"));
                } else {
                    applicant.setAtsOverallStatus(resolvedDecision);
                    if ("REJECTED".equalsIgnoreCase(decision)) {
                        applicant.setBackgroundVerificationStatus(statusResolver.get("Rejected"));
                    } else if ("HOLD".equalsIgnoreCase(decision)) {
                        applicant.setBackgroundVerificationStatus(statusResolver.get("Hold"));
                    }
                }
                log.info("[BGV] HR decision '{}' applied to applicant {}", decision, applicantId);

                // Notify candidate by email if selected
                if (statusResolver.isSelected(resolvedDecision)) {
                    try {
                        String candidateEmail = applicant.getOfficeMail();
                        if (candidateEmail == null || candidateEmail.trim().isEmpty()) {
                            candidateEmail = personalRepo.findFirstByEmployeeId(applicantId)
                                    .map(EmployeePersonalDetail::getPersonalEmail)
                                    .orElse(null);
                        }
                        String positionName = "";
                        if (applicant.getDesignationId() != null) {
                            positionName = designationRepo.findById(applicant.getDesignationId())
                                    .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                                    .orElse("");
                        }
                        atsEmailService.sendStatusEmail(
                                candidateEmail,
                                applicant.getEmployeeName(),
                                positionName,
                                "SELECTED", null, null, null);
                    } catch (Exception e) {
                        log.warn("[BGV] Failed to send SELECTED email to applicant {}: {}", applicantId,
                                e.getMessage());
                    }
                }
            }

            // Save HR notes if provided
            String comments = getStringValue(payload, "comments");
            if (comments != null && !comments.trim().isEmpty()) {
                applicant.setReferenceComments(comments);
            }
            String bgvRemark = getStringValue(payload, "bgvRemark");
            if (bgvRemark != null && !bgvRemark.trim().isEmpty()) {
                applicant.setBgvRemark(bgvRemark);
            }

            // Save manual responses if provided
            if (payload.containsKey("responses")) {
                List<Map<String, Object>> responsesList = (List<Map<String, Object>>) payload.get("responses");
                if (responsesList != null) {
                    // Clear existing manual responses for idempotency
                    List<ApplicantVerificationResponse> existingManual = verificationResponseRepo
                            .findByEmployeeIdAndRole(applicantId, "HR_MANUAL");
                    verificationResponseRepo.deleteAll(existingManual);

                    for (Map<String, Object> item : responsesList) {
                        Long questionId = Long.valueOf(item.get("questionId").toString());
                        Integer rating = Integer.valueOf(item.get("rating").toString());
                        String feedback = (String) item.get("feedback");
                        String reason = (String) item.get("reason");

                        ApplicantVerificationResponse resp = new ApplicantVerificationResponse(
                                null,
                                applicantId,
                                "HR_MANUAL",
                                questionId,
                                rating,
                                feedback,
                                reason,
                                new Date());
                        verificationResponseRepo.save(resp);
                    }
                }
            }
        }

        employeeRepo.save(applicant);
        return ResponseEntity.ok(Map.of("message", "Candidate verification confirmed successfully!",
                "verificationStatus", "Verified",
                "atsOverallStatus", applicant.getAtsOverallStatus() != null
                        ? applicant.getAtsOverallStatus().getName()
                        : "Pending"));
    }

    @GetMapping("/verification/criteria")
    @Operation(summary = "Get active verification criteria for Manual Verification dialog")
    public ResponseEntity<?> getVerificationCriteria() {
        List<VerificationCriteria> criteria = verificationCriteriaRepo.findAll().stream()
                .filter(q -> q.getIsActive() == null || q.getIsActive())
                .toList();
        return ResponseEntity.ok(Map.of("criteria", criteria));
    }

    @GetMapping("/portal/verify-onboarding-token")
    @Operation(summary = "Verify candidate portal onboarding token")
    public ResponseEntity<?> portalVerifyOnboardingToken(@RequestParam String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Missing verification token!");
        }

        try {
            // Validate the token signature and expiration
            String subject = jwtService.extractUsername(token);
            if (subject == null) {
                return ResponseEntity.status(401).body("Invalid token subject.");
            }

            if (!portalTokenService.isTokenActiveAndValid(token, "OFFER_LETTER")) {
                return ResponseEntity.status(401)
                        .body("This onboarding link is invalid or has expired. Please contact HR.");
            }

            // Load the candidate
            EmployeeMaster applicant = employeeRepo.findByApplicantCode(subject)
                    .or(() -> employeeRepo.findByEmpCode(subject)).orElse(null);
            if (applicant == null) {
                try {
                    Long id = Long.parseLong(subject);
                    applicant = employeeRepo.findById(id).orElse(null);
                } catch (NumberFormatException ignored) {
                }
            }
            if (applicant == null) {
                return ResponseEntity.status(401).body("Applicant not found.");
            }

            // Authorization check: if token is REJECTED_DOCUMENT, confirm they actually
            // have active onboarding rejections
            Optional<ApplicantPortalToken> tokenOpt = tokenRepository.findByToken(token);
            if (tokenOpt.isPresent() && "REJECTED_DOCUMENT".equalsIgnoreCase(tokenOpt.get().getPortalType())) {
                List<AtsRejectedDocument> activeRejs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                        applicant.getId(), AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));
                if (activeRejs.isEmpty()) {
                    return ResponseEntity.status(401)
                            .body("Unauthorized access. No active rejected documents found for Onboarding stage.");
                }
            }

            // Expose active rejected documents list in the response map
            List<AtsRejectedDocument> rejectedDocs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                    applicant.getId(), AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));
            List<Map<String, Object>> rejectedDocsList = new java.util.ArrayList<>();
            for (AtsRejectedDocument rd : rejectedDocs) {
                rejectedDocsList.add(Map.of(
                        "documentName", rd.getDocumentName(),
                        "rejectReason", rd.getRejectReason()));
            }

            // Check if already completed (by checking if offerStatus is SUBMITTED or
            // ACCEPTED)
            com.autonoma.erp.modules.platform.common.entity.StatusMaster offerStatusObj = applicant.getOfferStatus();
            String offerStatus = offerStatusObj != null ? offerStatusObj.getName() : null;
            boolean alreadySubmitted = "SUBMITTED".equalsIgnoreCase(offerStatus) ||
                    "TO BE VERIFIED".equalsIgnoreCase(offerStatus) ||
                    "TO BE VERIFY".equalsIgnoreCase(offerStatus) ||
                    "ACCEPTED".equalsIgnoreCase(offerStatus);

            if (!rejectedDocsList.isEmpty()) {
                alreadySubmitted = false;
            }

            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "alreadySubmitted", alreadySubmitted,
                    "rejectedDocuments", rejectedDocsList,
                    "applicant", mapEmployeeToFullMap(applicant)));
        } catch (Exception e) {
            log.error("Failed to verify portal token: {}", e.getMessage(), e);
            return ResponseEntity.status(401)
                    .body("This onboarding link is invalid or has expired. Please contact HR.");
        }
    }

    @PostMapping("/portal/start-onboarding")
    @Operation(summary = "Mark onboarding as started for a candidate")
    @Transactional
    public ResponseEntity<?> portalStartOnboarding(@RequestParam String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Authentication token missing!");
        }
        if (!portalTokenService.isTokenActiveAndValid(token, "OFFER_LETTER")) {
            return ResponseEntity.status(401)
                    .body("This onboarding link is invalid or has expired. Please contact HR.");
        }

        String subject;
        try {
            subject = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Session expired or invalid!");
        }

        EmployeeMaster applicant = findApplicantBySubject(subject);
        if (applicant == null) {
            return ResponseEntity.status(401).body("Applicant record not found for session!");
        }

        applicant.setOnboardingStarted(true);
        employeeRepo.save(applicant);

        return ResponseEntity.ok(Map.of("success", true, "message", "Onboarding marked as started successfully!"));
    }

    @GetMapping("/portal/document-reupload/verify")
    @Operation(summary = "Verify document re-upload token and determine redirect portal destination")
    public ResponseEntity<?> verifyDocumentReuploadToken(@RequestParam String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Missing verification token!");
        }

        try {
            if (!portalTokenService.isTokenActiveAndValid(token, "REJECTED_DOCUMENT")) {
                return ResponseEntity.status(401)
                        .body("This document re-upload link is invalid or has expired. Please contact HR.");
            }

            Optional<ApplicantPortalToken> tokenOpt = tokenRepository.findByToken(token);
            if (tokenOpt.isEmpty()) {
                return ResponseEntity.status(401).body("Token not found.");
            }
            ApplicantPortalToken portalToken = tokenOpt.get();

            EmployeeMaster applicant = employeeRepo.findById(portalToken.getEmployeeId()).orElse(null);
            if (applicant == null) {
                return ResponseEntity.status(401).body("Applicant not found.");
            }

            // Query active rejections to determine destination
            List<AtsRejectedDocument> activeOnboarding = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                    applicant.getId(), AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));

            String portal = "ASSESSMENT";
            List<AtsRejectedDocument> activeRejections;
            if (!activeOnboarding.isEmpty()) {
                portal = "ONBOARDING";
                activeRejections = activeOnboarding;
            } else {
                activeRejections = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                        applicant.getId(), AtsRejectionStage.ASSESSMENT, statusResolver.get("Active"));
            }

            List<Map<String, Object>> rejectedDocsList = new java.util.ArrayList<>();
            for (AtsRejectedDocument rd : activeRejections) {
                rejectedDocsList.add(Map.of(
                        "documentName", rd.getDocumentName(),
                        "rejectReason", rd.getRejectReason()));
            }

            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "portal", portal,
                    "hasRejectedDocuments", !rejectedDocsList.isEmpty(),
                    "rejectedDocuments", rejectedDocsList));
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body("This document re-upload link is invalid or has expired. Please contact HR.");
        }
    }

    @PostMapping("/portal/submit-onboarding")
    @Operation(summary = "Submit candidate onboarding details")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> portalSubmitOnboarding(@RequestBody Map<String, Object> payload) {
        String token = getStringValue(payload, "token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Authentication token missing!");
        }
        if (!portalTokenService.isTokenActiveAndValid(token, "OFFER_LETTER")) {
            return ResponseEntity.status(401)
                    .body("This onboarding link is invalid or has expired. Please contact HR.");
        }

        String subject;
        try {
            subject = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Session expired or invalid!");
        }

        EmployeeMaster applicant = findApplicantBySubject(subject);
        if (applicant == null) {
            return ResponseEntity.status(401).body("Applicant record not found for session!");
        }

        // Save education rows
        Long empId = applicant.getId();
        checkAndResolveRejections(empId, payload);
        educationRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> eduList = (List<Map<String, Object>>) payload.get("education");
        if (eduList != null) {
            for (Map<String, Object> eduMap : eduList) {
                EmployeeEducation edu = new EmployeeEducation();
                edu.setEmployeeId(empId);
                edu.setEducation(getStringValue(eduMap, "education"));
                edu.setInstitutionName(getStringValue(eduMap, "institutionName"));
                edu.setType(getStringValue(eduMap, "type"));
                edu.setYearOfPassing(getStringValue(eduMap, "yearOfPassing"));
                edu.setPercentageGrade(getStringValue(eduMap, "grade"));
                edu.setCertificateFile(getStringValue(eduMap, "filePath"));
                edu.setUniversity(getStringValue(eduMap, "university"));
                edu.setStream(getStringValue(eduMap, "stream"));
                edu.setFromWhere("ATS");
                educationRepo.save(edu);
            }
        }

        // Save experience rows
        experienceRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> expList = (List<Map<String, Object>>) payload.get("experience");
        if (expList != null) {
            for (Map<String, Object> expMap : expList) {
                EmployeeExperience exp = new EmployeeExperience();
                exp.setEmployeeId(empId);
                exp.setCompanyName(getStringValue(expMap, "companyName"));
                exp.setLocation(getStringValue(expMap, "location"));
                exp.setFromDate(getDateValue(expMap, "fromDate"));
                exp.setToDate(getDateValue(expMap, "toDate"));
                String expYearsStr = getStringValue(expMap, "expYears");
                if (expYearsStr != null && !expYearsStr.isEmpty()) {
                    try {
                        double expYearsDouble = Double.parseDouble(expYearsStr);
                        exp.setTotalExperienceMonths((int) Math.round(expYearsDouble * 12.0));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                exp.setDocuments(getStringValue(expMap, "filePath"));
                exp.setFromWhere("ATS");
                experienceRepo.save(exp);
            }
        }

        // Save kyc rows
        kycDocumentRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> kycList = (List<Map<String, Object>>) payload.get("kyc");
        if (kycList != null) {
            for (Map<String, Object> kycMap : kycList) {
                EmployeeKycDocument kyc = new EmployeeKycDocument();
                kyc.setEmployeeId(empId);
                Object seqObj = kycMap.get("seqNo");
                if (seqObj != null) {
                    try {
                        kyc.setSeqNo(Integer.parseInt(seqObj.toString()));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                kyc.setDocumentName(getStringValue(kycMap, "docName"));
                kyc.setDocumentNumber(getStringValue(kycMap, "docNo"));
                kyc.setAttachment(getStringValue(kycMap, "filePath"));
                kyc.setFromWhere("ATS");
                kycDocumentRepo.save(kyc);

                // Sync Aadhaar from KYC row back to candidate's personal detail columns
                if ("AADHAR CARD".equalsIgnoreCase(kyc.getDocumentName())) {
                    if (kyc.getDocumentNumber() != null && !kyc.getDocumentNumber().isBlank()) {
                        EmployeePersonalDetail p = personalRepo.findFirstByEmployeeId(empId)
                                .orElse(new EmployeePersonalDetail());
                        p.setEmployeeId(empId);
                        p.setAadharNumber(kyc.getDocumentNumber());
                        personalRepo.save(p);
                    }
                    if (kyc.getAttachment() != null && !kyc.getAttachment().isBlank()) {
                        applicant.setAadharPath(kyc.getAttachment());
                    }
                }
            }
        }

        // Save skills rows
        activityRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> skillList = (List<Map<String, Object>>) payload.get("skills");
        if (skillList != null) {
            for (Map<String, Object> skillMap : skillList) {
                EmployeeActivity act = new EmployeeActivity();
                act.setEmployeeId(empId);
                act.setActivityDetails(getStringValue(skillMap, "activityDetails"));
                act.setFilePath(getStringValue(skillMap, "filePath"));
                act.setFromWhere("ATS");
                activityRepo.save(act);
            }
        }

        // Save offer documents to HR_ATTACHMENT_PATH
        atsAttachmentService.syncOnboardingFiles(empId, eduList, expList, kycList, skillList, null);

        // Save reference details with null/empty safeguards and country ID mapping
        String isExp = getStringValue(payload, "q21_is_experienced");
        if (isExp != null && !isExp.trim().isEmpty()) {
            applicant.setQ21_isExperienced(isExp);
        }
        String repMgrName = getStringValue(payload, "q41_hr_mgr_name");
        if (repMgrName != null && !repMgrName.trim().isEmpty()) {
            applicant.setQ41_hrMgrName(repMgrName);
        }
        String repMgrEmail = getStringValue(payload, "q42_hr_mgr_email");
        if (repMgrEmail != null && !repMgrEmail.trim().isEmpty()) {
            applicant.setQ42_hrMgrEmail(repMgrEmail);
        }
        String repMgrPhone = getStringValue(payload, "q43_hr_mgr_phone");
        if (repMgrPhone != null && !repMgrPhone.trim().isEmpty()) {
            applicant.setQ43_hrMgrPhone(repMgrPhone);
        }
        Long repMgrCountry = getLongValue(payload, "q43_hr_mgr_country_id");
        if (repMgrCountry != null) {
            applicant.setMgrCountryId(repMgrCountry);
        }
        String vertHeadName = getStringValue(payload, "q44_vert_head_name");
        if (vertHeadName != null && !vertHeadName.trim().isEmpty()) {
            applicant.setQ44_vertHeadName(vertHeadName);
        }
        String vertHeadEmail = getStringValue(payload, "q45_vert_head_email");
        if (vertHeadEmail != null && !vertHeadEmail.trim().isEmpty()) {
            applicant.setQ45_vertHeadEmail(vertHeadEmail);
        }
        String vertHeadPhone = getStringValue(payload, "q46_vert_head_phone");
        if (vertHeadPhone != null && !vertHeadPhone.trim().isEmpty()) {
            applicant.setQ46_vertHeadPhone(vertHeadPhone);
        }
        Long vertHeadCountry = getLongValue(payload, "q46_vert_head_country_id");
        if (vertHeadCountry != null) {
            applicant.setVertHeadCountryId(vertHeadCountry);
        }

        // Mark offerStatus as SUBMITTED (To Be Verified)
        applicant.setOfferStatus(statusResolver.get("To Be Verified"));

        // Transition active onboarding rejections to SUBMITTED
        List<AtsRejectedDocument> activeRejs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                applicant.getId(), AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));
        for (AtsRejectedDocument doc : activeRejs) {
            doc.setActiveStatus(statusResolver.get("SUBMITTED"));
            doc.setUpdatedBy(doc.getCreatedBy() != null ? doc.getCreatedBy() : "SUPER BOSS");
            doc.setUpdatedDate(new Date());
            rejectedDocumentRepo.save(doc);
        }

        employeeRepo.save(applicant);

        return ResponseEntity.ok(Map.of("message", "Onboarding details submitted successfully!"));
    }

    @PostMapping("/portal/save-onboarding-draft")
    @Operation(summary = "Save candidate onboarding draft details")
    @Transactional
    public ResponseEntity<?> portalSaveOnboardingDraft(@RequestBody Map<String, Object> payload) {
        String token = getStringValue(payload, "token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body("Authentication token missing!");
        }
        if (!portalTokenService.isTokenActiveAndValid(token, "OFFER_LETTER")) {
            return ResponseEntity.status(401)
                    .body("This onboarding link is invalid or has expired. Please contact HR.");
        }

        String subject;
        try {
            subject = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Session expired or invalid!");
        }

        EmployeeMaster applicant = findApplicantBySubject(subject);
        if (applicant == null) {
            return ResponseEntity.status(401).body("Applicant record not found for session!");
        }

        Long empId = applicant.getId();
        checkAndResolveRejections(empId, payload);

        // Save education rows
        educationRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> eduList = (List<Map<String, Object>>) payload.get("education");
        if (eduList != null) {
            for (Map<String, Object> eduMap : eduList) {
                EmployeeEducation edu = new EmployeeEducation();
                edu.setEmployeeId(empId);
                edu.setEducation(getStringValue(eduMap, "education"));
                edu.setInstitutionName(getStringValue(eduMap, "institutionName"));
                edu.setType(getStringValue(eduMap, "type"));
                edu.setYearOfPassing(getStringValue(eduMap, "yearOfPassing"));
                edu.setPercentageGrade(getStringValue(eduMap, "grade"));
                edu.setCertificateFile(getStringValue(eduMap, "filePath"));
                edu.setUniversity(getStringValue(eduMap, "university"));
                edu.setStream(getStringValue(eduMap, "stream"));
                edu.setFromWhere("ATS");
                educationRepo.save(edu);
            }
        }

        // Save experience rows
        experienceRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> expList = (List<Map<String, Object>>) payload.get("experience");
        if (expList != null) {
            for (Map<String, Object> expMap : expList) {
                EmployeeExperience exp = new EmployeeExperience();
                exp.setEmployeeId(empId);
                exp.setCompanyName(getStringValue(expMap, "companyName"));
                exp.setLocation(getStringValue(expMap, "location"));
                exp.setFromDate(getDateValue(expMap, "fromDate"));
                exp.setToDate(getDateValue(expMap, "toDate"));
                String expYearsStr = getStringValue(expMap, "expYears");
                if (expYearsStr != null && !expYearsStr.isEmpty()) {
                    try {
                        double expYearsDouble = Double.parseDouble(expYearsStr);
                        exp.setTotalExperienceMonths((int) Math.round(expYearsDouble * 12.0));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                exp.setDocuments(getStringValue(expMap, "filePath"));
                exp.setFromWhere("ATS");
                experienceRepo.save(exp);
            }
        }

        // Save kyc rows
        kycDocumentRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> kycList = (List<Map<String, Object>>) payload.get("kyc");
        if (kycList != null) {
            for (Map<String, Object> kycMap : kycList) {
                EmployeeKycDocument kyc = new EmployeeKycDocument();
                kyc.setEmployeeId(empId);
                Object seqObj = kycMap.get("seqNo");
                if (seqObj != null) {
                    try {
                        kyc.setSeqNo(Integer.parseInt(seqObj.toString()));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                kyc.setDocumentName(getStringValue(kycMap, "docName"));
                kyc.setDocumentNumber(getStringValue(kycMap, "docNo"));
                kyc.setAttachment(getStringValue(kycMap, "filePath"));
                kyc.setFromWhere("ATS");
                kycDocumentRepo.save(kyc);

                // Sync Aadhaar from KYC row back to candidate's personal detail columns
                if ("AADHAR CARD".equalsIgnoreCase(kyc.getDocumentName())) {
                    if (kyc.getDocumentNumber() != null && !kyc.getDocumentNumber().isBlank()) {
                        EmployeePersonalDetail p = personalRepo.findFirstByEmployeeId(empId)
                                .orElse(new EmployeePersonalDetail());
                        p.setEmployeeId(empId);
                        p.setAadharNumber(kyc.getDocumentNumber());
                        personalRepo.save(p);
                    }
                    if (kyc.getAttachment() != null && !kyc.getAttachment().isBlank()) {
                        applicant.setAadharPath(kyc.getAttachment());
                    }
                }
            }
        }

        // Save skills rows
        activityRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> skillList = (List<Map<String, Object>>) payload.get("skills");
        if (skillList != null) {
            for (Map<String, Object> skillMap : skillList) {
                EmployeeActivity act = new EmployeeActivity();
                act.setEmployeeId(empId);
                act.setActivityDetails(getStringValue(skillMap, "activityDetails"));
                act.setFilePath(getStringValue(skillMap, "filePath"));
                act.setFromWhere("ATS");
                activityRepo.save(act);
            }
        }

        // Save draft offer documents to HR_ATTACHMENT_PATH
        atsAttachmentService.syncOnboardingFiles(empId, eduList, expList, kycList, skillList, null);

        // Save reference details with null/empty safeguards and country ID mapping
        String isExp = getStringValue(payload, "q21_is_experienced");
        if (isExp != null && !isExp.trim().isEmpty()) {
            applicant.setQ21_isExperienced(isExp);
        }
        String repMgrName = getStringValue(payload, "q41_hr_mgr_name");
        if (repMgrName != null && !repMgrName.trim().isEmpty()) {
            applicant.setQ41_hrMgrName(repMgrName);
        }
        String repMgrEmail = getStringValue(payload, "q42_hr_mgr_email");
        if (repMgrEmail != null && !repMgrEmail.trim().isEmpty()) {
            applicant.setQ42_hrMgrEmail(repMgrEmail);
        }
        String repMgrPhone = getStringValue(payload, "q43_hr_mgr_phone");
        if (repMgrPhone != null && !repMgrPhone.trim().isEmpty()) {
            applicant.setQ43_hrMgrPhone(repMgrPhone);
        }
        Long repMgrCountry = getLongValue(payload, "q43_hr_mgr_country_id");
        if (repMgrCountry != null) {
            applicant.setMgrCountryId(repMgrCountry);
        }
        String vertHeadName = getStringValue(payload, "q44_vert_head_name");
        if (vertHeadName != null && !vertHeadName.trim().isEmpty()) {
            applicant.setQ44_vertHeadName(vertHeadName);
        }
        String vertHeadEmail = getStringValue(payload, "q45_vert_head_email");
        if (vertHeadEmail != null && !vertHeadEmail.trim().isEmpty()) {
            applicant.setQ45_vertHeadEmail(vertHeadEmail);
        }
        String vertHeadPhone = getStringValue(payload, "q46_vert_head_phone");
        if (vertHeadPhone != null && !vertHeadPhone.trim().isEmpty()) {
            applicant.setQ46_vertHeadPhone(vertHeadPhone);
        }
        Long vertHeadCountry = getLongValue(payload, "q46_vert_head_country_id");
        if (vertHeadCountry != null) {
            applicant.setVertHeadCountryId(vertHeadCountry);
        }
        employeeRepo.save(applicant);

        return ResponseEntity.ok(Map.of("message", "Draft saved successfully!"));
    }

    @PutMapping("/{id}/verify-documents")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Verify applicant self assessment documents")
    @Transactional
    public ResponseEntity<?> verifyDocuments(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            jakarta.servlet.http.HttpServletRequest request) {
        return employeeRepo.findById(id).map(applicant -> {
            boolean hasRejection = statusResolver
                    .isRejected(statusResolver.get(getStringValue(payload, "photoVerifiedStatus"))) ||
                    statusResolver.isRejected(statusResolver.get(getStringValue(payload, "resumeVerifiedStatus"))) ||
                    statusResolver.isRejected(statusResolver.get(getStringValue(payload, "aadharVerifiedStatus")));
            if ("YES".equalsIgnoreCase(applicant.getQ21_isExperienced())) {
                if (statusResolver.isRejected(statusResolver.get(getStringValue(payload, "payslipVerifiedStatus")))) {
                    hasRejection = true;
                }
            }
            if (hasRejection) {
                emailContentService.getTemplateOrThrow("DOCUMENT REUPLOAD");
            }
            applicant.setPhotoVerifiedStatus(statusResolver.get(getStringValue(payload, "photoVerifiedStatus")));
            applicant.setPhotoRejectReason(getStringValue(payload, "photoRejectReason"));
            applicant.setResumeVerifiedStatus(statusResolver.get(getStringValue(payload, "resumeVerifiedStatus")));
            applicant.setResumeRejectReason(getStringValue(payload, "resumeRejectReason"));
            applicant.setPayslipVerifiedStatus(statusResolver.get(getStringValue(payload, "payslipVerifiedStatus")));
            applicant.setPayslipRejectReason(getStringValue(payload, "payslipRejectReason"));
            applicant.setAadharVerifiedStatus(statusResolver.get(getStringValue(payload, "aadharVerifiedStatus")));
            applicant.setAadharRejectReason(getStringValue(payload, "aadharRejectReason"));

            hasRejection = statusResolver.isRejected(applicant.getPhotoVerifiedStatus()) ||
                    statusResolver.isRejected(applicant.getResumeVerifiedStatus()) ||
                    statusResolver.isRejected(applicant.getAadharVerifiedStatus());

            if ("YES".equalsIgnoreCase(applicant.getQ21_isExperienced())) {
                if (statusResolver.isRejected(applicant.getPayslipVerifiedStatus())) {
                    hasRejection = true;
                }
            }

            boolean allApproved = (statusResolver.isVerified(applicant.getPhotoVerifiedStatus())
                    || statusResolver.is(applicant.getPhotoVerifiedStatus(), "Approved")) &&
                    (statusResolver.isVerified(applicant.getResumeVerifiedStatus())
                            || statusResolver.is(applicant.getResumeVerifiedStatus(), "Approved"))
                    &&
                    (statusResolver.isVerified(applicant.getAadharVerifiedStatus())
                            || statusResolver.is(applicant.getAadharVerifiedStatus(), "Approved"));

            if ("YES".equalsIgnoreCase(applicant.getQ21_isExperienced())) {
                if (!(statusResolver.isVerified(applicant.getPayslipVerifiedStatus())
                        || statusResolver.is(applicant.getPayslipVerifiedStatus(), "Approved"))) {
                    allApproved = false;
                }
            }

            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception ignored) {
            }

            // Auto-resolve any verified document rejections
            autoResolveDocumentRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Passport Size Photo",
                    statusResolver.isVerified(applicant.getPhotoVerifiedStatus())
                            || statusResolver.is(applicant.getPhotoVerifiedStatus(), "Approved"),
                    currentUserId);
            autoResolveDocumentRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Latest Resume",
                    statusResolver.isVerified(applicant.getResumeVerifiedStatus())
                            || statusResolver.is(applicant.getResumeVerifiedStatus(), "Approved"),
                    currentUserId);
            autoResolveDocumentRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Aadhaar Card",
                    statusResolver.isVerified(applicant.getAadharVerifiedStatus())
                            || statusResolver.is(applicant.getAadharVerifiedStatus(), "Approved"),
                    currentUserId);
            if ("YES".equalsIgnoreCase(applicant.getQ21_isExperienced())) {
                autoResolveDocumentRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Salary Payslip",
                        statusResolver.isVerified(applicant.getPayslipVerifiedStatus())
                                || statusResolver.is(applicant.getPayslipVerifiedStatus(), "Approved"),
                        currentUserId);
            }

            if (hasRejection) {
                applicant.setCallStatus(statusResolver.get("To Be Verified"));
                applicant.setVerificationStatus(statusResolver.get("Rejected"));

                // Trigger Dynamic Document Reupload Email
                try {
                    Optional<EmployeePersonalDetail> personalOpt = personalRepo
                            .findFirstByEmployeeId(applicant.getId());
                    String candidateEmail = personalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                            .orElse(applicant.getOfficeMail());

                    if (candidateEmail != null && !candidateEmail.trim().isEmpty()) {
                        StringBuilder rejectedList = new StringBuilder();
                        StringBuilder reasons = new StringBuilder();

                        StringBuilder tableHtml = new StringBuilder();
                        tableHtml.append(
                                "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"10\" style=\"border-collapse:collapse; margin-top:14px; margin-bottom:16px; font-size:14px; font-family:sans-serif;\">");
                        tableHtml.append("<thead>");
                        tableHtml.append("<tr style=\"background-color:#fee2e2; color:#991b1b; text-align:left;\">");
                        tableHtml.append(
                                "<th style=\"padding:10px 12px; border:1px solid #fca5a5; font-weight:700; width:40%;\">Rejected Document</th>");
                        tableHtml.append(
                                "<th style=\"padding:10px 12px; border:1px solid #fca5a5; font-weight:700; width:60%;\">Reason for Rejection</th>");
                        tableHtml.append("</tr>");
                        tableHtml.append("</thead>");
                        tableHtml.append("<tbody>");

                        boolean hasTableRows = false;

                        if (statusResolver.isRejected(applicant.getPhotoVerifiedStatus())) {
                            String r = (applicant.getPhotoRejectReason() != null
                                    && !applicant.getPhotoRejectReason().isBlank())
                                            ? applicant.getPhotoRejectReason().trim()
                                            : "Image is blurred / unclear.";
                            rejectedList.append("• Passport Size Photo: ").append(r).append("\n");
                            reasons.append("Photo: ").append(r).append(" | ");

                            tableHtml.append("<tr>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; font-weight:600; color:#0f172a;\">Passport Size Photo</td>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; color:#334155;\">")
                                    .append(com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                            .escapeHtml(r))
                                    .append("</td>");
                            tableHtml.append("</tr>");
                            hasTableRows = true;

                            createOrUpdateRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT,
                                    "Passport Size Photo", r, currentUserId);
                        }
                        if (statusResolver.isRejected(applicant.getResumeVerifiedStatus())) {
                            String r = (applicant.getResumeRejectReason() != null
                                    && !applicant.getResumeRejectReason().isBlank())
                                            ? applicant.getResumeRejectReason().trim()
                                            : "Resume document is incomplete / unreadable.";
                            rejectedList.append("• Latest Resume: ").append(r).append("\n");
                            reasons.append("Resume: ").append(r).append(" | ");

                            tableHtml.append("<tr>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; font-weight:600; color:#0f172a;\">Latest Resume</td>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; color:#334155;\">")
                                    .append(com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                            .escapeHtml(r))
                                    .append("</td>");
                            tableHtml.append("</tr>");
                            hasTableRows = true;

                            createOrUpdateRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Latest Resume", r,
                                    currentUserId);
                        }
                        if (statusResolver.isRejected(applicant.getAadharVerifiedStatus())) {
                            String r = (applicant.getAadharRejectReason() != null
                                    && !applicant.getAadharRejectReason().isBlank())
                                            ? applicant.getAadharRejectReason().trim()
                                            : "Aadhaar number / scan is not clear.";
                            rejectedList.append("• Aadhaar Card: ").append(r).append("\n");
                            reasons.append("Aadhaar: ").append(r).append(" | ");

                            tableHtml.append("<tr>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; font-weight:600; color:#0f172a;\">Aadhaar Card</td>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; color:#334155;\">")
                                    .append(com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                            .escapeHtml(r))
                                    .append("</td>");
                            tableHtml.append("</tr>");
                            hasTableRows = true;

                            createOrUpdateRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Aadhaar Card", r,
                                    currentUserId);
                        }
                        if ("YES".equalsIgnoreCase(applicant.getQ21_isExperienced())
                                && statusResolver.isRejected(applicant.getPayslipVerifiedStatus())) {
                            String r = (applicant.getPayslipRejectReason() != null
                                    && !applicant.getPayslipRejectReason().isBlank())
                                            ? applicant.getPayslipRejectReason().trim()
                                            : "Payslip scan is invalid / incomplete.";
                            rejectedList.append("• Salary Payslip: ").append(r).append("\n");
                            reasons.append("Payslip: ").append(r).append(" | ");

                            tableHtml.append("<tr>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; font-weight:600; color:#0f172a;\">Salary Payslip</td>");
                            tableHtml.append(
                                    "<td style=\"padding:10px 12px; border:1px solid #fecaca; color:#334155;\">")
                                    .append(com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                            .escapeHtml(r))
                                    .append("</td>");
                            tableHtml.append("</tr>");
                            hasTableRows = true;

                            createOrUpdateRejection(applicant.getId(), AtsRejectionStage.ASSESSMENT, "Salary Payslip",
                                    r, currentUserId);
                        }

                        tableHtml.append("</tbody>");
                        tableHtml.append("</table>");

                        String rejectedTableStr = hasTableRows ? tableHtml.toString() : "";

                        String candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim()
                                : "";
                        if (candidateFullName.isEmpty())
                            candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                                    : "Candidate";
                        String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                .getCandidateFirstName(candidateFullName);

                        String origin = resolveOrigin(request);
                        String token = portalTokenService.generateAndSaveToken(applicant.getId(), "REJECTED_DOCUMENT",
                                applicant.getApplicantCode() != null ? applicant.getApplicantCode()
                                        : applicant.getEmpCode(),
                                currentUserId);
                        String reuploadPortalLink = String.format("%s/candidate/document-reupload?token=%s", origin,
                                token);

                        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant()
                                .orElse(null);
                        String companyNameStr = (company != null && company.getCompanyName() != null)
                                ? company.getCompanyName()
                                : "NUTECH WIND PARTS PVT LTD";

                        Map<String, Object> placeholders = new HashMap<>();
                        placeholders.put("candidateName", candidateFirstName);
                        placeholders.put("candidateFirstName", candidateFirstName);
                        placeholders.put("candidateFullName", candidateFullName);
                        placeholders.put("candidateEmail", candidateEmail);
                        placeholders.put("rejectedDocumentsList",
                                rejectedList.toString().isBlank() ? "• Verification Documents"
                                        : rejectedList.toString());
                        placeholders.put("rejectedDocumentsTable", rejectedTableStr);
                        placeholders.put("rejectionReason",
                                reasons.toString().isBlank() ? "One or more documents require re-upload."
                                        : reasons.toString());
                        placeholders.put("reuploadPortalLink", reuploadPortalLink);
                        placeholders.put("onboardingPortalLink", reuploadPortalLink);
                        placeholders.put("assessmentPortalLink", reuploadPortalLink);
                        placeholders.put("portalLink", reuploadPortalLink);
                        placeholders.put("validityDays", "2");
                        placeholders.put("supportContact", "hr@autonomaerp.com");
                        placeholders.put("companyName", companyNameStr);
                        placeholders.put("websiteUrl",
                                (company != null && company.getWebsite() != null) ? company.getWebsite()
                                        : "https://www.autonomaerp.com");

                        com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService
                                .getTemplateOrThrow("DOCUMENT REUPLOAD");
                        com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                                .render(template, placeholders);

                        if (emailSendingService != null) {
                            emailSendingService.sendEmailWithAttachments(candidateEmail, null, null,
                                    rendered.getSubject(), rendered.getFullMasterHtml(), null);
                            log.info("Document Reupload email successfully sent to {}", candidateEmail);
                        }
                    }
                } catch (Exception emailEx) {
                    log.warn("Failed to send Document Reupload email: {}", emailEx.getMessage());
                }
            } else if (allApproved) {
                applicant.setCallStatus(statusResolver.get("Verified"));
                if ("YES".equalsIgnoreCase(applicant.getQ21_isExperienced())) {
                    applicant.setVerificationStatus(statusResolver.get("Pending"));
                } else {
                    applicant.setVerificationStatus(statusResolver.get("Not Applicable"));
                }
            } else {
                applicant.setCallStatus(statusResolver.get("To Be Verified"));
            }

            employeeRepo.save(applicant);
            return ResponseEntity.ok(mapEmployeeToFullMap(applicant));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/verify-onboarding")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Verify applicant onboarding documents")
    @Transactional
    public ResponseEntity<?> verifyOnboarding(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return employeeRepo.findById(id).map(applicant -> {
            String status = getStringValue(payload, "status");
            if (status == null || status.isEmpty() || "Confirm".equalsIgnoreCase(status)
                    || "CONFIRM".equalsIgnoreCase(status)) {
                status = "Verified";
            }
            applicant.setOfferStatus(statusResolver.get(status));
            computeAndSetAtsOverallStatus(applicant);
            employeeRepo.save(applicant);
            return ResponseEntity.ok(mapEmployeeToFullMap(applicant));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Update applicant details")
    @Transactional
    public ResponseEntity<?> updateApplicant(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return employeeRepo.findById(id).map(existing -> {
            String refMode = getStringValue(payload, "refMode");
            if (refMode == null || refMode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Ref Mode is required.");
            }
            // Validation for unique Aadhaar number
            String aadharNo = getStringValue(payload, "aadharNo");
            if (aadharNo != null && !aadharNo.isEmpty()) {
                if (!aadharNo.matches("^\\d{12}$")) {
                    return ResponseEntity.badRequest().body("Aadhaar number must contain exactly 12 digits.");
                }
            }
            Boolean duplicateAadhar = (Boolean) payload.get("duplicateAadhar");
            if (aadharNo != null && !aadharNo.isEmpty() && !Boolean.TRUE.equals(duplicateAadhar)) {
                if (personalRepo.existsByAadharNumberAndEmployeeIdNot(aadharNo, id)) {
                    return ResponseEntity.badRequest().body("Aadhaar Number already exists in another record!");
                }
            }

            com.autonoma.erp.modules.platform.common.entity.StatusMaster oldStatusObj = existing.getStatus();
            String oldStatus = oldStatusObj != null ? oldStatusObj.getName() : null;
            String newStatus = getStringValue(payload, "status");

            if ("CANCELLED".equalsIgnoreCase(newStatus)) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledSM = statusResolver
                        .get("CANCELLED");
                existing.setStatus(cancelledSM);
                cancelStatusIfInProgress(existing, "callStatus", cancelledSM);
                cancelStatusIfInProgress(existing, "interviewStatus", cancelledSM);
                cancelStatusIfInProgress(existing, "offerStatus", cancelledSM);
                cancelStatusIfInProgress(existing, "verificationStatus", cancelledSM);
                cancelStatusIfInProgress(existing, "atsOverallStatus", cancelledSM);

                String cancelReason = getStringValue(payload, "cancellationReason");
                if (cancelReason != null && !cancelReason.trim().isEmpty()) {
                    existing.setExitReason(cancelReason);
                }

                List<HraApplicantInterview> interviews = applicantInterviewRepo.findByEmployeeId(id);
                if (interviews != null) {
                    for (HraApplicantInterview iv : interviews) {
                        if (iv.getInterviewStatus() != null) {
                            String isName = iv.getInterviewStatus().getName().toUpperCase().trim();
                            if ("PENDING".equals(isName) || "WAITING FOR PROGRESS".equals(isName)
                                    || "IN PROGRESS".equals(isName)) {
                                iv.setInterviewStatus(cancelledSM);
                            }
                        } else {
                            iv.setInterviewStatus(cancelledSM);
                        }
                        if (iv.getInterviewResult() != null) {
                            String irName = iv.getInterviewResult().getName().toUpperCase().trim();
                            if ("PENDING".equals(irName) || "WAITING FOR PROGRESS".equals(irName)
                                    || "IN PROGRESS".equals(irName)) {
                                iv.setInterviewResult(cancelledSM);
                            }
                        } else {
                            iv.setInterviewResult(cancelledSM);
                        }
                        applicantInterviewRepo.save(iv);
                    }
                }
                employeeRepo.save(existing);
                return ResponseEntity.ok(mapEmployeeToFullMap(existing));
            }

            saveOrUpdateApplicantDetails(existing, payload);

            // Send email notification if status changed
            if (atsEmailService != null && newStatus != null
                    && !newStatus.equalsIgnoreCase(oldStatus)) {
                try {
                    String candidateName = existing.getFirstName() != null
                            ? existing.getFirstName().trim()
                            : (existing.getEmployeeName() != null ? existing.getEmployeeName() : "Candidate");
                    String candidateEmail = existing.getOfficeMail() != null
                            ? existing.getOfficeMail()
                            : getStringValue(payload, "emailId");
                    String position = "";
                    if (existing.getDesignationId() != null) {
                        position = designationRepo.findById(existing.getDesignationId())
                                .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                                .orElse("");
                    }
                    if (position.isEmpty()) {
                        String payloadDesigId = getStringValue(payload, "designationId");
                        if (payloadDesigId != null && !payloadDesigId.trim().isEmpty()) {
                            try {
                                position = designationRepo.findById(Long.valueOf(payloadDesigId))
                                        .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                                        .orElse("");
                            } catch (Exception e) {
                            }
                        }
                    }
                    atsEmailService.sendStatusEmail(
                            candidateEmail, candidateName, position, newStatus,
                            null, null, null);
                } catch (Exception emailEx) {
                    log.warn("[ATS] Status email failed (non-critical): {}", emailEx.getMessage());
                }
            }

            return ResponseEntity.ok(mapEmployeeToFullMap(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1110", action = "delete")
    @Operation(summary = "Delete applicant (soft delete)")
    @Transactional
    public ResponseEntity<Void> deleteApplicant(@PathVariable Long id) {
        Optional<EmployeeMaster> empOpt = employeeRepo.findById(id);
        if (empOpt.isPresent()) {
            EmployeeMaster emp = empOpt.get();
            if (!"ATS".equalsIgnoreCase(emp.getFromWhere()) || emp.getEmpCode() != null) {
                return ResponseEntity.badRequest().build();
            }
            emp.setIsActive(false);
            emp.setStatus(statusResolver.get("Cancelled"));
            emp.setArchivedDate(new Date());
            employeeRepo.save(emp);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/bulk-action")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Perform bulk pipeline stage updates on selected candidates")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> bulkAction(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        List<?> rawIds = (List<?>) payload.get("ids");
        String action = (String) payload.get("action"); // "CALL", "INTERVIEW", "OFFER", "PUSH-ON-ROLL"

        if (rawIds == null || rawIds.isEmpty() || action == null) {
            return ResponseEntity.badRequest().body("Invalid request payload parameters.");
        }
        if ("INTERVIEW".equalsIgnoreCase(action)) {
            Long interviewerId = null;
            if (payload.containsKey("interviewerId") && payload.get("interviewerId") != null) {
                String rawVal = payload.get("interviewerId").toString().trim();
                if (!rawVal.isEmpty()) {
                    try {
                        interviewerId = Long.valueOf(rawVal);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body("Assigned interviewerId must be a valid number!");
                    }
                }
            }
            if (interviewerId == null) {
                return ResponseEntity.badRequest().body("Assigned interviewerId is mandatory!");
            }
            if (!employeeRepo.findById(interviewerId).isPresent()) {
                return ResponseEntity.badRequest().body("Assigned interviewer employee does not exist!");
            }
        } else if ("OFFER".equalsIgnoreCase(action)) {
            emailContentService.getTemplateOrThrow("OFFER LETTER");
        }

        String origin = resolveOrigin(request);

        if ("PUSH-ON-ROLL".equalsIgnoreCase(action)) {
            List<String> errors = new ArrayList<>();
            for (Object rawId : rawIds) {
                Long id = Long.valueOf(rawId.toString());
                Optional<EmployeeMaster> empOpt = employeeRepo.findById(id);
                if (empOpt.isPresent()) {
                    EmployeeMaster applicant = empOpt.get();
                    List<String> missing = new ArrayList<>();

                    com.autonoma.erp.modules.platform.common.entity.StatusMaster vStatObj = applicant
                            .getVerificationStatus();
                    String vStat = vStatObj != null ? vStatObj.getName() : null;
                    boolean isExpCandidate = "YES".equalsIgnoreCase(applicant.getQ21_isExperienced());
                    if (isExpCandidate && !"VERIFIED".equalsIgnoreCase(vStat) && !"CONFIRM".equalsIgnoreCase(vStat)) {
                        missing.add("Document Verification (must be VERIFIED for experienced candidates, current: "
                                + (vStat != null ? vStat : "Pending")
                                + ")");
                    } else if (!isExpCandidate && !"VERIFIED".equalsIgnoreCase(vStat)
                            && !"CONFIRM".equalsIgnoreCase(vStat) && !"Not Applicable".equalsIgnoreCase(vStat)
                            && !"N/A".equalsIgnoreCase(vStat)) {
                        missing.add("Document Verification (must be VERIFIED or Not Applicable, current: "
                                + (vStat != null ? vStat : "Pending")
                                + ")");
                    }
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster bgStatObj = applicant
                            .getBackgroundVerificationStatus();
                    String bgStat = bgStatObj != null ? bgStatObj.getName() : "PENDING";
                    boolean isBgvNotApplicable = !"YES".equalsIgnoreCase(applicant.getQ21_isExperienced()) ||
                            "Not Applicable".equalsIgnoreCase(vStat) ||
                            "N/A".equalsIgnoreCase(vStat) ||
                            "Not Applicable".equalsIgnoreCase(bgStat) ||
                            "N/A".equalsIgnoreCase(bgStat);
                    if (!isBgvNotApplicable &&
                            !"CLEARED".equalsIgnoreCase(bgStat) &&
                            !"VERIFIED".equalsIgnoreCase(bgStat) &&
                            !"Verified".equalsIgnoreCase(bgStat) &&
                            !"PENDING".equalsIgnoreCase(bgStat)) {
                        missing.add("Background Verification (must be CLEARED/PENDING/Not Applicable, current: "
                                + (bgStat != null ? bgStat : "Pending")
                                + ")");
                    }
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster offerStatObj = applicant
                            .getOfferStatus();
                    String offerStat = offerStatObj != null ? offerStatObj.getName() : null;
                    if (!"ACCEPTED".equalsIgnoreCase(offerStat) &&
                            !"CONFIRM".equalsIgnoreCase(offerStat) &&
                            !"VERIFIED".equalsIgnoreCase(offerStat) &&
                            !"Verified".equalsIgnoreCase(offerStat)) {
                        missing.add("Offer Status (must be VERIFIED/CONFIRM/ACCEPTED, current: "
                                + (offerStat != null ? offerStat : "Pending") + ")");
                    }
                    if (applicant.getDateOfJoining() == null) {
                        missing.add("Joining Date not set/confirmed");
                    }
                    if (!"COMPLETED".equalsIgnoreCase(applicant.getInductionStatus()) &&
                            !"PENDING".equalsIgnoreCase(applicant.getInductionStatus()) &&
                            !"Not Applicable".equalsIgnoreCase(applicant.getInductionStatus()) &&
                            !"N/A".equalsIgnoreCase(applicant.getInductionStatus())) {
                        missing.add("Induction Program (must be COMPLETED/PENDING/Not Applicable, current: "
                                + (applicant.getInductionStatus() != null ? applicant.getInductionStatus() : "PENDING")
                                + ")");
                    }

                    if (!missing.isEmpty()) {
                        String name = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
                        if (name.isEmpty()) {
                            name = applicant.getEmployeeName() != null ? applicant.getEmployeeName() : "Unknown";
                        }
                        errors.add(
                                applicant.getEmpCode() + " (" + name + ") is missing: " + String.join(", ", missing));
                    }
                }
            }
            if (!errors.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message",
                                "Cannot push to On-Roll. The following candidate(s) have not met all prerequisites:\n"
                                        + String.join("\n", errors)));
            }
        }

        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        JavaMailSenderImpl mailSender = null;
        String senderName = "NUTECH HR TEAM";
        String fromEmail = null;

        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        EmailSenderDetails senderDetails = resolveEmailSenderDetails(currentUserId);
        String smtpUsername = senderDetails.getUsername();
        String smtpPassword = senderDetails.getPassword();
        if (senderDetails.getSenderName() != null) {
            senderName = senderDetails.getSenderName();
        }

        // Validate if action requires email sending
        if ("OFFER".equalsIgnoreCase(action)) {
            if (company == null || company.getSmtpHost() == null || company.getSmtpHost().isEmpty()) {
                log.warn(
                        "SMTP host is not configured in Company Profile. Offer letter email will be saved/logged locally via fallback.");
            }
            if (smtpUsername == null || smtpPassword == null) {
                log.warn(
                        "Neither individual office email/password is configured in Employee Profile, nor default SMTP. Email will be saved/logged locally via fallback.");
            }
        }

        // Configure JavaMailSender dynamically if host and credentials are present
        if (company != null && company.getSmtpHost() != null && !company.getSmtpHost().isEmpty() &&
                smtpUsername != null && smtpPassword != null) {

            mailSender = new JavaMailSenderImpl();
            mailSender.setHost(company.getSmtpHost());
            if (company.getSmtpPort() != null) {
                mailSender.setPort(company.getSmtpPort());
            }
            mailSender.setUsername(smtpUsername);
            mailSender.setPassword(smtpPassword);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
                props.put("mail.smtp.ssl.enable", "true");
            }
            props.put("mail.smtp.connectiontimeout", "15000");
            props.put("mail.smtp.timeout", "15000");
            props.put("mail.smtp.writetimeout", "15000");

            fromEmail = smtpUsername;
        }

        final JavaMailSenderImpl finalMailSender = mailSender;
        final CompanyCredential finalCompany = company;
        final String finalFromEmail = fromEmail;
        final String finalSenderName = senderName;

        for (Object rawId : rawIds) {
            Long id = Long.valueOf(rawId.toString());
            employeeRepo.findByIdWithWriteLock(id).ifPresent(applicant -> {
                switch (action.toUpperCase()) {
                    case "CALL":
                        applicant.setCallStatus(statusResolver.get("Sent"));
                        break;
                    case "INTERVIEW":
                        com.autonoma.erp.util.HolidayValidator.validateDate(getStringValue(payload, "interviewDate"));
                        applicant.setInterviewStatus(statusResolver.get("Pending"));

                        // Deactivate previous interviews at the same screening level for this candidate
                        // ONLY IF they are unfinished
                        String targetScreeningLevel = getStringValue(payload, "screeningLevel");
                        String previousInterviewer = null;
                        if (targetScreeningLevel != null && !targetScreeningLevel.trim().isEmpty()) {
                            List<HraApplicantInterview> existingInterviews = applicantInterviewRepo
                                    .findByEmployeeId(id);

                            com.autonoma.erp.modules.platform.common.entity.StatusMaster pendingSM = statusResolver
                                    .get("Pending");
                            com.autonoma.erp.modules.platform.common.entity.StatusMaster waitingProgressSM = statusResolver
                                    .get("WAITING FOR PROGRESS");

                            for (HraApplicantInterview existing : existingInterviews) {
                                if (targetScreeningLevel.equalsIgnoreCase(existing.getScreeningLevel())) {
                                    com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatus = existing
                                            .getInterviewStatus();
                                    boolean isUnfinished = ivStatus == null ||
                                            ivStatus.getId().equals(pendingSM.getId()) ||
                                            ivStatus.getId().equals(waitingProgressSM.getId());

                                    if (isUnfinished) {
                                        if (isInterviewStatusActive(existing.getStatus())) {
                                            previousInterviewer = existing.getInterviewPerson();
                                        }
                                        existing.setStatus(statusResolver.get("INACTIVE").getId().toString());
                                        existing.setIsActive(false);
                                        applicantInterviewRepo.save(existing);

                                        // Soft close old alerts and notify previous interviewer of cancellation
                                        notificationService.softCloseAndNotifyCancelIfAssigned(
                                                existing.getInterviewerId(), existing);
                                    }
                                }
                            }
                        }
                        HraApplicantInterview interview = new HraApplicantInterview();
                        interview.setEmployeeId(id);
                        interview.setScreeningLevel(targetScreeningLevel);
                        interview.setRound(getStringValue(payload, "round"));
                        interview.setInterviewDate(getStringValue(payload, "interviewDate"));
                        interview.setStartTime(getStringValue(payload, "startTime"));
                        interview.setEndTime(getStringValue(payload, "endTime"));

                        Long interviewerId = Long.valueOf(payload.get("interviewerId").toString().trim());
                        EmployeeMaster interviewer = employeeRepo.findById(interviewerId).get();

                        interview.setInterviewerId(interviewerId);
                        interview.setInterviewPerson(interviewer.getEmployeeName());
                        interview.setInterviewStatus(statusResolver.get("Pending"));

                        String currentUser = "admin";
                        try {
                            currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                        } catch (Exception ex) {
                        }
                        interview.setCreatedBy(currentUser);
                        interview.setCreatedDate(new Date());
                        interview.setStatus(statusResolver.get("ACTIVE").getId().toString());
                        interview.setIsActive(true);

                        applicantInterviewRepo.save(interview);

                        // --- Visitor Gate Pass Integration ---
                        try {
                            // 1. Resolve contact & email details from backend DB as the source of truth
                            Optional<EmployeePersonalDetail> personalOpt = personalRepo
                                    .findFirstByEmployeeId(applicant.getId());
                            String candidateEmail = personalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                                    .orElse(applicant.getOfficeMail());

                            EmployeeContact contact = contactRepo.findByEmployeeId(applicant.getId()).orElse(null);
                            String candidateMobile = contact != null ? contact.getMobile() : null;

                            if (candidateEmail == null || candidateEmail.trim().isEmpty()
                                    || !candidateEmail.contains("@")) {
                                throw new IllegalArgumentException("Candidate is missing a valid email address!");
                            }
                            if (candidateMobile == null || candidateMobile.trim().isEmpty()) {
                                throw new IllegalArgumentException("Candidate is missing a valid mobile number!");
                            }

                            // 2. Parse interview Date
                            String interviewDateStr = getStringValue(payload, "interviewDate");
                            if (interviewDateStr == null || interviewDateStr.trim().isEmpty()) {
                                throw new IllegalArgumentException("Interview date is mandatory!");
                            }
                            Date interviewDate = new java.text.SimpleDateFormat("yyyy-MM-dd")
                                    .parse(interviewDateStr.trim());

                            // 3. Split mobile code (e.g. IND1234567890 -> ISD: IND, Mobile: 1234567890)
                            String mobileStr = candidateMobile.trim();
                            String isd = "+91";
                            String localMobile = mobileStr;
                            if (mobileStr.length() > 10) {
                                localMobile = mobileStr.substring(mobileStr.length() - 10);
                                isd = mobileStr.substring(0, mobileStr.length() - 10);
                            }

                            // 4. Duplicate Check: Name + Mobile + Interview Date
                            String applicantName = (applicant.getFirstName() != null ? applicant.getFirstName().trim()
                                    : "")
                                    + " " + (applicant.getLastName() != null ? applicant.getLastName().trim() : "");
                            if (applicantName.trim().isEmpty()) {
                                applicantName = applicant.getEmployeeName();
                            }

                            List<VisitorGatePass> existingPasses = visitorPassRepo.findByNameAndMobileAndDate(
                                    applicantName.trim(), localMobile, interviewDate);

                            if (existingPasses == null || existingPasses.isEmpty()) {
                                // Create new Visitor Pass for the first successfully created assignment
                                VisitorGatePass pass = new VisitorGatePass();
                                pass.setVisitorName(applicantName.trim());
                                pass.setIsdCode(isd);
                                pass.setMobileNo(localMobile);
                                pass.setEmailId(candidateEmail.trim());
                                pass.setAddress(
                                        contact != null && contact.getAddress() != null ? contact.getAddress() : "");
                                pass.setVisitorDate(interviewDate);

                                String startTime = getStringValue(payload, "startTime");
                                String endTime = getStringValue(payload, "endTime");
                                pass.setInTime(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm")
                                        .parse(interviewDateStr + " " + startTime));
                                pass.setOutTime(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm")
                                        .parse(interviewDateStr + " " + endTime));

                                pass.setVisitorType("INTERVIEW PERSON");
                                pass.setPurpose("INTERVIEW / HR PURPOSE");
                                pass.setPersonToMeet(interviewer.getEmployeeName());
                                pass.setNoOfPersons(1);
                                pass.setKit("ALLOWED");

                                // Food allowance check
                                boolean hasFood = false;
                                try {
                                    String[] startParts = startTime.split(":");
                                    String[] endParts = endTime.split(":");
                                    double startHour = Double.parseDouble(startParts[0])
                                            + Double.parseDouble(startParts[1]) / 60.0;
                                    double endHour = Double.parseDouble(endParts[0])
                                            + Double.parseDouble(endParts[1]) / 60.0;
                                    if (startHour < 14.0 && endHour > 12.0) {
                                        hasFood = true;
                                    }
                                } catch (Exception ex) {
                                }

                                if (hasFood) {
                                    pass.setFoodAllowance("YES");
                                    pass.setFoodCategory("CANTEEN");
                                    pass.setNormalFood("VEGETARIAN");
                                } else {
                                    pass.setFoodAllowance("NO");
                                }

                                // Create pass (generates Gate Pass No)
                                VisitorGatePass savedPass = visitorPassService.create(pass);

                                // If emailTemplate is provided, replace placeholders and send synchronously
                                String emailTemplate = getStringValue(payload, "emailTemplate");
                                if (emailTemplate != null && !emailTemplate.trim().isEmpty()) {
                                    String gpNo = savedPass.getGatePassNo() != null ? savedPass.getGatePassNo() : "-";
                                    String name = savedPass.getVisitorName() != null ? savedPass.getVisitorName() : "-";
                                    String mobile = (savedPass.getIsdCode() != null ? savedPass.getIsdCode() : "")
                                            + (savedPass.getMobileNo() != null ? savedPass.getMobileNo() : "-");
                                    String person = savedPass.getPersonToMeet() != null ? savedPass.getPersonToMeet()
                                            : "-";
                                    String purp = savedPass.getPurpose() != null ? savedPass.getPurpose() : "-";

                                    // Build authoritative QR code URL
                                    java.text.SimpleDateFormat qrDateFmt = new java.text.SimpleDateFormat("yyyy-MM-dd");
                                    java.text.SimpleDateFormat qrDateTimeFmt = new java.text.SimpleDateFormat(
                                            "yyyy-MM-dd HH:mm:ss.0");

                                    String qrText = String.format(
                                            "Gate Pass No :%s\nGate Pass Date :%s\nVisitor Name :%s\nVisitor Mobile No:%s\nAddress:%s\nFood Required:%s\nNo Of Persons:%s\nKit:%s\nTo Meet:%s\nPurpose:%s\nIn Time:%s\nOut Time:%s",
                                            gpNo,
                                            savedPass.getVisitorDate() != null
                                                    ? qrDateFmt.format(savedPass.getVisitorDate())
                                                    : "-",
                                            name,
                                            mobile,
                                            savedPass.getAddress() != null ? savedPass.getAddress() : "-",
                                            "YES".equalsIgnoreCase(savedPass.getFoodAllowance()) ? "Yes" : "No",
                                            savedPass.getNoOfPersons() != null ? savedPass.getNoOfPersons() + ".0"
                                                    : "1.0",
                                            savedPass.getKit() != null ? savedPass.getKit() : "NOT ALLOWED",
                                            person,
                                            purp,
                                            savedPass.getInTime() != null ? qrDateTimeFmt.format(savedPass.getInTime())
                                                    : "-",
                                            savedPass.getOutTime() != null
                                                    ? qrDateTimeFmt.format(savedPass.getOutTime())
                                                    : "-");

                                    String encodedQrData = "";
                                    try {
                                        encodedQrData = java.net.URLEncoder
                                                .encode(qrText, java.nio.charset.StandardCharsets.UTF_8.name())
                                                .replace("+", "%20");
                                    } catch (Exception ex) {
                                        encodedQrData = gpNo;
                                    }
                                    String authoritativeQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data="
                                            + encodedQrData;

                                    String emailBody = emailTemplate;

                                    // 1. Replace the entire QR code URL inside the image src attribute
                                    int qrIndex = emailBody.indexOf("https://api.qrserver.com/v1/create-qr-code/");
                                    if (qrIndex != -1) {
                                        int endQuoteIndex = emailBody.indexOf("\"", qrIndex);
                                        if (endQuoteIndex != -1) {
                                            String oldQrUrl = emailBody.substring(qrIndex, endQuoteIndex);
                                            emailBody = emailBody.replace(oldQrUrl, authoritativeQrUrl);
                                        }
                                    }

                                    // 2. Replace unencoded text layout placeholders in HTML body
                                    emailBody = emailBody.replace("__GATE_PASS_NO__", gpNo);
                                    emailBody = emailBody.replace("__VISITOR_NAME__", name);
                                    emailBody = emailBody.replace("__MOBILE_NO__", mobile);
                                    emailBody = emailBody.replace("__PERSON_TO_MEET__", person);
                                    emailBody = emailBody.replace("__PURPOSE__", purp);

                                    boolean sent = emailSendingService.sendEmailWithAttachments(
                                            candidateEmail,
                                            null,
                                            null,
                                            "Your Visitor Gate Pass for Interview",
                                            emailBody,
                                            null,
                                            true);
                                    if (!sent) {
                                        throw new RuntimeException("Failed to send Visitor Pass email via SMTP.");
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("Failed to process Visitor Gate Pass during interview assignment: ", e);
                            throw new RuntimeException(e.getMessage(), e);
                        }

                        // Trigger assignment notification immediately for the newly assigned active
                        // interview
                        notificationService.notifyUserAboutInterviewSafe(
                                interviewer, interview,
                                com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN);
                        notificationService.notifySuperUsersAboutInterview(
                                interview,
                                com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN);
                        break;
                    case "OFFER":
                        // Get candidate email first
                        Optional<EmployeePersonalDetail> personalOpt = personalRepo
                                .findFirstByEmployeeId(applicant.getId());
                        String candidateEmail = personalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                                .orElse(applicant.getOfficeMail());

                        // CASE 4: Invalid recipient email
                        if (candidateEmail == null || candidateEmail.trim().isEmpty()
                                || !candidateEmail.contains("@")) {
                            String errorMsg = "Invalid recipient email address: "
                                    + (candidateEmail == null ? "null" : candidateEmail);
                            log.error(
                                    "[OFFER_LETTER_FAILED] Status: FAILURE, Candidate ID: {}, Offer Letter ID: N/A, Email: {}, Subject: N/A, Attachment: N/A, Reason: {}",
                                    applicant.getId(), candidateEmail, errorMsg);
                            throw new IllegalArgumentException(errorMsg);
                        }

                        com.autonoma.erp.modules.platform.notification.entity.EmailContent template = null;
                        com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = null;

                        try {
                            String token = portalTokenService.generateAndSaveToken(applicant.getId(), "OFFER_LETTER",
                                    applicant.getApplicantCode() != null ? applicant.getApplicantCode()
                                            : applicant.getEmpCode(),
                                    currentUserId);
                            String portalLink = String.format("%s/candidate/onboarding?token=%s", origin, token);

                            String candidateFullName = applicant.getFirstName() != null
                                    ? applicant.getFirstName().trim()
                                    : "";
                            if (candidateFullName.isEmpty()) {
                                candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                                        : "Shortlisted Candidate";
                            }
                            String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                    .getCandidateFirstName(candidateFullName);

                            String positionName = "";

                            if (positionName.isEmpty() && applicant.getDesignationId() != null) {
                                positionName = designationRepo.findById(applicant.getDesignationId())
                                        .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                                        .orElse("");
                            }
                            if (positionName.isEmpty()) {
                                positionName = "Shortlisted Position";
                            }

                            String departmentName = "HR";
                            if (applicant.getDepartmentId() != null) {
                                Optional<Department> deptOpt = departmentRepo.findById(applicant.getDepartmentId());
                                if (deptOpt.isPresent())
                                    departmentName = deptOpt.get().getDepartmentName();
                            }

                            String companyNameStr = (finalCompany != null && finalCompany.getCompanyName() != null)
                                    ? finalCompany.getCompanyName()
                                    : "NUTECH WIND PARTS PVT LTD";
                            String companyAddressStr = finalCompany != null
                                    ? ((finalCompany.getAddress() != null ? finalCompany.getAddress() : "") + ", " +
                                            (finalCompany.getCity() != null ? finalCompany.getCity() : "") + " - " +
                                            (finalCompany.getPincode() != null ? finalCompany.getPincode() : ""))
                                    : "Tamil Nadu, India";

                            Map<String, Object> placeholders = new HashMap<>();
                            placeholders.put("candidateName", candidateFirstName);
                            placeholders.put("candidateFirstName", candidateFirstName);
                            placeholders.put("candidateFullName", candidateFullName);
                            placeholders.put("candidateEmail", candidateEmail);
                            placeholders.put("position", positionName);
                            placeholders.put("designation", positionName);
                            placeholders.put("department", departmentName);
                            placeholders.put("companyName", companyNameStr);
                            placeholders.put("companyAddress", companyAddressStr);
                            placeholders.put("onboardingPortalLink", portalLink);
                            placeholders.put("validityDays", "2");
                            placeholders.put("hrName", finalSenderName);
                            placeholders.put("hrEmail", finalFromEmail != null ? finalFromEmail : "hr@autonomaerp.com");
                            placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
                            placeholders.put("currentYear",
                                    String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));
                            placeholders.put("websiteUrl",
                                    (finalCompany != null && finalCompany.getWebsite() != null)
                                            ? finalCompany.getWebsite()
                                            : "https://www.autonomaerp.com");
                            placeholders.put("locationMapUrl",
                                    (finalCompany != null && finalCompany.getGmaplink() != null)
                                            ? finalCompany.getGmaplink()
                                            : "");

                            template = emailContentService.getTemplateOrThrow("OFFER LETTER");
                            rendered = emailTemplateEngine.render(template, placeholders);

                            if (emailSendingService == null) {
                                throw new RuntimeException("Email sending service is not available.");
                            }

                            // Send Offer Letter email
                            emailSendingService.sendEmailWithAttachments(candidateEmail, null, null,
                                    rendered.getSubject(), rendered.getFullMasterHtml(), null);

                            // Success logging
                            log.info(
                                    "[OFFER_LETTER_SUCCESS] Status: SUCCESS, Candidate ID: {}, Offer Letter ID: N/A, Email: {}, Subject: {}, Attachment status: None/HTML Body email, SMTP response: Sent successfully",
                                    applicant.getId(), candidateEmail, rendered.getSubject());

                            // Update status ONLY after successful processing
                            applicant.setOfferStatus(statusResolver.get("Sent"));

                        } catch (Exception ex) {
                            String subjectStr = (rendered != null) ? rendered.getSubject()
                                    : ((template != null) ? template.getSubject() : "OFFER LETTER");
                            // Log complete exception
                            log.error(
                                    "[OFFER_LETTER_FAILED] Status: FAILURE, Candidate ID: {}, Offer Letter ID: N/A, Email: {}, Subject: {}, Attachment status: None/HTML Body email, SMTP response: {}, Exception: {}",
                                    applicant.getId(), candidateEmail, subjectStr, ex.getMessage(), ex);
                            throw new RuntimeException(
                                    "Unable to send Offer Letter. Please try again. Reason: " + ex.getMessage(), ex);
                        }
                    case "PUSH-ON-ROLL": {
                        applicant.setVerificationStatus(statusResolver.get("Verified"));
                        applicant.setStatus(statusResolver.get("Active"));
                        applicant.setAtsOverallStatus(statusResolver.get("SELECTED"));
                        String nextCode = getNextEmpCode();
                        String originalAtsCode = applicant.getApplicantCode();
                        if (originalAtsCode == null || originalAtsCode.trim().isEmpty()) {
                            originalAtsCode = applicant.getEmpCode();
                        }
                        if (originalAtsCode == null || originalAtsCode.trim().isEmpty()) {
                            originalAtsCode = applicant.getOldEmpCode();
                        }
                        if (originalAtsCode != null && !originalAtsCode.trim().isEmpty()) {
                            applicant.setApplicantCode(originalAtsCode);
                        }
                        applicant.setOldEmpCode(nextCode);
                        applicant.setEmpCode(nextCode);
                        applicant.setDateOfJoining(new Date());

                        // Copy lastName (Father Name in ATS) to fatherHusbandName for Employee Master
                        if (applicant.getLastName() != null && !applicant.getLastName().trim().isEmpty()) {
                            applicant.setFatherHusbandName(applicant.getLastName());
                        }
                        String fullName = (applicant.getFirstName() != null ? applicant.getFirstName().trim() : "")
                                + " " + (applicant.getLastName() != null ? applicant.getLastName().trim() : "");
                        fullName = fullName.trim();
                        if (!fullName.isEmpty()) {
                            applicant.setEmployeeName(fullName);
                        } else if (applicant.getFirstName() != null) {
                            applicant.setEmployeeName(applicant.getFirstName());
                        }

                        // Resolve or initialize Organization & Category/Grade
                        com.autonoma.erp.modules.hr.employee.entity.EmployeeOrganization org = applicant
                                .getOrganization();
                        if (org == null) {
                            org = new com.autonoma.erp.modules.hr.employee.entity.EmployeeOrganization();
                            org.setEmployee(applicant);
                            applicant.setOrganization(org);
                        }
                        if (org.getCreatedBy() == null) {
                            org.setCreatedBy(applicant.getCreatedBy() != null ? applicant.getCreatedBy() : "admin");
                        }
                        if (org.getCreatedDate() == null) {
                            org.setCreatedDate(
                                    applicant.getCreatedDate() != null ? applicant.getCreatedDate() : new Date());
                        }

                        // Category and Grade are initially left blank/null during conversion
                        org.setCategoryId(null);
                        org.setGradeCode(null);

                        // Resolve default geographic parameters from Company Profile
                        String defaultCity = "Chennai";
                        String defaultState = "Tamil Nadu";
                        String defaultCountry = "INDIA";
                        String defaultPincode = "600113";

                        if (company != null) {
                            if (company.getCity() != null && !company.getCity().trim().isEmpty()) {
                                defaultCity = company.getCity().trim();
                            }
                            if (company.getState() != null && !company.getState().trim().isEmpty()) {
                                defaultState = company.getState().trim();
                            }
                            if (company.getCountry() != null && !company.getCountry().trim().isEmpty()) {
                                defaultCountry = company.getCountry().trim();
                            }
                            if (company.getPincode() != null && !company.getPincode().trim().isEmpty()) {
                                defaultPincode = company.getPincode().trim();
                            }
                        }

                        // Retrieve or initialize EmployeeContact
                        EmployeeContact contact = contactRepo.findByEmployeeId(id).orElse(null);
                        if (contact == null) {
                            contact = new EmployeeContact();
                            contact.setEmployeeId(id);
                        }

                        // If mobile is missing, default
                        if (contact.getMobile() == null || contact.getMobile().trim().isEmpty()) {
                            contact.setMobile("0000000000");
                        }

                        // Address field
                        if (contact.getAddress() == null || contact.getAddress().trim().isEmpty()) {
                            contact.setAddress("N/A");
                        }

                        // City
                        if (contact.getCity() == null || contact.getCity().trim().isEmpty()) {
                            if (contact.getCommCity() != null && !contact.getCommCity().trim().isEmpty()) {
                                contact.setCity(contact.getCommCity());
                            } else {
                                contact.setCity(defaultCity);
                            }
                        }

                        // State
                        if (contact.getState() == null || contact.getState().trim().isEmpty()) {
                            if (contact.getCommState() != null && !contact.getCommState().trim().isEmpty()) {
                                contact.setState(contact.getCommState());
                            } else {
                                contact.setState(defaultState);
                            }
                        }

                        // Country
                        if (contact.getCountry() == null || contact.getCountry().trim().isEmpty()) {
                            if (contact.getCommCountry() != null && !contact.getCommCountry().trim().isEmpty()) {
                                contact.setCountry(contact.getCommCountry());
                            } else {
                                contact.setCountry(defaultCountry);
                            }
                        }

                        // Pincode
                        if (contact.getPincode() == null || contact.getPincode().trim().isEmpty()) {
                            if (contact.getCommPincode() != null && !contact.getCommPincode().trim().isEmpty()) {
                                contact.setPincode(contact.getCommPincode());
                            } else {
                                contact.setPincode(defaultPincode);
                            }
                        }

                        // Sync communication address fields if they are blank
                        if (contact.getCommAddress() == null || contact.getCommAddress().trim().isEmpty()) {
                            contact.setCommAddress(contact.getAddress());
                        }
                        if (contact.getCommCity() == null || contact.getCommCity().trim().isEmpty()) {
                            contact.setCommCity(contact.getCity());
                        }
                        if (contact.getCommState() == null || contact.getCommState().trim().isEmpty()) {
                            contact.setCommState(contact.getState());
                        }
                        if (contact.getCommCountry() == null || contact.getCommCountry().trim().isEmpty()) {
                            contact.setCommCountry(contact.getCountry());
                        }
                        if (contact.getCommPincode() == null || contact.getCommPincode().trim().isEmpty()) {
                            contact.setCommPincode(contact.getPincode());
                        }

                        contactRepo.save(contact);
                        break;
                    }
                    case "CANCEL":
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatus = applicant
                                .getStatus();
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster currentAtsOverall = applicant
                                .getAtsOverallStatus();
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster activeSM = statusResolver
                                .get("Active");
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster onRollSM = statusResolver
                                .get("ON-ROLL");
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster selectedSM = statusResolver
                                .get("SELECTED");

                        boolean isAlreadyOnRoll = false;
                        if (currentStatus != null && currentStatus.getId() != null) {
                            if (currentStatus.getId().equals(activeSM.getId()) || (onRollSM != null
                                    && onRollSM.getId() != null && currentStatus.getId().equals(onRollSM.getId()))) {
                                isAlreadyOnRoll = true;
                            }
                        }
                        if (currentAtsOverall != null && currentAtsOverall.getId() != null && selectedSM != null
                                && selectedSM.getId() != null) {
                            if (currentAtsOverall.getId().equals(selectedSM.getId())
                                    && applicant.getEmpCode() != null) {
                                isAlreadyOnRoll = true;
                            }
                        }

                        if (isAlreadyOnRoll) {
                            break; // Candidate is already pushed to On-Roll, block cancellation
                        }

                        com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledSM = statusResolver
                                .get("CANCELLED");
                        applicant.setStatus(cancelledSM);
                        cancelStatusIfInProgress(applicant, "callStatus", cancelledSM);
                        cancelStatusIfInProgress(applicant, "interviewStatus", cancelledSM);
                        cancelStatusIfInProgress(applicant, "offerStatus", cancelledSM);
                        cancelStatusIfInProgress(applicant, "verificationStatus", cancelledSM);
                        cancelStatusIfInProgress(applicant, "atsOverallStatus", cancelledSM);

                        String cancelReason = getStringValue(payload, "cancellationReason");
                        if (cancelReason != null && !cancelReason.trim().isEmpty()) {
                            applicant.setExitReason(cancelReason);
                        }

                        List<HraApplicantInterview> interviews = applicantInterviewRepo.findByEmployeeId(id);
                        if (interviews != null) {
                            for (HraApplicantInterview iv : interviews) {
                                if (iv.getInterviewStatus() != null) {
                                    String isName = iv.getInterviewStatus().getName().toUpperCase().trim();
                                    if ("PENDING".equals(isName) || "WAITING FOR PROGRESS".equals(isName)
                                            || "IN PROGRESS".equals(isName)) {
                                        iv.setInterviewStatus(cancelledSM);
                                    }
                                } else {
                                    iv.setInterviewStatus(cancelledSM);
                                }
                                if (iv.getInterviewResult() != null) {
                                    String irName = iv.getInterviewResult().getName().toUpperCase().trim();
                                    if ("PENDING".equals(irName) || "WAITING FOR PROGRESS".equals(irName)
                                            || "IN PROGRESS".equals(irName)) {
                                        iv.setInterviewResult(cancelledSM);
                                    }
                                } else {
                                    iv.setInterviewResult(cancelledSM);
                                }
                                applicantInterviewRepo.save(iv);
                            }
                        }
                        break;
                    default:
                        break;
                }
                employeeRepo.save(applicant);
            });
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Bulk action executed successfully."));
    }

    @GetMapping("/all-interviews")
    @RequirePagePermission(pageCode = "HA1120", action = "read")
    @Operation(summary = "Get all applicant interviews with candidate info")
    public List<Map<String, Object>> getAllApplicantInterviews() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ex) {
        }

        String filterName = null;
        boolean isSystemAdmin = false;
        Long empId = null;
        if (currentUserId != null) {
            String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
            Optional<UserCredential> userOpt = Optional.empty();
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
                userOpt = userRepo.findByUserId(currentUserId);
            } finally {
                com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
            }
            if (userOpt.isPresent()) {
                UserCredential user = userOpt.get();
                empId = user.getEmpId();
                Integer userLevel = user.getUserLevel();

                // Only bypass the filter if they are a system administrator (userLevel >= 5 or
                // username SUPER BOSS/ADMIN)
                isSystemAdmin = (userLevel != null && userLevel >= 5)
                        || "SUPER BOSS".equalsIgnoreCase(user.getUserId())
                        || "ADMIN".equalsIgnoreCase(user.getUserId());

                if (!isSystemAdmin) {
                    if (empId != null) {
                        Optional<EmployeeMaster> empOpt = employeeRepo.findById(empId);
                        if (empOpt.isPresent()) {
                            filterName = empOpt.get().getEmployeeName();
                        }
                    } else {
                        filterName = "NON_EXISTENT_INTERVIEWER_SHIELD";
                    }
                }
            }
        }

        List<HraApplicantInterview> interviews;
        if (isSystemAdmin) {
            interviews = applicantInterviewRepo.findAll();
        } else if (empId != null) {
            String cleanFilterName = filterName != null ? filterName.trim() : "";
            interviews = applicantInterviewRepo.findByInterviewerIdOrInterviewPersonIgnoreCase(empId, cleanFilterName);
        } else {
            interviews = new ArrayList<>();
        }

        Map<Long, List<HraApplicantInterview>> groupedByEmployee = new HashMap<>();
        for (HraApplicantInterview i : interviews) {
            groupedByEmployee.computeIfAbsent(i.getEmployeeId(), k -> new ArrayList<>()).add(i);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (HraApplicantInterview interview : interviews) {
            // Exclude inactive records (historical ones) for active Interview Process page
            if (interview.getStatus() != null && !isInterviewStatusActive(interview.getStatus())) {
                continue;
            }

            // Candidate Check (EmployeeMaster: must exist, be active, and from ATS)
            Optional<EmployeeMaster> empOpt = employeeRepo.findById(interview.getEmployeeId());
            if (empOpt.isEmpty()) {
                continue;
            }
            EmployeeMaster emp = empOpt.get();

            // Candidate active check
            if (emp.getIsActive() != null && !emp.getIsActive()) {
                continue;
            }

            // Skip non-ATS (direct) employees
            if (!"ATS".equalsIgnoreCase(emp.getFromWhere())) {
                continue;
            }

            com.autonoma.erp.modules.platform.common.entity.StatusMaster dynamicStatus = computeDynamicStatus(interview,
                    groupedByEmployee.get(interview.getEmployeeId()));

            Map<String, Object> map = new HashMap<>();
            map.put("interviewerId", interview.getInterviewerId());
            map.put("id", interview.getId());
            map.put("employeeId", interview.getEmployeeId());
            map.put("screeningLevel", interview.getScreeningLevel());
            map.put("round", interview.getRound());
            map.put("interviewDate", interview.getInterviewDate());
            map.put("startTime", interview.getStartTime());
            map.put("endTime", interview.getEndTime());
            map.put("interviewPerson", interview.getInterviewPerson());
            map.put("interviewStatus", dynamicStatus);
            map.put("interviewResult",
                    interview.getInterviewResult() != null ? interview.getInterviewResult().getName() : "Pending");
            map.put("createdBy", interview.getCreatedBy());
            map.put("createdDate", interview.getCreatedDate());
            com.autonoma.erp.modules.platform.common.entity.StatusMaster stObj = statusResolver
                    .get(interview.getStatus());
            map.put("status", stObj != null ? stObj.getName().toUpperCase()
                    : (interview.getStatus() != null ? interview.getStatus().toUpperCase() : "ACTIVE"));
            map.put("expSalary", interview.getExpSalary());
            map.put("suggestedSalary", interview.getSuggestedSalary());
            map.put("comments", interview.getComments());
            map.put("attachmentRequired", interview.getAttachmentRequired());
            String taskIvPath = atsAttachmentService.getInterviewAttachmentPath(interview.getId());
            map.put("attachmentPath", taskIvPath != null ? taskIvPath : interview.getAttachmentPath());
            map.put("feedbackJson", interview.getFeedbackJson());

            map.put("candidateName",
                    emp.getFirstName() != null ? emp.getFirstName().trim() : "");
            map.put("candidateCode", emp.getApplicantCode() != null ? emp.getApplicantCode() : emp.getEmpCode());
            map.put("atsOverallStatus",
                    emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getName() : "APPLIED");
            map.put("department", emp.getDepartment());
            map.put("candidatePhoto", emp.getEmployeePhotoUpload());
            map.put("applicantDate", emp.getApplicantDate() != null ? emp.getApplicantDate() : emp.getCreatedDate());
            String desigName = "";
            if (emp.getDesignationId() != null) {
                desigName = designationRepo.findById(emp.getDesignationId())
                        .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                        .orElse("");
            }
            map.put("designationName", desigName);
            map.put("positionLookFor", desigName);

            String levelName = "";
            Long empLevelId = emp.getEmpLevelId();
            if (empLevelId == null) {
                empLevelId = employeeRepo.findEmpLevelIdByEmployeeId(emp.getId());
            }
            if (empLevelId != null) {
                levelName = designationLevelRepo.findById(empLevelId)
                        .map(com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel::getLevel)
                        .orElse("");
            }
            if (levelName.isEmpty() && emp.getDesignationId() != null) {
                levelName = designationRepo.findById(emp.getDesignationId())
                        .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getSubCategoryLevel)
                        .orElse("");
            }
            map.put("empLevelId", empLevelId);
            map.put("levelName", levelName);
            map.put("level", levelName);
            result.add(map);
        }
        result.sort((r1, r2) -> ((Long) r2.get("id")).compareTo((Long) r1.get("id")));
        return result;
    }

    @PutMapping("/interviews/{interviewId}")
    @RequirePagePermission(pageCode = "HA1120", action = "write")
    @Operation(summary = "Update applicant interview details and status")
    @Transactional
    public ResponseEntity<?> updateApplicantInterview(@PathVariable Long interviewId,
            @RequestBody Map<String, Object> payload) {
        return applicantInterviewRepo.findById(interviewId).map(interview -> {
            if (!isAuthorizedInterviewer(interview)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access Denied: You are not the assigned interviewer."));
            }

            Long oldInterviewerId = interview.getInterviewerId();
            String oldDate = interview.getInterviewDate();
            String oldStartTime = interview.getStartTime();
            String oldScreeningLevel = interview.getScreeningLevel();
            Boolean oldIsActive = interview.getIsActive();
            String oldStatus = interview.getStatus();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster oldIvStatus = interview.getInterviewStatus();

            boolean wasCompleted = oldIvStatus != null
                    && (statusResolver.isSelected(oldIvStatus) || statusResolver.isHold(oldIvStatus));

            if (statusResolver.isCancelled(oldIvStatus) || "CANCELLED".equalsIgnoreCase(oldStatus)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "This interview round has been cancelled and cannot be evaluated."));
            }

            if (payload.containsKey("feedbackJson")) {
                List<InterviewMaster> matchedCriteria = getMatchedCriteria(interview);
                if (matchedCriteria.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("message",
                            "There are no interview criteria configured for this candidate's department and designation level. Please configure Interview Criteria Master before proceeding."));
                }

                String statusVal = getStringValue(payload, "interviewStatus");
                if (statusVal == null || statusVal.trim().isEmpty() ||
                        (!statusVal.trim().equalsIgnoreCase("SELECTED") &&
                                !statusVal.trim().equalsIgnoreCase("REJECTED") &&
                                !statusVal.trim().equalsIgnoreCase("HOLD") &&
                                !statusVal.trim().equalsIgnoreCase("ON HOLD") &&
                                !statusVal.trim().equalsIgnoreCase("ON_HOLD"))) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Recommendation (Selected / Hold / Rejected) is mandatory."));
                }

                String fbJson = getStringValue(payload, "feedbackJson");
                if (fbJson != null && !fbJson.trim().isEmpty() && !"[]".equals(fbJson.trim())) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(fbJson);
                        if (rootNode.isArray()) {
                            int totalMasterCriteria = 0;
                            int gradedMasterCriteria = 0;
                            for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                                boolean isMaster = node.has("isMasterCriteria")
                                        && node.get("isMasterCriteria").asBoolean();
                                if (isMaster) {
                                    totalMasterCriteria++;
                                    if (node.has("score") && !node.get("score").isNull()) {
                                        String scoreStr = node.get("score").asText().trim();
                                        if (!scoreStr.isEmpty() && !"null".equalsIgnoreCase(scoreStr)) {
                                            gradedMasterCriteria++;
                                        }
                                    }
                                }
                            }
                            if (totalMasterCriteria > 0) {
                                int minRequired = (int) Math.ceil((double) totalMasterCriteria / 3.0);
                                if (gradedMasterCriteria < minRequired) {
                                    return ResponseEntity.badRequest().body(Map.of("message",
                                            "Minimum criteria limit not met. You must grade at least " + minRequired
                                                    + " out of the " + totalMasterCriteria + " criteria questions."));
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Failed to parse feedbackJson for 3:1 rule validation", e);
                    }
                }
            }

            if (payload.containsKey("interviewStatus")) {
                interview.setInterviewStatus(statusResolver.get(getStringValue(payload, "interviewStatus")));
            }
            if (payload.containsKey("interviewResult")) {
                interview.setInterviewResult(statusResolver.get(getStringValue(payload, "interviewResult")));
            }
            if (payload.containsKey("screeningLevel")) {
                interview.setScreeningLevel(getStringValue(payload, "screeningLevel"));
            }
            if (payload.containsKey("round")) {
                interview.setRound(getStringValue(payload, "round"));
            }
            if (payload.containsKey("interviewDate")) {
                String dateStr = getStringValue(payload, "interviewDate");
                com.autonoma.erp.util.HolidayValidator.validateDate(dateStr);
                interview.setInterviewDate(dateStr);
            }
            if (payload.containsKey("startTime")) {
                interview.setStartTime(getStringValue(payload, "startTime"));
            }
            if (payload.containsKey("endTime")) {
                interview.setEndTime(getStringValue(payload, "endTime"));
            }
            if (payload.containsKey("interviewerId")) {
                Long interviewerId = null;
                if (payload.get("interviewerId") != null) {
                    String rawVal = payload.get("interviewerId").toString().trim();
                    if (!rawVal.isEmpty()) {
                        try {
                            interviewerId = Long.valueOf(rawVal);
                        } catch (NumberFormatException e) {
                            return ResponseEntity.badRequest().body("Assigned interviewerId must be a valid number!");
                        }
                    }
                }
                if (interviewerId == null) {
                    return ResponseEntity.badRequest()
                            .body("Assigned interviewerId is mandatory when updating interviewer!");
                }
                Optional<EmployeeMaster> interviewerOpt = employeeRepo.findById(interviewerId);
                if (!interviewerOpt.isPresent()) {
                    return ResponseEntity.badRequest().body("Assigned interviewer employee does not exist!");
                }
                interview.setInterviewerId(interviewerId);
                interview.setInterviewPerson(interviewerOpt.get().getEmployeeName());
            } else if (payload.containsKey("interviewPerson")) {
                return ResponseEntity.badRequest()
                        .body("Assigned interviewerId is mandatory when changing the interviewer!");
            }
            if (payload.containsKey("status")) {
                String rawStatus = getStringValue(payload, "status");
                if (rawStatus != null) {
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster resolvedSM = statusResolver
                            .get(rawStatus);
                    if (resolvedSM != null && resolvedSM.getId() != null) {
                        interview.setStatus(resolvedSM.getId().toString());
                    } else {
                        interview.setStatus(rawStatus);
                    }
                } else {
                    interview.setStatus(null);
                }
            }
            if (payload.containsKey("expSalary")) {
                interview.setExpSalary(getStringValue(payload, "expSalary"));
            }
            if (payload.containsKey("suggestedSalary")) {
                interview.setSuggestedSalary(getStringValue(payload, "suggestedSalary"));
            }
            if (payload.containsKey("comments")) {
                interview.setComments(getStringValue(payload, "comments"));
            }
            if (payload.containsKey("attachmentRequired")) {
                interview.setAttachmentRequired(getStringValue(payload, "attachmentRequired"));
            }
            if (payload.containsKey("attachmentPath")) {
                interview.setAttachmentPath(getStringValue(payload, "attachmentPath"));
            }
            if (payload.containsKey("feedbackJson")) {
                String fbJson = getStringValue(payload, "feedbackJson");
                String rawRound = interview.getRound() != null ? interview.getRound().trim() : "";
                String normRound = normalizeRound(rawRound);
                if ("TECHNICAL".equalsIgnoreCase(normRound) || "HR".equalsIgnoreCase(normRound)) {
                    if (fbJson != null && !fbJson.trim().isEmpty()) {
                        try {
                            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(fbJson);
                            if (rootNode.isArray()) {
                                for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                                    if (node.has("isCustom") && node.get("isCustom").asBoolean()) {
                                        // Block custom question additions for Technical and HR rounds
                                        throw new IllegalArgumentException(
                                                "Custom questions are not allowed for Technical and HR rounds.");
                                    }
                                }
                            }
                        } catch (IllegalArgumentException ex) {
                            throw ex;
                        } catch (Exception e) {
                            log.error("Failed to validate feedbackJson", e);
                        }
                    }
                }
                interview.setFeedbackJson(fbJson);
            }
            applicantInterviewRepo.save(interview);

            String currentIvUser = null;
            try {
                currentIvUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception ignored) {
            }
            atsAttachmentService.syncInterviewFile(interview.getId(), interview.getAttachmentPath(), currentIvUser);

            boolean seqChanged = !java.util.Objects.equals(oldInterviewerId, interview.getInterviewerId())
                    || !java.util.Objects.equals(oldDate, interview.getInterviewDate())
                    || !java.util.Objects.equals(oldStartTime, interview.getStartTime())
                    || !java.util.Objects.equals(oldScreeningLevel, interview.getScreeningLevel())
                    || !java.util.Objects.equals(oldIsActive, interview.getIsActive())
                    || !java.util.Objects.equals(oldStatus, interview.getStatus());

            if (seqChanged) {
                interview.setReminderSent(false);
                interview.setReadyNotificationSent(false);
                applicantInterviewRepo.save(interview);

                boolean isAct = (interview.getIsActive() == null || interview.getIsActive())
                        && isInterviewStatusActive(interview.getStatus());

                if (!java.util.Objects.equals(oldInterviewerId, interview.getInterviewerId())) {
                    // Soft close old alerts and notify old interviewer of cancellation
                    notificationService.softCloseAndNotifyCancelIfAssigned(oldInterviewerId, interview);

                    // Notify new interviewer immediately if the interview is active
                    if (isAct && interview.getInterviewerId() != null) {
                        Optional<EmployeeMaster> newIntvOpt = employeeRepo.findById(interview.getInterviewerId());
                        if (newIntvOpt.isPresent()) {
                            notificationService.notifyUserAboutInterviewSafe(
                                    newIntvOpt.get(), interview,
                                    com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN);
                            notificationService.notifySuperUsersAboutInterview(
                                    interview,
                                    com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN);
                        }
                    }
                } else {
                    // Date/time/sequence changed but interviewer stayed the same
                    notificationService.softCloseInterviewNotifications(interview.getId());

                    // Send rescheduled assignment notification if active
                    if (isAct && interview.getInterviewerId() != null) {
                        Optional<EmployeeMaster> intvOpt = employeeRepo.findById(interview.getInterviewerId());
                        if (intvOpt.isPresent()) {
                            notificationService.notifyUserAboutInterviewSafe(
                                    intvOpt.get(), interview,
                                    com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN);
                            notificationService.notifySuperUsersAboutInterview(
                                    interview,
                                    com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN);
                        }
                    }
                }
            }

            // Check if deactivated
            boolean wasDeactivated = (oldIsActive != null && oldIsActive
                    && (interview.getIsActive() == null || !interview.getIsActive()))
                    || (isInterviewStatusActive(oldStatus) && !isInterviewStatusActive(interview.getStatus()));
            if (wasDeactivated) {
                notificationService.softCloseAndNotifyCancelIfAssigned(interview.getInterviewerId(), interview);
            }

            // Check completion transition
            com.autonoma.erp.modules.platform.common.entity.StatusMaster newIvStatus = interview.getInterviewStatus();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster newIvResult = interview.getInterviewResult();
            boolean isNowSelected = (newIvStatus != null && statusResolver.isSelected(newIvStatus))
                    || (newIvResult != null && statusResolver.isSelected(newIvResult));
            if (!wasCompleted && isNowSelected) {
                checkAndTriggerNextInterviewNotification(interview.getEmployeeId());
            }

            Optional<EmployeeMaster> applicantOpt = employeeRepo.findById(interview.getEmployeeId());
            if (applicantOpt.isPresent()) {
                EmployeeMaster applicant = applicantOpt.get();
                InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(applicant, null);
                if (hasSatisfiedInterviewRequirements(eligibility)) {
                    applicant.setInterviewStatus(statusResolver.get("Completed"));
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatusObj = applicant
                            .getStatus();
                    String currentStatus = currentStatusObj != null ? currentStatusObj.getName() : null;
                    if (currentStatus == null || "APPLIED".equalsIgnoreCase(currentStatus)
                            || "PENDING".equalsIgnoreCase(currentStatus)
                            || "IN PROGRESS".equalsIgnoreCase(currentStatus)
                            || "IN_PROGRESS".equalsIgnoreCase(currentStatus)) {
                        applicant.setStatus(statusResolver.get("Waiting For Progress"));
                    }
                } else {
                    applicant.setInterviewStatus(statusResolver.get("In Progress"));
                }
                employeeRepo.save(applicant);
            }

            return ResponseEntity.ok(interview);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/interviews/{interviewId}")
    @RequirePagePermission(pageCode = "HA1120", action = "delete")
    @Operation(summary = "Delete an interview record")
    @Transactional
    public ResponseEntity<?> deleteApplicantInterview(@PathVariable Long interviewId) {
        return applicantInterviewRepo.findById(interviewId).map(interview -> {
            // Soft close old alerts and notify interviewer of cancellation
            notificationService.softCloseAndNotifyCancelIfAssigned(interview.getInterviewerId(), interview);

            applicantInterviewRepo.delete(interview);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private String normalizeRound(String round) {
        if (round == null)
            return "";
        String r = round.trim().toUpperCase();
        if (r.endsWith(" ROUND")) {
            r = r.substring(0, r.length() - 6).trim();
        } else if (r.endsWith("ROUND")) {
            r = r.substring(0, r.length() - 5).trim();
        }
        return r;
    }

    private List<InterviewMaster> getMatchedCriteria(HraApplicantInterview interview) {
        if (interview == null || interview.getEmployeeId() == null) {
            return new ArrayList<>();
        }

        Optional<EmployeeMaster> empOpt = employeeRepo.findById(interview.getEmployeeId());
        if (empOpt.isEmpty()) {
            return new ArrayList<>();
        }
        EmployeeMaster emp = empOpt.get();

        Long deptId = emp.getDepartmentId();
        if (deptId == null) {
            deptId = employeeRepo.findDepartmentIdByEmployeeId(emp.getId());
        }
        if (deptId == null) {
            return new ArrayList<>();
        }
        String deptCode = deptId.toString().trim();

        String levelCode = "";
        Long empLevelId = emp.getEmpLevelId();
        if (empLevelId == null) {
            empLevelId = employeeRepo.findEmpLevelIdByEmployeeId(emp.getId());
        }
        if (empLevelId != null) {
            levelCode = designationLevelRepo.findById(empLevelId)
                    .map(DesignationLevel::getLevel)
                    .orElse("");
        }

        final String finalDeptCode = deptCode;
        final String finalLevelCode = levelCode.trim();
        final String rawRound = interview.getRound() != null ? interview.getRound().trim() : "";
        final String normRound = normalizeRound(rawRound);

        List<InterviewMaster> allCriteria = interviewMasterRepo.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getStatus()))
                .toList();

        List<InterviewMaster> matched = new ArrayList<>();

        for (InterviewMaster c : allCriteria) {
            String cRawRound = c.getInterviewRound() != null ? c.getInterviewRound().trim() : "";
            String cNormRound = normalizeRound(cRawRound);

            boolean roundMatched = rawRound.equalsIgnoreCase(cRawRound)
                    || (!normRound.isEmpty() && normRound.equalsIgnoreCase(cNormRound))
                    || (!normRound.isEmpty() && normRound.equalsIgnoreCase(cRawRound))
                    || (!cNormRound.isEmpty() && rawRound.equalsIgnoreCase(cNormRound));

            if (!roundMatched) {
                continue;
            }

            boolean deptMatched = false;
            if (c.getDepartmentCodes() != null) {
                for (String code : c.getDepartmentCodes().split(",")) {
                    if (code.trim().equalsIgnoreCase(finalDeptCode)) {
                        deptMatched = true;
                        break;
                    }
                }
            }

            boolean levelMatched = false;
            if (finalLevelCode.isEmpty()) {
                levelMatched = true;
            } else if (c.getLevelCodes() != null) {
                for (String code : c.getLevelCodes().split(",")) {
                    if (code.trim().equalsIgnoreCase(finalLevelCode)) {
                        levelMatched = true;
                        break;
                    }
                }
            }

            if (deptMatched && levelMatched) {
                matched.add(c);
            }
        }
        return matched;
    }

    @GetMapping("/interviews/{interviewId}/criteria")
    @RequirePagePermission(pageCode = "HA1120", action = "read")
    @Operation(summary = "Get matching interview criteria for candidate evaluation")
    public ResponseEntity<?> getInterviewCriteriaForInterview(@PathVariable Long interviewId) {
        return applicantInterviewRepo.findById(interviewId).map(interview -> {
            if (!isAuthorizedInterviewer(interview)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access Denied: You are not the assigned interviewer."));
            }
            List<InterviewMaster> matched = getMatchedCriteria(interview);
            return ResponseEntity.ok(matched);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Helper method to generate next Employee Code starting with EMP-
    private String getNextEmpCode() {
        List<EmployeeMaster> list = employeeRepo.findByEmpCodeStartingWith("EMP-");
        if (list.isEmpty()) {
            return "EMP-001";
        }
        int maxSeq = 0;
        for (EmployeeMaster emp : list) {
            String code = emp.getEmpCode();
            if (code == null)
                continue;
            String[] parts = code.split("-");
            if (parts.length == 2) {
                try {
                    int seq = Integer.parseInt(parts[1]);
                    if (seq > maxSeq) {
                        maxSeq = seq;
                    }
                } catch (NumberFormatException e) {
                    // ignore
                }
            }
        }
        return String.format("EMP-%03d", maxSeq + 1);
    }

    // Utility methods to extract types from payload Map
    private String getStringValue(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) {
            return null;
        }
        String str = val.toString().trim();
        if (str.isEmpty() || "null".equalsIgnoreCase(str)) {
            return null;
        }
        return str;
    }

    private Long getLongValue(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) {
            return null;
        }
        String str = val.toString().trim();
        if (str.isEmpty() || "null".equalsIgnoreCase(str)) {
            return null;
        }
        try {
            return Long.parseLong(str);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void validatePhoneByCountryId(Long countryId, String phone, String fieldLabel) {
        if (countryId == null || phone == null || phone.trim().isEmpty()) {
            return;
        }
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldLabel + " Phone number is required.");
        }

        com.autonoma.erp.modules.master.geography.entity.CountryMaster country = countryRepo.findById(countryId)
                .orElseThrow(() -> new IllegalArgumentException(fieldLabel + " Selected country is invalid."));

        if (!Boolean.TRUE.equals(country.getIsActive())) {
            throw new IllegalArgumentException(fieldLabel + " Selected country is not active.");
        }

        String cleanPhone = phone.trim();
        if (!cleanPhone.matches("^\\d+$")) {
            throw new IllegalArgumentException(fieldLabel + " Phone must contain digits only.");
        }

        int len = cleanPhone.length();
        if (country.getPhoneMinLength() != null && len < country.getPhoneMinLength()) {
            throw new IllegalArgumentException(
                    fieldLabel + " Phone must be at least " + country.getPhoneMinLength() + " digits.");
        }
        if (country.getPhoneMaxLength() != null && len > country.getPhoneMaxLength()) {
            throw new IllegalArgumentException(
                    fieldLabel + " Phone must not exceed " + country.getPhoneMaxLength() + " digits.");
        }
    }

    private void computeAndSetAtsOverallStatus(EmployeeMaster emp) {
        if (emp == null)
            return;
        if (emp.getEmpCode() != null) {
            return; // Already pushed to on-roll, do not overwrite final status
        }
        com.autonoma.erp.modules.platform.common.entity.StatusMaster overall = emp.getAtsOverallStatus();
        if (statusResolver.isRejected(overall) || statusResolver.isCancelled(overall)) {
            return; // Don't overwrite terminal states (Rejected, Cancelled)
        }

        boolean interviewSelected = statusResolver.isSelected(emp.getInterviewStatus());
        boolean offerVerified = statusResolver.isVerified(emp.getOfferStatus());
        boolean verDone = statusResolver.isVerified(emp.getVerificationStatus())
                || statusResolver.isNotApplicable(emp.getVerificationStatus());

        com.autonoma.erp.modules.platform.common.entity.StatusMaster bgStatObj = emp.getBackgroundVerificationStatus();
        String bgStat = bgStatObj != null ? bgStatObj.getName() : null;
        boolean bgvDone = !"YES".equalsIgnoreCase(emp.getQ21_isExperienced()) ||
                "CLEARED".equalsIgnoreCase(bgStat) ||
                "VERIFIED".equalsIgnoreCase(bgStat) ||
                "Verified".equalsIgnoreCase(bgStat) ||
                "Not Applicable".equalsIgnoreCase(bgStat) ||
                "N/A".equalsIgnoreCase(bgStat) ||
                "Not Applicable".equalsIgnoreCase(
                        emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName() : null)
                ||
                "N/A".equalsIgnoreCase(
                        emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName() : null);

        if (interviewSelected && offerVerified && verDone && bgvDone) {
            emp.setAtsOverallStatus(statusResolver.get("Waiting For Progress"));
        } else {
            emp.setAtsOverallStatus(statusResolver.get("Pending"));
        }
    }

    private int getRequiredScreeningLevel(EmployeeMaster emp) {
        int requiredScreeningLevel = 1; // Default fallback to 1 round
        if (emp.getEmpLevelId() != null) {
            Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlByIdOpt = designationLevelRepo
                    .findById(emp.getEmpLevelId());
            if (lvlByIdOpt.isPresent()) {
                return lvlByIdOpt.get().getScreeningLevel();
            }
        }
        if (emp.getDesignationId() != null) {
            Optional<com.autonoma.erp.modules.hr.orgstructure.entity.Designation> desigOpt = designationRepo
                    .findById(emp.getDesignationId());
            if (desigOpt.isPresent()) {
                String subCategoryLevel = desigOpt.get().getSubCategoryLevel();
                if (subCategoryLevel != null && !subCategoryLevel.trim().isEmpty()) {
                    Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlOpt = designationLevelRepo
                            .findByLevel(subCategoryLevel.trim());
                    if (lvlOpt.isPresent()) {
                        requiredScreeningLevel = lvlOpt.get().getScreeningLevel();
                    } else {
                        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(subCategoryLevel);
                        if (m.find()) {
                            requiredScreeningLevel = Integer.parseInt(m.group());
                        }
                    }
                }
            }
        }
        return requiredScreeningLevel;
    }

    private int getAssignedActiveInterviewRoundsCount(EmployeeMaster emp) {
        if (emp == null || emp.getId() == null) {
            return 0;
        }
        List<HraApplicantInterview> rawInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
        if (rawInterviews == null) {
            return 0;
        }
        int count = 0;
        for (HraApplicantInterview iv : rawInterviews) {
            boolean active = (iv.getIsActive() == null || iv.getIsActive())
                    && isInterviewStatusActive(iv.getStatus());
            if (active) {
                count++;
            }
        }
        return count;
    }

    private int getCompletedInterviewRoundsCount(EmployeeMaster emp) {
        if (emp == null || emp.getId() == null) {
            return 0;
        }
        List<HraApplicantInterview> rawInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
        if (rawInterviews == null) {
            return 0;
        }
        int completed = 0;
        for (HraApplicantInterview iv : rawInterviews) {
            boolean active = (iv.getIsActive() == null || iv.getIsActive())
                    && isInterviewStatusActive(iv.getStatus());
            if (active) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusObj = iv.getInterviewStatus();
                String ivStatus = ivStatusObj != null ? ivStatusObj.getName() : null;
                boolean isTerminalStatus = ivStatus != null
                        && !"PENDING".equalsIgnoreCase(ivStatus.trim())
                        && !"WAITING FOR PROGRESS".equalsIgnoreCase(ivStatus.trim())
                        && !"WAITING FOR PROCESS".equalsIgnoreCase(ivStatus.trim());
                boolean hasBeenEvaluated = iv.getFeedbackJson() != null
                        && !iv.getFeedbackJson().trim().isEmpty()
                        && !"[]".equals(iv.getFeedbackJson().trim());
                if (isTerminalStatus || hasBeenEvaluated) {
                    completed++;
                }
            }
        }
        return completed;
    }

    private List<HraApplicantInterview> getSortedActiveInterviews(Long candidateId) {
        List<HraApplicantInterview> list = applicantInterviewRepo.findByEmployeeId(candidateId);
        if (list == null)
            return new ArrayList<>();

        List<HraApplicantInterview> active = new ArrayList<>();
        for (HraApplicantInterview i : list) {
            boolean isAct = (i.getIsActive() == null || i.getIsActive())
                    && isInterviewStatusActive(i.getStatus());
            if (isAct) {
                active.add(i);
            }
        }

        active.sort((a, b) -> {
            try {
                int aVal = Integer.parseInt(a.getScreeningLevel());
                int bVal = Integer.parseInt(b.getScreeningLevel());
                if (aVal != bVal) {
                    return Integer.compare(aVal, bVal);
                }
            } catch (Exception e) {
                String aStr = a.getScreeningLevel() != null ? a.getScreeningLevel().trim() : "";
                String bStr = b.getScreeningLevel() != null ? b.getScreeningLevel().trim() : "";
                if (!aStr.equalsIgnoreCase(bStr)) {
                    return aStr.compareToIgnoreCase(bStr);
                }
            }

            // Date
            String aDate = a.getInterviewDate() != null ? a.getInterviewDate().trim() : "";
            String bDate = b.getInterviewDate() != null ? b.getInterviewDate().trim() : "";
            if (!aDate.equalsIgnoreCase(bDate)) {
                return aDate.compareTo(bDate);
            }

            // Time
            String aTime = a.getStartTime() != null ? a.getStartTime().trim() : "";
            String bTime = b.getStartTime() != null ? b.getStartTime().trim() : "";
            if (!aTime.equalsIgnoreCase(bTime)) {
                return aTime.compareTo(bTime);
            }

            // ID
            Long aId = a.getId() != null ? a.getId() : 0L;
            Long bId = b.getId() != null ? b.getId() : 0L;
            return aId.compareTo(bId);
        });

        return active;
    }

    private void checkAndTriggerNextInterviewNotification(Long candidateId) {
        try {
            List<HraApplicantInterview> sorted = getSortedActiveInterviews(candidateId);
            for (HraApplicantInterview interview : sorted) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster status = interview.getInterviewStatus();
                String statusName = status != null ? status.getName() : "Pending";

                // If this is the first uncompleted (pending) interview in the sorted active
                // sequence
                if ("Pending".equalsIgnoreCase(statusName) || "Waiting For Progress".equalsIgnoreCase(statusName)) {
                    if (interview.getReadyNotificationSent() == null || !interview.getReadyNotificationSent()) {
                        if (interview.getInterviewerId() != null) {
                            Optional<EmployeeMaster> intOpt = employeeRepo.findById(interview.getInterviewerId());
                            if (intOpt.isPresent()) {
                                notificationService.notifyUserAboutInterviewSafe(
                                        intOpt.get(), interview,
                                        com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_READY);
                                notificationService.notifySuperUsersAboutInterview(
                                        interview,
                                        com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_READY);
                                interview.setReadyNotificationSent(true);
                                applicantInterviewRepo.save(interview);
                            }
                        }
                    }
                    break; // Only notify the FIRST active pending round in sequence!
                }
            }
        } catch (Exception e) {
            log.error("Failed to check and trigger next interview notification", e);
        }
    }

    private InterviewEligibilitySummary getInterviewEligibilitySummary(EmployeeMaster emp,
            Integer cachedRequiredRounds) {
        if (emp == null || emp.getId() == null) {
            return new InterviewEligibilitySummary(1, 0, 0, false);
        }
        int required = cachedRequiredRounds != null ? cachedRequiredRounds : getRequiredScreeningLevel(emp);
        List<HraApplicantInterview> rawInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
        int assigned = getAssignedActiveInterviewRoundsCount(rawInterviews);
        int completed = getCompletedInterviewRoundsCount(rawInterviews);
        boolean eligible = computeFinalResolutionEligibility(rawInterviews);
        return new InterviewEligibilitySummary(required, assigned, completed, eligible);
    }

    private boolean computeFinalResolutionEligibility(List<HraApplicantInterview> rawInterviews) {
        if (rawInterviews == null || rawInterviews.isEmpty()) {
            return false;
        }

        List<HraApplicantInterview> active = new ArrayList<>();
        for (HraApplicantInterview iv : rawInterviews) {
            boolean isAct = (iv.getIsActive() == null || iv.getIsActive())
                    && isInterviewStatusActive(iv.getStatus());
            if (isAct) {
                active.add(iv);
            }
        }

        if (active.isEmpty()) {
            return false;
        }

        active.sort((a, b) -> {
            try {
                int aVal = Integer.parseInt(a.getScreeningLevel());
                int bVal = Integer.parseInt(b.getScreeningLevel());
                if (aVal != bVal) {
                    return Integer.compare(aVal, bVal);
                }
            } catch (Exception e) {
                String aStr = a.getScreeningLevel() != null ? a.getScreeningLevel().trim() : "";
                String bStr = b.getScreeningLevel() != null ? b.getScreeningLevel().trim() : "";
                if (!aStr.equalsIgnoreCase(bStr)) {
                    return aStr.compareToIgnoreCase(bStr);
                }
            }
            Long aId = a.getId() != null ? a.getId() : 0L;
            Long bId = b.getId() != null ? b.getId() : 0L;
            return aId.compareTo(bId);
        });

        for (int i = 0; i < active.size(); i++) {
            HraApplicantInterview iv = active.get(i);
            com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusObj = iv.getInterviewStatus();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster ivResultObj = iv.getInterviewResult();
            String statusName = ivStatusObj != null ? ivStatusObj.getName().trim() : "";
            String resultName = ivResultObj != null ? ivResultObj.getName().trim() : "";

            boolean isRejected = (ivStatusObj != null && statusResolver.isRejected(ivStatusObj))
                    || (ivResultObj != null && statusResolver.isRejected(ivResultObj))
                    || "REJECTED".equalsIgnoreCase(statusName)
                    || "REJECTED".equalsIgnoreCase(resultName);

            if (isRejected) {
                return true;
            }

            boolean isHold = (ivStatusObj != null && statusResolver.isHold(ivStatusObj))
                    || (ivResultObj != null && statusResolver.isHold(ivResultObj))
                    || "HOLD".equalsIgnoreCase(statusName)
                    || "ON HOLD".equalsIgnoreCase(statusName)
                    || "HOLD".equalsIgnoreCase(resultName)
                    || "ON HOLD".equalsIgnoreCase(resultName);

            if (isHold) {
                return true;
            }

            boolean isSelected = (ivStatusObj != null && statusResolver.isSelected(ivStatusObj))
                    || (ivResultObj != null && statusResolver.isSelected(ivResultObj))
                    || "SELECTED".equalsIgnoreCase(statusName)
                    || "SELECTED".equalsIgnoreCase(resultName)
                    || (ivStatusObj != null && statusResolver.isCompleted(ivStatusObj))
                    || "COMPLETED".equalsIgnoreCase(statusName);

            if (isSelected) {
                boolean hasNextAssignedRound = (i + 1 < active.size());
                if (hasNextAssignedRound) {
                    continue; // Next assigned round exists in sequence -> continue checking
                } else {
                    return true; // Selected in final assigned round -> Final Resolution accessible
                }
            }

            // Current round is un-evaluated (PENDING / WAITING FOR PROGRESS)
            return false;
        }

        return false;
    }

    private boolean hasSatisfiedInterviewRequirements(InterviewEligibilitySummary summary) {
        return summary != null && summary.isEligible();
    }

    private boolean checkAllActiveRoundsCompleted(EmployeeMaster emp) {
        InterviewEligibilitySummary summary = getInterviewEligibilitySummary(emp, null);
        return hasSatisfiedInterviewRequirements(summary);
    }

    private Date getDateValue(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null || val.toString().isEmpty())
            return null;
        try {
            String str = val.toString();
            if (str.contains("T")) {
                str = str.substring(0, str.indexOf("T"));
            }
            return new SimpleDateFormat("yyyy-MM-dd").parse(str);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal getBigDecimalValue(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null || val.toString().isEmpty())
            return null;
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private void savePersonalDetailsFromPayload(EmployeeMaster applicant, Map<String, Object> payload) {
        String genderVal = getStringValue(payload, "gender");
        String titleVal = getStringValue(payload, "title");
        if (titleVal == null || titleVal.isBlank()) {
            titleVal = applicant.getTitle();
        }
        if ((genderVal == null || genderVal.isBlank()) && titleVal != null && !titleVal.isBlank()) {
            String t = titleVal.trim().replace(".", "").toUpperCase();
            if ("MR".equals(t))
                genderVal = "MALE";
            else if ("MISS".equals(t) || "MRS".equals(t) || "MS".equals(t))
                genderVal = "FEMALE";
            else if ("MX".equals(t))
                genderVal = "TRANS";
        }
        String religionVal = getStringValue(payload, "religion");
        if ((religionVal == null || religionVal.isBlank()) && payload.get("religionSelect") != null) {
            String selectVal = payload.get("religionSelect").toString();
            if ("Other".equalsIgnoreCase(selectVal) && payload.get("religion_other") != null
                    && !payload.get("religion_other").toString().isBlank()) {
                religionVal = payload.get("religion_other").toString();
            } else {
                religionVal = selectVal;
            }
        }
        String maritalVal = getStringValue(payload, "q6_marital_status");

        if ((genderVal != null && !genderVal.isBlank()) ||
                (religionVal != null && !religionVal.isBlank()) ||
                (maritalVal != null && !maritalVal.isBlank())) {

            EmployeePersonalDetail personalDetail = personalRepo.findFirstByEmployeeId(applicant.getId()).orElse(null);
            if (personalDetail == null) {
                personalDetail = new EmployeePersonalDetail();
                personalDetail.setEmployeeId(applicant.getId());
            }
            if (genderVal != null && !genderVal.isBlank()) {
                personalDetail.setGender(genderVal);
            }
            if (religionVal != null && !religionVal.isBlank()) {
                personalDetail.setReligion(religionVal);
            }
            if (maritalVal != null && !maritalVal.isBlank()) {
                personalDetail.setMaritalStatus(maritalVal);
            }
            personalRepo.save(personalDetail);
        }
    }

    private Map<String, Object> mapStatusMaster(StatusMaster status) {
        if (status == null) {
            StatusMaster pending = statusResolver.get("Pending");
            if (pending != null) {
                return Map.of("id", pending.getId(), "name", pending.getName());
            }
            return Map.of("id", 13L, "name", "Pending");
        }
        return Map.of("id", status.getId(), "name", status.getName());
    }

    private Map<String, Object> mapEmployeeToSummaryMap(EmployeeMaster emp, String aadharNo, String emailId) {
        InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(emp, null);
        return mapEmployeeToSummaryMap(emp, aadharNo, emailId, eligibility);
    }

    private Map<String, Object> mapEmployeeToSummaryMap(EmployeeMaster emp, String aadharNo, String emailId,
            InterviewEligibilitySummary eligibility) {
        Map<String, Object> map = new HashMap<>();
        List<HraApplicantInterview> empInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
        HraApplicantInterview scheduledIv = getScheduledOrCurrentInterview(empInterviews);
        if (scheduledIv != null) {
            map.put("scheduledInterviewDate", scheduledIv.getInterviewDate());
            map.put("scheduledInterviewTime", scheduledIv.getStartTime());
        } else if (empInterviews != null && !empInterviews.isEmpty()) {
            HraApplicantInterview latestIv = null;
            for (HraApplicantInterview iv : empInterviews) {
                boolean isActive = (iv.getIsActive() == null || iv.getIsActive())
                        && isInterviewStatusActive(iv.getStatus());
                if (isActive) {
                    if (latestIv == null
                            || (iv.getId() != null && latestIv.getId() != null && iv.getId() > latestIv.getId())) {
                        latestIv = iv;
                    }
                }
            }
            if (latestIv != null && latestIv.getInterviewDate() != null) {
                map.put("scheduledInterviewDate", latestIv.getInterviewDate());
                map.put("scheduledInterviewTime", latestIv.getStartTime());
            } else {
                map.put("scheduledInterviewDate", emp.getCallLetterDate());
                map.put("scheduledInterviewTime", emp.getCallLetterTime());
            }
        } else {
            map.put("scheduledInterviewDate", emp.getCallLetterDate());
            map.put("scheduledInterviewTime", emp.getCallLetterTime());
        }
        map.put("id", emp.getId());
        map.put("applicantCode", emp.getApplicantCode());
        map.put("empCode", emp.getEmpCode());
        String atsDisplayCode = emp.getApplicantCode() != null && !emp.getApplicantCode().trim().isEmpty()
                ? emp.getApplicantCode()
                : emp.getEmpCode();
        map.put("enRolledNo", atsDisplayCode);
        map.put("displayCode", atsDisplayCode);
        map.put("applicantDate", emp.getApplicantDate() != null ? emp.getApplicantDate() : emp.getCreatedDate());
        map.put("designationId", emp.getDesignationId());
        map.put("positionLookFor",
                emp.getDesignationId() != null ? emp.getDesignationId().toString() : "");
        map.put("title", emp.getTitle());
        map.put("firstName", emp.getFirstName());
        map.put("lastName", emp.getLastName());
        map.put("departmentId", emp.getDepartmentId());
        map.put("department", emp.getDepartmentId() != null ? emp.getDepartmentId().toString() : "");
        map.put("aadharNo", aadharNo);
        map.put("emailId", emailId != null ? emailId : "");

        map.put("callStatus", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");
        map.put("call", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");

        String candStatus = emp.getStatus() != null ? emp.getStatus().getName() : "Pending";
        String candStatusUpper = candStatus != null ? candStatus.toUpperCase().trim() : "";
        com.autonoma.erp.modules.platform.common.entity.StatusMaster empIvSM = emp.getInterviewStatus();
        String interviewStatus = "Pending";

        if (statusResolver.isSelected(empIvSM) || statusResolver.isCompleted(empIvSM)) {
            interviewStatus = empIvSM.getName();
        } else if (statusResolver.isRejected(empIvSM)) {
            interviewStatus = "Rejected";
        } else if (statusResolver.isHold(empIvSM)) {
            interviewStatus = "Hold";
        } else if ("SELECTED".equals(candStatusUpper) || "OFFERED".equals(candStatusUpper)
                || "ON-ROLL".equals(candStatusUpper)) {
            interviewStatus = "SELECTED";
        } else if ("REJECTED".equals(candStatusUpper)) {
            interviewStatus = "Rejected";
        } else if ("CANCELLED".equals(candStatusUpper)) {
            if (statusResolver.isSelected(empIvSM) || statusResolver.isCompleted(empIvSM)) {
                interviewStatus = empIvSM.getName();
            } else {
                interviewStatus = "CANCELLED";
            }
        } else if (eligibility != null
                && (eligibility.getAssignedActiveRounds() > 0 || eligibility.getCompletedActiveRounds() > 0)) {
            interviewStatus = "In Progress";
        } else {
            interviewStatus = "Pending";
        }
        map.put("interviewStatus", interviewStatus);
        map.put("interview", interviewStatus);

        String offerStatus = emp.getOfferStatus() != null ? emp.getOfferStatus().getName() : "Pending";
        map.put("offerStatus", offerStatus);
        map.put("offer", offerStatus);

        map.put("atsOverallStatus",
                emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getName() : "Pending");

        if (candStatus == null || "APPLIED".equalsIgnoreCase(candStatus) || "PENDING".equalsIgnoreCase(candStatus)) {
            if (eligibility != null && eligibility.isEligible()) {
                candStatus = "Waiting For Progress";
            }
        }
        map.put("status", candStatus);

        map.put("q21_is_experienced", emp.getQ21_isExperienced());
        map.put("q21_isExperienced", emp.getQ21_isExperienced());

        String verificationStatus = emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName()
                : "Pending";
        if ("YES".equalsIgnoreCase(emp.getQ21_isExperienced())) {
            if (verificationStatus == null || verificationStatus.isEmpty()
                    || "N/A".equalsIgnoreCase(verificationStatus)
                    || "Not Applicable".equalsIgnoreCase(verificationStatus)) {
                verificationStatus = "Pending";
            }
        } else {
            verificationStatus = "Not Applicable";
        }
        map.put("verificationStatus", verificationStatus);
        map.put("verification", verificationStatus);

        com.autonoma.erp.modules.platform.common.entity.StatusMaster rejectedSM2 = statusResolver.get("REJECTED");
        com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledSM2 = statusResolver.get("CANCELLED");
        com.autonoma.erp.modules.platform.common.entity.StatusMaster onRollSM2 = statusResolver.get("ON-ROLL");
        com.autonoma.erp.modules.platform.common.entity.StatusMaster selectedSM2 = statusResolver.get("SELECTED");

        map.put("statusId", emp.getStatus() != null ? emp.getStatus().getId() : null);
        map.put("atsOverallStatusId", emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getId() : null);
        map.put("interviewStatusId", emp.getInterviewStatus() != null ? emp.getInterviewStatus().getId() : null);
        map.put("callStatusId", emp.getCallStatus() != null ? emp.getCallStatus().getId() : null);
        map.put("offerStatusId", emp.getOfferStatus() != null ? emp.getOfferStatus().getId() : null);
        map.put("verificationStatusId",
                emp.getVerificationStatus() != null ? emp.getVerificationStatus().getId() : null);

        map.put("rejectedStatusId", rejectedSM2 != null ? rejectedSM2.getId() : null);
        map.put("cancelledStatusId", cancelledSM2 != null ? cancelledSM2.getId() : null);
        map.put("onRollStatusId", onRollSM2 != null ? onRollSM2.getId() : null);
        map.put("selectedStatusId", selectedSM2 != null ? selectedSM2.getId() : null);

        boolean isRejectedBool2 = (emp.getStatus() != null && rejectedSM2 != null
                && emp.getStatus().getId().equals(rejectedSM2.getId()))
                || (emp.getAtsOverallStatus() != null && rejectedSM2 != null
                        && emp.getAtsOverallStatus().getId().equals(rejectedSM2.getId()))
                || "REJECTED".equalsIgnoreCase(candStatusUpper);
        boolean isCancelledBool2 = (emp.getStatus() != null && cancelledSM2 != null
                && emp.getStatus().getId().equals(cancelledSM2.getId()))
                || (emp.getAtsOverallStatus() != null && cancelledSM2 != null
                        && emp.getAtsOverallStatus().getId().equals(cancelledSM2.getId()))
                || "CANCELLED".equalsIgnoreCase(candStatusUpper);
        boolean isAlreadyOnRollBool2 = (emp.getStatus() != null && onRollSM2 != null
                && emp.getStatus().getId().equals(onRollSM2.getId()))
                || (emp.getAtsOverallStatus() != null && onRollSM2 != null
                        && emp.getAtsOverallStatus().getId().equals(onRollSM2.getId()))
                || "ON-ROLL".equalsIgnoreCase(candStatusUpper);

        map.put("isRejected", isRejectedBool2);
        map.put("isCancelled", isCancelledBool2);
        map.put("isAlreadyOnRoll", isAlreadyOnRollBool2);

        // Call letter dates – needed by Assign Interview dialog to pre-fill Interview
        // Date
        map.put("callLetterDate", emp.getCallLetterDate());
        map.put("callLetterTime", emp.getCallLetterTime());

        // Resolve Level and Screen Level from Designation Master
        String resolvedLevel = null;
        int resolvedScreenLevel = 0;
        if (eligibility != null) {
            resolvedScreenLevel = eligibility.getRequiredScreeningLevel();
        }
        if (emp.getEmpLevelId() != null) {
            Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlByIdOpt = designationLevelRepo
                    .findById(emp.getEmpLevelId());
            if (lvlByIdOpt.isPresent()) {
                resolvedLevel = lvlByIdOpt.get().getLevel();
                if (resolvedScreenLevel == 0) {
                    resolvedScreenLevel = lvlByIdOpt.get().getScreeningLevel();
                }
            }
        }
        if (resolvedLevel == null && emp.getDesignationId() != null) {
            Optional<com.autonoma.erp.modules.hr.orgstructure.entity.Designation> desigOpt = designationRepo
                    .findById(emp.getDesignationId());
            if (desigOpt.isPresent()) {
                String subCatLvl = desigOpt.get().getSubCategoryLevel();
                if (subCatLvl != null && !subCatLvl.trim().isEmpty()) {
                    Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlOpt = designationLevelRepo
                            .findByLevel(subCatLvl.trim());
                    if (lvlOpt.isPresent()) {
                        resolvedLevel = lvlOpt.get().getLevel();
                        if (resolvedScreenLevel == 0) {
                            resolvedScreenLevel = lvlOpt.get().getScreeningLevel();
                        }
                    }
                }
            }
        }
        map.put("level", resolvedLevel);
        map.put("screenLevel", resolvedScreenLevel > 0 ? String.valueOf(resolvedScreenLevel) : null);

        // Document verification statuses – needed for doc review workspace
        map.put("photoVerifiedStatus", mapStatusMaster(emp.getPhotoVerifiedStatus()));
        map.put("photoRejectReason", emp.getPhotoRejectReason());
        map.put("resumeVerifiedStatus", mapStatusMaster(emp.getResumeVerifiedStatus()));
        map.put("resumeRejectReason", emp.getResumeRejectReason());
        map.put("payslipVerifiedStatus", mapStatusMaster(emp.getPayslipVerifiedStatus()));
        map.put("payslipRejectReason", emp.getPayslipRejectReason());
        map.put("aadharVerifiedStatus", mapStatusMaster(emp.getAadharVerifiedStatus()));
        map.put("aadharRejectReason", emp.getAadharRejectReason());

        // Assessment – Reporting Manager & Vertical Head emails (needed for Initiate
        // Reference Verification)
        map.put("q42_hr_mgr_email", emp.getQ42_hrMgrEmail());
        map.put("q42_rep_mgr_email", emp.getQ42_hrMgrEmail());
        map.put("q45_vert_head_email", emp.getQ45_vertHeadEmail());

        return map;
    }

    private void cancelStatusIfInProgress(EmployeeMaster emp, String fieldName,
            com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledSM) {
        com.autonoma.erp.modules.platform.common.entity.StatusMaster currentSM = null;
        if ("callStatus".equalsIgnoreCase(fieldName))
            currentSM = emp.getCallStatus();
        else if ("interviewStatus".equalsIgnoreCase(fieldName))
            currentSM = emp.getInterviewStatus();
        else if ("offerStatus".equalsIgnoreCase(fieldName))
            currentSM = emp.getOfferStatus();
        else if ("verificationStatus".equalsIgnoreCase(fieldName))
            currentSM = emp.getVerificationStatus();
        else if ("atsOverallStatus".equalsIgnoreCase(fieldName))
            currentSM = emp.getAtsOverallStatus();

        if (currentSM == null || currentSM.getId() == null) {
            return; // Unknown/null status -> Preserve
        }

        boolean shouldCancel = false;

        if ("callStatus".equalsIgnoreCase(fieldName)) {
            shouldCancel = statusResolver.isPending(currentSM)
                    || statusResolver.isSent(currentSM)
                    || statusResolver.isResent(currentSM)
                    || statusResolver.isToBeVerified(currentSM);
        } else if ("interviewStatus".equalsIgnoreCase(fieldName)) {
            shouldCancel = statusResolver.isPending(currentSM)
                    || statusResolver.isInProgress(currentSM)
                    || statusResolver.isWaitingForProgress(currentSM)
                    || statusResolver.isWaitingForProcess(currentSM);
        } else if ("offerStatus".equalsIgnoreCase(fieldName)) {
            shouldCancel = statusResolver.isPending(currentSM)
                    || statusResolver.isSent(currentSM)
                    || statusResolver.isResent(currentSM)
                    || statusResolver.isToBeVerified(currentSM);
        } else if ("verificationStatus".equalsIgnoreCase(fieldName)) {
            shouldCancel = statusResolver.isSent(currentSM)
                    || statusResolver.isResent(currentSM)
                    || statusResolver.isPartiallyVerified(currentSM)
                    || statusResolver.isToBeVerified(currentSM);
        } else if ("atsOverallStatus".equalsIgnoreCase(fieldName)) {
            shouldCancel = true; // Overall status is always cancelled
        }

        if (shouldCancel) {
            setEmpStatusField(emp, fieldName, cancelledSM);
        }
    }

    private void setEmpStatusField(EmployeeMaster emp, String fieldName,
            com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledSM) {
        if ("callStatus".equalsIgnoreCase(fieldName))
            emp.setCallStatus(cancelledSM);
        else if ("interviewStatus".equalsIgnoreCase(fieldName))
            emp.setInterviewStatus(cancelledSM);
        else if ("offerStatus".equalsIgnoreCase(fieldName))
            emp.setOfferStatus(cancelledSM);
        else if ("verificationStatus".equalsIgnoreCase(fieldName))
            emp.setVerificationStatus(cancelledSM);
        else if ("atsOverallStatus".equalsIgnoreCase(fieldName))
            emp.setAtsOverallStatus(cancelledSM);
    }

    private Map<String, Object> mapEmployeeToFullMap(EmployeeMaster emp) {
        InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(emp, null);
        return mapEmployeeToFullMap(emp, eligibility);
    }

    private String getOriginalFileNamesForPaths(String filePath,
            com.autonoma.erp.modules.platform.files.service.FileService fileService) {
        if (filePath == null || filePath.trim().isEmpty()) {
            return null;
        }
        if (filePath.contains(",")) {
            String[] parts = filePath.split(",");
            List<String> names = new ArrayList<>();
            for (String part : parts) {
                if (part != null && !part.trim().isEmpty()) {
                    String name = fileService.getOriginalFileNameForPath(part.trim());
                    if (name != null) {
                        names.add(name);
                    } else {
                        String trimmed = part.trim();
                        names.add(trimmed.substring(Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\')) + 1));
                    }
                }
            }
            return String.join(",", names);
        } else {
            return fileService.getOriginalFileNameForPath(filePath);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapEmployeeToFullMap(EmployeeMaster emp, InterviewEligibilitySummary eligibility) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", emp.getId());
        map.put("applicantCode", emp.getApplicantCode());
        map.put("empCode", emp.getEmpCode());
        String atsDisplayCode = emp.getApplicantCode() != null && !emp.getApplicantCode().trim().isEmpty()
                ? emp.getApplicantCode()
                : emp.getEmpCode();
        map.put("enRolledNo", atsDisplayCode);
        map.put("displayCode", atsDisplayCode);
        map.put("applicantDate", emp.getApplicantDate() != null ? emp.getApplicantDate() : emp.getCreatedDate());
        if (emp.getDesignationId() != null) {
            designationRepo.findById(emp.getDesignationId()).ifPresent(d -> {
                map.put("positionLookFor", d.getDesignationName());
            });
        } else {
            map.put("positionLookFor", "");
        }
        map.put("title", emp.getTitle());
        map.put("firstName", emp.getFirstName());
        map.put("lastName", emp.getLastName());
        String candidateFullName = emp.getFirstName() != null ? emp.getFirstName().trim() : "";
        if (candidateFullName.isEmpty()) {
            candidateFullName = emp.getEmployeeName() != null ? emp.getEmployeeName() : "";
        }
        map.put("employeeName", candidateFullName);
        map.put("department", emp.getDepartmentId() != null ? emp.getDepartmentId().toString() : "");
        map.put("departmentId", emp.getDepartmentId());
        if (emp.getDepartmentId() != null) {
            departmentRepo.findById(emp.getDepartmentId()).ifPresent(d -> {
                map.put("departmentName", d.getDepartmentName());
            });
        }
        map.put("callStatus", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");
        map.put("call", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");
        List<HraApplicantInterview> rawIVs = applicantInterviewRepo.findByEmployeeId(emp.getId());
        List<HraApplicantInterview> activeIVs = new ArrayList<>();
        if (rawIVs != null) {
            for (HraApplicantInterview iv : rawIVs) {
                boolean active = (iv.getIsActive() == null || iv.getIsActive())
                        && (iv.getStatus() == null || !"INACTIVE".equalsIgnoreCase(iv.getStatus().trim()));
                if (active) {
                    activeIVs.add(iv);
                }
            }
        }

        String candStatus = emp.getStatus() != null ? emp.getStatus().getName() : "Pending";
        String candStatusUpper = candStatus != null ? candStatus.toUpperCase().trim() : "";
        String dbInterviewStatus = emp.getInterviewStatus() != null ? emp.getInterviewStatus().getName() : "Pending";
        String interviewStatus = dbInterviewStatus;
        if ("PENDING".equalsIgnoreCase(dbInterviewStatus) || "APPLIED".equalsIgnoreCase(dbInterviewStatus)) {
            if (eligibility != null) {
                if (eligibility.isEligible() || eligibility.getAssignedActiveRounds() > 0
                        || eligibility.getCompletedActiveRounds() > 0) {
                    interviewStatus = "In Progress";
                }
            }
        }

        map.put("interviewStatus", interviewStatus);
        map.put("interview", interviewStatus);

        String offerStatus = emp.getOfferStatus() != null ? emp.getOfferStatus().getName() : "Pending";
        map.put("offerStatus", offerStatus);
        map.put("offer", offerStatus);

        map.put("atsOverallStatus",
                emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getName() : "Pending");
        map.put("backgroundVerificationStatus",
                emp.getBackgroundVerificationStatus() != null ? emp.getBackgroundVerificationStatus().getName()
                        : "Pending");
        map.put("isRehired", emp.getIsRehired());
        map.put("previousEmpCode", emp.getPreviousEmpCode());
        map.put("archivedDate", emp.getArchivedDate());
        String verificationStatus = emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName()
                : "Pending";
        if ("YES".equalsIgnoreCase(emp.getQ21_isExperienced())) {
            if (verificationStatus == null || verificationStatus.isEmpty()
                    || "N/A".equalsIgnoreCase(verificationStatus)
                    || "Not Applicable".equalsIgnoreCase(verificationStatus)) {
                verificationStatus = "Pending";
            }
        } else {
            verificationStatus = "Not Applicable";
        }
        map.put("verificationStatus", verificationStatus);
        map.put("verification", verificationStatus);
        candStatus = emp.getStatus() != null ? emp.getStatus().getName() : "Pending";
        if (candStatus == null || "APPLIED".equalsIgnoreCase(candStatus) || "PENDING".equalsIgnoreCase(candStatus)
                || "IN PROGRESS".equalsIgnoreCase(candStatus) || "IN_PROGRESS".equalsIgnoreCase(candStatus)) {
            if (eligibility != null && eligibility.isEligible()) {
                candStatus = "Waiting For Progress";
            }
        }
        map.put("status", candStatus);
        map.put("statusId", emp.getStatus() != null ? emp.getStatus().getId() : null);
        map.put("interviewStatusId", emp.getInterviewStatus() != null ? emp.getInterviewStatus().getId() : null);
        map.put("offerStatusId", emp.getOfferStatus() != null ? emp.getOfferStatus().getId() : null);
        map.put("verificationStatusId",
                emp.getVerificationStatus() != null ? emp.getVerificationStatus().getId() : null);
        map.put("atsOverallStatusId", emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getId() : null);
        com.autonoma.erp.modules.platform.common.entity.StatusMaster rejectedSMFull = statusResolver.get("Rejected");
        map.put("rejectedStatusId", rejectedSMFull != null ? rejectedSMFull.getId() : null);
        map.put("age", emp.getAge());
        map.put("payslipPath", emp.getPayslipPath());
        map.put("payslipName", fileService.getOriginalFileNameForPath(emp.getPayslipPath()));
        map.put("resumePath", emp.getResumePath());
        map.put("resumeName", fileService.getOriginalFileNameForPath(emp.getResumePath()));
        map.put("aadharPath", emp.getAadharPath());
        map.put("aadharName", fileService.getOriginalFileNameForPath(emp.getAadharPath()));
        map.put("employeePhotoUpload", emp.getEmployeePhotoUpload());
        map.put("photoVerifiedStatus", mapStatusMaster(emp.getPhotoVerifiedStatus()));
        map.put("resumeVerifiedStatus", mapStatusMaster(emp.getResumeVerifiedStatus()));
        map.put("payslipVerifiedStatus", mapStatusMaster(emp.getPayslipVerifiedStatus()));
        map.put("aadharVerifiedStatus", mapStatusMaster(emp.getAadharVerifiedStatus()));
        map.put("photoRejectReason", emp.getPhotoRejectReason());
        map.put("resumeRejectReason", emp.getResumeRejectReason());
        map.put("payslipRejectReason", emp.getPayslipRejectReason());
        map.put("aadharRejectReason", emp.getAadharRejectReason());
        map.put("referMode", emp.getReferMode());
        map.put("refMode", emp.getReferMode());
        map.put("refComments", emp.getReferenceComments());
        map.put("referenceComments", emp.getReferenceComments());
        map.put("bgvRemark", emp.getBgvRemark());
        map.put("finalFeedback", emp.getFinalFeedback());
        map.put("callLetterDate", emp.getCallLetterDate());
        map.put("callLetterTime", emp.getCallLetterTime());
        map.put("empLevelId", emp.getEmpLevelId());
        map.put("employeeTypeId", emp.getEmployeeTypeId());
        map.put("dateOfJoining", emp.getDateOfJoining());
        map.put("nextSalaryHikeMonth", emp.getNextSalaryHikeMonth());
        map.put("minimumAmount", emp.getMinimumAmount());
        map.put("maximumAmount", emp.getMaximumAmount());
        map.put("designationId", emp.getDesignationId());
        map.put("selfAssessmentStatus",
                emp.getSelfAssessmentStatus() != null ? emp.getSelfAssessmentStatus().getName() : "DRAFT");
        map.put("onboardingStarted", emp.getOnboardingStarted() != null && emp.getOnboardingStarted());

        // Resolve Level and Screen Level: empLevelId (direct FK) takes priority
        String resolvedLevel = null;
        int resolvedScreenLevel = 0;
        if (eligibility != null) {
            resolvedScreenLevel = eligibility.getRequiredScreeningLevel();
        }
        if (emp.getEmpLevelId() != null) {
            Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlByIdOpt = designationLevelRepo
                    .findById(emp.getEmpLevelId());
            if (lvlByIdOpt.isPresent()) {
                resolvedLevel = lvlByIdOpt.get().getLevel();
                if (resolvedScreenLevel == 0) {
                    resolvedScreenLevel = lvlByIdOpt.get().getScreeningLevel();
                }
            }
        }
        // Fallback: resolve through designation subCategoryLevel
        if (resolvedLevel == null && emp.getDesignationId() != null) {
            Optional<com.autonoma.erp.modules.hr.orgstructure.entity.Designation> desigLvlOpt = designationRepo
                    .findById(emp.getDesignationId());
            if (desigLvlOpt.isPresent()) {
                String subCatLvl = desigLvlOpt.get().getSubCategoryLevel();
                if (subCatLvl != null && !subCatLvl.trim().isEmpty()) {
                    Optional<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> lvlOpt = designationLevelRepo
                            .findByLevel(subCatLvl.trim());
                    if (lvlOpt.isPresent()) {
                        resolvedLevel = lvlOpt.get().getLevel();
                        if (resolvedScreenLevel == 0) {
                            resolvedScreenLevel = lvlOpt.get().getScreeningLevel();
                        }
                    }
                }
            }
        }
        map.put("level", resolvedLevel);
        map.put("screenLevel", resolvedScreenLevel > 0 ? String.valueOf(resolvedScreenLevel) : null);

        // Tab 8 Self Assessment fields
        map.put("q1_native", emp.getQ1_native());
        map.put("q2_present_address", emp.getQ2_presentAddress());
        map.put("q3_permanent_address", emp.getQ3_permanentAddress());
        map.put("same_as_current_address", emp.getSameAsCurrentAddress());
        map.put("q4_father_occupation", emp.getQ4_fatherOccupation());
        map.put("q5_mother_occupation", emp.getQ5_motherOccupation());
        map.put("q6_marital_status", emp.getQ6_maritalStatus());
        map.put("q7_spouse_occupation", emp.getQ7_spouseOccupation());
        map.put("q8_children", emp.getQ8_children());
        map.put("q9_has_relatives", emp.getQ9_hasRelativesInCompany());
        map.put("q10_relatives_details", emp.getQ10_relativesDetails());
        map.put("q11_siblings_occupations", emp.getQ11_siblingsOccupations());
        map.put("q12_has_two_wheeler", emp.getQ12_hasTwoWheeler());
        map.put("q13_has_android_phone", emp.getQ13_hasAndroidPhone());
        map.put("q14_knows_car_driving", emp.getQ14_knowsCarDriving());
        map.put("q15_willing_to_travel", emp.getQ15_willingToTravel());
        map.put("q16_covid_vaccination", emp.getQ16_covidVaccination());
        map.put("q47_has_insurance", emp.getQ47_hasInsurance());
        map.put("q48_insurance_number", emp.getQ48_insuranceNumber());
        map.put("q17_positive_points", emp.getQ17_positivePoints());
        map.put("q18_negative_points", emp.getQ18_negativePoints());
        map.put("q19_life_goals", emp.getQ19_lifeGoals());
        map.put("q20_willing_rotational_shifts", emp.getQ20_willingRotationalShifts());
        map.put("q20_improvement_suggestions", emp.getQ20_improvementSuggestions());
        map.put("q21_is_experienced", emp.getQ21_isExperienced());
        map.put("q22_total_experience", emp.getQ22_totalExperience());
        map.put("q23_core_experience", emp.getQ23_coreExperience());
        map.put("q24_prev_net_salary", emp.getQ24_prevNetSalary());
        map.put("q25_prev_gross_salary", emp.getQ25_prevGrossSalary());
        map.put("q26_expected_net_salary", emp.getQ26_expectedNetSalary());
        map.put("q27_expected_gross_salary", emp.getQ27_expectedGrossSalary());
        map.put("q28_pf_higher_pension", emp.getQ28_pfHigherPension());
        map.put("q29_pf_deduction_amount", emp.getQ29_pfDeductionAmount());
        map.put("q30_alternative_department", emp.getQ30_alternativeDepartment());
        map.put("q31_prev_location", emp.getQ31_prevLocation());
        map.put("q32_prev_shift", emp.getQ32_prevShift());
        map.put("q33_reason_for_leaving", emp.getQ33_reasonForLeaving());
        map.put("q34_notice_period", emp.getQ34_noticePeriod());
        map.put("q35_prev_dept_position", emp.getQ35_prevDeptPosition());
        map.put("q36_prev_dept_count", emp.getQ36_prevDeptCount());
        map.put("q38_handle_mistake", emp.getQ38_handleMistake());
        map.put("q39_handle_opinion_difference", emp.getQ39_handleOpinionDifference());
        map.put("q40_computer_self_rating", emp.getQ40_computerSelfRating());
        map.put("q41_hr_mgr_name", emp.getQ41_hrMgrName());
        map.put("q42_hr_mgr_email", emp.getQ42_hrMgrEmail());
        map.put("q43_hr_mgr_phone", emp.getQ43_hrMgrPhone());
        map.put("q43_hr_mgr_country_id", emp.getMgrCountryId());
        map.put("q44_vert_head_name", emp.getQ44_vertHeadName());
        map.put("q45_vert_head_email", emp.getQ45_vertHeadEmail());
        map.put("q46_vert_head_phone", emp.getQ46_vertHeadPhone());
        map.put("q46_vert_head_country_id", emp.getVertHeadCountryId());

        // Fetch personal detail
        Optional<EmployeePersonalDetail> personalOpt = personalRepo.findFirstByEmployeeId(emp.getId());
        String fetchedGender = personalOpt.map(EmployeePersonalDetail::getGender).orElse(null);
        if (fetchedGender == null || fetchedGender.isBlank()) {
            String t = emp.getTitle() != null ? emp.getTitle().trim().replace(".", "").toUpperCase() : "";
            if ("MR".equals(t))
                fetchedGender = "MALE";
            else if ("MISS".equals(t) || "MRS".equals(t) || "MS".equals(t))
                fetchedGender = "FEMALE";
            else if ("MX".equals(t))
                fetchedGender = "TRANS";
        }
        map.put("gender", fetchedGender);

        if (personalOpt.isPresent()) {
            EmployeePersonalDetail p = personalOpt.get();
            map.put("maritalStatus", p.getMaritalStatus());
            map.put("panNo", p.getPanNumber());
            map.put("birthDate", p.getBirthDate());
            map.put("nationality", p.getNationality());
            map.put("religion", p.getReligion());
            map.put("aadharNo", p.getAadharNumber());
        }

        // Fetch contact
        Optional<EmployeeContact> contactOpt = contactRepo.findByEmployeeId(emp.getId());
        if (contactOpt.isPresent()) {
            EmployeeContact c = contactOpt.get();
            map.put("mobileNo", c.getMobile());
            map.put("emailId", personalOpt.map(EmployeePersonalDetail::getPersonalEmail).orElse(null));
            map.put("officePhoneNo", c.getAlternateMobile());
            map.put("phoneNo", c.getAlternateMobile());
            map.put("permAdd1", c.getAddress());
            map.put("city", c.getCity());
            map.put("state", c.getState());
            map.put("pincode", c.getPincode());
            map.put("persAdd1", c.getCommAddress());
            map.put("contactAddress1", c.getCommAddress());
            map.put("contactCity", c.getCommCity());
            map.put("contactMobile", c.getMobile());
            map.put("contactPhone", c.getAlternateMobile());
        }

        // Fetch job profile for salary components
        Optional<EmployeeJobProfile> jpOpt = jobProfileRepo.findByEmployeeId(emp.getId());
        if (jpOpt.isPresent()) {
            EmployeeJobProfile jp = jpOpt.get();
            Map<String, Object> dynMap = new HashMap<>();
            if (jp.getDynamicComponents() != null && !jp.getDynamicComponents().trim().isEmpty()) {
                try {
                    dynMap = new com.fasterxml.jackson.databind.ObjectMapper().readValue(jp.getDynamicComponents(),
                            Map.class);
                } catch (Exception e) {
                    // ignore
                }
            }
            map.put("basic", dynMap.get("BASIC") != null ? dynMap.get("BASIC") : dynMap.get("basic"));
            map.put("da", dynMap.get("DA") != null ? dynMap.get("DA") : dynMap.get("da"));
            map.put("hra", dynMap.get("HRA") != null ? dynMap.get("HRA") : dynMap.get("hra"));
            map.put("splAllowance", dynMap.get("SPECIAL_ALLOWANCE") != null ? dynMap.get("SPECIAL_ALLOWANCE")
                    : dynMap.get("splAllowance"));
            map.put("perfIncentive",
                    dynMap.get("performance_incentive") != null ? dynMap.get("performance_incentive")
                            : (dynMap.get("PERFORMANCE_INCENTIVE") != null ? dynMap.get("PERFORMANCE_INCENTIVE")
                                    : dynMap.get("perfIncentive")));
            map.put("statutoryBonus", dynMap.get("statutoryBonus") != null ? dynMap.get("statutoryBonus")
                    : (dynMap.get("STATUTORY_BONUS") != null ? dynMap.get("STATUTORY_BONUS") : ""));
            map.put("canteenAllowance", dynMap.get("canteenAllowance") != null ? dynMap.get("canteenAllowance")
                    : dynMap.get("canteen_allowance"));
            map.put("attendanceAllow1", dynMap.get("attendanceAllow1") != null ? dynMap.get("attendanceAllow1")
                    : (dynMap.get("ATTENDANCE_ALLOW_1") != null ? dynMap.get("ATTENDANCE_ALLOW_1") : ""));
            map.put("attendanceAllow2", dynMap.get("attendanceAllow2") != null ? dynMap.get("attendanceAllow2")
                    : (dynMap.get("ATTENDANCE_ALLOW_2") != null ? dynMap.get("ATTENDANCE_ALLOW_2") : ""));
            map.put("pfEmployee", dynMap.get("PF_EMP") != null ? dynMap.get("PF_EMP") : dynMap.get("pfEmployee"));
            map.put("esiEmployee", dynMap.get("ESI_EMP") != null ? dynMap.get("ESI_EMP") : dynMap.get("esiEmployee"));
            map.put("profTax", dynMap.get("PT") != null ? dynMap.get("PT") : dynMap.get("profTax"));
            map.put("grossSalary", dynMap.get("GROSS") != null ? dynMap.get("GROSS") : dynMap.get("grossSalary"));
            map.put("netSalary", dynMap.get("NET_SALARY") != null ? dynMap.get("NET_SALARY") : dynMap.get("netSalary"));
            map.put("ctc", dynMap.get("monthlyCtc") != null ? dynMap.get("monthlyCtc") : dynMap.get("ctc"));
            map.put("uniform",
                    dynMap.get("uniformAllowance") != null ? dynMap.get("uniformAllowance") : dynMap.get("uniform"));
            map.put("shoes", dynMap.get("shoeAllowance") != null ? dynMap.get("shoeAllowance") : dynMap.get("shoes"));
            map.put("mobileCug", dynMap.get("mobileAllowanceCug") != null ? dynMap.get("mobileAllowanceCug")
                    : dynMap.get("mobileCug"));
            map.put("pfEmployer",
                    dynMap.get("employerPf") != null ? dynMap.get("employerPf") : dynMap.get("pfEmployer"));
            map.put("esiEmployer",
                    dynMap.get("employerEsi") != null ? dynMap.get("employerEsi") : dynMap.get("esiEmployer"));
            map.put("canteenDeduct",
                    dynMap.get("canteenDeduction") != null ? dynMap.get("canteenDeduction")
                            : (dynMap.get("CANTEEN_DEDUCTION") != null ? dynMap.get("CANTEEN_DEDUCTION")
                                    : dynMap.get("canteenDeduct")));
            map.put("otAmount", dynMap.get("otAmount") != null ? dynMap.get("otAmount")
                    : (dynMap.get("OT_AMOUNT") != null ? dynMap.get("OT_AMOUNT") : ""));
            map.put("petrolAllow", dynMap.get("petrolAllow") != null ? dynMap.get("petrolAllow")
                    : (dynMap.get("PETROL_ALLOW") != null ? dynMap.get("PETROL_ALLOW") : ""));
            map.put("appraisalPer", dynMap.get("appraisalPer") != null ? dynMap.get("appraisalPer")
                    : (dynMap.get("APPRAISAL_PER") != null ? dynMap.get("APPRAISAL_PER") : ""));
            map.put("otherAllow", dynMap.get("otherAllow") != null ? dynMap.get("otherAllow")
                    : (dynMap.get("OTHER_ALLOW") != null ? dynMap.get("OTHER_ALLOW") : ""));
            map.put("labourWelFundEmp", dynMap.get("labourWelFundEmp") != null ? dynMap.get("labourWelFundEmp")
                    : (dynMap.get("LABOUR_WEL_FUND_EMP") != null ? dynMap.get("LABOUR_WEL_FUND_EMP") : ""));
            map.put("labourWelFundEmployer", dynMap.get("labourWelFundEmployer") != null
                    ? dynMap.get("labourWelFundEmployer")
                    : (dynMap.get("LABOUR_WEL_FUND_EMPLOYER") != null ? dynMap.get("LABOUR_WEL_FUND_EMPLOYER") : ""));
            map.put("otherDeduct", dynMap.get("otherDeduct") != null ? dynMap.get("otherDeduct")
                    : (dynMap.get("OTHER_DEDUCT") != null ? dynMap.get("OTHER_DEDUCT") : ""));
            map.put("suspenseDeduct", dynMap.get("suspenseDeduct") != null ? dynMap.get("suspenseDeduct")
                    : (dynMap.get("SUSPENSE_DEDUCT") != null ? dynMap.get("SUSPENSE_DEDUCT") : ""));
            map.put("providentFund", jp.getProvidentFund());
            map.put("esiAllowed", jp.getEsiAllowed());
            map.put("professionalTax", jp.getProfessionalTax());
        }

        // Fetch onboarding attachments from HR_ATTACHMENT_PATH
        List<Map<String, Object>> atsDocs = atsAttachmentService.getOfferDocuments(emp.getId());

        java.util.function.BiFunction<String, String, String> getAtsPaths = (docTypePrefix, key) -> {
            String targetDocType = docTypePrefix + (key != null ? key.trim() : "Unknown");
            List<String> paths = new ArrayList<>();
            for (Map<String, Object> doc : atsDocs) {
                String dt = (String) doc.get("DOC_TYPE");
                String path = (String) doc.get("PATH");
                if (dt != null && path != null && dt.trim().equalsIgnoreCase(targetDocType.trim())) {
                    paths.add(path.trim());
                }
            }
            if (paths.isEmpty()) {
                return null;
            }
            return String.join(",", paths);
        };

        // Fetch lists: education, experience, kyc, skills
        List<EmployeeEducation> eduList = educationRepo.findByEmployeeId(emp.getId());
        List<Map<String, Object>> eduFrontend = new ArrayList<>();
        for (EmployeeEducation edu : eduList) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", edu.getId());
            m.put("education", edu.getEducation());
            m.put("institutionName", edu.getInstitutionName());
            m.put("type", edu.getType());
            m.put("yearOfPassing", edu.getYearOfPassing());
            m.put("grade", edu.getPercentageGrade());

            String atsPath = getAtsPaths.apply("EDUCATION_", edu.getEducation());
            String filePath = atsPath != null ? atsPath : edu.getCertificateFile();
            m.put("filePath", filePath);
            m.put("fileName", getOriginalFileNamesForPaths(filePath, fileService));
            m.put("fromWhere", edu.getFromWhere() != null ? edu.getFromWhere() : "ATS");

            m.put("university", edu.getUniversity());
            m.put("stream", edu.getStream());
            eduFrontend.add(m);
        }
        map.put("education", eduFrontend);

        List<EmployeeExperience> expList = experienceRepo.findByEmployeeId(emp.getId());
        List<Map<String, Object>> expFrontend = new ArrayList<>();
        for (EmployeeExperience exp : expList) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", exp.getId());
            m.put("companyName", exp.getCompanyName());
            m.put("location", exp.getLocation());
            m.put("fromDate", exp.getFromDate());
            m.put("toDate", exp.getToDate());
            double months = exp.getTotalExperienceMonths() != null ? exp.getTotalExperienceMonths() : 0.0;
            double years = months / 12.0;
            String expYearsVal = (years % 1 == 0) ? String.valueOf((int) years)
                    : String.format(java.util.Locale.US, "%.1f", years);
            m.put("expYears", exp.getTotalExperienceMonths() != null ? expYearsVal : "");

            String atsPath = getAtsPaths.apply("EXPERIENCE_", exp.getCompanyName());
            String filePath = atsPath != null ? atsPath : exp.getDocuments();
            m.put("filePath", filePath);
            m.put("fileName", getOriginalFileNamesForPaths(filePath, fileService));
            m.put("fromWhere", exp.getFromWhere() != null ? exp.getFromWhere() : "ATS");

            expFrontend.add(m);
        }
        map.put("experience", expFrontend);

        List<EmployeeKycDocument> kycList = kycDocumentRepo.findByEmployeeId(emp.getId());
        List<Map<String, Object>> kycFrontend = new ArrayList<>();
        for (EmployeeKycDocument kyc : kycList) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", kyc.getId());
            m.put("seqNo", kyc.getSeqNo());
            m.put("docName", kyc.getDocumentName());
            m.put("docNo", kyc.getDocumentNumber());

            String atsPath = getAtsPaths.apply("", kyc.getDocumentName());
            if (atsPath == null || atsPath.trim().isEmpty()) {
                atsPath = getAtsPaths.apply("KYC_", kyc.getDocumentName());
            }
            if (atsPath == null || atsPath.trim().isEmpty()) {
                atsPath = getAtsPaths.apply("KYC", "");
            }
            String filePath = (atsPath != null && !atsPath.trim().isEmpty())
                    ? atsPath
                    : (kyc.getAttachment() != null && !kyc.getAttachment().trim().isEmpty()
                            ? kyc.getAttachment()
                            : kyc.getFileName());
            m.put("filePath", filePath);
            m.put("fileName", getOriginalFileNamesForPaths(filePath, fileService));
            m.put("fromWhere", kyc.getFromWhere() != null ? kyc.getFromWhere() : "ATS");

            kycFrontend.add(m);
        }
        map.put("kyc", kycFrontend);

        List<EmployeeActivity> actList = activityRepo.findByEmployeeId(emp.getId());
        List<Map<String, Object>> actFrontend = new ArrayList<>();
        for (EmployeeActivity act : actList) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", act.getId());
            m.put("activityDetails", act.getActivityDetails());

            String atsPath = getAtsPaths.apply("SKILL_", act.getActivityDetails());
            String filePath = atsPath != null ? atsPath : act.getFilePath();
            m.put("filePath", filePath);
            m.put("fileName", fileService.getOriginalFileNameForPath(filePath));
            m.put("fromWhere", act.getFromWhere() != null ? act.getFromWhere() : "ATS");

            actFrontend.add(m);
        }
        map.put("skills", actFrontend);
        map.put("currentStep", emp.getCurrentStep() != null ? emp.getCurrentStep() : 1);
        map.put("lastDraftSavedDate", emp.getLastDraftSavedDate() != null
                ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(emp.getLastDraftSavedDate())
                : "");
        map.put("cancellationReason", emp.getExitReason() != null ? emp.getExitReason() : "");
        map.put("exitReason", emp.getExitReason() != null ? emp.getExitReason() : "");

        return map;
    }

    @SuppressWarnings("unchecked")
    private void saveOrUpdateApplicantDetails(EmployeeMaster emp, Map<String, Object> payload) {
        String firstName = getStringValue(payload, "firstName");
        String lastName = getStringValue(payload, "lastName");
        emp.setFirstName(firstName);
        emp.setLastName(lastName);

        String empName = getStringValue(payload, "employeeName");
        if (empName == null || empName.trim().isEmpty()) {
            empName = (firstName != null ? firstName.trim() : "") + " " + (lastName != null ? lastName.trim() : "");
            empName = empName.trim();
        }
        emp.setEmployeeName(empName.isEmpty() ? null : empName);
        emp.setFatherHusbandName(lastName);
        emp.setTitle(getStringValue(payload, "title"));

        String emailId = getStringValue(payload, "emailId");
        if (emailId != null && !emailId.trim().isEmpty()) {
            emp.setOfficeMail(emailId.trim());
        }

        String deptStr = getStringValue(payload, "department");
        if (deptStr == null || deptStr.isEmpty()) {
            deptStr = getStringValue(payload, "departmentId");
        }
        if (deptStr != null && !deptStr.isEmpty()) {
            try {
                emp.setDepartmentId(Long.parseLong(deptStr));
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        Object desigIdObj = payload.get("designationId");
        if (desigIdObj == null || desigIdObj.toString().isEmpty()) {
            desigIdObj = payload.get("designation");
        }
        if (desigIdObj != null && !desigIdObj.toString().isEmpty()) {
            try {
                emp.setDesignationId(Long.parseLong(desigIdObj.toString()));
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        String posLook = getStringValue(payload, "positionLookFor");
        if (posLook != null && !posLook.isEmpty()) {
            if (emp.getDesignationId() == null) {
                designationRepo.findAll().stream()
                        .filter(d -> posLook.equalsIgnoreCase(d.getDesignationName())
                                || posLook.equals(d.getId().toString()))
                        .findFirst()
                        .ifPresent(d -> emp.setDesignationId(d.getId()));
            }
        }

        // Initialize Organization CREATED_BY / CREATED_DATE
        com.autonoma.erp.modules.hr.employee.entity.EmployeeOrganization org = emp.getOrganization();
        if (org.getCreatedBy() == null) {
            org.setCreatedBy(emp.getCreatedBy() != null ? emp.getCreatedBy() : "admin");
        }
        if (org.getCreatedDate() == null) {
            org.setCreatedDate(emp.getCreatedDate() != null ? emp.getCreatedDate() : new java.util.Date());
        }

        // Auto-resolve empLevelId in the controller context to prevent repository calls
        // during flush/persist callback
        if (emp.getDesignationId() != null) {
            designationRepo.findById(emp.getDesignationId()).ifPresent(desig -> {
                String subCatLvl = desig.getSubCategoryLevel();
                if (subCatLvl != null && !subCatLvl.trim().isEmpty()) {
                    designationLevelRepo.findByLevel(subCatLvl.trim()).ifPresent(lvl -> {
                        emp.setEmpLevelId(lvl.getRowId());
                    });
                }
            });
        }
        emp.setReferMode(getStringValue(payload, "refMode"));
        emp.setReferenceComments(getStringValue(payload, "refComments"));

        Date appDate = getDateValue(payload, "applicantDate");
        if (appDate != null) {
            emp.setApplicantDate(appDate);
            if (emp.getId() == null) {
                emp.setCreatedDate(appDate);
            }
        }

        Object ageObj = payload.get("age");
        if (ageObj != null) {
            try {
                emp.setAge(Integer.parseInt(ageObj.toString()));
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        boolean isNew = emp.getId() == null;

        if (isNew || payload.containsKey("callStatus") || payload.containsKey("call")) {
            String callVal = getStringValue(payload, "callStatus");
            if (callVal == null)
                callVal = getStringValue(payload, "call");
            if (callVal != null) {
                emp.setCallStatus(statusResolver.get(callVal));
            }
        }

        if (isNew || payload.containsKey("interviewStatus") || payload.containsKey("interview")) {
            String intVal = getStringValue(payload, "interviewStatus");
            if (intVal == null)
                intVal = getStringValue(payload, "interview");
            if (intVal != null) {
                emp.setInterviewStatus(statusResolver.get(intVal));
            }
        }

        if (isNew || payload.containsKey("offerStatus") || payload.containsKey("offer")) {
            String offerVal = getStringValue(payload, "offerStatus");
            if (offerVal == null)
                offerVal = getStringValue(payload, "offer");
            if (offerVal != null) {
                emp.setOfferStatus(statusResolver.get(offerVal));
            }
        }

        boolean isExpChanged = payload.containsKey("q21_is_experienced");
        boolean hasVerStatusPayload = payload.containsKey("verificationStatus") || payload.containsKey("verification");
        if (isNew || hasVerStatusPayload || isExpChanged) {
            String isExp = getStringValue(payload, "q21_is_experienced");
            if (isExp == null) {
                isExp = emp.getQ21_isExperienced();
            }
            String verificationStatus = getStringValue(payload, "verificationStatus");
            if (verificationStatus == null) {
                verificationStatus = getStringValue(payload, "verification");
            }
            if (verificationStatus == null) {
                verificationStatus = emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName() : null;
            }

            boolean isRejected = (emp.getStatus() != null && "Rejected".equalsIgnoreCase(emp.getStatus().getName()))
                    || (emp.getInterviewStatus() != null
                            && "Rejected".equalsIgnoreCase(emp.getInterviewStatus().getName()))
                    || (emp.getAtsOverallStatus() != null
                            && "Rejected".equalsIgnoreCase(emp.getAtsOverallStatus().getName()))
                    || "Rejected".equalsIgnoreCase(verificationStatus);

            boolean isCancelled = (emp.getStatus() != null && "CANCELLED".equalsIgnoreCase(emp.getStatus().getName()))
                    || (emp.getInterviewStatus() != null
                            && "CANCELLED".equalsIgnoreCase(emp.getInterviewStatus().getName()))
                    || (emp.getAtsOverallStatus() != null
                            && "CANCELLED".equalsIgnoreCase(emp.getAtsOverallStatus().getName()))
                    || "CANCELLED".equalsIgnoreCase(verificationStatus);

            if (isRejected) {
                verificationStatus = "Rejected";
            } else if (isCancelled) {
                String oldVerVal = emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName() : null;
                boolean isFinished = oldVerVal != null
                        && ("VERIFIED".equalsIgnoreCase(oldVerVal) || "COMPLETED".equalsIgnoreCase(oldVerVal)
                                || "Not Applicable".equalsIgnoreCase(oldVerVal) || "N/A".equalsIgnoreCase(oldVerVal));
                if (!isFinished) {
                    verificationStatus = "CANCELLED";
                } else {
                    verificationStatus = oldVerVal;
                }
            } else {
                if ("YES".equalsIgnoreCase(isExp)) {
                    if (verificationStatus == null || verificationStatus.isEmpty()
                            || "N/A".equalsIgnoreCase(verificationStatus)
                            || "Not Applicable".equalsIgnoreCase(verificationStatus)) {
                        verificationStatus = "Pending";
                    }
                } else {
                    verificationStatus = "Not Applicable";
                }
            }
            emp.setVerificationStatus(statusResolver.get(verificationStatus));
        }

        if (isNew || payload.containsKey("status")) {
            String statusVal = getStringValue(payload, "status");
            if (statusVal == null && isNew) {
                statusVal = "APPLIED";
            }
            if (statusVal != null) {
                emp.setStatus(statusResolver.get(statusVal));
            }
        }

        if (isNew || payload.containsKey("atsOverallStatus")) {
            String atsOverallVal = getStringValue(payload, "atsOverallStatus");
            if (atsOverallVal != null) {
                emp.setAtsOverallStatus(statusResolver.get(atsOverallVal));
            }
        }

        // Tab 8 Self Assessment fields
        emp.setQ1_native(getStringValue(payload, "q1_native"));
        emp.setQ2_presentAddress(getStringValue(payload, "q2_present_address"));
        emp.setQ3_permanentAddress(getStringValue(payload, "q3_permanent_address"));

        String noticePeriodVal = getStringValue(payload, "q34_notice_period");
        if (noticePeriodVal != null && !noticePeriodVal.trim().isEmpty() && !noticePeriodVal.trim().matches("^\\d+$")) {
            throw new IllegalArgumentException("Notice Period must be a positive whole number of days.");
        }

        emp.setSameAsCurrentAddress(getStringValue(payload, "same_as_current_address"));
        emp.setQ4_fatherOccupation(getStringValue(payload, "q4_father_occupation"));
        emp.setQ5_motherOccupation(getStringValue(payload, "q5_mother_occupation"));
        emp.setQ6_maritalStatus(getStringValue(payload, "q6_marital_status"));
        emp.setQ7_spouseOccupation(getStringValue(payload, "q7_spouse_occupation"));
        emp.setQ8_children(getStringValue(payload, "q8_children"));
        emp.setQ9_hasRelativesInCompany(getStringValue(payload, "q9_has_relatives"));
        emp.setQ10_relativesDetails(getStringValue(payload, "q10_relatives_details"));
        emp.setQ11_siblingsOccupations(getStringValue(payload, "q11_siblings_occupations"));
        emp.setQ12_hasTwoWheeler(getStringValue(payload, "q12_has_two_wheeler"));
        emp.setQ13_hasAndroidPhone(getStringValue(payload, "q13_has_android_phone"));
        emp.setQ14_knowsCarDriving(getStringValue(payload, "q14_knows_car_driving"));
        emp.setQ15_willingToTravel(getStringValue(payload, "q15_willing_to_travel"));
        emp.setQ16_covidVaccination(getStringValue(payload, "q16_covid_vaccination"));
        emp.setQ47_hasInsurance(getStringValue(payload, "q47_has_insurance"));
        emp.setQ48_insuranceNumber(getStringValue(payload, "q48_insurance_number"));
        emp.setQ17_positivePoints(getStringValue(payload, "q17_positive_points"));
        emp.setQ18_negativePoints(getStringValue(payload, "q18_negative_points"));
        emp.setQ19_lifeGoals(getStringValue(payload, "q19_life_goals"));
        emp.setQ20_willingRotationalShifts(getStringValue(payload, "q20_willing_rotational_shifts"));
        emp.setQ20_improvementSuggestions(getStringValue(payload, "q20_improvement_suggestions"));
        emp.setQ21_isExperienced(getStringValue(payload, "q21_is_experienced"));
        emp.setQ22_totalExperience(getStringValue(payload, "q22_total_experience"));
        emp.setQ23_coreExperience(getStringValue(payload, "q23_core_experience"));
        emp.setQ24_prevNetSalary(getStringValue(payload, "q24_prev_net_salary"));
        emp.setQ25_prevGrossSalary(getStringValue(payload, "q25_prev_gross_salary"));
        emp.setQ26_expectedNetSalary(getStringValue(payload, "q26_expected_net_salary"));
        emp.setQ27_expectedGrossSalary(getStringValue(payload, "q27_expected_gross_salary"));
        emp.setQ28_pfHigherPension(getStringValue(payload, "q28_pf_higher_pension"));
        emp.setQ29_pfDeductionAmount(getStringValue(payload, "q29_pf_deduction_amount"));
        emp.setQ30_alternativeDepartment(getStringValue(payload, "q30_alternative_department"));
        emp.setQ31_prevLocation(getStringValue(payload, "q31_prev_location"));
        emp.setQ32_prevShift(getStringValue(payload, "q32_prev_shift"));
        emp.setQ33_reasonForLeaving(getStringValue(payload, "q33_reason_for_leaving"));
        emp.setQ34_noticePeriod(getStringValue(payload, "q34_notice_period"));
        emp.setQ35_prevDeptPosition(getStringValue(payload, "q35_prev_dept_position"));
        emp.setQ36_prevDeptCount(getStringValue(payload, "q36_prev_dept_count"));
        emp.setQ38_handleMistake(getStringValue(payload, "q38_handle_mistake"));
        emp.setQ39_handleOpinionDifference(getStringValue(payload, "q39_handle_opinion_difference"));
        emp.setQ40_computerSelfRating(getStringValue(payload, "q40_computer_self_rating"));
        Long mgrCountryId = getLongValue(payload, "q43_hr_mgr_country_id");
        String mgrPhone = getStringValue(payload, "q43_hr_mgr_phone");
        validatePhoneByCountryId(mgrCountryId, mgrPhone, "HR Manager");

        Long vertCountryId = getLongValue(payload, "q46_vert_head_country_id");
        String vertPhone = getStringValue(payload, "q46_vert_head_phone");
        validatePhoneByCountryId(vertCountryId, vertPhone, "Vertical Head");

        emp.setQ41_hrMgrName(getStringValue(payload, "q41_hr_mgr_name"));
        emp.setQ42_hrMgrEmail(getStringValue(payload, "q42_hr_mgr_email"));
        emp.setQ43_hrMgrPhone(mgrPhone);
        emp.setMgrCountryId(mgrCountryId);
        emp.setQ44_vertHeadName(getStringValue(payload, "q44_vert_head_name"));
        emp.setQ45_vertHeadEmail(getStringValue(payload, "q45_vert_head_email"));
        emp.setQ46_vertHeadPhone(vertPhone);
        emp.setVertHeadCountryId(vertCountryId);
        emp.setPayslipPath(getStringValue(payload, "payslipPath"));
        emp.setResumePath(getStringValue(payload, "resumePath"));
        emp.setAadharPath(getStringValue(payload, "aadharPath"));
        emp.setEmployeePhotoUpload(getStringValue(payload, "employeePhotoUpload"));
        emp.setPhotoVerifiedStatus(statusResolver.get(getStringValue(payload, "photoVerifiedStatus")));
        emp.setResumeVerifiedStatus(statusResolver.get(getStringValue(payload, "resumeVerifiedStatus")));
        emp.setPayslipVerifiedStatus(statusResolver.get(getStringValue(payload, "payslipVerifiedStatus")));
        emp.setAadharVerifiedStatus(statusResolver.get(getStringValue(payload, "aadharVerifiedStatus")));
        emp.setPhotoRejectReason(getStringValue(payload, "photoRejectReason"));
        emp.setResumeRejectReason(getStringValue(payload, "resumeRejectReason"));
        emp.setPayslipRejectReason(getStringValue(payload, "payslipRejectReason"));
        emp.setAadharRejectReason(getStringValue(payload, "aadharRejectReason"));
        if (payload.containsKey("isRehired")) {
            emp.setIsRehired(getStringValue(payload, "isRehired"));
        }
        if (payload.containsKey("previousEmpCode")) {
            emp.setPreviousEmpCode(getStringValue(payload, "previousEmpCode"));
        }
        if (payload.containsKey("backgroundVerificationStatus")) {
            emp.setBackgroundVerificationStatus(
                    statusResolver.get(getStringValue(payload, "backgroundVerificationStatus")));
        }

        employeeRepo.save(emp);
        syncAadharAndPayslipAttachments(emp);
        Long empId = emp.getId();

        EmployeePersonalDetail p = personalRepo.findFirstByEmployeeId(empId).orElse(new EmployeePersonalDetail());
        p.setEmployeeId(empId);
        p.setGender(getStringValue(payload, "gender"));
        p.setMaritalStatus(getStringValue(payload, "maritalStatus"));
        p.setPanNumber(getStringValue(payload, "panNo"));
        p.setBirthDate(getDateValue(payload, "birthDate"));
        p.setNationality(getStringValue(payload, "nationality"));
        p.setReligion(getStringValue(payload, "religion"));
        p.setAadharNumber(getStringValue(payload, "aadharNo"));
        p.setPersonalEmail(getStringValue(payload, "emailId"));
        personalRepo.save(p);

        EmployeeContact c = contactRepo.findByEmployeeId(empId).orElse(new EmployeeContact());
        c.setEmployeeId(empId);
        c.setMobile(getStringValue(payload, "mobileNo"));
        c.setAlternateMobile(getStringValue(payload, "officePhoneNo"));
        if (c.getAlternateMobile() == null)
            c.setAlternateMobile(getStringValue(payload, "phoneNo"));
        c.setAddress(getStringValue(payload, "permAdd1"));
        c.setCity(getStringValue(payload, "city"));
        c.setState(getStringValue(payload, "state"));
        c.setCommAddress(getStringValue(payload, "persAdd1"));
        if (c.getCommAddress() == null)
            c.setCommAddress(getStringValue(payload, "contactAddress1"));
        c.setCommCity(getStringValue(payload, "contactCity"));
        contactRepo.save(c);

        EmployeeJobProfile jp = jobProfileRepo.findByEmployeeId(empId).orElse(new EmployeeJobProfile());
        jp.setEmployeeId(empId);

        Map<String, Object> dynMap = new HashMap<>();
        if (jp.getDynamicComponents() != null && !jp.getDynamicComponents().trim().isEmpty()) {
            try {
                dynMap = new com.fasterxml.jackson.databind.ObjectMapper().readValue(jp.getDynamicComponents(),
                        Map.class);
            } catch (Exception e) {
                // ignore
            }
        }

        dynMap.put("BASIC", getBigDecimalValue(payload, "basic"));
        dynMap.put("DA", getBigDecimalValue(payload, "da"));
        dynMap.put("HRA", getBigDecimalValue(payload, "hra"));
        dynMap.put("SPECIAL_ALLOWANCE", getBigDecimalValue(payload, "splAllowance"));
        dynMap.put("performance_incentive", getBigDecimalValue(payload, "perfIncentive"));
        dynMap.put("canteenAllowance", getBigDecimalValue(payload, "canteenAllowance"));
        dynMap.put("PF_EMP", getBigDecimalValue(payload, "pfEmployee"));
        dynMap.put("ESI_EMP", getBigDecimalValue(payload, "esiEmployee"));
        dynMap.put("PT", getBigDecimalValue(payload, "profTax"));
        dynMap.put("GROSS", getBigDecimalValue(payload, "grossSalary"));
        dynMap.put("NET_SALARY", getBigDecimalValue(payload, "netSalary"));
        dynMap.put("monthlyCtc", getBigDecimalValue(payload, "ctc"));
        dynMap.put("uniformAllowance", getBigDecimalValue(payload, "uniform"));
        dynMap.put("shoeAllowance", getBigDecimalValue(payload, "shoes"));
        dynMap.put("mobileAllowanceCug", getBigDecimalValue(payload, "mobileCug"));
        dynMap.put("employerPf", getBigDecimalValue(payload, "pfEmployer"));
        dynMap.put("employerEsi", getBigDecimalValue(payload, "esiEmployer"));
        dynMap.put("canteenDeduction", getBigDecimalValue(payload, "canteenDeduct"));
        dynMap.put("statutoryBonus", getBigDecimalValue(payload, "statutoryBonus"));
        dynMap.put("attendanceAllow1", getBigDecimalValue(payload, "attendanceAllow1"));
        dynMap.put("attendanceAllow2", getBigDecimalValue(payload, "attendanceAllow2"));
        dynMap.put("otAmount", getBigDecimalValue(payload, "otAmount"));
        dynMap.put("petrolAllow", getBigDecimalValue(payload, "petrolAllow"));
        dynMap.put("appraisalPer", getBigDecimalValue(payload, "appraisalPer"));
        dynMap.put("otherAllow", getBigDecimalValue(payload, "otherAllow"));
        dynMap.put("labourWelFundEmp", getBigDecimalValue(payload, "labourWelFundEmp"));
        dynMap.put("labourWelFundEmployer", getBigDecimalValue(payload, "labourWelFundEmployer"));
        dynMap.put("otherDeduct", getBigDecimalValue(payload, "otherDeduct"));
        dynMap.put("suspenseDeduct", getBigDecimalValue(payload, "suspenseDeduct"));

        try {
            jp.setDynamicComponents(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(dynMap));
        } catch (Exception e) {
            // ignore
        }
        jobProfileRepo.save(jp);

        educationRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> eduList = (List<Map<String, Object>>) payload.get("education");
        if (eduList != null) {
            for (Map<String, Object> eduMap : eduList) {
                EmployeeEducation edu = new EmployeeEducation();
                edu.setEmployeeId(empId);
                edu.setEducation(getStringValue(eduMap, "education"));
                edu.setInstitutionName(getStringValue(eduMap, "institutionName"));
                edu.setType(getStringValue(eduMap, "type"));
                edu.setYearOfPassing(getStringValue(eduMap, "yearOfPassing"));
                edu.setPercentageGrade(getStringValue(eduMap, "grade"));
                edu.setCertificateFile(getStringValue(eduMap, "filePath"));
                edu.setUniversity(getStringValue(eduMap, "university"));
                edu.setStream(getStringValue(eduMap, "stream"));
                edu.setFromWhere("ATS");
                educationRepo.save(edu);
            }
        }

        experienceRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> expList = (List<Map<String, Object>>) payload.get("experience");
        if (expList != null) {
            for (Map<String, Object> expMap : expList) {
                EmployeeExperience exp = new EmployeeExperience();
                exp.setEmployeeId(empId);
                exp.setCompanyName(getStringValue(expMap, "companyName"));
                exp.setLocation(getStringValue(expMap, "location"));
                exp.setFromDate(getDateValue(expMap, "fromDate"));
                exp.setToDate(getDateValue(expMap, "toDate"));
                String expYearsStr = getStringValue(expMap, "expYears");
                if (expYearsStr != null && !expYearsStr.isEmpty()) {
                    try {
                        double expYearsDouble = Double.parseDouble(expYearsStr);
                        exp.setTotalExperienceMonths((int) Math.round(expYearsDouble * 12.0));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                exp.setDocuments(getStringValue(expMap, "filePath"));
                exp.setFromWhere("ATS");
                experienceRepo.save(exp);
            }
        }

        kycDocumentRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> kycList = (List<Map<String, Object>>) payload.get("kyc");
        if (kycList != null) {
            for (Map<String, Object> kycMap : kycList) {
                EmployeeKycDocument kyc = new EmployeeKycDocument();
                kyc.setEmployeeId(empId);
                Object seqObj = kycMap.get("seqNo");
                if (seqObj != null) {
                    try {
                        kyc.setSeqNo(Integer.parseInt(seqObj.toString()));
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                kyc.setDocumentName(getStringValue(kycMap, "docName"));
                kyc.setDocumentNumber(getStringValue(kycMap, "docNo"));
                kyc.setAttachment(getStringValue(kycMap, "filePath"));
                kyc.setFromWhere("ATS");
                kycDocumentRepo.save(kyc);
            }
        }

        activityRepo.deleteByEmployeeId(empId);
        List<Map<String, Object>> skillList = (List<Map<String, Object>>) payload.get("skills");
        if (skillList != null) {
            for (Map<String, Object> skillMap : skillList) {
                EmployeeActivity act = new EmployeeActivity();
                act.setEmployeeId(empId);
                act.setActivityDetails(getStringValue(skillMap, "activityDetails"));
                act.setFilePath(getStringValue(skillMap, "filePath"));
                act.setFromWhere("ATS");
                activityRepo.save(act);
            }
        }
    }

    @GetMapping("/final-process-candidates")
    @RequirePagePermission(pageCode = "HA1130", action = "read")
    @Operation(summary = "Get candidates for final interview decision processing")
    public List<Map<String, Object>> getFinalProcessCandidates() {
        List<EmployeeMaster> applicants = employeeRepo.findAtsApplicants();
        List<EmployeeMaster> activeCandidates = new ArrayList<>();
        List<Long> empIds = new ArrayList<>();

        for (EmployeeMaster emp : applicants) {
            if (emp.getIsActive() != null && !emp.getIsActive()) {
                continue;
            }
            if (emp.getEmpCode() != null) {
                continue; // Already pushed to on-roll
            }
            activeCandidates.add(emp);
            empIds.add(emp.getId());
        }

        if (empIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Bulk fetch interviews for all active candidate IDs
        List<HraApplicantInterview> allInterviews = applicantInterviewRepo.findByEmployeeIdIn(empIds);
        Map<Long, List<HraApplicantInterview>> interviewsByEmpId = new HashMap<>();
        for (HraApplicantInterview iv : allInterviews) {
            if (iv.getEmployeeId() != null) {
                interviewsByEmpId.computeIfAbsent(iv.getEmployeeId(), k -> new ArrayList<>()).add(iv);
            }
        }

        // Bulk fetch emails for all active candidate IDs
        List<EmployeePersonalDetail> personals = personalRepo.findByEmployeeIdIn(empIds);
        Map<Long, String> emailMap = new HashMap<>();
        for (EmployeePersonalDetail pd : personals) {
            if (pd.getEmployeeId() != null && pd.getPersonalEmail() != null
                    && !pd.getPersonalEmail().trim().isEmpty()) {
                emailMap.putIfAbsent(pd.getEmployeeId(), pd.getPersonalEmail().trim());
            }
        }

        // Bulk fetch designations and levels
        List<com.autonoma.erp.modules.hr.orgstructure.entity.Designation> designations = designationRepo.findAll();
        Map<Long, com.autonoma.erp.modules.hr.orgstructure.entity.Designation> designationMap = new HashMap<>();
        for (com.autonoma.erp.modules.hr.orgstructure.entity.Designation d : designations) {
            designationMap.put(d.getId(), d);
        }

        List<com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevels = designationLevelRepo
                .findAll();
        Map<Long, com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel> designationLevelMap = new HashMap<>();
        for (com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl : designationLevels) {
            designationLevelMap.put(dl.getId(), dl);
        }

        com.autonoma.erp.modules.platform.common.entity.StatusMaster rejectedSM = statusResolver.get("REJECTED");

        List<Map<String, Object>> result = new ArrayList<>();
        for (EmployeeMaster emp : activeCandidates) {
            List<HraApplicantInterview> rawInterviews = interviewsByEmpId.getOrDefault(emp.getId(), new ArrayList<>());
            List<HraApplicantInterview> interviews = new ArrayList<>();
            for (HraApplicantInterview iv : rawInterviews) {
                boolean active = (iv.getIsActive() == null || iv.getIsActive())
                        && isInterviewStatusActive(iv.getStatus());
                if (active) {
                    interviews.add(iv);
                }
            }

            if (interviews.isEmpty()) {
                continue; // Skip candidates without active interview rounds
            }

            int totalRounds = interviews.size();
            String latestRound = "-";
            String latestRoundStatus = "-";
            String interviewDate = "-";
            int completedRounds = 0;
            int selectedRounds = 0;

            List<HraApplicantInterview> sorted = new ArrayList<>(interviews);
            sorted.sort((a, b) -> {
                try {
                    int aVal = Integer.parseInt(a.getScreeningLevel());
                    int bVal = Integer.parseInt(b.getScreeningLevel());
                    return Integer.compare(aVal, bVal);
                } catch (Exception e) {
                    String aStr = a.getScreeningLevel() != null ? a.getScreeningLevel() : "";
                    String bStr = b.getScreeningLevel() != null ? b.getScreeningLevel() : "";
                    return aStr.compareTo(bStr);
                }
            });
            HraApplicantInterview latest = sorted.get(sorted.size() - 1);
            latestRound = latest.getRound();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster dynamicLatestStatus = computeDynamicStatus(latest, interviews);
            if (dynamicLatestStatus != null && dynamicLatestStatus.getName() != null) {
                latestRoundStatus = dynamicLatestStatus.getName();
            }
            interviewDate = latest.getInterviewDate() != null ? latest.getInterviewDate() : "-";

            // Count interviews that are completed (not PENDING) and selected
            for (HraApplicantInterview iv : interviews) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusObj = iv.getInterviewStatus();
                String ivStatus = ivStatusObj != null ? ivStatusObj.getName() : null;
                if (ivStatus != null && !ivStatus.trim().isEmpty() && !"PENDING".equalsIgnoreCase(ivStatus)) {
                    completedRounds++;
                }
                if (ivStatus != null && ("SELECTED".equalsIgnoreCase(ivStatus) ||
                        "PASS".equalsIgnoreCase(ivStatus) ||
                        "APPROVED".equalsIgnoreCase(ivStatus))) {
                    selectedRounds++;
                }
            }

            InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(emp, 1, rawInterviews);

            String email = emailMap.getOrDefault(emp.getId(), "-");

            Map<String, Object> map = new HashMap<>();
            map.put("id", emp.getId());
            map.put("candidateCode", emp.getApplicantCode() != null ? emp.getApplicantCode() : emp.getEmpCode());
            map.put("candidateName",
                    emp.getFirstName() != null ? emp.getFirstName().trim() : "");
            map.put("department", emp.getDepartment());
            map.put("applicantDate", emp.getApplicantDate() != null ? emp.getApplicantDate() : emp.getCreatedDate());
            String desigName = "";
            if (emp.getDesignationId() != null) {
                com.autonoma.erp.modules.hr.orgstructure.entity.Designation d = designationMap
                        .get(emp.getDesignationId());
                if (d != null && d.getDesignationName() != null) {
                    desigName = d.getDesignationName();
                }
            }
            map.put("positionLookFor", desigName);

            String levelName = "";
            Long empLevelId = emp.getEmpLevelId();
            if (empLevelId == null) {
                empLevelId = employeeRepo.findEmpLevelIdByEmployeeId(emp.getId());
            }
            if (empLevelId != null) {
                com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel dl = designationLevelMap
                        .get(empLevelId);
                if (dl != null && dl.getLevel() != null) {
                    levelName = dl.getLevel();
                }
            }
            if (levelName.isEmpty() && emp.getDesignationId() != null) {
                com.autonoma.erp.modules.hr.orgstructure.entity.Designation d = designationMap
                        .get(emp.getDesignationId());
                if (d != null && d.getSubCategoryLevel() != null) {
                    levelName = d.getSubCategoryLevel();
                }
            }
            map.put("empLevelId", empLevelId);
            map.put("levelName", levelName);
            map.put("level", levelName);
            map.put("totalRounds", totalRounds);
            map.put("completedRounds", completedRounds);
            map.put("latestRound", latestRound);
            map.put("latestRoundStatus", latestRoundStatus);
            com.autonoma.erp.modules.platform.common.entity.StatusMaster candStatusObj = emp.getInterviewStatus();
            String candStatus = candStatusObj != null ? candStatusObj.getName() : null;
            if (candStatus == null || "APPLIED".equalsIgnoreCase(candStatus) || "PENDING".equalsIgnoreCase(candStatus)
                    || "IN PROGRESS".equalsIgnoreCase(candStatus) || "IN_PROGRESS".equalsIgnoreCase(candStatus)
                    || "WAITING FOR PROGRESS".equalsIgnoreCase(candStatus)
                    || "WAITING FOR PROCESS".equalsIgnoreCase(candStatus)) {
                candStatus = "Waiting For Progress";
            }
            map.put("status", candStatus);
            map.put("comments", emp.getReferenceComments());
            map.put("emailId", email);
            map.put("interviewDate", interviewDate);
            double ratingValue = 0.0;
            List<Double> roundRatings = new ArrayList<>();
            for (HraApplicantInterview iv : interviews) {
                if (iv.getFeedbackJson() != null && !iv.getFeedbackJson().trim().isEmpty()
                        && !"[]".equals(iv.getFeedbackJson().trim())) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(iv.getFeedbackJson());
                        if (rootNode.isArray()) {
                            double sum = 0.0;
                            int count = 0;
                            for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                                boolean hasValidScore = false;
                                double scoreVal = 0.0;
                                if (node.has("score") && !node.get("score").isNull()) {
                                    String scoreStr = node.get("score").asText().trim();
                                    if (!scoreStr.isEmpty() && !"null".equalsIgnoreCase(scoreStr)) {
                                        try {
                                            scoreVal = Double.parseDouble(scoreStr);
                                            hasValidScore = true;
                                        } catch (Exception e) {
                                            // ignore parsing errors
                                        }
                                    }
                                }

                                if (hasValidScore) {
                                    sum += scoreVal;
                                    count++;
                                } else {
                                    if (node.has("feedback") && !node.get("feedback").isNull()) {
                                        String fb = node.get("feedback").asText().trim().toLowerCase();
                                        if (!fb.isEmpty() && !"null".equalsIgnoreCase(fb)) {
                                            if (fb.contains("correct") || fb.contains("excellent")
                                                    || fb.contains("outstanding")
                                                    || fb.equals("pass") || fb.equals("selected")) {
                                                sum += 1.0;
                                                count++;
                                            } else if (fb.contains("moderate") || fb.contains("average")
                                                    || fb.equals("ok")
                                                    || fb.equals("hold")) {
                                                sum += 0.5;
                                                count++;
                                            } else if (fb.contains("incorrect") || fb.contains("poor")
                                                    || fb.contains("bad")
                                                    || fb.equals("fail") || fb.equals("rejected")) {
                                                sum += 0.0;
                                                count++;
                                            } else {
                                                sum += 1.0;
                                                count++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (count > 0) {
                                roundRatings.add((sum / count) * 100.0);
                            }
                        }
                    } catch (Exception e) {
                        // ignore malformed feedbackJson
                    }
                }
            }
            if (!roundRatings.isEmpty()) {
                double total = 0.0;
                for (double r : roundRatings) {
                    total += r;
                }
                ratingValue = total / roundRatings.size();
            } else {
                ratingValue = (double) selectedRounds;
            }

            boolean isRejectionPending = (rejectedSM != null && emp.getOfferStatus() != null
                    && emp.getOfferStatus().getId().equals(rejectedSM.getId()))
                    && !(emp.getStatus() != null && rejectedSM.getId().equals(emp.getStatus().getId()));

            map.put("statusId", emp.getStatus() != null ? emp.getStatus().getId() : null);
            map.put("interviewStatusId", emp.getInterviewStatus() != null ? emp.getInterviewStatus().getId() : null);
            map.put("atsOverallStatusId", emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getId() : null);
            map.put("offerStatusId", emp.getOfferStatus() != null ? emp.getOfferStatus().getId() : null);
            map.put("rejectedStatusId", rejectedSM != null ? rejectedSM.getId() : null);
            map.put("isRejectionEmailPending", isRejectionPending);
            if (isRejectionPending) {
                map.put("finalDecision", "REJECTED");
                map.put("finalDecisionStatusId", rejectedSM.getId());
            }

            map.put("rating", ratingValue);
            map.put("callStatus", emp.getCallStatus() != null ? emp.getCallStatus().getName() : "Pending");
            map.put("offerStatus", emp.getOfferStatus() != null ? emp.getOfferStatus().getName() : "Pending");
            String verificationStatus = emp.getVerificationStatus() != null ? emp.getVerificationStatus().getName()
                    : "Pending";
            if ("YES".equalsIgnoreCase(emp.getQ21_isExperienced())) {
                if (verificationStatus == null || verificationStatus.isEmpty()
                        || "N/A".equalsIgnoreCase(verificationStatus)
                        || "Not Applicable".equalsIgnoreCase(verificationStatus)) {
                    verificationStatus = "Pending";
                }
            } else {
                verificationStatus = "Not Applicable";
            }
            map.put("verificationStatus", verificationStatus);
            map.put("interviewsCompleted", eligibility.isEligible());

            result.add(map);
        }
        result.sort((r1, r2) -> ((Long) r2.get("id")).compareTo((Long) r1.get("id")));
        return result;
    }

    @PutMapping("/{id}/bgv")
    @RequirePagePermission(pageCode = "HA1130", action = "write")
    @Operation(summary = "Update candidate background verification status")
    @Transactional
    public ResponseEntity<?> updateBgvStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return employeeRepo.findById(id).map(applicant -> {
            applicant.setBackgroundVerificationStatus(
                    statusResolver.get(getStringValue(payload, "backgroundVerificationStatus")));
            employeeRepo.save(applicant);
            return ResponseEntity.ok(mapEmployeeToFullMap(applicant));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/final-process/{id}")
    @RequirePagePermission(pageCode = "HA1130", action = "write")
    @Operation(summary = "Finalize applicant decision")
    @Transactional
    public ResponseEntity<?> finalizeApplicant(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return employeeRepo.findById(id).map(emp -> {
            InterviewEligibilitySummary eligibility = getInterviewEligibilitySummary(emp, null);
            if (!hasSatisfiedInterviewRequirements(eligibility)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Candidate has not completed all required interview rounds."));
            }

            List<HraApplicantInterview> rawInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
            if (rawInterviews != null && !rawInterviews.isEmpty()) {
                List<HraApplicantInterview> activeInterviews = new ArrayList<>();
                for (HraApplicantInterview iv : rawInterviews) {
                    boolean active = (iv.getIsActive() == null || iv.getIsActive())
                            && isInterviewStatusActive(iv.getStatus());
                    if (active) {
                        activeInterviews.add(iv);
                    }
                }
                if (!activeInterviews.isEmpty()) {
                    activeInterviews.sort((a, b) -> {
                        try {
                            int aVal = Integer.parseInt(a.getScreeningLevel());
                            int bVal = Integer.parseInt(b.getScreeningLevel());
                            return Integer.compare(aVal, bVal);
                        } catch (Exception e) {
                            String aStr = a.getScreeningLevel() != null ? a.getScreeningLevel() : "";
                            String bStr = b.getScreeningLevel() != null ? b.getScreeningLevel() : "";
                            return aStr.compareTo(bStr);
                        }
                    });
                    // Completed interview rounds criteria check is bypassed for Final Resolution
                    // since evaluation is already done.
                }
            }

            // Guard: If candidate has ALREADY been finalized as REJECTED in Final
            // Resolution and email sent, block any modification
            if (statusResolver.isRejected(emp.getStatus()) && statusResolver.isRejected(emp.getInterviewStatus())) {
                return ResponseEntity.status(403).body(
                        Map.of("message",
                                "This candidate has already been rejected in Final Resolution and rejection email has been sent."));
            }

            com.autonoma.erp.modules.platform.common.entity.StatusMaster originalOfferStatus = emp.getOfferStatus();

            if (payload.containsKey("status")) {
                String newStatus = getStringValue(payload, "status");
                if (newStatus == null || "APPLIED".equalsIgnoreCase(newStatus) || "PENDING".equalsIgnoreCase(newStatus)
                        || "WAITING FOR PROGRESS".equalsIgnoreCase(newStatus)) {
                    boolean allRoundsCompleted = checkAllActiveRoundsCompleted(emp);
                    if (allRoundsCompleted) {
                        newStatus = "Waiting For Progress";
                    }
                }
                com.autonoma.erp.modules.platform.common.entity.StatusMaster resolvedStatus = statusResolver
                        .get(newStatus);

                if (statusResolver.isCancelled(emp.getStatus())) {
                    if (statusResolver.isSelected(resolvedStatus) || statusResolver.isRejected(resolvedStatus)
                            || statusResolver.isHold(resolvedStatus) || statusResolver.isCancelled(resolvedStatus)) {
                        emp.setInterviewStatus(resolvedStatus);
                    }
                } else {
                    if (statusResolver.isSelected(resolvedStatus) || statusResolver.isHold(resolvedStatus)
                            || statusResolver.isCancelled(resolvedStatus)) {
                        emp.setStatus(resolvedStatus);
                        emp.setInterviewStatus(resolvedStatus);
                    }

                    if (statusResolver.isSelected(resolvedStatus)) {
                        computeAndSetAtsOverallStatus(emp); // check if we can set ATS_OVERALL_STATUS to SELECTED
                    } else if (statusResolver.isRejected(resolvedStatus)) {
                        emp.setStatus(resolvedStatus);
                        emp.setInterviewStatus(resolvedStatus);
                        emp.setAtsOverallStatus(resolvedStatus);
                        emp.setOfferStatus(resolvedStatus); // stop subsequent phase: OFFER = Rejected
                        emp.setVerificationStatus(resolvedStatus); // stop subsequent phase: VERIFICATION = Rejected
                    } else if (statusResolver.isCancelled(resolvedStatus)) {
                        emp.setAtsOverallStatus(resolvedStatus); // stop the workflow, ATS_OVERALL_STATUS = Cancelled
                    }
                }
            }
            if (payload.containsKey("finalFeedback")) {
                emp.setFinalFeedback(getStringValue(payload, "finalFeedback"));
            }
            if (payload.containsKey("dateOfJoining")) {
                emp.setDateOfJoining(getDateValue(payload, "dateOfJoining"));
            }
            if (payload.containsKey("employeeType")) {
                String typeName = getStringValue(payload, "employeeType");
                if (typeName != null && !typeName.trim().isEmpty()) {
                    EmployeeTypeMaster typeMaster = employeeTypeRepo.findByTypeNameIgnoreCase(typeName);
                    if (typeMaster == null) {
                        typeMaster = new EmployeeTypeMaster(typeName);
                        typeMaster = employeeTypeRepo.save(typeMaster);
                    }
                    emp.setEmployeeTypeId(typeMaster.getId());
                }
            }
            if (payload.containsKey("nextSalaryHikeMonth")) {
                emp.setNextSalaryHikeMonth(getStringValue(payload, "nextSalaryHikeMonth"));
            }
            if (payload.containsKey("minimumAmount")) {
                emp.setMinimumAmount(getBigDecimalValue(payload, "minimumAmount"));
            }
            if (payload.containsKey("maximumAmount")) {
                emp.setMaximumAmount(getBigDecimalValue(payload, "maximumAmount"));
            }

            employeeRepo.save(emp);

            // Determine if actual non-empty salary components are being submitted
            boolean hasSalaryPayload = false;
            if (payload.get("salaryComponents") instanceof Map
                    && !((Map<?, ?>) payload.get("salaryComponents")).isEmpty()) {
                hasSalaryPayload = true;
            } else if (payload.get("salaryStructure") instanceof Map
                    && !((Map<?, ?>) payload.get("salaryStructure")).isEmpty()) {
                hasSalaryPayload = true;
            }

            // Salary-only lock: Reject salary modifications when candidate is already
            // pushed to On-Roll or offer is locked
            if (hasSalaryPayload) {
                boolean isOnRoll = (emp.getEmpCode() != null && !emp.getEmpCode().trim().isEmpty())
                        || statusResolver.is(emp.getStatus(), "ON-ROLL")
                        || statusResolver.is(emp.getAtsOverallStatus(), "ON-ROLL");
                boolean isSalaryLocked = isOnRoll
                        || statusResolver.isToBeVerified(originalOfferStatus)
                        || statusResolver.isVerified(originalOfferStatus)
                        || statusResolver.is(originalOfferStatus, "Joined");
                if (isSalaryLocked) {
                    String lockedReason = isOnRoll ? "candidate is already pushed to On-Roll"
                            : "offer status is locked ("
                                    + (originalOfferStatus != null ? originalOfferStatus.getName() : "unknown") + ")";
                    return ResponseEntity.status(403).body(
                            java.util.Map.of("error",
                                    "Salary cannot be modified: " + lockedReason + "."));
                }
            }

            // Save/Update Job Profile with Salary components if provided
            if (hasSalaryPayload) {
                // Ensure EmployeeJobProfile is initialized and persisted with Job Profile
                // settings
                EmployeeJobProfile jp = jobProfileRepo.findByEmployeeId(id).orElse(new EmployeeJobProfile());
                jp.setEmployeeId(id);

                // Set defaults to avoid bank / wages validation failures
                if (jp.getPaymentMode() == null || jp.getPaymentMode().trim().isEmpty()) {
                    jp.setPaymentMode("CASH");
                }
                if (jp.getWagesType() == null || jp.getWagesType().trim().isEmpty()) {
                    jp.setWagesType("MONTHLY");
                }

                // Explicit payload overrides
                if (payload.containsKey("paymentMode")) {
                    jp.setPaymentMode(getStringValue(payload, "paymentMode"));
                }
                if (payload.containsKey("wagesType")) {
                    jp.setWagesType(getStringValue(payload, "wagesType"));
                }
                if (payload.containsKey("providentFund")) {
                    jp.setProvidentFund(getStringValue(payload, "providentFund"));
                }
                if (payload.containsKey("esiAllowed")) {
                    jp.setEsiAllowed(getStringValue(payload, "esiAllowed"));
                }
                if (payload.containsKey("professionalTax")) {
                    jp.setProfessionalTax(getStringValue(payload, "professionalTax"));
                }

                Map<String, Object> dynMap = new HashMap<>();
                if (jp.getDynamicComponents() != null && !jp.getDynamicComponents().trim().isEmpty()) {
                    try {
                        dynMap = new com.fasterxml.jackson.databind.ObjectMapper()
                                .readValue(jp.getDynamicComponents(), Map.class);
                    } catch (Exception e) {
                    }
                }

                // Support both new structured map and old flat structure mapping
                if (payload.containsKey("salaryComponents")) {
                    Map<String, Object> components = (Map<String, Object>) payload.get("salaryComponents");
                    if (components != null) {
                        for (Map.Entry<String, Object> entry : components.entrySet()) {
                            if (entry.getValue() != null) {
                                try {
                                    dynMap.put(entry.getKey(),
                                            new java.math.BigDecimal(String.valueOf(entry.getValue())));
                                } catch (Exception e) {
                                    dynMap.put(entry.getKey(), entry.getValue());
                                }
                            }
                        }
                    }
                } else if (payload.containsKey("salaryStructure")) {
                    Map<String, Object> salary = (Map<String, Object>) payload.get("salaryStructure");
                    if (salary != null) {
                        dynMap.put("BASIC", getBigDecimalValue(salary, "basic"));
                        dynMap.put("DA", getBigDecimalValue(salary, "da"));
                        dynMap.put("HRA", getBigDecimalValue(salary, "hra"));
                        dynMap.put("SPECIAL_ALLOWANCE", getBigDecimalValue(salary, "splAllowance"));
                        dynMap.put("performance_incentive", getBigDecimalValue(salary, "perfIncentive"));
                        dynMap.put("canteenAllowance", getBigDecimalValue(salary, "canteenAllowance"));
                        dynMap.put("PF_EMP", getBigDecimalValue(salary, "pfEmployee"));
                        dynMap.put("ESI_EMP", getBigDecimalValue(salary, "esiEmployee"));
                        dynMap.put("PT", getBigDecimalValue(salary, "profTax"));
                        dynMap.put("GROSS", getBigDecimalValue(salary, "grossSalary"));
                        dynMap.put("NET_SALARY", getBigDecimalValue(salary, "netSalary"));
                        dynMap.put("monthlyCtc", getBigDecimalValue(salary, "ctc"));
                        dynMap.put("uniformAllowance", getBigDecimalValue(salary, "uniform"));
                        dynMap.put("shoeAllowance", getBigDecimalValue(salary, "shoes"));
                        dynMap.put("mobileAllowanceCug", getBigDecimalValue(salary, "mobileCug"));
                        dynMap.put("employerPf", getBigDecimalValue(salary, "pfEmployer"));
                        dynMap.put("employerEsi", getBigDecimalValue(salary, "esiEmployer"));
                        dynMap.put("canteenDeduction", getBigDecimalValue(salary, "canteenDeduct"));
                        dynMap.put("statutoryBonus", getBigDecimalValue(salary, "statutoryBonus"));
                        dynMap.put("attendanceAllow1", getBigDecimalValue(salary, "attendanceAllow1"));
                        dynMap.put("attendanceAllow2", getBigDecimalValue(salary, "attendanceAllow2"));
                        dynMap.put("otAmount", getBigDecimalValue(salary, "otAmount"));
                        dynMap.put("petrolAllow", getBigDecimalValue(salary, "petrolAllow"));
                        dynMap.put("appraisalPer", getBigDecimalValue(salary, "appraisalPer"));
                        dynMap.put("otherAllow", getBigDecimalValue(salary, "otherAllow"));
                        dynMap.put("labourWelFundEmp", getBigDecimalValue(salary, "labourWelFundEmp"));
                        dynMap.put("labourWelFundEmployer", getBigDecimalValue(salary, "labourWelFundEmployer"));
                        dynMap.put("otherDeduct", getBigDecimalValue(salary, "otherDeduct"));
                        dynMap.put("suspenseDeduct", getBigDecimalValue(salary, "suspenseDeduct"));
                    }
                }

                try {
                    jp.setDynamicComponents(
                            new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(dynMap));
                } catch (Exception e) {
                }

                // Delegate persistence to EmployeeMasterService to extract salary components
                // properly
                employeeMasterService.saveJobProfile(id, jp);
            }

            // Cancel remaining unfinished assigned interviews for this candidate
            List<HraApplicantInterview> candInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
            if (candInterviews != null && !candInterviews.isEmpty()) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledStatus = statusResolver
                        .get("CANCELLED");
                for (HraApplicantInterview iv : candInterviews) {
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatus = iv.getInterviewStatus();
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster ivResult = iv.getInterviewResult();

                    boolean isCompleted = statusResolver.isSelected(ivStatus) || statusResolver.isSelected(ivResult)
                            || statusResolver.isRejected(ivStatus) || statusResolver.isRejected(ivResult)
                            || statusResolver.isHold(ivStatus) || statusResolver.isHold(ivResult)
                            || statusResolver.isCompleted(ivStatus) || statusResolver.isCompleted(ivResult)
                            || statusResolver.isCancelled(ivStatus) || statusResolver.isCancelled(ivResult)
                            || (iv.getFeedbackJson() != null && !iv.getFeedbackJson().trim().isEmpty()
                                    && !"[]".equals(iv.getFeedbackJson().trim()));

                    if (!isCompleted) {
                        iv.setInterviewStatus(cancelledStatus);
                        iv.setInterviewResult(cancelledStatus);
                        iv.setStatus("CANCELLED");
                        notificationService.softCloseAndNotifyCancelIfAssigned(iv.getInterviewerId(), iv);
                        applicantInterviewRepo.save(iv);
                    }
                }
            }

            EmployeeMaster savedEmp = employeeRepo.save(emp);

            if (statusResolver.isRejected(savedEmp.getStatus())) {
                sendAutomaticRejectionEmail(savedEmp);
            }

            InterviewEligibilitySummary postEligibility = getInterviewEligibilitySummary(savedEmp, null);
            Map<String, Object> respMap = mapEmployeeToFullMap(savedEmp, postEligibility);
            respMap.put("message", "Applicant finalized successfully.");
            return ResponseEntity.ok(respMap);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Sends an automatic rejection email upon Final Resolution Rejection decision.
     * Follows template priority: Email Content Master (REJECTION / REJECTED) ->
     * hardcoded fallback.
     * Sender priority: Logged-in user office email -> Company Mail fallback.
     */
    private void sendAutomaticRejectionEmail(EmployeeMaster applicant) {
        if (applicant == null || applicant.getId() == null)
            return;
        try {
            log.info("[ATS Auto-Rejection Email] Starting automatic rejection email dispatch for applicant ID: {}",
                    applicant.getId());

            // 1. Resolve recipient candidate email
            Optional<EmployeePersonalDetail> candidatePersonalOpt = personalRepo
                    .findFirstByEmployeeId(applicant.getId());
            String candidateEmail = candidatePersonalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                    .orElse(applicant.getOfficeMail() != null ? applicant.getOfficeMail() : "");
            if (candidateEmail == null || candidateEmail.trim().isEmpty() || !candidateEmail.contains("@")) {
                log.warn(
                        "[ATS Auto-Rejection Email] Candidate email missing or invalid for applicant ID: {}. Skipping auto-email.",
                        applicant.getId());
                return;
            }
            candidateEmail = candidateEmail.trim();

            // 2. Resolve Company Profile & Smtp
            CompanyCredential company = companyCredentialService != null
                    ? companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null)
                    : null;
            if (company == null || company.getSmtpHost() == null || company.getSmtpHost().trim().isEmpty()
                    || company.getSmtpUsername() == null || company.getSmtpUsername().trim().isEmpty()
                    || company.getSmtpPassword() == null || company.getSmtpPassword().trim().isEmpty()) {
                log.warn(
                        "[ATS Auto-Rejection Email] SMTP is not configured in Company Profile. Skipping auto-email for applicant ID: {}",
                        applicant.getId());
                return;
            }

            String smtpUsername = company.getSmtpUsername().trim();
            String smtpPassword = company.getSmtpPassword().trim();
            String companyEmail = (company.getEmailId() != null && !company.getEmailId().isBlank())
                    ? company.getEmailId().trim()
                    : smtpUsername;

            // 3. Sender Resolution: First priority = Logged-in user's office email;
            // fallback = Company Mail
            String fromEmail = null;
            String senderDisplayName = (company.getCompanyName() != null && !company.getCompanyName().isBlank())
                    ? company.getCompanyName().trim() + " HR Team"
                    : "NUTECH HR TEAM";
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }

            if (currentUserId != null) {
                Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
                if (empId != null) {
                    Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                    if (senderEmpOpt.isPresent()) {
                        EmployeeMaster senderEmp = senderEmpOpt.get();
                        if (senderEmp.getEmployeeName() != null && !senderEmp.getEmployeeName().isBlank()) {
                            senderDisplayName = senderEmp.getEmployeeName().trim();
                        }
                        if (senderEmp.getOfficeMail() != null && !senderEmp.getOfficeMail().isBlank()
                                && senderEmp.getOfficeMail().contains("@")) {
                            fromEmail = senderEmp.getOfficeMail().trim();
                            log.info("[ATS Auto-Rejection Email] Resolved sender from logged-in user office mail: {}",
                                    fromEmail);
                        }
                    }
                }
            }
            if (fromEmail == null || fromEmail.isBlank()) {
                fromEmail = companyEmail;
                log.info("[ATS Auto-Rejection Email] Falling back to Company Mail as sender: {}", fromEmail);
            }

            // 4. Resolve candidate / position / company placeholders
            String candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
            if (candidateFullName.isEmpty()) {
                candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName() : "Candidate";
            }
            String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                    .getCandidateFirstName(candidateFullName);

            String departmentName = "HR";
            if (applicant.getDepartmentId() != null) {
                Optional<Department> deptOpt = departmentRepo.findById(applicant.getDepartmentId());
                if (deptOpt.isPresent()) {
                    departmentName = deptOpt.get().getDepartmentName();
                }
            }

            String companyName = (company.getCompanyName() != null && !company.getCompanyName().isBlank())
                    ? company.getCompanyName().trim()
                    : "NUTECH WIND PARTS PVT LTD";
            String companyAddress = ((company.getAddress() != null ? company.getAddress() : "") + ", " +
                    (company.getCity() != null ? company.getCity() : "") + " - " +
                    (company.getPincode() != null ? company.getPincode() : "")).trim();
            if (companyAddress.isBlank() || companyAddress.equals("-") || companyAddress.equals(",")) {
                companyAddress = "Tamil Nadu, India";
            }

            String position = "";
            if (applicant.getDesignationId() != null) {
                position = designationRepo.findById(applicant.getDesignationId())
                        .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                        .orElse("");
            }
            if (position.isEmpty()) {
                position = "Position";
            }

            Map<String, Object> placeholders = new HashMap<>();
            placeholders.put("candidateName", candidateFirstName);
            placeholders.put("candidateFirstName", candidateFirstName);
            placeholders.put("candidateFullName", candidateFullName);
            placeholders.put("candidateEmail", candidateEmail);
            placeholders.put("position", position);
            placeholders.put("designation", position);
            placeholders.put("department", departmentName);
            placeholders.put("companyName", companyName);
            placeholders.put("companyAddress", companyAddress);
            placeholders.put("companyMail", companyEmail);
            placeholders.put("hrName", senderDisplayName);
            placeholders.put("hrEmail", fromEmail);
            placeholders.put("officeEmail", fromEmail);
            placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
            placeholders.put("currentYear",
                    String.valueOf(java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)));

            // 5. Template Resolution: Priority 1: Email Content Master (REJECTION /
            // REJECTED); Priority 2: Hardcoded fallback
            com.autonoma.erp.modules.platform.notification.entity.EmailContent templateEntity = null;
            try {
                Optional<com.autonoma.erp.modules.platform.notification.entity.EmailContent> configuredOpt = emailContentService
                        .getActiveTemplateByType("REJECTION");
                if (configuredOpt.isEmpty()) {
                    configuredOpt = emailContentService.getActiveTemplateByType("REJECTED");
                }
                if (configuredOpt.isPresent()) {
                    templateEntity = configuredOpt.get();
                    log.info("[ATS Auto-Rejection Email] Using configured Email Content Master template: {}",
                            templateEntity.getType());
                }
            } catch (Exception ex) {
                log.warn("[ATS Auto-Rejection Email] Error fetching configured template: {}", ex.getMessage());
            }

            if (templateEntity == null) {
                templateEntity = emailDefaultTemplates.getDefaultTemplate("REJECTION");
                log.info("[ATS Auto-Rejection Email] Using hardcoded fallback rejection template");
            }

            // Render through master HTML layout engine
            com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                    .render(templateEntity, placeholders);

            String finalSubject = rendered.getSubject();
            String finalHtmlBody = rendered.getFullMasterHtml();

            // 6. Configure JavaMailSender dynamically
            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(company.getSmtpHost());
            if (company.getSmtpPort() != null) {
                mailSender.setPort(company.getSmtpPort());
            }
            mailSender.setUsername(smtpUsername);
            mailSender.setPassword(smtpPassword);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
                props.put("mail.smtp.ssl.enable", "true");
            }
            props.put("mail.smtp.connectiontimeout", "15000");
            props.put("mail.smtp.timeout", "15000");
            props.put("mail.smtp.writetimeout", "15000");

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String cleanFrom = fromEmail != null ? fromEmail.trim() : smtpUsername;
            try {
                helper.setFrom(new jakarta.mail.internet.InternetAddress(cleanFrom, senderDisplayName));
            } catch (Exception ex) {
                helper.setFrom(cleanFrom);
            }

            helper.setTo(candidateEmail);
            helper.setSubject(finalSubject);
            helper.setText(finalHtmlBody, true);

            mailSender.send(mimeMessage);
            log.info("[ATS Auto-Rejection Email] Successfully sent automatic rejection email to candidate: {}",
                    candidateEmail);
        } catch (Exception e) {
            log.error("[ATS Auto-Rejection Email] Failed to send automatic rejection email for applicant ID {}: {}",
                    applicant.getId(), e.getMessage(), e);
            // Do NOT throw; candidate rejection status is safely persisted in the database.
        }
    }

    @GetMapping("/onboarding-tracking")
    @RequirePagePermission(pageCode = "HA1360", action = "read")
    @Operation(summary = "Get all employee onboarding tracking records")
    public List<Map<String, Object>> getOnboardingTracking() {
        List<EmployeeMaster> employees = employeeRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (EmployeeMaster emp : employees) {
            if (emp.getIsActive() != null && !emp.getIsActive()) {
                continue;
            }
            if (!"ATS".equalsIgnoreCase(emp.getFromWhere())) {
                continue;
            }
            String code = emp.getEmpCode() != null ? emp.getEmpCode() : emp.getApplicantCode();
            String atsCode = emp.getApplicantCode() != null && !emp.getApplicantCode().trim().isEmpty()
                    ? emp.getApplicantCode()
                    : emp.getEmpCode();
            String empCodeVal = emp.getEmpCode();

            Map<String, Object> map = new HashMap<>();
            map.put("id", emp.getId());
            map.put("enRolledNo", atsCode);
            map.put("employeeId", atsCode);
            map.put("empCode", empCodeVal);
            map.put("firstName", emp.getFirstName() != null ? emp.getFirstName() : "");
            map.put("lastName", emp.getLastName() != null ? emp.getLastName() : "");
            map.put("employeeName",
                    emp.getEmployeeName() != null ? emp.getEmployeeName()
                            : (emp.getFirstName() != null ? emp.getFirstName().trim() : ""));
            map.put("department", emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "N/A");
            map.put("designation", emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "N/A");
            map.put("positionLookFor",
                    emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "N/A");
            map.put("backgroundVerificationStatus",
                    emp.getBackgroundVerificationStatus() != null ? emp.getBackgroundVerificationStatus() : "PENDING");

            // 6. Recruitment Date
            Date recruitDate = emp.getApplicantDate() != null ? emp.getApplicantDate() : emp.getCreatedDate();
            map.put("recruitmentDate",
                    recruitDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(recruitDate) : "N/A");

            // 7. Interview Completion Date
            List<HraApplicantInterview> rawInterviews = applicantInterviewRepo.findByEmployeeId(emp.getId());
            List<HraApplicantInterview> interviews = new ArrayList<>();
            for (HraApplicantInterview iv : rawInterviews) {
                boolean active = (iv.getIsActive() == null || iv.getIsActive())
                        && isInterviewStatusActive(iv.getStatus());
                if (active) {
                    interviews.add(iv);
                }
            }
            Date interviewCompDate = null;
            for (HraApplicantInterview interview : interviews) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster ivStatusObj = interview
                        .getInterviewStatus();
                String ivStatus = ivStatusObj != null ? ivStatusObj.getName() : null;
                if ("COMPLETED".equalsIgnoreCase(ivStatus)
                        || "PASS".equalsIgnoreCase(ivStatus)
                        || "SELECTED".equalsIgnoreCase(ivStatus)) {
                    try {
                        Date parsed = new SimpleDateFormat("yyyy-MM-dd").parse(interview.getInterviewDate());
                        if (interviewCompDate == null || parsed.after(interviewCompDate)) {
                            interviewCompDate = parsed;
                        }
                    } catch (Exception e) {
                    }
                }
            }
            map.put("interviewCompletionDate",
                    interviewCompDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(interviewCompDate) : "N/A");

            // 8. Offer Letter Generated Date
            Date offerGenDate = null;
            com.autonoma.erp.modules.platform.common.entity.StatusMaster offerStatusObj = emp.getOfferStatus();
            String offerStatus = offerStatusObj != null ? offerStatusObj.getName() : null;
            if (offerStatus != null && !"PENDING".equalsIgnoreCase(offerStatus)) {
                offerGenDate = emp.getUpdatedDate() != null ? emp.getUpdatedDate() : emp.getCreatedDate();
            }
            map.put("offerLetterGeneratedDate",
                    offerGenDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(offerGenDate) : "N/A");

            // 9. Offer Letter Accepted Date
            Date offerAccDate = null;
            if ("SUBMITTED".equalsIgnoreCase(offerStatus)
                    || "TO BE VERIFIED".equalsIgnoreCase(offerStatus)
                    || "TO BE VERIFY".equalsIgnoreCase(offerStatus)
                    || "ACCEPTED".equalsIgnoreCase(offerStatus)) {
                offerAccDate = emp.getUpdatedDate() != null ? emp.getUpdatedDate() : emp.getCreatedDate();
            }
            map.put("offerLetterAcceptedDate",
                    offerAccDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(offerAccDate) : "N/A");

            // 10. Internship Start Date
            boolean isIntern = false;
            if (emp.getDesignation() != null && emp.getDesignation().getDesignationName() != null) {
                isIntern = emp.getDesignation().getDesignationName().toUpperCase().contains("INTERN");
            }
            Date internStartDate = isIntern ? emp.getDateOfJoining() : null;
            map.put("internshipStartDate",
                    internStartDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(internStartDate) : "N/A");

            // 11. Internship Completion Date
            Date internCompDate = (isIntern && emp.getConfirmationDate() != null) ? emp.getConfirmationDate() : null;
            map.put("internshipCompletionDate",
                    internCompDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(internCompDate) : "N/A");

            // 12. Induction Program Date
            List<InductionAssignment> inductions = inductionAssignmentRepo.findByEmpCode(code);
            Date inductionDate = null;
            for (InductionAssignment ind : inductions) {
                if (ind.getInductionDate() != null) {
                    if (inductionDate == null || ind.getInductionDate().after(inductionDate)) {
                        inductionDate = ind.getInductionDate();
                    }
                }
            }
            map.put("inductionProgramDate",
                    inductionDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(inductionDate) : "N/A");

            // 13. Document Verification Date
            Date docVerDate = null;
            com.autonoma.erp.modules.platform.common.entity.StatusMaster verificationStatusObj = emp
                    .getVerificationStatus();
            String verificationStatus = verificationStatusObj != null ? verificationStatusObj.getName() : null;
            if ("VERIFIED".equalsIgnoreCase(verificationStatus)) {
                docVerDate = emp.getUpdatedDate() != null ? emp.getUpdatedDate() : emp.getCreatedDate();
            }
            map.put("documentVerificationDate",
                    docVerDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(docVerDate) : "N/A");

            // 14. Joining Date
            map.put("joiningDate",
                    emp.getDateOfJoining() != null ? new SimpleDateFormat("yyyy-MM-dd").format(emp.getDateOfJoining())
                            : "N/A");

            // 15. Onboarding Completion Date
            Date onboardCompDate = null;
            if (emp.getStatus() != null && "Active".equalsIgnoreCase(emp.getStatus().getName())
                    && code.startsWith("EMP-")) {
                onboardCompDate = emp.getDateOfJoining() != null ? emp.getDateOfJoining() : emp.getUpdatedDate();
            }
            map.put("onboardingCompletionDate",
                    onboardCompDate != null ? new SimpleDateFormat("yyyy-MM-dd").format(onboardCompDate) : "N/A");

            // 16. Current Onboarding Status
            String onboardingStatus = "Recruited";
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empStatusObj = emp.getStatus();
            String empStatus = empStatusObj != null ? empStatusObj.getName() : null;
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empVerObj = emp.getVerificationStatus();
            String empVer = empVerObj != null ? empVerObj.getName() : null;
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empOfferObj = emp.getOfferStatus();
            String empOffer = empOfferObj != null ? empOfferObj.getName() : null;
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empIntObj = emp.getInterviewStatus();
            String empInt = empIntObj != null ? empIntObj.getName() : null;
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empCallObj = emp.getCallStatus();
            String empCall = empCallObj != null ? empCallObj.getName() : null;

            if ("Active".equalsIgnoreCase(empStatus) && code.startsWith("EMP-")) {
                onboardingStatus = "Completed";
            } else if ("VERIFIED".equalsIgnoreCase(empVer)) {
                onboardingStatus = "Documents Verified";
            } else if ("ACCEPTED".equalsIgnoreCase(empOffer)) {
                onboardingStatus = "Offer Accepted";
            } else if ("SUBMITTED".equalsIgnoreCase(empOffer) || "TO BE VERIFIED".equalsIgnoreCase(empOffer)
                    || "TO BE VERIFY".equalsIgnoreCase(empOffer)) {
                onboardingStatus = "Documents Submitted";
            } else if ("ISSUED".equalsIgnoreCase(empOffer)) {
                onboardingStatus = "Offer Letter Sent";
            } else if ("SCHEDULED".equalsIgnoreCase(empInt) || "ON PROGRESS".equalsIgnoreCase(empInt)
                    || "IN PROGRESS".equalsIgnoreCase(empInt)) {
                onboardingStatus = "Interviewing";
            } else if ("SENT".equalsIgnoreCase(empCall)) {
                onboardingStatus = "Call Letter Sent";
            }
            map.put("currentOnboardingStatus", onboardingStatus);

            // 17. Last Updated Date & Time
            Date lastUpdated = emp.getUpdatedDate() != null ? emp.getUpdatedDate() : emp.getCreatedDate();
            map.put("lastUpdatedDate",
                    lastUpdated != null ? new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(lastUpdated) : "N/A");

            result.add(map);
        }

        result.sort((r1, r2) -> ((Long) r2.get("id")).compareTo((Long) r1.get("id")));

        return result;
    }

    private boolean isInterviewStatusActive(String statusStr) {
        if (statusStr == null) {
            return true;
        }
        String trimmed = statusStr.trim();
        if ("INACTIVE".equalsIgnoreCase(trimmed)) {
            return false;
        }
        if (statusResolver != null) {
            com.autonoma.erp.modules.platform.common.entity.StatusMaster sm = statusResolver.get(trimmed);
            if (sm != null) {
                return !"Inactive".equalsIgnoreCase(sm.getName());
            }
        }
        return true;
    }

    private com.autonoma.erp.modules.platform.common.entity.StatusMaster computeDynamicStatus(
            HraApplicantInterview current,
            List<HraApplicantInterview> candidateInterviews) {
        if (current == null) {
            return statusResolver.get("PENDING");
        }
        boolean isCurrentActive = (current.getIsActive() == null || current.getIsActive())
                && isInterviewStatusActive(current.getStatus());
        if (!isCurrentActive) {
            com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatusObj = current
                    .getInterviewStatus();
            String currentStatus = currentStatusObj != null ? currentStatusObj.getName() : null;
            if (currentStatus == null || "PENDING".equalsIgnoreCase(currentStatus.trim())
                    || "WAITING FOR PROGRESS".equalsIgnoreCase(currentStatus.trim())) {
                return statusResolver.get("CANCELLED");
            }
            return currentStatusObj != null ? currentStatusObj : statusResolver.get("INACTIVE");
        }

        Optional<EmployeeMaster> empOpt = employeeRepo.findById(current.getEmployeeId());
        if (empOpt.isPresent()) {
            EmployeeMaster emp = empOpt.get();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empStatus = emp.getStatus();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empIvStatus = emp.getInterviewStatus();
            com.autonoma.erp.modules.platform.common.entity.StatusMaster empOverall = emp.getAtsOverallStatus();

            boolean isCandidateFinalized = (empStatus != null
                    && (statusResolver.isSelected(empStatus) || statusResolver.isRejected(empStatus)
                            || statusResolver.isHold(empStatus) || statusResolver.isCancelled(empStatus)))
                    || (empIvStatus != null
                            && (statusResolver.isSelected(empIvStatus) || statusResolver.isRejected(empIvStatus)
                                    || statusResolver.isHold(empIvStatus) || statusResolver.isCancelled(empIvStatus)))
                    || (empOverall != null
                            && (statusResolver.isSelected(empOverall) || statusResolver.isRejected(empOverall)
                                    || statusResolver.isHold(empOverall) || statusResolver.isCancelled(empOverall)));

            boolean isCurrentEvaluated = (current.getFeedbackJson() != null
                    && !current.getFeedbackJson().trim().isEmpty() && !"[]".equals(current.getFeedbackJson().trim()))
                    || (current.getInterviewResult() != null && (statusResolver.isSelected(current.getInterviewResult())
                            || statusResolver.isRejected(current.getInterviewResult())
                            || statusResolver.isHold(current.getInterviewResult())));

            if (isCandidateFinalized && !isCurrentEvaluated) {
                return statusResolver.get("CANCELLED");
            }
        }

        com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatusObj = current.getInterviewStatus();
        if (currentStatusObj == null) {
            currentStatusObj = statusResolver.get("PENDING");
        }
        String currentStatus = currentStatusObj.getName();
        if (!"PENDING".equalsIgnoreCase(currentStatus) &&
                !"WAITING FOR PROGRESS".equalsIgnoreCase(currentStatus)) {
            return currentStatusObj;
        }

        if (candidateInterviews == null || candidateInterviews.isEmpty()) {
            if ("1".equals(current.getScreeningLevel())) {
                if (isWithinTenMinutesOfStartTime(current)) {
                    return statusResolver.get("WAITING FOR PROGRESS");
                }
                return statusResolver.get("PENDING");
            } else {
                return statusResolver.get("WAITING FOR PROGRESS");
            }
        }

        // Filter to only include active interviews
        List<HraApplicantInterview> activeInterviews = new ArrayList<>();
        for (HraApplicantInterview interview : candidateInterviews) {
            boolean active = (interview.getIsActive() == null || interview.getIsActive())
                    && isInterviewStatusActive(interview.getStatus());
            if (active) {
                activeInterviews.add(interview);
            }
        }

        if (activeInterviews.isEmpty()) {
            if ("1".equals(current.getScreeningLevel())) {
                if (isWithinTenMinutesOfStartTime(current)) {
                    return statusResolver.get("WAITING FOR PROGRESS");
                }
                return statusResolver.get("PENDING");
            } else {
                return statusResolver.get("WAITING FOR PROGRESS");
            }
        }

        // Sort all active candidate interviews sequentially by screeningLevel and ID
        List<HraApplicantInterview> sorted = new ArrayList<>(activeInterviews);
        sorted.sort((a, b) -> {
            try {
                int aVal = Integer.parseInt(a.getScreeningLevel());
                int bVal = Integer.parseInt(b.getScreeningLevel());
                if (aVal != bVal) {
                    return Integer.compare(aVal, bVal);
                }
            } catch (Exception e) {
                String aStr = a.getScreeningLevel() != null ? a.getScreeningLevel().trim() : "";
                String bStr = b.getScreeningLevel() != null ? b.getScreeningLevel().trim() : "";
                if (!aStr.equalsIgnoreCase(bStr)) {
                    return aStr.compareToIgnoreCase(bStr);
                }
            }
            Long aId = a.getId() != null ? a.getId() : 0L;
            Long bId = b.getId() != null ? b.getId() : 0L;
            return aId.compareTo(bId);
        });

        // Find the index of current
        int index = -1;
        for (int i = 0; i < sorted.size(); i++) {
            if (sorted.get(i).getId() != null && sorted.get(i).getId().equals(current.getId())) {
                index = i;
                break;
            }
        }

        if (index == -1) {
            if ("1".equals(current.getScreeningLevel())) {
                if (isWithinTenMinutesOfStartTime(current)) {
                    return statusResolver.get("WAITING FOR PROGRESS");
                }
                return statusResolver.get("PENDING");
            } else {
                return statusResolver.get("WAITING FOR PROGRESS");
            }
        }

        // First interview in sequence -> check 10-minute accessibility window
        if (index == 0) {
            if ("1".equals(current.getScreeningLevel())) {
                if (isWithinTenMinutesOfStartTime(current)) {
                    return statusResolver.get("WAITING FOR PROGRESS");
                }
                return statusResolver.get("PENDING");
            } else {
                return statusResolver.get("WAITING FOR PROGRESS");
            }
        }

        // Subsequent interview -> check only if immediately previous round was
        // completed/evaluated
        HraApplicantInterview prev = sorted.get(index - 1);
        com.autonoma.erp.modules.platform.common.entity.StatusMaster prevStatusObj = prev.getInterviewStatus();
        com.autonoma.erp.modules.platform.common.entity.StatusMaster prevResultObj = prev.getInterviewResult();
        String prevStatus = prevStatusObj != null ? prevStatusObj.getName() : null;
        String prevResult = prevResultObj != null ? prevResultObj.getName() : null;
        boolean isPrevCompleted = (prevStatus != null &&
                !"PENDING".equalsIgnoreCase(prevStatus.trim()) &&
                !"WAITING FOR PROGRESS".equalsIgnoreCase(prevStatus.trim()) &&
                !"WAITING FOR PROCESS".equalsIgnoreCase(prevStatus.trim()))
                || (prevResult != null &&
                        !"PENDING".equalsIgnoreCase(prevResult.trim()) &&
                        !"WAITING FOR PROGRESS".equalsIgnoreCase(prevResult.trim()) &&
                        !"WAITING FOR PROCESS".equalsIgnoreCase(prevResult.trim()))
                || (prev.getFeedbackJson() != null && !prev.getFeedbackJson().trim().isEmpty()
                        && !"[]".equals(prev.getFeedbackJson().trim()));

        if (isPrevCompleted) {
            return statusResolver.get("WAITING FOR PROGRESS");
        }

        return statusResolver.get("PENDING");
    }

    private boolean isWithinTenMinutesOfStartTime(HraApplicantInterview interview) {
        if (interview == null || interview.getInterviewDate() == null || interview.getStartTime() == null) {
            return false;
        }
        try {
            java.time.LocalDate date = null;
            String dateStr = interview.getInterviewDate().trim();
            if (dateStr.contains(" ")) {
                dateStr = dateStr.split(" ")[0]; // e.g. "2026-07-23"
            }

            try {
                if (dateStr.contains("/")) {
                    java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("d/M/yyyy");
                    date = java.time.LocalDate.parse(dateStr, dtf);
                } else {
                    date = java.time.LocalDate.parse(dateStr);
                }
            } catch (Exception ex) {
                log.warn("Failed to parse date string: {}", dateStr, ex);
                return false;
            }

            java.time.LocalTime time = null;
            String timeStr = interview.getStartTime().trim().toUpperCase();
            if (timeStr.contains(".")) {
                timeStr = timeStr.split("\\.")[0]; // e.g. "22:25:00"
            }

            try {
                if (timeStr.contains("AM") || timeStr.contains("PM")) {
                    java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("h:m a",
                            java.util.Locale.ENGLISH);
                    try {
                        time = java.time.LocalTime.parse(timeStr, dtf);
                    } catch (Exception ex) {
                        time = java.time.LocalTime.parse(timeStr,
                                java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH));
                    }
                } else {
                    if (timeStr.length() == 5) {
                        time = java.time.LocalTime.parse(timeStr,
                                java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
                    } else if (timeStr.length() == 8) {
                        time = java.time.LocalTime.parse(timeStr,
                                java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"));
                    } else {
                        time = java.time.LocalTime.parse(timeStr);
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to parse time string: {}", timeStr, ex);
                return false;
            }

            java.time.LocalDateTime interviewDateTime = java.time.LocalDateTime.of(date, time);
            java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
            java.time.LocalDateTime tenMinutesBefore = interviewDateTime.minusMinutes(10);

            return !now.isBefore(tenMinutesBefore);
        } catch (Exception e) {
            log.error("Error in isWithinTenMinutesOfStartTime: {}", e.getMessage(), e);
            return false;
        }
    }

    private boolean isAuthorizedInterviewer(HraApplicantInterview interview) {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ex) {
        }
        if (currentUserId == null) {
            return false;
        }
        String originalTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        Optional<UserCredential> userOpt = Optional.empty();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            userOpt = userRepo.findByUserId(currentUserId);
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(originalTenant);
        }
        if (!userOpt.isPresent()) {
            return false;
        }
        UserCredential user = userOpt.get();

        // Strict Admin Bypass check (only userLevel >= 5 or username SUPER BOSS/ADMIN
        // allowed)
        boolean isAdmin = (user.getUserLevel() != null && user.getUserLevel() >= 5)
                || "SUPER BOSS".equalsIgnoreCase(user.getUserId()) || "ADMIN".equalsIgnoreCase(user.getUserId());
        if (isAdmin) {
            return true;
        }

        Long empId = user.getEmpId();
        if (empId == null) {
            return false; // Do not grant admin privilege just because empId is null
        }
        Optional<EmployeeMaster> empOpt = employeeRepo.findById(empId);
        if (!empOpt.isPresent()) {
            return false;
        }
        String currentEmployeeName = empOpt.get().getEmployeeName();
        if (currentEmployeeName == null) {
            return false;
        }
        String person = interview.getInterviewPerson();
        if (person == null) {
            return false;
        }
        String cleanPerson = person.trim();
        String cleanEmployeeName = currentEmployeeName.trim();
        boolean matches = cleanPerson.equalsIgnoreCase(cleanEmployeeName);
        if (!matches && cleanPerson.contains(" - ")) {
            String[] parts = cleanPerson.split(" - ", 2);
            if (parts.length > 1 && parts[1].trim().equalsIgnoreCase(cleanEmployeeName)) {
                matches = true;
            }
        }
        return matches;
    }

    @GetMapping("/{id:[0-9]+}/offer-documents")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get candidate offer/onboarding documents")
    public ResponseEntity<?> getOfferDocuments(@PathVariable Long id) {
        List<Map<String, Object>> docs = atsAttachmentService.getOfferDocuments(id);
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/{id}/rejected-documents")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get candidate active rejected documents")
    public ResponseEntity<?> getActiveRejectedDocuments(@PathVariable Long id) {
        List<AtsRejectedDocument> active = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                id, AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));
        List<Map<String, Object>> list = new java.util.ArrayList<>();
        for (AtsRejectedDocument rd : active) {
            list.add(Map.of(
                    "documentName", rd.getDocumentName(),
                    "rejectReason", rd.getRejectReason()));
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}/verify-offer-documents")
    @RequirePagePermission(pageCode = "HA1110", action = "write")
    @Operation(summary = "Verify candidate offer/onboarding documents")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> verifyOfferDocuments(@PathVariable Long id, @RequestBody Map<String, Object> payload,
            jakarta.servlet.http.HttpServletRequest request) {
        return employeeRepo.findById(id).map(applicant -> {
            boolean isApproved = Boolean.TRUE.equals(payload.get("isApproved"));
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception ignored) {
            }

            if (!isApproved) {
                List<Map<String, Object>> rejectedDocs = (List<Map<String, Object>>) payload.get("rejectedDocs");
                if (rejectedDocs != null && !rejectedDocs.isEmpty()) {
                    emailContentService.getTemplateOrThrow("DOCUMENT REUPLOAD");
                }
            }
            if (isApproved) {
                applicant.setOfferStatus(statusResolver.get("Verified"));
                computeAndSetAtsOverallStatus(applicant);

                // Resolve all active onboarding rejections
                List<AtsRejectedDocument> prevActive = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                        applicant.getId(), AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));
                for (AtsRejectedDocument doc : prevActive) {
                    doc.setActiveStatus(statusResolver.get("CLOSED"));
                    doc.setUpdatedBy(currentUserId != null ? currentUserId : "SYSTEM");
                    doc.setUpdatedDate(new Date());
                    rejectedDocumentRepo.save(doc);
                }
            } else {
                applicant.setOfferStatus(statusResolver.get("To Be Verified"));

                // Send rejection email if rejectedDocs is provided
                List<Map<String, Object>> rejectedDocs = (List<Map<String, Object>>) payload.get("rejectedDocs");
                if (rejectedDocs != null && !rejectedDocs.isEmpty()) {
                    try {
                        Optional<EmployeePersonalDetail> personalOpt = personalRepo
                                .findFirstByEmployeeId(applicant.getId());
                        String candidateEmail = personalOpt.map(EmployeePersonalDetail::getPersonalEmail)
                                .orElse(applicant.getOfficeMail());

                        if (candidateEmail != null && !candidateEmail.trim().isEmpty()) {
                            StringBuilder rejectedList = new StringBuilder();
                            StringBuilder reasons = new StringBuilder();

                            StringBuilder tableHtml = new StringBuilder();
                            tableHtml.append(
                                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"10\" style=\"border-collapse:collapse; margin-top:14px; margin-bottom:16px; font-size:14px; font-family:sans-serif;\">");
                            tableHtml.append("<thead>");
                            tableHtml
                                    .append("<tr style=\"background-color:#fee2e2; color:#991b1b; text-align:left;\">");
                            tableHtml.append(
                                    "<th style=\"padding:10px 12px; border:1px solid #fca5a5; font-weight:700; width:40%;\">Rejected Document</th>");
                            tableHtml.append(
                                    "<th style=\"padding:10px 12px; border:1px solid #fca5a5; font-weight:700; width:60%;\">Reason for Rejection</th>");
                            tableHtml.append("</tr>");
                            tableHtml.append("</thead>");
                            tableHtml.append("<tbody>");

                            List<String> rejectedDocNames = new ArrayList<>();
                            for (Map<String, Object> doc : rejectedDocs) {
                                rejectedDocNames.add((String) doc.get("name"));
                            }

                            // Auto-resolve any onboarding documents not in the new rejected list
                            List<AtsRejectedDocument> prevActive = rejectedDocumentRepo
                                    .findByEmployeeIdAndStageAndActiveStatus(
                                            applicant.getId(), AtsRejectionStage.ONBOARDING,
                                            statusResolver.get("Active"));
                            for (AtsRejectedDocument doc : prevActive) {
                                if (!rejectedDocNames.contains(doc.getDocumentName())) {
                                    doc.setActiveStatus(statusResolver.get("CLOSED"));
                                    doc.setUpdatedBy(currentUserId != null ? currentUserId : "SYSTEM");
                                    doc.setUpdatedDate(new Date());
                                    rejectedDocumentRepo.save(doc);
                                }
                            }

                            for (Map<String, Object> doc : rejectedDocs) {
                                String name = (String) doc.get("name");
                                String reason = (String) doc.get("reason");
                                if (reason == null || reason.isBlank()) {
                                    reason = "Re-upload required.";
                                }
                                rejectedList.append("• ").append(name).append(": ").append(reason).append("\n");
                                reasons.append(name).append(": ").append(reason).append(" | ");

                                tableHtml.append("<tr>");
                                tableHtml.append(
                                        "<td style=\"padding:10px 12px; border:1px solid #fecaca; font-weight:600; color:#0f172a;\">")
                                        .append(com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                                .escapeHtml(name))
                                        .append("</td>");
                                tableHtml.append(
                                        "<td style=\"padding:10px 12px; border:1px solid #fecaca; color:#334155;\">")
                                        .append(com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                                .escapeHtml(reason))
                                        .append("</td>");
                                tableHtml.append("</tr>");

                                createOrUpdateRejection(applicant.getId(), AtsRejectionStage.ONBOARDING, name, reason,
                                        currentUserId);
                            }

                            tableHtml.append("</tbody>");
                            tableHtml.append("</table>");

                            String candidateFullName = applicant.getFirstName() != null
                                    ? applicant.getFirstName().trim()
                                    : "";
                            if (candidateFullName.isEmpty())
                                candidateFullName = applicant.getEmployeeName() != null ? applicant.getEmployeeName()
                                        : "Candidate";
                            String candidateFirstName = com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine
                                    .getCandidateFirstName(candidateFullName);

                            String origin = resolveOrigin(request);
                            String token = portalTokenService.generateAndSaveToken(applicant.getId(),
                                    "REJECTED_DOCUMENT",
                                    applicant.getApplicantCode() != null ? applicant.getApplicantCode()
                                            : applicant.getEmpCode(),
                                    currentUserId);
                            String targetId = null;
                            if (rejectedDocs != null && !rejectedDocs.isEmpty()) {
                                targetId = (String) rejectedDocs.get(0).get("id");
                            }
                            String reuploadPortalLink = String.format("%s/candidate/document-reupload?token=%s", origin,
                                    token);
                            if (targetId != null && !targetId.trim().isEmpty()) {
                                reuploadPortalLink += "&targetId=" + targetId;
                            }

                            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant()
                                    .orElse(null);
                            String companyNameStr = (company != null && company.getCompanyName() != null)
                                    ? company.getCompanyName()
                                    : "NUTECH WIND PARTS PVT LTD";

                            Map<String, Object> placeholders = new HashMap<>();
                            placeholders.put("candidateName", candidateFirstName);
                            placeholders.put("candidateFirstName", candidateFirstName);
                            placeholders.put("candidateFullName", candidateFullName);
                            placeholders.put("candidateEmail", candidateEmail);
                            placeholders.put("rejectedDocumentsList", rejectedList.toString());
                            placeholders.put("rejectedDocumentsTable", tableHtml.toString());
                            placeholders.put("rejectionReason", reasons.toString());
                            placeholders.put("reuploadPortalLink", reuploadPortalLink);
                            placeholders.put("onboardingPortalLink", reuploadPortalLink);
                            placeholders.put("portalLink", reuploadPortalLink);
                            placeholders.put("validityDays", "2");
                            placeholders.put("supportContact", "hr@autonomaerp.com");
                            placeholders.put("companyName", companyNameStr);
                            placeholders.put("websiteUrl",
                                    (company != null && company.getWebsite() != null) ? company.getWebsite()
                                            : "https://www.autonomaerp.com");

                            com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService
                                    .getTemplateOrThrow("DOCUMENT REUPLOAD");
                            com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine
                                    .render(template, placeholders);

                            if (emailSendingService != null) {
                                emailSendingService.sendEmailWithAttachments(candidateEmail, null, null,
                                        rendered.getSubject(), rendered.getFullMasterHtml(), null);
                                log.info("Onboarding Document Reupload email successfully sent to {}", candidateEmail);
                            }
                        }
                    } catch (Exception emailEx) {
                        log.warn("Failed to send Onboarding Document Reupload email: {}", emailEx.getMessage());
                    }
                }
            }
            employeeRepo.save(applicant);
            return ResponseEntity.ok(mapEmployeeToFullMap(applicant));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id:[0-9]+}/verification-responses")
    @RequirePagePermission(pageCode = "HA1110", action = "read")
    @Operation(summary = "Get HR Manager and Vertical Head verification responses")
    public ResponseEntity<?> getVerificationResponses(@PathVariable Long id) {
        String subSql = "SELECT ROLE, NAME, EMAIL, PHONE, IS_SUBMITTED, SUBMITTED_DATE FROM HR_APPLICANT_VERIFICATION_SUBMISSION WHERE EMPLOYEE_ID = ?";
        List<Map<String, Object>> submissions = jdbcTemplate.queryForList(subSql, id);

        String respSql = "SELECT r.ID, r.ROLE, r.RATING, r.FEEDBACK, r.REASON, r.SUBMITTED_DATE, c.DESCRIPTION AS questionText "
                +
                "FROM HR_APPLICANT_VERIFICATION_RESPONSE r " +
                "LEFT JOIN HR_VERIFICATION_CRITERIA c ON r.QUESTION_ID = c.ID " +
                "WHERE r.EMPLOYEE_ID = ? " +
                "ORDER BY r.ROLE, r.QUESTION_ID";
        List<Map<String, Object>> responses = jdbcTemplate.queryForList(respSql, id);

        Map<String, Object> result = new HashMap<>();
        result.put("submissions", submissions);
        result.put("responses", responses);
        return ResponseEntity.ok(result);
    }

    private void autoResolveDocumentRejection(Long employeeId, AtsRejectionStage stage, String documentName,
            boolean isApproved, String currentUserId) {
        if (isApproved) {
            Optional<AtsRejectedDocument> activeOpt = rejectedDocumentRepo
                    .findByEmployeeIdAndStageAndDocumentNameAndActiveStatus(
                            employeeId, stage, documentName, statusResolver.get("Active"));
            if (activeOpt.isPresent()) {
                AtsRejectedDocument doc = activeOpt.get();
                doc.setActiveStatus(statusResolver.get("CLOSED"));
                doc.setUpdatedBy(currentUserId != null && !"SYSTEM".equalsIgnoreCase(currentUserId) ? currentUserId
                        : "SUPER BOSS");
                doc.setUpdatedDate(new Date());
                rejectedDocumentRepo.save(doc);
            }
        }
    }

    private void createOrUpdateRejection(Long employeeId, AtsRejectionStage stage, String documentName,
            String rejectReason, String currentUserId) {
        Optional<AtsRejectedDocument> activeOpt = rejectedDocumentRepo
                .findByEmployeeIdAndStageAndDocumentNameAndActiveStatus(
                        employeeId, stage, documentName, statusResolver.get("Active"));
        if (activeOpt.isPresent()) {
            AtsRejectedDocument doc = activeOpt.get();
            doc.setActiveStatus(statusResolver.get("CLOSED"));
            doc.setUpdatedBy(
                    currentUserId != null && !"SYSTEM".equalsIgnoreCase(currentUserId) ? currentUserId : "SUPER BOSS");
            doc.setUpdatedDate(new Date());
            rejectedDocumentRepo.save(doc);
        }

        AtsRejectedDocument newDoc = new AtsRejectedDocument();
        newDoc.setEmployeeId(employeeId);
        newDoc.setStage(stage);
        newDoc.setDocumentName(documentName);
        newDoc.setRejectReason(rejectReason);
        newDoc.setActiveStatus(statusResolver.get("Active"));
        newDoc.setCreatedBy(
                currentUserId != null && !"SYSTEM".equalsIgnoreCase(currentUserId) ? currentUserId : "SUPER BOSS");
        newDoc.setCreatedDate(new Date());
        rejectedDocumentRepo.save(newDoc);
    }

    @SuppressWarnings("unchecked")
    private void checkAndResolveRejections(Long empId, Map<String, Object> payload) {
        List<AtsRejectedDocument> activeRejs = rejectedDocumentRepo.findByEmployeeIdAndStageAndActiveStatus(
                empId, AtsRejectionStage.ONBOARDING, statusResolver.get("Active"));
        if (activeRejs.isEmpty()) {
            return;
        }

        // Load old database records before they are overwritten
        List<EmployeeEducation> oldEdu = educationRepo.findByEmployeeId(empId);
        List<EmployeeExperience> oldExp = experienceRepo.findByEmployeeId(empId);
        List<EmployeeKycDocument> oldKyc = kycDocumentRepo.findByEmployeeId(empId);
        List<EmployeeActivity> oldSkills = activityRepo.findByEmployeeId(empId);

        List<Map<String, Object>> newEduList = (List<Map<String, Object>>) payload.get("education");
        List<Map<String, Object>> newExpList = (List<Map<String, Object>>) payload.get("experience");
        List<Map<String, Object>> newKycList = (List<Map<String, Object>>) payload.get("kyc");
        List<Map<String, Object>> newSkillList = (List<Map<String, Object>>) payload.get("skills");

        for (AtsRejectedDocument rd : activeRejs) {
            String docName = rd.getDocumentName();
            if (docName == null)
                continue;
            String cleanDoc = cleanString(docName);

            boolean replaced = false;

            // 1. Check Education
            for (EmployeeEducation edu : oldEdu) {
                String oldLabel = "Education - " + (edu.getEducation() != null ? edu.getEducation() : "")
                        + " - " + (edu.getInstitutionName() != null ? edu.getInstitutionName() : "");
                if (cleanString(oldLabel).contains(cleanDoc) || cleanDoc.contains(cleanString(oldLabel))
                        || (edu.getEducation() != null && cleanDoc.contains(cleanString(edu.getEducation())))) {
                    if (newEduList != null) {
                        for (Map<String, Object> newEdu : newEduList) {
                            String newEduName = getStringValue(newEdu, "education");
                            if (newEduName != null && newEduName.equalsIgnoreCase(edu.getEducation())) {
                                String newPath = getStringValue(newEdu, "filePath");
                                String oldPath = edu.getCertificateFile();
                                if (newPath != null && !newPath.trim().isEmpty()
                                        && !newPath.trim().equalsIgnoreCase(oldPath)) {
                                    replaced = true;
                                }
                                break;
                            }
                        }
                    }
                    break;
                }
            }

            // 2. Check Experience
            if (!replaced) {
                for (EmployeeExperience exp : oldExp) {
                    String oldLabel = "Experience - " + (exp.getCompanyName() != null ? exp.getCompanyName() : "");
                    if (cleanString(oldLabel).contains(cleanDoc) || cleanDoc.contains(cleanString(oldLabel))
                            || (exp.getCompanyName() != null && cleanDoc.contains(cleanString(exp.getCompanyName())))) {
                        if (newExpList != null) {
                            for (Map<String, Object> newExp : newExpList) {
                                String newCompany = getStringValue(newExp, "companyName");
                                if (newCompany != null && newCompany.equalsIgnoreCase(exp.getCompanyName())) {
                                    String newPath = getStringValue(newExp, "filePath");
                                    String oldPath = exp.getDocuments();
                                    if (newPath != null && !newPath.trim().isEmpty()
                                            && !newPath.trim().equalsIgnoreCase(oldPath)) {
                                        replaced = true;
                                    }
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            // 3. Check KYC
            if (!replaced) {
                for (EmployeeKycDocument kyc : oldKyc) {
                    String oldLabel = kyc.getDocumentName() != null ? kyc.getDocumentName() : "";
                    if (cleanString(oldLabel).contains(cleanDoc) || cleanDoc.contains(cleanString(oldLabel))) {
                        if (newKycList != null) {
                            for (Map<String, Object> newKyc : newKycList) {
                                String newDocName = getStringValue(newKyc, "docName");
                                if (newDocName != null && newDocName.equalsIgnoreCase(kyc.getDocumentName())) {
                                    String newPath = getStringValue(newKyc, "filePath");
                                    String oldPath = kyc.getAttachment();
                                    if (newPath != null && !newPath.trim().isEmpty()
                                            && !newPath.trim().equalsIgnoreCase(oldPath)) {
                                        replaced = true;
                                    }
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            // 4. Check Skills
            if (!replaced) {
                for (EmployeeActivity act : oldSkills) {
                    String oldLabel = "Skills - " + (act.getActivityDetails() != null ? act.getActivityDetails() : "");
                    if (cleanString(oldLabel).contains(cleanDoc) || cleanDoc.contains(cleanString(oldLabel))
                            || (act.getActivityDetails() != null
                                    && cleanDoc.contains(cleanString(act.getActivityDetails())))) {
                        if (newSkillList != null) {
                            for (Map<String, Object> newSkill : newSkillList) {
                                String newSkillName = getStringValue(newSkill, "activityDetails");
                                if (newSkillName != null && newSkillName.equalsIgnoreCase(act.getActivityDetails())) {
                                    String newPath = getStringValue(newSkill, "filePath");
                                    String oldPath = act.getFilePath();
                                    if (newPath != null && !newPath.trim().isEmpty()
                                            && !newPath.trim().equalsIgnoreCase(oldPath)) {
                                        replaced = true;
                                    }
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            if (replaced) {
                rd.setActiveStatus(statusResolver.get("SUBMITTED"));
                rd.setUpdatedBy("CANDIDATE");
                rd.setUpdatedDate(new Date());
                rejectedDocumentRepo.save(rd);
            }
        }
    }

    private void syncAadharAndPayslipAttachments(EmployeeMaster emp) {
        if (emp == null || emp.getId() == null) {
            return;
        }
        List<Map<String, Object>> kycList = null;
        if (emp.getAadharPath() != null && !emp.getAadharPath().isBlank()) {
            kycList = new ArrayList<>();
            Map<String, Object> kycMap = new HashMap<>();
            kycMap.put("docName", "Aadhaar Card");
            kycMap.put("filePath", emp.getAadharPath());
            kycList.add(kycMap);
        }
        List<Map<String, Object>> expList = null;
        if (emp.getPayslipPath() != null && !emp.getPayslipPath().isBlank()) {
            expList = new ArrayList<>();
            Map<String, Object> expMap = new HashMap<>();
            expMap.put("companyName", "Previous payslip");
            expMap.put("filePath", emp.getPayslipPath());
            expList.add(expMap);
        }
        if (kycList != null || expList != null) {
            atsAttachmentService.syncOnboardingFiles(emp.getId(), null, expList, kycList, null, "SYSTEM");
        }
    }

    private String cleanString(String s) {
        if (s == null)
            return "";
        return s.toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
