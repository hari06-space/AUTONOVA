package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.UserCompanyMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface UserCompanyMappingRepository extends JpaRepository<UserCompanyMapping, Long> {
    List<UserCompanyMapping> findByUserId(String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserCompanyMapping u WHERE u.userId = ?1")
    void deleteByUserId(String userId);
}
