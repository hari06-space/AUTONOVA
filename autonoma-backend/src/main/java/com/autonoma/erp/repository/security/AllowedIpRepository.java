package com.autonoma.erp.repository.security;

import com.autonoma.erp.model.security.AllowedIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AllowedIpRepository extends JpaRepository<AllowedIp, Long> {
    List<AllowedIp> findByCompanyIdOrderByCreatedDateDesc(Long companyId);
    List<AllowedIp> findByCompanyIdAndStatus(Long companyId, Boolean status);
    Optional<AllowedIp> findByCompanyIdAndIpAddress(Long companyId, String ipAddress);
    long countByCompanyIdAndStatus(Long companyId, Boolean status);
}
