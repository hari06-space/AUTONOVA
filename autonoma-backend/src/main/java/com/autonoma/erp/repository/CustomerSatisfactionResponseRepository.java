package com.autonoma.erp.repository;

import com.autonoma.erp.model.CustomerSatisfactionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerSatisfactionResponseRepository extends JpaRepository<CustomerSatisfactionResponse, Long> {
    List<CustomerSatisfactionResponse> findByMappingId(Long mappingId);
}
