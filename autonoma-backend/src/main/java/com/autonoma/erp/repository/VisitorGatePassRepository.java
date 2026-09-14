package com.autonoma.erp.repository;

import com.autonoma.erp.model.VisitorGatePass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;

@Repository
public interface VisitorGatePassRepository extends JpaRepository<VisitorGatePass, Long> {

    @Query("SELECT v FROM VisitorGatePass v WHERE " +
           "(:status IS NULL OR v.status = :status) " +
           "AND (:visitorType IS NULL OR v.visitorType = :visitorType) " +
           "AND (:foodAllowance IS NULL OR v.foodAllowance = :foodAllowance) " +
           "AND (:fromDate IS NULL OR v.createdDate >= :fromDate) " +
           "AND (:toDate IS NULL OR v.createdDate <= :toDate) " +
           "AND (:gatePassNo IS NULL OR LOWER(v.gatePassNo) LIKE LOWER(CONCAT('%', :gatePassNo, '%'))) " +
           "AND (:allowedPersons IS NULL OR LOWER(v.personToMeet) IN :allowedPersons OR LOWER(v.createdBy) IN :allowedPersons OR LOWER(v.personName) IN :allowedPersons) " +
           "AND (:searchValue IS NULL OR LOWER(v.visitorName) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.gatePassNo) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.mobileNo) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.personName) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.visitorType) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.personToMeet) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.purpose) LIKE LOWER(CONCAT('%', :searchValue, '%')) " +
           "     OR LOWER(v.address) LIKE LOWER(CONCAT('%', :searchValue, '%'))) " +
           "ORDER BY v.id DESC")
    Page<VisitorGatePass> findByFilters(
            @Param("status")       Integer status,
            @Param("visitorType")  String visitorType,
            @Param("foodAllowance") String foodAllowance,
            @Param("fromDate")     Date fromDate,
            @Param("toDate")       Date toDate,
            @Param("searchValue")  String searchValue,
            @Param("gatePassNo")   String gatePassNo,
            @Param("allowedPersons") java.util.Collection<String> allowedPersons,
            Pageable pageable
    );

    @Query("SELECT COUNT(v) FROM VisitorGatePass v WHERE v.gatePassDate >= :dayStart AND v.gatePassDate IS NOT NULL")
    long countByGatePassDateAndNotNull(@Param("dayStart") Date dayStart);

    @Query("SELECT COUNT(v) FROM VisitorGatePass v WHERE v.gatePassNo LIKE CONCAT(:prefix, '%')")
    long countByPrefix(@Param("prefix") String prefix);

    @Query("SELECT v FROM VisitorGatePass v WHERE v.mobileNo LIKE CONCAT('%', :digits) ORDER BY v.id DESC")
    java.util.List<VisitorGatePass> findLatestByMobileDigits(@Param("digits") String digits);

    @Query("SELECT v FROM VisitorGatePass v WHERE v.mobileNo LIKE CONCAT('%', :digits) AND ((v.checkInImg IS NOT NULL AND TRIM(v.checkInImg) <> '') OR (v.checkOutImg IS NOT NULL AND TRIM(v.checkOutImg) <> '')) ORDER BY v.id DESC")
    java.util.List<VisitorGatePass> findLatestWithImageByMobileDigits(@Param("digits") String digits);

    @Query("SELECT v FROM VisitorGatePass v WHERE v.visitorName = :name AND v.mobileNo = :mobile AND CAST(v.visitorDate AS date) = CAST(:date AS date)")
    java.util.List<VisitorGatePass> findByNameAndMobileAndDate(
            @Param("name") String name,
            @Param("mobile") String mobile,
            @Param("date") Date date
    );

    @Query("SELECT v FROM VisitorGatePass v WHERE v.visitorDate <= :endOfDay AND v.status IN (:statusIds)")
    java.util.List<VisitorGatePass> findOpenPassesBeforeDate(
            @Param("endOfDay") Date endOfDay,
            @Param("statusIds") java.util.Collection<Integer> statusIds
    );

    @Query("SELECT v FROM VisitorGatePass v WHERE LOWER(TRIM(v.gatePassNo)) = LOWER(TRIM(:gatePassNo))")
    java.util.Optional<VisitorGatePass> findByGatePassNoExact(@Param("gatePassNo") String gatePassNo);

    java.util.List<VisitorGatePass> findTop10ByGatePassNoContainingIgnoreCaseOrderByIdDesc(String gatePassNo);
}
