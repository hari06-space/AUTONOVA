package com.autonoma.erp.modules.platform.identity.repository;

import com.autonoma.erp.modules.platform.identity.entity.CliClientDatabaseConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CliClientDatabaseConfigRepository extends JpaRepository<CliClientDatabaseConfig, Long> {
    Optional<CliClientDatabaseConfig> findByClientId(Long clientId);
}
