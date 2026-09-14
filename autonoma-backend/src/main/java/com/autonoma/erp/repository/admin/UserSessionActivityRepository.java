package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.model.admin.UserSessionActivity;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionActivityRepository extends JpaRepository<UserSessionActivity, Long> {
    List<UserSessionActivity> findAllByUserIdOrderByEntryTimeDesc(String userId);

    Optional<UserSessionActivity> findTopByUserIdAndExitTimeIsNullOrderByEntryTimeDesc(String userId);
}
