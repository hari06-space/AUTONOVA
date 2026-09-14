/*
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-08-31
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-01
 * Description: Edit/detail DTO for HRA offer letters. Used as the API request and
 *              response contract so the JPA entity is never exposed on the wire.
 */
package com.autonoma.erp.modules.hra.letters.dto;

import com.autonoma.erp.modules.hra.letters.entity.HraLetter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterDetailDto {
    private Long id;
    private String letterType;
    private String refNo;
    private String offerNo;
    private Date letterDate;

    // Candidate Snapshot
    private Long applicantId;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String email;
    private String phone;

    // Job Offer Snapshot
    private Long departmentId;
    private String department;
    private Long designationId;
    private String designation;
    private String employmentType;
    private String workLocation;
    private String grade;
    private Date joiningDate;
    private Integer probationPeriodMonths;
    private String noticePeriod;

    // Financial Totals
    private BigDecimal grossSalary;
    private BigDecimal annualCtc;
    private BigDecimal netSalary;
    private BigDecimal monthlyCtc;

    // Template & Compact JSON
    private String formData;

    // Status Architecture & Concurrency
    private Long statusId;
    private String statusName;
    private Long lockVersion;

    // Audit Metadata
    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;

    public String getOfferNo() {
        return offerNo != null && !offerNo.isBlank() ? offerNo : refNo;
    }

    public Long getEmployeeId() {
        return employeeId != null ? employeeId : applicantId;
    }

    public static OfferLetterDetailDto fromEntity(HraLetter letter) {
        if (letter == null) return null;

        String resolvedStatusName = letter.getStatus() != null ? letter.getStatus().getName() : "Draft";
        Long resolvedStatusId = letter.getStatusId() != null ? letter.getStatusId() : (letter.getStatus() != null ? letter.getStatus().getId() : null);
        String resolvedOfferNo = letter.getOfferNo();
        Long resolvedEmpId = letter.getEmployeeId();

        return OfferLetterDetailDto.builder()
                .id(letter.getId())
                .letterType(letter.getLetterType())
                .refNo(resolvedOfferNo)
                .offerNo(resolvedOfferNo)
                .letterDate(letter.getLetterDate())
                .applicantId(resolvedEmpId)
                .employeeId(resolvedEmpId)
                .employeeCode(letter.getEmployeeCode())
                .employeeName(letter.getEmployeeName())
                .email(letter.getEmail())
                .phone(letter.getPhone())
                .departmentId(letter.getDepartmentId())
                .department(letter.getDepartment())
                .designationId(letter.getDesignationId())
                .designation(letter.getDesignation())
                .employmentType(letter.getEmploymentType())
                .workLocation(letter.getWorkLocation())
                .grade(letter.getGrade())
                .joiningDate(letter.getJoiningDate())
                .probationPeriodMonths(letter.getProbationPeriodMonths())
                .noticePeriod(letter.getNoticePeriod())
                .grossSalary(letter.getGrossSalary())
                .annualCtc(letter.getAnnualCtc())
                .netSalary(letter.getNetSalary())
                .monthlyCtc(letter.getMonthlyCtc())
                .formData(letter.getFormData())
                .statusId(resolvedStatusId)
                .statusName(resolvedStatusName)
                .lockVersion(letter.getLockVersion())
                .createdBy(letter.getCreatedUser())
                .createdDate(letter.getCreatedDate())
                .updatedBy(letter.getUpdatedUser())
                .updatedDate(letter.getUpdatedDate())
                .build();
    }
}
