package com.autonoma.erp.repository.security;

import com.autonoma.erp.model.security.AllowedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AllowedDeviceRepository extends JpaRepository<AllowedDevice, Long> {
    List<AllowedDevice> findByCompanyIdOrderByCreatedDateDesc(Long companyId);
    List<AllowedDevice> findByCompanyIdAndStatus(Long companyId, Boolean status);
    Optional<AllowedDevice> findByCompanyIdAndDeviceIdentifier(Long companyId, String deviceIdentifier);
    Optional<AllowedDevice> findByCompanyIdAndDeviceCode(Long companyId, String deviceCode);
    long countByCompanyIdAndStatus(Long companyId, Boolean status);
}
