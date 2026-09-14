package com.autonoma.erp.repository.security;

import com.autonoma.erp.model.security.LoginAccessConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoginAccessConfigRepository extends JpaRepository<LoginAccessConfig, Long> {
    Optional<LoginAccessConfig> findByCompanyId(Long companyId);
}
