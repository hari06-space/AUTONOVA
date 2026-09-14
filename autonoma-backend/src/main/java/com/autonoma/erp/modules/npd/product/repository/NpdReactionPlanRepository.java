package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdReactionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdReactionPlanRepository extends JpaRepository<NpdReactionPlan, Long> {

    List<NpdReactionPlan> findByStatus(Boolean status);

    boolean existsByShortNameIgnoreCase(String shortName);

    boolean existsByShortNameIgnoreCaseAndIdNot(String shortName, Long id);

    boolean existsByReactionPlanIgnoreCase(String reactionPlan);

    boolean existsByReactionPlanIgnoreCaseAndIdNot(String reactionPlan, Long id);

    Optional<NpdReactionPlan> findByShortNameIgnoreCase(String shortName);
}
