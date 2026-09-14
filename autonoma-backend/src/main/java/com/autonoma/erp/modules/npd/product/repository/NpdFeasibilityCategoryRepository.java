package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdFeasibilityCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdFeasibilityCategoryRepository extends JpaRepository<NpdFeasibilityCategory, Long> {

    List<NpdFeasibilityCategory> findByStatus(Boolean status);

    boolean existsByCategoryIgnoreCase(String category);

    boolean existsByCategoryIgnoreCaseAndIdNot(String category, Long id);

    Optional<NpdFeasibilityCategory> findByCategoryIgnoreCase(String category);
}
