package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.UserDivisionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface UserDivisionMappingRepository extends JpaRepository<UserDivisionMapping, Long> {
    List<UserDivisionMapping> findByUserId(String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserDivisionMapping u WHERE u.userId = ?1")
    void deleteByUserId(String userId);
}
