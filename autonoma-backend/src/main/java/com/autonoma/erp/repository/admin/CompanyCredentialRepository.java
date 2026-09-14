package com.autonoma.erp.repository.admin;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.model.admin.CompanyCredential;

@Repository
public interface CompanyCredentialRepository extends JpaRepository<CompanyCredential, Long> {
    Optional<CompanyCredential> findFirstByOrderByIdAsc();
    Optional<CompanyCredential> findFirstByClientCodeIgnoreCaseOrderByIdAsc(String clientCode);
    Optional<CompanyCredential> findByClientCode(String clientCode);
    Optional<CompanyCredential> findByDbSourceNameIgnoreCase(String dbSourceName);
    List<CompanyCredential> findAllByClientCodeIgnoreCase(String clientCode);
    boolean existsByClientCode(String clientCode);
}
