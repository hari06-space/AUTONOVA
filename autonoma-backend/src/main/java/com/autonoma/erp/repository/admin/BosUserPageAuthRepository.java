package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.autonoma.erp.model.admin.BosUserPageAuth;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Set;

@Repository
public interface BosUserPageAuthRepository extends JpaRepository<BosUserPageAuth, Object> {
    List<BosUserPageAuth> findByUserId(String userId);

    BosUserPageAuth findByUserIdAndPageId(String userId, Integer pageId);

    @Query("SELECT a.pageId FROM BosUserPageAuth a WHERE a.userId = :userId AND a.enable = 1")
    Set<Integer> findEnabledPageIdsByUserId(@Param("userId") String userId);

    @Query("SELECT DISTINCT a.user.empId FROM BosUserPageAuth a WHERE a.page.pageCode = :pageCode AND a.enable = 1 AND a.user.empId IS NOT NULL")
    List<Long> findEmpIdsByPageCodeAndEnable(@Param("pageCode") String pageCode);
}
