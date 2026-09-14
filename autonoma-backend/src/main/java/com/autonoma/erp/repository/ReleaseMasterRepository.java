package com.autonoma.erp.repository;

import com.autonoma.erp.model.ReleaseMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReleaseMasterRepository extends JpaRepository<ReleaseMaster, Long> {
    
    Optional<ReleaseMaster> findByVersionNo(String versionNo);
    
    List<ReleaseMaster> findByIsActiveOrderByReleaseDateDesc(Boolean isActive);
    
    @Query("SELECT r FROM ReleaseMaster r WHERE r.isActive = true ORDER BY r.releaseDate DESC, r.id DESC")
    List<ReleaseMaster> findLatestActiveRelease();
}
