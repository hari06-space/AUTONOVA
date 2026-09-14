package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.PublicEmailProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PublicEmailProviderRepository extends JpaRepository<PublicEmailProvider, Long> {
    Optional<PublicEmailProvider> findByDomainNameIgnoreCaseAndActiveStatusTrue(String domainName);
    boolean existsByDomainNameIgnoreCaseAndActiveStatusTrue(String domainName);
}
