package com.autonoma.erp.modules.hra.recruitment.repository;

import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantVerificationSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicantVerificationSubmissionRepository extends JpaRepository<ApplicantVerificationSubmission, Long> {
    Optional<ApplicantVerificationSubmission> findByToken(String token);
    List<ApplicantVerificationSubmission> findByEmployeeId(Long employeeId);
    Optional<ApplicantVerificationSubmission> findByEmployeeIdAndRole(Long employeeId, String role);
}
