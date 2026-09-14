package com.autonoma.erp.modules.platform.dbquery.repository;

import com.autonoma.erp.modules.platform.dbquery.entity.DbSavedQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DbSavedQueryRepository extends JpaRepository<DbSavedQuery, Integer> {
    List<DbSavedQuery> findByCreatedUserAndIsActiveTrueOrderByIdDesc(String createdUser);
    Optional<DbSavedQuery> findByIdAndCreatedUserAndIsActiveTrue(Integer id, String createdUser);
}
