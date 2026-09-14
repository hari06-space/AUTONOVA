package com.autonoma.erp.repository;

import com.autonoma.erp.model.OdEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OdEntryRepository extends JpaRepository<OdEntry, Long> {
    List<OdEntry> findAllByOrderByIdAsc();
    Optional<OdEntry> findTopByOdNumberStartingWithOrderByOdNumberDesc(String prefix);
    List<OdEntry> findByEmployeeId(Long employeeId);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM OdEntry o WHERE (o.statusId IN (SELECT s.id FROM StatusMaster s WHERE UPPER(TRIM(s.name)) IN ('VERIFIED', 'APPROVED')) OR (o.statusId IS NULL AND (o.rejectionReason IS NULL OR TRIM(o.rejectionReason) = ''))) AND o.odFromDateTime <= :endOfDay AND o.odToDateTime >= :startOfDay")
    List<OdEntry> findByDateRange(
            @org.springframework.data.repository.query.Param("startOfDay") java.util.Date startOfDay,
            @org.springframework.data.repository.query.Param("endOfDay") java.util.Date endOfDay
    );
}
