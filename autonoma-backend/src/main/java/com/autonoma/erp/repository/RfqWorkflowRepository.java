package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfqWorkflowRepository extends JpaRepository<RfqWorkflow, Long> {
    List<RfqWorkflow> findByRfqHeadIdOrderByCreatedDateDesc(Long rfqHeadId);
}
