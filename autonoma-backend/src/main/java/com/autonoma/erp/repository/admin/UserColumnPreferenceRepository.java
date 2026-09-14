package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.UserColumnPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserColumnPreferenceRepository extends JpaRepository<UserColumnPreference, Integer> {
    Optional<UserColumnPreference> findByUserIdAndPageKey(String userId, String pageKey);
    List<UserColumnPreference> findAllByUserId(String userId);
}
