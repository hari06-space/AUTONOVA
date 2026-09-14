package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.OccuranceFmea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OccuranceFmeaRepository extends JpaRepository<OccuranceFmea, Long> {

    List<OccuranceFmea> findByStatus(Boolean status);

    boolean existsByProbabilityOfFailureIgnoreCase(String probabilityOfFailure);

    boolean existsByProbabilityOfFailureIgnoreCaseAndIdNot(String probabilityOfFailure, Long id);

    Optional<OccuranceFmea> findByProbabilityOfFailureIgnoreCase(String probabilityOfFailure);
}
