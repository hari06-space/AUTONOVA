package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.NpdControlMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NpdControlMethodRepository extends JpaRepository<NpdControlMethod, Long> {

    List<NpdControlMethod> findByStatus(Boolean status);

    boolean existsByControlMethodIgnoreCase(String controlMethod);

    boolean existsByControlMethodIgnoreCaseAndIdNot(String controlMethod, Long id);

    Optional<NpdControlMethod> findByControlMethodIgnoreCase(String controlMethod);
}
