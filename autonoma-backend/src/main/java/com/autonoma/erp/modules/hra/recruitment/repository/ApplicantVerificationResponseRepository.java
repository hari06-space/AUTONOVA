package com.autonoma.erp.modules.hra.recruitment.repository;

import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantVerificationResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicantVerificationResponseRepository extends JpaRepository<ApplicantVerificationResponse, Long> {
    List<ApplicantVerificationResponse> findByEmployeeId(Long employeeId);
    List<ApplicantVerificationResponse> findByEmployeeIdAndRole(Long employeeId, String role);
}
