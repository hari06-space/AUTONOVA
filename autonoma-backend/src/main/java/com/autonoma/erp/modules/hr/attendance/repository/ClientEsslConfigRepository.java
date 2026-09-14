package com.autonoma.erp.modules.hr.attendance.repository;

import com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientEsslConfigRepository extends JpaRepository<ClientEsslConfig, Long> {

    List<ClientEsslConfig> findByIsActiveTrue();

    Optional<ClientEsslConfig> findByClientIdAndIsActiveTrue(String clientId);

    Optional<ClientEsslConfig> findByClientId(String clientId);

    boolean existsByClientId(String clientId);
}
