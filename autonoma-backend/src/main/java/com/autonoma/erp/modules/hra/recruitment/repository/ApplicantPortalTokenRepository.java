package com.autonoma.erp.modules.hra.recruitment.repository;

import com.autonoma.erp.modules.hra.recruitment.entity.ApplicantPortalToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicantPortalTokenRepository extends JpaRepository<ApplicantPortalToken, Long> {
    Optional<ApplicantPortalToken> findByToken(String token);
    List<ApplicantPortalToken> findByEmployeeIdAndPortalTypeAndIsActive(Long employeeId, String portalType, Boolean isActive);
}
