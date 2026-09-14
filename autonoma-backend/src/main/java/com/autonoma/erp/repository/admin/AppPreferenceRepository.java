package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.model.admin.AppPreference;

import java.util.Optional;

@Repository
public interface AppPreferenceRepository extends JpaRepository<AppPreference, Integer> {
    Optional<AppPreference> findByPrefName(String prefName);
}
