package com.autonoma.erp.modules.hr.attendance.service;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.Calendar;
import java.util.Date;
import java.util.Optional;

@Service
public class OvertimeCalculationService {

    private static final Logger log = LoggerFactory.getLogger(OvertimeCalculationService.class);
    private static final int DEFAULT_OT_MIN_MINUTES = 30;

    @Autowired
    private AppPreferenceRepository appPreferenceRepository;

    /**
     * Retrieves the configured minimum overtime interval in minutes (OT_MIN_MINUTES preference).
     * Defaults to 30 minutes if missing or invalid.
     */
    public int getOtMinMinutes() {
        try {
            if (appPreferenceRepository != null) {
                Optional<AppPreference> pref = appPreferenceRepository.findByPrefName("OT_MIN_MINUTES");
                if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().trim().isEmpty()) {
                    return Integer.parseInt(pref.get().getPrefValue().trim());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse OT_MIN_MINUTES preference, defaulting to {}. Error: {}", DEFAULT_OT_MIN_MINUTES, e.getMessage());
        }
        return DEFAULT_OT_MIN_MINUTES;
    }

    /**
     * Converts any time representation (Date, LocalTime, java.sql.Time, String) into minutes of day (0 to 1439).
     */
    public int objectToMinutesOfDay(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Date) {
            Calendar cal = Calendar.getInstance();
            cal.setTime((Date) obj);
            return cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
        }
        if (obj instanceof LocalTime) {
            LocalTime lt = (LocalTime) obj;
            return lt.getHour() * 60 + lt.getMinute();
        }
        if (obj instanceof String) {
            return parseTimeToMinutes((String) obj);
        }
        return 0;
    }

    /**
     * Calculates overtime minutes given checkout time, shift, and OT eligibility.
     */
    public int calculateOtMinutes(Object inTime, Object outTime, ShiftMaster shift, boolean isOtEligible, Integer preFetchedStepMins) {
        if (!isOtEligible || outTime == null || shift == null || shift.getEndTime() == null || shift.getEndTime().trim().isEmpty()) {
            return 0;
        }

        int step = (preFetchedStepMins != null && preFetchedStepMins > 0) ? preFetchedStepMins : getOtMinMinutes();
        int shiftEndMins = parseTimeToMinutes(shift.getEndTime());
        int checkoutMins = objectToMinutesOfDay(outTime);

        boolean isNightShift = Boolean.TRUE.equals(shift.getIsNightShift());

        int extraMins = checkoutMins - shiftEndMins;
        if (isNightShift && extraMins < 0) {
            extraMins += 24 * 60; // Handle midnight crossover
        }

        if (extraMins < step) {
            return 0;
        }

        return (int) Math.floor((double) extraMins / step) * step;
    }

    /**
     * Calculates overtime hours (as a BigDecimal with 2 decimal places) for entities using hours.
     */
    public BigDecimal calculateOtHours(Object inTime, Object outTime, ShiftMaster shift, boolean isOtEligible, Integer preFetchedStepMins) {
        int otMins = calculateOtMinutes(inTime, outTime, shift, isOtEligible, preFetchedStepMins);
        if (otMins <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(otMins).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Helper to parse time string ("09:00", "18:00", "06:00 PM") into minutes from start of day.
     */
    public int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return 0;
        }
        try {
            String str = timeStr.trim().toUpperCase();
            boolean isPm = str.contains("PM");
            boolean isAm = str.contains("AM");
            str = str.replace("AM", "").replace("PM", "").trim();
            String[] parts = str.split(":");
            int h = Integer.parseInt(parts[0].trim());
            int m = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
            if (isPm && h < 12) h += 12;
            if (isAm && h == 12) h = 0;
            return h * 60 + m;
        } catch (Exception e) {
            log.warn("Failed to parse time string '{}': {}", timeStr, e.getMessage());
            return 0;
        }
    }

    /**
     * Helper to convert Date to minutes of day (0 to 1439).
     */
    public int dateToMinutesOfDay(Date date) {
        return objectToMinutesOfDay(date);
    }
}
