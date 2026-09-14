package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfqActivityRepository extends JpaRepository<RfqActivity, Long> {
    List<RfqActivity> findByRfqHeadIdOrderByActivityDateDesc(Long rfqHeadId);
}
