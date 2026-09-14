package com.autonoma.erp.modules.master.commercial.repository;

import com.autonoma.erp.modules.master.commercial.entity.TermsMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TermsMasterRepository extends JpaRepository<TermsMaster, Long> {

    List<TermsMaster> findByTypeOrderByDescriptionAsc(String type);

    List<TermsMaster> findByStatus(Boolean status);

    List<TermsMaster> findByTypeAndStatus(String type, Boolean status);

    @Query("SELECT t FROM TermsMaster t WHERE " +
           "(:type IS NULL OR UPPER(TRIM(t.type)) = UPPER(TRIM(:type)) OR UPPER(t.type) LIKE UPPER(CONCAT('%', :type, '%'))) " +
           "AND (:divisionId IS NULL OR t.division = :divisionId OR t.division IS NULL) " +
           "AND (:activeOnly IS NULL OR :activeOnly = false OR t.status = true) " +
           "ORDER BY t.id DESC")
    List<TermsMaster> searchTerms(@Param("type") String type, @Param("divisionId") Long divisionId, @Param("activeOnly") Boolean activeOnly);

    @Query("SELECT t FROM TermsMaster t WHERE " +
           "(UPPER(t.type) LIKE '%PAYMENT%') " +
           "AND (:divisionId IS NULL OR t.division = :divisionId OR t.division IS NULL) " +
           "AND (:activeOnly IS NULL OR :activeOnly = false OR t.status = true) " +
           "ORDER BY t.description ASC, t.id DESC")
    List<TermsMaster> findPaymentTerms(@Param("divisionId") Long divisionId, @Param("activeOnly") Boolean activeOnly);

    @Query("SELECT t FROM TermsMaster t WHERE " +
           "(UPPER(t.type) LIKE '%DELIVERY%' OR UPPER(t.type) LIKE '%INCOTERM%') " +
           "AND (:divisionId IS NULL OR t.division = :divisionId OR t.division IS NULL) " +
           "AND (:activeOnly IS NULL OR :activeOnly = false OR t.status = true) " +
           "ORDER BY t.description ASC, t.id DESC")
    List<TermsMaster> findDeliveryTerms(@Param("divisionId") Long divisionId, @Param("activeOnly") Boolean activeOnly);

    @Query("SELECT t FROM TermsMaster t WHERE " +
           "(UPPER(t.type) LIKE '%DESPATC%' OR UPPER(t.type) LIKE '%DISPATCH%') " +
           "AND (:divisionId IS NULL OR t.division = :divisionId OR t.division IS NULL) " +
           "AND (:activeOnly IS NULL OR :activeOnly = false OR t.status = true) " +
           "ORDER BY t.description ASC, t.id DESC")
    List<TermsMaster> findDespatchModes(@Param("divisionId") Long divisionId, @Param("activeOnly") Boolean activeOnly);

    @Query("SELECT t FROM TermsMaster t WHERE " +
           "(UPPER(t.type) LIKE '%FREIGHT%') " +
           "AND (:divisionId IS NULL OR t.division = :divisionId OR t.division IS NULL) " +
           "AND (:activeOnly IS NULL OR :activeOnly = false OR t.status = true) " +
           "ORDER BY t.description ASC, t.id DESC")
    List<TermsMaster> findFreightTerms(@Param("divisionId") Long divisionId, @Param("activeOnly") Boolean activeOnly);

    @Query("SELECT DISTINCT t.type FROM TermsMaster t WHERE t.type IS NOT NULL AND TRIM(t.type) <> '' ORDER BY t.type ASC")
    List<String> findDistinctTypes();

    boolean existsByDescriptionIgnoreCaseAndType(String description, String type);

    boolean existsByCodeIgnoreCase(String code);
}
