package com.nutech.email.repository;

import com.nutech.email.model.MasterPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface MasterPartRepository extends JpaRepository<MasterPart, Long> {
    Optional<MasterPart> findByPartCode(String partCode);
    Optional<MasterPart> findByPartCodeIgnoreCase(String partCode);
    boolean existsByPartCode(String partCode);
    List<MasterPart> findByIsActiveTrue();

    @Query("SELECT mp FROM MasterPart mp WHERE mp.isActive = true AND " +
           "(LOWER(mp.partCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(mp.partName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<MasterPart> searchByCodeOrName(String query);
}
