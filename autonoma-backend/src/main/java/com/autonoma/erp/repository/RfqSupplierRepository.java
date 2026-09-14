package com.autonoma.erp.repository;

import com.autonoma.erp.model.RfqSupplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RfqSupplierRepository extends JpaRepository<RfqSupplier, Long> {
    List<RfqSupplier> findByRfqHeadId(Long rfqHeadId);
    Optional<RfqSupplier> findByRfqHeadIdAndSupplierId(Long rfqHeadId, Long supplierId);
    void deleteByRfqHeadId(Long rfqHeadId);
}
