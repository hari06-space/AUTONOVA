package com.autonoma.erp.repository;

import com.autonoma.erp.model.UserReleaseRead;
import com.autonoma.erp.model.UserReleaseReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserReleaseReadRepository extends JpaRepository<UserReleaseRead, UserReleaseReadId> {
    List<UserReleaseRead> findByUserId(String userId);
}
