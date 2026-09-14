package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.CustomerEmailMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerEmailMappingRepository extends JpaRepository<CustomerEmailMapping, Long> {
    Optional<CustomerEmailMapping> findByEmailAddressIgnoreCaseAndActiveStatusTrue(String emailAddress);
    List<CustomerEmailMapping> findByCustomerIdAndActiveStatusTrue(Long customerId);
}
