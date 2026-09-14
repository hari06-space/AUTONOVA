package com.autonoma.erp.modules.npd.oem.repository;

import com.autonoma.erp.modules.npd.oem.entity.ProductOem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductOemRepository extends JpaRepository<ProductOem, String> {

    List<ProductOem> findByStatus(Integer status);

    boolean existsByOemShortNameIgnoreCase(String oemShortName);
}
