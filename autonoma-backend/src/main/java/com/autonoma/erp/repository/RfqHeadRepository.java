package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RfqHeadRepository extends JpaRepository<RfqHead, Long>, JpaSpecificationExecutor<RfqHead> {
    Optional<RfqHead> findByRfqNo(String rfqNo);
    boolean existsByRfqNo(String rfqNo);
}
