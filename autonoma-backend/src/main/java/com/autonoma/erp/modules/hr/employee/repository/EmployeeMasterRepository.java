package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeMasterRepository extends JpaRepository<EmployeeMaster, Long> {
        boolean existsByEmpCode(String empCode);

        boolean existsByEmpCodeAndIdNot(String empCode, Long id);

        java.util.Optional<EmployeeMaster> findFirstByOrderByEmpCodeDesc();

        java.util.Optional<EmployeeMaster> findFirstByEmpCodeStartingWithOrderByEmpCodeDesc(String prefix);

        @Override
        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM EmployeeMaster e LEFT JOIN FETCH e.organization LEFT JOIN FETCH e.statutory LEFT JOIN FETCH e.ability LEFT JOIN FETCH e.scheduling LEFT JOIN FETCH e.induction LEFT JOIN FETCH e.operations")
        java.util.List<EmployeeMaster> findAll();

        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM EmployeeMaster e LEFT JOIN FETCH e.organization LEFT JOIN FETCH e.statutory LEFT JOIN FETCH e.ability LEFT JOIN FETCH e.scheduling LEFT JOIN FETCH e.induction LEFT JOIN FETCH e.operations WHERE UPPER(TRIM(e.status.name)) = UPPER(TRIM(:status))")
        java.util.List<EmployeeMaster> findByStatus(
                        @org.springframework.data.repository.query.Param("status") String status);

        @Override
        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e LEFT JOIN FETCH e.selfAssessment WHERE e.id = :id")
        java.util.Optional<EmployeeMaster> findById(@org.springframework.data.repository.query.Param("id") Long id);

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e LEFT JOIN FETCH e.selfAssessment WHERE e.empCode = :empCode")
        java.util.Optional<EmployeeMaster> findByEmpCode(
                        @org.springframework.data.repository.query.Param("empCode") String empCode);

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e LEFT JOIN FETCH e.selfAssessment WHERE LOWER(e.empCode) = LOWER(:empCode)")
        java.util.Optional<EmployeeMaster> findByEmpCodeIgnoreCase(
                        @org.springframework.data.repository.query.Param("empCode") String empCode);

        java.util.Optional<EmployeeMaster> findByEmployeeNameIgnoreCase(String employeeName);

        @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM EmployeeMaster e WHERE LOWER(e.employeeName) = LOWER(:employeeName) AND e.isActive = :isActive")
        long countByEmployeeNameIgnoreCaseAndIsActive(
                        @org.springframework.data.repository.query.Param("employeeName") String employeeName,
                        @org.springframework.data.repository.query.Param("isActive") Boolean isActive);

        java.util.Optional<EmployeeMaster> findByOldEmpCode(String oldEmpCode);

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e WHERE LOWER(e.organization.officeMail) = LOWER(:officeMail)")
        java.util.List<EmployeeMaster> findByOfficeMailIgnoreCase(
                        @org.springframework.data.repository.query.Param("officeMail") String officeMail);

        java.util.Optional<EmployeeMaster> findFirstByOldEmpCodeStartingWithOrderByOldEmpCodeDesc(String prefix);

        java.util.List<EmployeeMaster> findByOldEmpCodeStartingWith(String prefix);

        default java.util.List<EmployeeMaster> findByIsInductionEligibleAndStatus(String isInductionEligible,
                        String status) {
                return java.util.Collections.emptyList();
        }

        java.util.List<EmployeeMaster> findByEmpCodeStartingWith(String prefix);

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e " +
                        "LEFT JOIN FETCH e.status " +
                        "LEFT JOIN FETCH e.callStatus " +
                        "LEFT JOIN FETCH e.offerStatus " +
                        "LEFT JOIN FETCH e.verificationStatus " +
                        "LEFT JOIN FETCH e.atsOverallStatus " +
                        "LEFT JOIN FETCH e.photoVerifiedStatus " +
                        "LEFT JOIN FETCH e.resumeVerifiedStatus " +
                        "LEFT JOIN FETCH e.payslipVerifiedStatus " +
                        "LEFT JOIN FETCH e.aadharVerifiedStatus " +
                        "WHERE e.fromWhere = 'ATS' and e.applicantCode is not null " +
                        "ORDER BY e.applicantDate DESC, e.id DESC")
        java.util.List<EmployeeMaster> findAtsApplicants();

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e " +
                        "LEFT JOIN FETCH e.status " +
                        "LEFT JOIN FETCH e.offerStatus " +
                        "LEFT JOIN FETCH e.atsOverallStatus " +
                        "LEFT JOIN FETCH e.organization " +
                        "WHERE e.fromWhere = 'ATS' AND e.applicantCode IS NOT NULL " +
                        "AND (UPPER(TRIM(e.status.name)) IN ('SELECTED', 'OFFERED') " +
                        "     OR UPPER(TRIM(e.atsOverallStatus.name)) IN ('SELECTED', 'OFFERED')) " +
                        "AND (e.offerStatus IS NULL OR UPPER(TRIM(e.offerStatus.name)) NOT IN ('VERIFIED', 'JOINED', 'TO BE VERIFIED', 'TO BE VERIFY')) " +
                        "AND (e.status IS NULL OR UPPER(TRIM(e.status.name)) NOT IN ('REJECTED', 'HOLD', 'ON HOLD', 'CANCELLED')) " +
                        "ORDER BY e.applicantDate DESC, e.id DESC")
        java.util.List<EmployeeMaster> findAtsApplicantsEligibleForOffer();

        @org.springframework.data.jpa.repository.Query(value = "SELECT DISTINCT e FROM EmployeeMaster e " +
                        "LEFT JOIN FETCH e.status " +
                        "LEFT JOIN FETCH e.callStatus " +
                        "LEFT JOIN FETCH e.offerStatus " +
                        "LEFT JOIN FETCH e.verificationStatus " +
                        "LEFT JOIN FETCH e.atsOverallStatus " +
                        "LEFT JOIN FETCH e.photoVerifiedStatus " +
                        "LEFT JOIN FETCH e.resumeVerifiedStatus " +
                        "LEFT JOIN FETCH e.payslipVerifiedStatus " +
                        "LEFT JOIN FETCH e.aadharVerifiedStatus " +
                        "WHERE e.fromWhere = 'ATS' and e.applicantCode is not null", countQuery = "SELECT count(e) FROM EmployeeMaster e WHERE e.fromWhere = 'ATS' and e.applicantCode is not null")
        org.springframework.data.domain.Page<EmployeeMaster> findAtsApplicants(
                        org.springframework.data.domain.Pageable pageable);

        boolean existsByApplicantCode(String applicantCode);

        java.util.Optional<EmployeeMaster> findByApplicantCode(String applicantCode);

        default boolean existsByVerticalHeadIgnoreCase(String verticalHead) {
                return false;
        }

        default java.util.List<EmployeeMaster> findActiveReportsByVerticalHead(
                        String name, String code, String username) {
                return java.util.Collections.emptyList();
        }

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e WHERE LOWER(e.organization.verticalHead) = LOWER(:verticalHead) AND LOWER(e.status.name) = 'active'")
        java.util.List<EmployeeMaster> findActiveReportsByVerticalHeadName(
                        @org.springframework.data.repository.query.Param("verticalHead") String verticalHead);

        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e WHERE LOWER(e.empCode) = LOWER(:assignedTo) OR LOWER(e.oldEmpCode) = LOWER(:assignedTo) OR LOWER(e.employeeName) = LOWER(:assignedTo)")
        java.util.List<EmployeeMaster> findByEmpCodeOrNameInternal(
                        @org.springframework.data.repository.query.Param("assignedTo") String assignedTo);

        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeMaster e WHERE e.id = :id")
        java.util.Optional<EmployeeMaster> findByIdWithWriteLock(@org.springframework.data.repository.query.Param("id") Long id);

        default java.util.Optional<EmployeeMaster> findByEmpCodeOrName(String assignedTo) {
                if (assignedTo == null || assignedTo.trim().isEmpty()) {
                        return java.util.Optional.empty();
                }
                String trimmed = assignedTo.trim();

                // 1. Prioritize direct exact lookup by empCode (Unique)
                java.util.Optional<EmployeeMaster> byCode = findByEmpCodeIgnoreCase(trimmed);
                if (byCode.isPresent()) {
                        return byCode;
                }

                // 2. Prioritize lookup by oldEmpCode (Unique)
                java.util.Optional<EmployeeMaster> byOldCode = findByOldEmpCode(trimmed);
                if (byOldCode.isPresent()) {
                        return byOldCode;
                }

                // 3. Prioritize lookup by numeric database ID (Unique)
                try {
                        long id = Long.parseLong(trimmed);
                        java.util.Optional<EmployeeMaster> emp = findById(id);
                        if (emp.isPresent()) {
                                return emp;
                        }
                } catch (NumberFormatException ignored) {}

                // 4. Fall back to name lookup only if not resolvable by unique codes/IDs
                java.util.List<EmployeeMaster> list = findByEmpCodeOrNameInternal(trimmed);
                if (list != null && !list.isEmpty()) {
                        return list.stream()
                                        .filter(e -> e.getStatus() != null
                                                        && "Active".equalsIgnoreCase(e.getStatus().getName()))
                                        .findFirst()
                                        .or(() -> java.util.Optional.of(list.get(0)));
                }
                return java.util.Optional.empty();
        }

        @org.springframework.data.jpa.repository.Query("SELECT new com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster(e.id, e.empCode, e.employeeName, '', '', e.organization.empLevelId, e.organization.designationId, e.employeePhotoUpload) FROM EmployeeMaster e "
                        +
                        "JOIN e.organization org " +
                        "JOIN DesignationLevel dl ON org.empLevelId = dl.rowId " +
                        "WHERE LOWER(e.status.name) = 'active' " +
                        "AND (:empId IS NULL OR e.id <> :empId) " +
                        "AND CAST(SUBSTRING(dl.level, 2, 10) AS integer) > :empLevelVal " +
                        "ORDER BY CAST(SUBSTRING(dl.level, 2, 10) AS integer) DESC, e.employeeName ASC")
        java.util.List<EmployeeMaster> findActiveEligibleManagers(
                        @org.springframework.data.repository.query.Param("empId") Long empId,
                        @org.springframework.data.repository.query.Param("empLevelVal") int empLevelVal);

        @org.springframework.data.jpa.repository.Query("SELECT new com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto(e.id, e.empCode, e.oldEmpCode, e.employeeName, e.firstName, e.lastName, e.fatherHusbandName, o.designationId, o.gradeCode, o.departmentId, o.unitId, r.supplierName, e.status.name, s.exitDate, s.exitReason, s.exitComments, e.createdBy, e.createdDate, e.updatedBy, e.updatedDate, e.employeePhotoUpload, e.fromWhere, s.dateOfJoining, p.birthDate, p.personalEmail) FROM EmployeeMaster e LEFT JOIN e.organization o LEFT JOIN e.reference r LEFT JOIN e.scheduling s LEFT JOIN EmployeePersonalDetail p ON e.id = p.employeeId ORDER BY e.id DESC")
        java.util.List<com.autonoma.erp.modules.hr.employee.dto.EmployeeMasterListDto> findAllProjected();

        @org.springframework.data.jpa.repository.Query("SELECT new com.autonoma.erp.modules.hr.employee.dto.EmployeeBirthdayDto("
                        +
                        "e.id, COALESCE(e.oldEmpCode, e.empCode), e.employeeName, e.employeePhotoUpload, p.birthDate, "
                        +
                        "org.department.departmentName, org.designation.designationName, e.status.name) " +
                        "FROM EmployeeMaster e " +
                        "JOIN EmployeePersonalDetail p ON e.id = p.employeeId " +
                        "LEFT JOIN e.organization org " +
                        "WHERE LOWER(e.status.name) = 'active' " +
                        "AND (e.fromWhere IS NULL OR UPPER(TRIM(e.fromWhere)) <> 'ATS') " +
                        "AND p.birthDate IS NOT NULL " +
                        "AND MONTH(p.birthDate) = :month " +
                        "AND DAY(p.birthDate) >= :day " +
                        "ORDER BY DAY(p.birthDate) ASC")
        java.util.List<com.autonoma.erp.modules.hr.employee.dto.EmployeeBirthdayDto> findUpcomingBirthdays(
                        @org.springframework.data.repository.query.Param("month") int month,
                        @org.springframework.data.repository.query.Param("day") int day);

        @org.springframework.data.jpa.repository.Query("SELECT e.id, e.firstName, e.lastName, e.employeeName FROM EmployeeMaster e")
        java.util.List<Object[]> findAllIdAndNames();

        @org.springframework.data.jpa.repository.Query("SELECT o.departmentId FROM EmployeeMaster e JOIN e.organization o WHERE e.id = :empId")
        Long findDepartmentIdByEmployeeId(@org.springframework.data.repository.query.Param("empId") Long empId);

        @org.springframework.data.jpa.repository.Query("SELECT o.empLevelId FROM EmployeeMaster e JOIN e.organization o WHERE e.id = :empId")
        Long findEmpLevelIdByEmployeeId(@org.springframework.data.repository.query.Param("empId") Long empId);

        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM EmployeeMaster e " +
                        "LEFT JOIN e.organization org " +
                        "JOIN e.ability ab " +
                        "WHERE LOWER(e.status.name) = 'active' " +
                        "AND (" +
                        "  (LOWER(ab.isChaired) = 'yes' AND (ab.chairedType = :meetingPrefix OR ab.chairedType LIKE CONCAT(:meetingPrefix, ',%') OR ab.chairedType LIKE CONCAT('%,', :meetingPrefix) OR ab.chairedType LIKE CONCAT('%,', :meetingPrefix, ',%') OR ab.chairedType LIKE CONCAT('%, ', :meetingPrefix, ',%') OR ab.chairedType LIKE CONCAT('%, ', :meetingPrefix))) "
                        +
                        "  OR " +
                        "  (LOWER(ab.isHost) = 'yes' AND (ab.hostType = :meetingPrefix OR ab.hostType LIKE CONCAT(:meetingPrefix, ',%') OR ab.hostType LIKE CONCAT('%,', :meetingPrefix) OR ab.hostType LIKE CONCAT('%,', :meetingPrefix, ',%') OR ab.hostType LIKE CONCAT('%, ', :meetingPrefix, ',%') OR ab.hostType LIKE CONCAT('%, ', :meetingPrefix)) "
                        +
                        "   AND (:hasDepts = false OR org.departmentId IN (:departmentIds))) " +
                        "  OR " +
                        "  (LOWER(ab.isParticipants) = 'yes' AND (ab.participantsType = :meetingPrefix OR ab.participantsType LIKE CONCAT(:meetingPrefix, ',%') OR ab.participantsType LIKE CONCAT('%,', :meetingPrefix) OR ab.participantsType LIKE CONCAT('%,', :meetingPrefix, ',%') OR ab.participantsType LIKE CONCAT('%, ', :meetingPrefix, ',%') OR ab.participantsType LIKE CONCAT('%, ', :meetingPrefix)) "
                        +
                        "   AND (:hasDepts = false OR org.departmentId IN (:departmentIds)))" +
                        ")")
        java.util.List<EmployeeMaster> findEligibleEmployeesForMeeting(
                        @org.springframework.data.repository.query.Param("meetingPrefix") String meetingPrefix,
                        @org.springframework.data.repository.query.Param("departmentIds") java.util.List<Long> departmentIds,
                        @org.springframework.data.repository.query.Param("hasDepts") boolean hasDepts);

        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM EmployeeMaster e " +
                        "LEFT JOIN e.organization org " +
                        "JOIN e.ability ab " +
                        "WHERE LOWER(e.status.name) = 'active' " +
                        "AND LOWER(TRIM(ab.isChaired)) = 'yes' " +
                        "AND (" +
                        "  UPPER(CONCAT(',', REPLACE(ab.chairedType, ' ', ''), ',')) LIKE UPPER(CONCAT('%,', :meetingName, ',%')) " +
                        "  OR " +
                        "  UPPER(CONCAT(',', REPLACE(ab.chairedType, ' ', ''), ',')) LIKE UPPER(CONCAT('%,', :meetingPrefix, ',%')) " +
                        ")")
        java.util.List<EmployeeMaster> findEligibleChairpersons(
                        @org.springframework.data.repository.query.Param("meetingName") String meetingName,
                        @org.springframework.data.repository.query.Param("meetingPrefix") String meetingPrefix);

        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM EmployeeMaster e " +
                        "LEFT JOIN e.organization org " +
                        "JOIN e.ability ab " +
                        "WHERE LOWER(e.status.name) = 'active' " +
                        "AND LOWER(TRIM(ab.isHost)) = 'yes' " +
                        "AND (" +
                        "  UPPER(CONCAT(',', REPLACE(ab.hostType, ' ', ''), ',')) LIKE UPPER(CONCAT('%,', :meetingName, ',%')) " +
                        "  OR " +
                        "  UPPER(CONCAT(',', REPLACE(ab.hostType, ' ', ''), ',')) LIKE UPPER(CONCAT('%,', :meetingPrefix, ',%')) " +
                        ") " +
                        "AND org.departmentId IN (:departmentIds)")
        java.util.List<EmployeeMaster> findEligibleHosts(
                        @org.springframework.data.repository.query.Param("meetingName") String meetingName,
                        @org.springframework.data.repository.query.Param("meetingPrefix") String meetingPrefix,
                        @org.springframework.data.repository.query.Param("departmentIds") java.util.List<Long> departmentIds);

        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e FROM EmployeeMaster e " +
                        "LEFT JOIN e.organization org " +
                        "JOIN e.ability ab " +
                        "WHERE LOWER(e.status.name) = 'active' " +
                        "AND LOWER(TRIM(ab.isParticipants)) = 'yes' " +
                        "AND (" +
                        "  UPPER(CONCAT(',', REPLACE(ab.participantsType, ' ', ''), ',')) LIKE UPPER(CONCAT('%,', :meetingName, ',%')) " +
                        "  OR " +
                        "  UPPER(CONCAT(',', REPLACE(ab.participantsType, ' ', ''), ',')) LIKE UPPER(CONCAT('%,', :meetingPrefix, ',%')) " +
                        ") " +
                        "AND (:hasDepts = false OR org.departmentId IN (:departmentIds))")
        java.util.List<EmployeeMaster> findEligibleParticipants(
                        @org.springframework.data.repository.query.Param("meetingName") String meetingName,
                        @org.springframework.data.repository.query.Param("meetingPrefix") String meetingPrefix,
                        @org.springframework.data.repository.query.Param("departmentIds") java.util.List<Long> departmentIds,
                        @org.springframework.data.repository.query.Param("hasDepts") boolean hasDepts);
}
