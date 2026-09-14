package com.autonoma.erp.util;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;

public class HolidayValidator {

    public static void validateDate(LocalDate localDate) {
        if (localDate == null) {
            return;
        }
        if (localDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            throw new RuntimeException("Cannot schedule events on Sundays! Selected date is a Sunday.");
        }
        HrHolidayMasterRepository repo = SpringContext.getBean(HrHolidayMasterRepository.class);
        if (repo == null) {
            return;
        }
        List<HrHolidayMaster> holidays = repo.findByHolidayDateAndIsActiveTrue(localDate);
        if (holidays != null && !holidays.isEmpty()) {
            HrHolidayMaster holiday = holidays.get(0);
            throw new RuntimeException("Cannot schedule events on public holidays! Selected date is a registered holiday: " + holiday.getHolidayName());
        }
    }

    public static void validateDate(Date date) {
        if (date == null) {
            return;
        }
        LocalDate localDate = date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
        validateDate(localDate);
    }

    public static void validateDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return;
        }
        try {
            LocalDate localDate = LocalDate.parse(dateStr.substring(0, 10));
            validateDate(localDate);
        } catch (Exception ignored) {
        }
    }
}
