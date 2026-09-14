/*
 * Organization: Nutech
 * Owner: Logaraj S
 * Created At: 2026-09-01
 * Description: Slim ATS applicant projection for the offer-letter candidate picker.
 *              Avoids serialising the EmployeeMaster persistence graph.
 */
package com.autonoma.erp.modules.hra.letters.dto;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibleApplicantDto {
    private Long id;
    private String applicantCode;
    private String empCode;
    private String employeeName;
    private String firstName;
    private String lastName;
    private String email;
    private Long departmentId;
    private Long designationId;
    private String statusName;
    private String atsOverallStatusName;
    private String offerStatusName;
    private String fromWhere;
    private String employeePhotoUpload;
    private String candidatePhoto;
    private String profileUpload;
    private String photo;

    public static EligibleApplicantDto fromEntity(EmployeeMaster emp) {
        if (emp == null) {
            return null;
        }
        String officeMail = null;
        Long departmentId = null;
        Long designationId = null;
        try {
            officeMail = emp.getOfficeMail();
            departmentId = emp.getDepartmentId();
            designationId = emp.getDesignationId();
        } catch (Exception ignored) {
            // Organization may be absent on a lightweight fetch
        }
        String photoPath = emp.getEmployeePhotoUpload();
        return EligibleApplicantDto.builder()
                .id(emp.getId())
                .applicantCode(emp.getApplicantCode())
                .empCode(emp.getEmpCode())
                .employeeName(emp.getEmployeeName())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .email(officeMail)
                .departmentId(departmentId)
                .designationId(designationId)
                .statusName(emp.getStatus() != null ? emp.getStatus().getName() : null)
                .atsOverallStatusName(emp.getAtsOverallStatus() != null ? emp.getAtsOverallStatus().getName() : null)
                .offerStatusName(emp.getOfferStatus() != null ? emp.getOfferStatus().getName() : null)
                .fromWhere(emp.getFromWhere())
                .employeePhotoUpload(photoPath)
                .candidatePhoto(photoPath)
                .profileUpload(photoPath)
                .photo(photoPath)
                .build();
    }
}
