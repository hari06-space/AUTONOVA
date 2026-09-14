package com.nutech.email.repository;

import com.nutech.email.model.OcrConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OcrConfigRepository extends JpaRepository<OcrConfig, Long> {
    java.util.Optional<OcrConfig> findByCompanyCredentialId(Long companyCredentialId);
}
