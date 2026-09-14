package com.autonoma.erp.repository;

import com.autonoma.erp.model.CompanyHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface CompanyHolidayRepository extends JpaRepository<CompanyHoliday, Long> {
    Optional<CompanyHoliday> findByHolidayDate(LocalDate date);
}
