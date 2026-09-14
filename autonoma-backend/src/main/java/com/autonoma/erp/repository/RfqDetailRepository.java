package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfqDetailRepository extends JpaRepository<RfqDetail, Long> {
    List<RfqDetail> findByRfqHeadId(Long rfqHeadId);
    void deleteByRfqHeadId(Long rfqHeadId);
}
