package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.CustomerDomainMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerDomainMappingRepository extends JpaRepository<CustomerDomainMapping, Long> {
    Optional<CustomerDomainMapping> findByDomainNameIgnoreCaseAndActiveStatusTrue(String domainName);
    List<CustomerDomainMapping> findByCustomerIdAndActiveStatusTrue(Long customerId);
}
