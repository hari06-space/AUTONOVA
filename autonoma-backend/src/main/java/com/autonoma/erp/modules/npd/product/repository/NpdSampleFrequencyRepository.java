package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdSampleFrequency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdSampleFrequencyRepository extends JpaRepository<NpdSampleFrequency, Long> {

    List<NpdSampleFrequency> findByStatus(Boolean status);

    boolean existsByFrequencyIgnoreCase(String frequency);

    boolean existsByFrequencyIgnoreCaseAndIdNot(String frequency, Long id);

    Optional<NpdSampleFrequency> findByFrequencyIgnoreCase(String frequency);
}
