package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdCharacterSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdCharacterSpecificationRepository extends JpaRepository<NpdCharacterSpecification, Long> {

    List<NpdCharacterSpecification> findByStatus(Boolean status);

    boolean existsByCharacterSpecificationIgnoreCase(String characterSpecification);

    boolean existsByCharacterSpecificationIgnoreCaseAndIdNot(String characterSpecification, Long id);

    Optional<NpdCharacterSpecification> findByCharacterSpecificationIgnoreCase(String characterSpecification);
}
