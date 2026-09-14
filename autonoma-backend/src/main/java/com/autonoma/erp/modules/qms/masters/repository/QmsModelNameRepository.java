package com.autonoma.erp.modules.qms.masters.repository;

import com.autonoma.erp.modules.qms.masters.entity.QmsModelName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QmsModelNameRepository extends JpaRepository<QmsModelName, Long> {

    List<QmsModelName> findByStatus(String status);

    boolean existsByModelNameIgnoreCase(String modelName);

    boolean existsByModelNameIgnoreCaseAndIdNot(String modelName, Long id);
}
