package com.autonoma.erp.modules.platform.identity.repository;

import com.autonoma.erp.modules.platform.identity.entity.CliClientLicense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CliClientLicenseRepository extends JpaRepository<CliClientLicense, Long> {

    Optional<CliClientLicense> findByClientIdAndIsDeletedFalse(Long clientId);
}
