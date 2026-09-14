/*
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-09-01
 * Description: Business service for HRA offer letter persistence, status resolution,
 *              sequence allocation and downstream candidate-status synchronisation.
 */
package com.autonoma.erp.modules.hra.letters.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hra.letters.dto.OfferLetterDetailDto;
import com.autonoma.erp.modules.hra.letters.dto.OfferLetterSummaryDto;
import com.autonoma.erp.modules.hra.letters.entity.HraLetter;
import com.autonoma.erp.modules.hra.letters.repository.HraLetterRepository;
import com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.service.admin.AutoIdGenerationService;
import com.autonoma.erp.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;
import java.util.Set;

@Service
public class HraLetterService {

    private static final Logger log = LoggerFactory.getLogger(HraLetterService.class);
    private static final String DEFAULT_LETTER_TYPE = "OFFER_LETTER";
    private static final String DRAFT_STATUS = "Draft";
    private static final Set<String> TERMINAL_OFFER_STATUSES = Set.of(
            "VERIFIED", "ACCEPTED", "JOINED", "REJECTED", "CANCELLED",
            "TO BE VERIFIED", "TO BE VERIFY"
    );

    private final HraLetterRepository letterRepository;
    private final AutoIdGenerationService autoIdGenerationService;
    private final AtsStatusResolver atsStatusResolver;
    private final EmployeeMasterRepository employeeMasterRepository;

    public HraLetterService(
            HraLetterRepository letterRepository,
            AutoIdGenerationService autoIdGenerationService,
            AtsStatusResolver atsStatusResolver,
            EmployeeMasterRepository employeeMasterRepository
    ) {
        this.letterRepository = letterRepository;
        this.autoIdGenerationService = autoIdGenerationService;
        this.atsStatusResolver = atsStatusResolver;
        this.employeeMasterRepository = employeeMasterRepository;
    }

    public String previewNextOfferLetterNo() {
        return autoIdGenerationService.previewNextCode("OFFER_LETTER", new Date());
    }

    @Transactional(readOnly = true)
    public Page<OfferLetterSummaryDto> list(String type, int page, int size) {
        String targetType = (type != null && !type.trim().isEmpty()) ? type.trim() : DEFAULT_LETTER_TYPE;
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 50 : Math.min(size, 200);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        return letterRepository.findByLetterType(targetType, pageable)
                .map(OfferLetterSummaryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<OfferLetterDetailDto> getById(Long id) {
        return letterRepository.findById(id).map(OfferLetterDetailDto::fromEntity);
    }

    @Transactional
    public OfferLetterDetailDto save(OfferLetterDetailDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Offer letter payload is required.");
        }

        String letterType = (dto.getLetterType() == null || dto.getLetterType().trim().isEmpty())
                ? DEFAULT_LETTER_TYPE
                : dto.getLetterType().trim();
        dto.setLetterType(letterType);

        StatusMaster resolvedStatus = resolveStatus(dto);

        HraLetter toPersist;
        if (dto.getId() != null) {
            HraLetter existing = letterRepository.findById(dto.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Offer letter not found: " + dto.getId()));
            applyDto(existing, dto, resolvedStatus, true);
            toPersist = existing;
        } else {
            toPersist = new HraLetter();
            applyDto(toPersist, dto, resolvedStatus, false);
            if (DEFAULT_LETTER_TYPE.equalsIgnoreCase(letterType)) {
                String userId = SecurityUtils.getCurrentUserId();
                String authoritativeNo = autoIdGenerationService.generateNextCode(
                        "OFFER_LETTER",
                        dto.getLetterDate() != null ? dto.getLetterDate() : new Date(),
                        userId != null ? userId : "System"
                );
                toPersist.setRefNo(authoritativeNo);
            }
        }

        try {
            HraLetter saved = letterRepository.save(toPersist);
            syncCandidateOfferStatus(saved.getApplicantId(), resolvedStatus);
            return OfferLetterDetailDto.fromEntity(saved);
        } catch (ObjectOptimisticLockingFailureException | jakarta.persistence.OptimisticLockException ole) {
            throw ole;
        }
    }

    @Transactional
    public boolean delete(Long id) {
        if (!letterRepository.existsById(id)) {
            return false;
        }
        letterRepository.deleteById(id);
        return true;
    }

    private StatusMaster resolveStatus(OfferLetterDetailDto dto) {
        StatusMaster resolved = null;
        if (dto.getStatusId() != null) {
            resolved = atsStatusResolver.get(String.valueOf(dto.getStatusId()));
        } else if (dto.getStatusName() != null && !dto.getStatusName().isBlank()) {
            resolved = atsStatusResolver.get(dto.getStatusName());
        }
        if (resolved == null) {
            resolved = atsStatusResolver.get(DRAFT_STATUS);
        }
        return resolved;
    }

    private void applyDto(HraLetter target, OfferLetterDetailDto dto, StatusMaster status, boolean isUpdate) {
        target.setLetterType(dto.getLetterType());
        String effectiveOfferNo = dto.getOfferNo();
        if (!isUpdate || target.getRefNo() == null || target.getRefNo().isBlank()) {
            if (effectiveOfferNo != null && !effectiveOfferNo.isBlank()) {
                target.setRefNo(effectiveOfferNo);
            }
        }
        if (dto.getLetterDate() != null) {
            target.setLetterDate(dto.getLetterDate());
        } else if (target.getLetterDate() == null) {
            target.setLetterDate(new Date());
        }

        Long effectiveEmpId = dto.getEmployeeId();
        target.setApplicantId(effectiveEmpId);
        target.setEmployeeCode(dto.getEmployeeCode());
        target.setEmployeeName(dto.getEmployeeName());
        target.setEmail(dto.getEmail());
        target.setPhone(dto.getPhone());
        target.setDepartmentId(dto.getDepartmentId());
        target.setDepartment(dto.getDepartment());
        target.setDesignationId(dto.getDesignationId());
        target.setDesignation(dto.getDesignation());
        target.setEmploymentType(dto.getEmploymentType());
        target.setWorkLocation(dto.getWorkLocation());
        target.setGrade(dto.getGrade());
        target.setJoiningDate(dto.getJoiningDate());
        target.setProbationPeriodMonths(dto.getProbationPeriodMonths());
        target.setNoticePeriod(dto.getNoticePeriod());
        target.setGrossSalary(dto.getGrossSalary());
        target.setAnnualCtc(dto.getAnnualCtc());
        target.setNetSalary(dto.getNetSalary());
        target.setMonthlyCtc(dto.getMonthlyCtc());
        target.setFormData(dto.getFormData());
        target.setStatus(status);
        if (dto.getLockVersion() != null) {
            target.setLockVersion(dto.getLockVersion());
        }
    }

    private void syncCandidateOfferStatus(Long applicantId, StatusMaster status) {
        if (applicantId == null || status == null) {
            return;
        }
        try {
            Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(applicantId);
            if (empOpt.isEmpty()) {
                return;
            }
            EmployeeMaster emp = empOpt.get();
            if (emp.getOfferStatus() != null && emp.getOfferStatus().getName() != null) {
                String currentName = emp.getOfferStatus().getName().trim().toUpperCase();
                String targetName = status.getName() != null ? status.getName().trim().toUpperCase() : "";
                if (("DRAFT".equals(targetName) || "PENDING".equals(targetName))
                        && TERMINAL_OFFER_STATUSES.contains(currentName)) {
                    return;
                }
            }
            emp.setOfferStatus(status);
            employeeMasterRepository.save(emp);
        } catch (Exception e) {
            log.warn("Failed to sync candidate offer status for applicant {}: {}", applicantId, e.getMessage());
        }
    }
}
