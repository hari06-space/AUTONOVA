package com.autonoma.erp.util;

import java.util.Calendar;
import java.util.Date;

/**
 * Utility for evaluating attendance day occupancy (First Half, Second Half, Full Day)
 * and cross-module conflict validation across Leave, OD, and Permission.
 */
public class AttendanceOccupancyUtil {

    public enum DayOccupancy {
        FULL_DAY("Full Day"),
        FIRST_HALF("First Half"),
        SECOND_HALF("Second Half");

        private final String label;

        DayOccupancy(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    public static DayOccupancy getLeaveOccupancy(String halfDay) {
        if (halfDay == null || halfDay.trim().isEmpty() || "No".equalsIgnoreCase(halfDay.trim())) {
            return DayOccupancy.FULL_DAY;
        }
        String clean = halfDay.trim().toUpperCase();
        if (clean.contains("MORNING") || clean.contains("FIRST") || clean.equals("YES")) {
            return DayOccupancy.FIRST_HALF;
        }
        if (clean.contains("AFTERNOON") || clean.contains("SECOND")) {
            return DayOccupancy.SECOND_HALF;
        }
        return DayOccupancy.FULL_DAY;
    }

    public static DayOccupancy getOdOccupancy(Date fromDateTime, Date toDateTime) {
        if (fromDateTime == null || toDateTime == null) {
            return DayOccupancy.FULL_DAY;
        }
        Calendar fromCal = Calendar.getInstance();
        fromCal.setTime(fromDateTime);
        Calendar toCal = Calendar.getInstance();
        toCal.setTime(toDateTime);

        // Multi-day OD occupies FULL_DAY for dates in range
        if (fromCal.get(Calendar.YEAR) != toCal.get(Calendar.YEAR) ||
            fromCal.get(Calendar.DAY_OF_YEAR) != toCal.get(Calendar.DAY_OF_YEAR)) {
            return DayOccupancy.FULL_DAY;
        }

        int fromHour = fromCal.get(Calendar.HOUR_OF_DAY);
        int toHour = toCal.get(Calendar.HOUR_OF_DAY);
        int toMin = toCal.get(Calendar.MINUTE);
        int toTotalMins = toHour * 60 + toMin;

        if (toTotalMins <= 780) { // <= 1:00 PM (13:00)
            return DayOccupancy.FIRST_HALF;
        }
        if (fromHour >= 12) { // >= 12:00 PM
            return DayOccupancy.SECOND_HALF;
        }
        return DayOccupancy.FULL_DAY;
    }

    public static DayOccupancy getPermissionOccupancy(String fromTimeStr, String toTimeStr) {
        int fromMins = parseTimeToMinutes(fromTimeStr);
        int toMins = parseTimeToMinutes(toTimeStr);

        if (toMins <= 780) { // <= 1:00 PM (13:00)
            return DayOccupancy.FIRST_HALF;
        }
        if (fromMins >= 720) { // >= 12:00 PM (12:00)
            return DayOccupancy.SECOND_HALF;
        }
        return DayOccupancy.FULL_DAY;
    }

    public static boolean checkOccupancyConflict(DayOccupancy existing, DayOccupancy requested) {
        if (existing == DayOccupancy.FULL_DAY || requested == DayOccupancy.FULL_DAY) {
            return true; // Full day blocks everything or requested full day is blocked by any half
        }
        return existing == requested; // First Half vs First Half or Second Half vs Second Half
    }

    public static int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return 0;
        String clean = timeStr.trim().toUpperCase();
        boolean isPm = clean.contains("PM");
        boolean isAm = clean.contains("AM");

        String timePart = clean.replace("AM", "").replace("PM", "").trim();
        String[] parts = timePart.split(":");
        if (parts.length < 2) return 0;
        try {
            int h = Integer.parseInt(parts[0].trim());
            int m = Integer.parseInt(parts[1].trim());

            if (isAm || isPm) {
                if (h == 12) h = 0;
                if (isPm) h += 12;
            }
            return h * 60 + m;
        } catch (Exception e) {
            return 0;
        }
    }
}
