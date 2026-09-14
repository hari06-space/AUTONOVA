package com.autonoma.erp.modules.sm.customer.repository;

import com.autonoma.erp.modules.sm.customer.entity.CustomerPotential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerPotentialRepository extends JpaRepository<CustomerPotential, Long> {
}
