package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdSampleSize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdSampleSizeRepository extends JpaRepository<NpdSampleSize, Long> {

    List<NpdSampleSize> findByStatus(Boolean status);

    boolean existsBySizeIgnoreCase(String size);

    boolean existsBySizeIgnoreCaseAndIdNot(String size, Long id);

    Optional<NpdSampleSize> findBySizeIgnoreCase(String size);
}
