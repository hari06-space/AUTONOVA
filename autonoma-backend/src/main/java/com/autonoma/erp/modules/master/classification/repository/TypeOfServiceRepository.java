package com.autonoma.erp.modules.master.classification.repository;

import com.autonoma.erp.modules.master.classification.entity.TypeOfService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TypeOfServiceRepository extends JpaRepository<TypeOfService, Long> {
    boolean existsByServiceNameIgnoreCase(String serviceName);
}
