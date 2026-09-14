package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmEnquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SmEnquiryRepository extends JpaRepository<SmEnquiry, Long> {

    List<SmEnquiry> findByStatus(Long status);

    @Query("SELECT MAX(e.id) FROM SmEnquiry e")
    Optional<Long> findMaxId();
}
