package com.autonoma.erp.modules.hr.petrol.repository;

import com.autonoma.erp.modules.hr.petrol.entity.HrPetrolAllowanceMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;

@Repository
public interface HrPetrolAllowanceMasterRepository extends JpaRepository<HrPetrolAllowanceMaster, Long> {
    
    /** Check duplicate: same vehicle type and exact rate range */
    boolean existsByVehicleTypeAndFromRateAndToRate(String vehicleType, BigDecimal fromRate, BigDecimal toRate);

    /** Check duplicate on update (exclude self) */
    boolean existsByVehicleTypeAndFromRateAndToRateAndIdNot(String vehicleType, BigDecimal fromRate, BigDecimal toRate, Long id);

    /** Check slab overlap: same vehicle type where [fromRate, toRate] overlaps with existing slab [p.fromRate, p.toRate] */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM HrPetrolAllowanceMaster p " +
           "WHERE UPPER(p.vehicleType) = UPPER(:vehicleType) " +
           "AND :fromRate <= p.toRate AND :toRate >= p.fromRate")
    boolean existsOverlappingSlab(@Param("vehicleType") String vehicleType, 
                                  @Param("fromRate") BigDecimal fromRate, 
                                  @Param("toRate") BigDecimal toRate);

    /** Check slab overlap on update (exclude self) */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM HrPetrolAllowanceMaster p " +
           "WHERE UPPER(p.vehicleType) = UPPER(:vehicleType) " +
           "AND p.id <> :id " +
           "AND :fromRate <= p.toRate AND :toRate >= p.fromRate")
    boolean existsOverlappingSlabExcludingId(@Param("vehicleType") String vehicleType, 
                                             @Param("fromRate") BigDecimal fromRate, 
                                             @Param("toRate") BigDecimal toRate, 
                                             @Param("id") Long id);
}

