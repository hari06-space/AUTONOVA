package com.autonoma.erp.modules.hr.orgstructure.repository;

import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

@Repository
public interface DesignationLevelRepository extends JpaRepository<DesignationLevel, Long> {
    @Query("SELECT MAX(d.screeningLevel) FROM DesignationLevel d")
    Optional<Integer> findMaxScreeningLevel();

    boolean existsByLevel(String level);
    Optional<DesignationLevel> findByLevel(String level);
}
