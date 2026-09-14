package com.autonoma.erp.modules.qms.meeting.engine;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DatePropertyResolver {

    private final HrHolidayMasterRepository hrHolidayMasterRepository;

    public Map<String, Object> resolveProperties(LocalDate date, Map<String, Object> scheduleContext) {
        Map<String, Object> props = new HashMap<>();

        if (date == null) return props;

        // 1. DATE INFORMATION
        props.put("DATE", date.toString());
        props.put("DAY", date.getDayOfMonth());
        props.put("DAY_OF_WEEK", formatDayOfWeek(date.getDayOfWeek()));
        props.put("DAY_OF_MONTH", date.getDayOfMonth());
        props.put("WEEK_OF_MONTH", getWeekOfMonth(date));
        props.put("WEEK_OF_YEAR", getWeekOfYear(date));
        props.put("MONTH", formatMonth(date.getMonthValue()));
        props.put("MONTH_NUMBER", date.getMonthValue());
        props.put("QUARTER", "Q" + ((date.getMonthValue() - 1) / 3 + 1));
        props.put("YEAR", date.getYear());

        // 2. OCCURRENCE INFORMATION
        int occurrence = (date.getDayOfMonth() - 1) / 7 + 1;
        props.put("WEEK_OCCURRENCE", occurrence);
        props.put("NTH_OCCURRENCE", occurrence);
        props.put("FIRST_OCCURRENCE", occurrence == 1);

        LocalDate lastSameDay = date.with(TemporalAdjusters.lastInMonth(date.getDayOfWeek()));
        props.put("LAST_OCCURRENCE", date.equals(lastSameDay));

        // 3. HOLIDAY INFORMATION
        boolean isHoliday = isHoliday(date);
        props.put("IS_HOLIDAY", isHoliday);
        props.put("HOLIDAY_TYPE", getHolidayType(date));
        props.put("CONSECUTIVE_HOLIDAY_COUNT", getConsecutiveHolidayCount(date));

        // 4. WORKING DAY INFORMATION
        boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);
        props.put("IS_WEEKEND", isWeekend);
        boolean isWorkingDay = !isWeekend && !isHoliday;
        props.put("IS_WORKING_DAY", isWorkingDay);

        props.put("PREVIOUS_WORKING_DAY", getPreviousWorkingDay(date).toString());
        props.put("NEXT_WORKING_DAY", getNextWorkingDay(date).toString());
        props.put("FIRST_WORKING_DAY", getFirstWorkingDayOfMonth(date).toString());
        props.put("LAST_WORKING_DAY", getLastWorkingDayOfMonth(date).toString());
        props.put("PREVIOUS_DATE_IS_WORKING_DAY", !isWeekend(date.minusDays(1)) && !isHoliday(date.minusDays(1)));

        // 5. FINANCIAL INFORMATION
        int year = date.getYear();
        int month = date.getMonthValue();
        int fyStartYear = (month >= 4) ? year : (year - 1);
        int fyEndYear = fyStartYear + 1;
        String fy = fyStartYear + "-" + fyEndYear;
        props.put("FINANCIAL_YEAR", fy);
        props.put("FINANCIAL_YEAR_START_DATE", LocalDate.of(fyStartYear, 4, 1).toString());
        props.put("FINANCIAL_YEAR_END_DATE", LocalDate.of(fyEndYear, 3, 31).toString());

        LocalDate now = LocalDate.now();
        int currentFyStart = (now.getMonthValue() >= 4) ? now.getYear() : (now.getYear() - 1);
        props.put("CURRENT_FINANCIAL_YEAR", currentFyStart + "-" + (currentFyStart + 1));
        props.put("NEXT_FINANCIAL_YEAR", (currentFyStart + 1) + "-" + (currentFyStart + 2));

        // 6. SCHEDULE INFORMATION (Passed from context)
        if (scheduleContext != null) {
            props.putAll(scheduleContext);
        }

        return props;
    }

    public boolean isHoliday(LocalDate date) {
        if (date == null) return false;
        try {
            List<HrHolidayMaster> holidays = hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(date);
            return holidays != null && !holidays.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isWeekend(LocalDate date) {
        if (date == null) return false;
        return date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    public boolean isWorkingDay(LocalDate date) {
        return !isWeekend(date) && !isHoliday(date);
    }

    public LocalDate getNextWorkingDay(LocalDate date) {
        LocalDate candidate = date.plusDays(1);
        while (isWeekend(candidate) || isHoliday(candidate)) {
            candidate = candidate.plusDays(1);
        }
        return candidate;
    }

    public LocalDate getPreviousWorkingDay(LocalDate date) {
        LocalDate candidate = date.minusDays(1);
        while (isWeekend(candidate) || isHoliday(candidate)) {
            candidate = candidate.minusDays(1);
        }
        return candidate;
    }

    public LocalDate getFirstWorkingDayOfMonth(LocalDate date) {
        LocalDate first = date.withDayOfMonth(1);
        while (isWeekend(first) || isHoliday(first)) {
            first = first.plusDays(1);
        }
        return first;
    }

    public LocalDate getLastWorkingDayOfMonth(LocalDate date) {
        LocalDate last = date.with(TemporalAdjusters.lastDayOfMonth());
        while (isWeekend(last) || isHoliday(last)) {
            last = last.minusDays(1);
        }
        return last;
    }

    private String getHolidayType(LocalDate date) {
        try {
            List<HrHolidayMaster> holidays = hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(date);
            if (holidays != null && !holidays.isEmpty()) {
                HrHolidayMaster h = holidays.get(0);
                return h.getHolidayName() != null ? h.getHolidayName() : "Public Holiday";
            }
        } catch (Exception e) {
        }
        return "None";
    }

    private int getConsecutiveHolidayCount(LocalDate date) {
        if (!isHoliday(date)) return 0;
        int count = 1;

        LocalDate prev = date.minusDays(1);
        while (isHoliday(prev) || isWeekend(prev)) {
            count++;
            prev = prev.minusDays(1);
        }

        LocalDate next = date.plusDays(1);
        while (isHoliday(next) || isWeekend(next)) {
            count++;
            next = next.plusDays(1);
        }

        return count;
    }

    private String formatDayOfWeek(DayOfWeek dow) {
        switch (dow) {
            case MONDAY: return "Monday";
            case TUESDAY: return "Tuesday";
            case WEDNESDAY: return "Wednesday";
            case THURSDAY: return "Thursday";
            case FRIDAY: return "Friday";
            case SATURDAY: return "Saturday";
            case SUNDAY: return "Sunday";
            default: return dow.toString();
        }
    }

    private String formatMonth(int monthVal) {
        String[] months = {"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"};
        if (monthVal >= 1 && monthVal <= 12) {
            return months[monthVal - 1];
        }
        return String.valueOf(monthVal);
    }

    private int getWeekOfMonth(LocalDate date) {
        if (date == null) return 1;
        return date.get(java.time.temporal.WeekFields.of(DayOfWeek.SUNDAY, 1).weekOfMonth());
    }

    private int getWeekOfYear(LocalDate date) {
        return date.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());
    }
}
