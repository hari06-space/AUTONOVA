package com.nutech.email.repository;

import com.nutech.email.model.CustomerPartMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface CustomerPartMappingRepository extends JpaRepository<CustomerPartMapping, Long> {
    Optional<CustomerPartMapping> findByCustomerIdAndCustomerPartCode(Long customerId, String customerPartCode);
    List<CustomerPartMapping> findByCustomerId(Long customerId);
    boolean existsByCustomerIdAndCustomerPartCode(Long customerId, String customerPartCode);
}
