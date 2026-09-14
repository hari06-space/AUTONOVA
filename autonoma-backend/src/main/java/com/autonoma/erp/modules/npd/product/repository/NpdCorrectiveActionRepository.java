package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdCorrectiveAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdCorrectiveActionRepository extends JpaRepository<NpdCorrectiveAction, Long> {

    List<NpdCorrectiveAction> findByStatus(Boolean status);

    boolean existsByShortNameIgnoreCase(String shortName);

    boolean existsByShortNameIgnoreCaseAndIdNot(String shortName, Long id);

    boolean existsByCorrectivePlanIgnoreCase(String correctivePlan);

    boolean existsByCorrectivePlanIgnoreCaseAndIdNot(String correctivePlan, Long id);

    Optional<NpdCorrectiveAction> findByShortNameIgnoreCase(String shortName);
}
