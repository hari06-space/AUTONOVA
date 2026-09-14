package com.autonoma.erp.modules.platform.identity.repository;

import com.autonoma.erp.modules.platform.identity.entity.CliClientServerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CliClientServerConfigRepository extends JpaRepository<CliClientServerConfig, Long> {

    Optional<CliClientServerConfig> findByClientId(Long clientId);

    void deleteByClientId(Long clientId);
}
