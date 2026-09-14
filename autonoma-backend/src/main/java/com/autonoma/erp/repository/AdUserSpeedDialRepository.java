package com.autonoma.erp.repository;

import com.autonoma.erp.model.AdUserSpeedDial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdUserSpeedDialRepository extends JpaRepository<AdUserSpeedDial, Long> {
    List<AdUserSpeedDial> findByUserId(String userId);
    List<AdUserSpeedDial> findByUserIdAndModuleId(String userId, String moduleId);
    void deleteByUserIdAndModuleId(String userId, String moduleId);
}
