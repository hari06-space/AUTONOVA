package com.autonoma.erp.modules.hr.holiday.repository;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrHolidayMasterRepository extends JpaRepository<HrHolidayMaster, Long> {


    List<HrHolidayMaster> findByHolidayYear(String holidayYear);

    List<HrHolidayMaster> findByIsActiveTrue();

    List<HrHolidayMaster> findByHolidayDateBetween(LocalDate from, LocalDate to);

    List<HrHolidayMaster> findByIsOptionalTrueAndIsActiveTrue();

    List<HrHolidayMaster> findByHolidayDateAndIsActiveTrue(LocalDate holidayDate);

    List<HrHolidayMaster> findByFromDateOrHolidayDate(LocalDate fromDate, LocalDate holidayDate);

    boolean existsByFromDateOrHolidayDate(LocalDate fromDate, LocalDate holidayDate);
}
