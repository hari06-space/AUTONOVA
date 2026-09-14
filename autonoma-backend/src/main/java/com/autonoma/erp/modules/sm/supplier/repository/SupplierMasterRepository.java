package com.autonoma.erp.modules.sm.supplier.repository;

import com.autonoma.erp.modules.sm.supplier.entity.SupplierMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SupplierMasterRepository extends JpaRepository<SupplierMaster, Long> {
    Optional<SupplierMaster> findBySupplierCode(String supplierCode);
    
    Optional<SupplierMaster> findTopBySupplierCodeStartingWithOrderBySupplierCodeDesc(String prefix);
    
    boolean existsBySupplierName(String supplierName);
    boolean existsBySupplierNameAndIdNot(String supplierName, Long id);
    boolean existsBySupplierCode(String supplierCode);
    boolean existsBySupplierCodeAndIdNot(String supplierCode, Long id);
    Optional<SupplierMaster> findBySupplierNameIgnoreCase(String supplierName);

    @Query("SELECT new com.autonoma.erp.modules.sm.supplier.dto.SupplierMasterListDto(" +
           "s.id, s.gstNo, s.supplierCode, s.supplierName, s.supplierPrintName, s.shortName, " +
           "s.city, s.state, s.country, s.status, s.createdBy, s.createdDate, s.updatedBy, s.updatedDate) " +
           "FROM SupplierMaster s")
    java.util.List<com.autonoma.erp.modules.sm.supplier.dto.SupplierMasterListDto> findAllProjected();
}
