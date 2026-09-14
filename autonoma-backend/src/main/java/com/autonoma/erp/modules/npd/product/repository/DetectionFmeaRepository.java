package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.DetectionFmea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DetectionFmeaRepository extends JpaRepository<DetectionFmea, Long> {

    List<DetectionFmea> findByStatus(Boolean status);

    boolean existsByDetectionIgnoreCase(String detection);

    boolean existsByDetectionIgnoreCaseAndIdNot(String detection, Long id);

    Optional<DetectionFmea> findByDetectionIgnoreCase(String detection);
}
