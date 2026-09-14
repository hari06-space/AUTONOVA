/*
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-08-31
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-01
 * Description: Grid/list projection for HRA offer letters. Intentionally omits formData,
 *              company snapshot and audit columns so the list API stays small.
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
public class OfferLetterSummaryDto {
    private Long id;
    private String letterType;
    private String refNo;
    private String offerNo;
    private Date letterDate;
    private Long applicantId;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String email;
    private String phone;
    private String department;
    private String designation;
    private String employmentType;
    private Date joiningDate;
    private String noticePeriod;
    private BigDecimal annualCtc;
    private Long statusId;
    private String statusName;
    private Long lockVersion;

    public static OfferLetterSummaryDto fromEntity(HraLetter letter) {
        if (letter == null) {
            return null;
        }
        String resolvedStatusName = letter.getStatus() != null ? letter.getStatus().getName() : "Draft";
        Long resolvedStatusId = letter.getStatus() != null ? letter.getStatus().getId() : null;
        String resolvedOfferNo = letter.getOfferNo();
        Long resolvedEmpId = letter.getEmployeeId();

        return OfferLetterSummaryDto.builder()
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
                .department(letter.getDepartment())
                .designation(letter.getDesignation())
                .employmentType(letter.getEmploymentType())
                .joiningDate(letter.getJoiningDate())
                .noticePeriod(letter.getNoticePeriod())
                .annualCtc(letter.getAnnualCtc())
                .statusId(resolvedStatusId)
                .statusName(resolvedStatusName)
                .lockVersion(letter.getLockVersion())
                .build();
    }
}
