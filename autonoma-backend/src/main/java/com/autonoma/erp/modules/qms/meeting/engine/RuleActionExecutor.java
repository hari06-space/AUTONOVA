package com.autonoma.erp.modules.qms.meeting.engine;

import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleRuleAction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class RuleActionExecutor {

    private final DatePropertyResolver datePropertyResolver;

    @Data
    @NoArgsConstructor
    public static class ActionResult {
        private boolean scheduled;
        private boolean skipped;
        private boolean stopProcessing;
        private boolean invalid;
        private LocalDate finalScheduledDate;
        private String actionType;
        private String message;
        private Long nextRuleId;

        public ActionResult(boolean scheduled, boolean skipped, boolean stopProcessing, boolean invalid,
                            LocalDate finalScheduledDate, String actionType, String message, Long nextRuleId) {
            this.scheduled = scheduled;
            this.skipped = skipped;
            this.stopProcessing = stopProcessing;
            this.invalid = invalid;
            this.finalScheduledDate = finalScheduledDate;
            this.actionType = actionType;
            this.message = message;
            this.nextRuleId = nextRuleId;
        }

        public boolean isScheduled() { return scheduled; }
        public void setScheduled(boolean scheduled) { this.scheduled = scheduled; }
        public boolean isSkipped() { return skipped; }
        public void setSkipped(boolean skipped) { this.skipped = skipped; }
        public boolean isStopProcessing() { return stopProcessing; }
        public void setStopProcessing(boolean stopProcessing) { this.stopProcessing = stopProcessing; }
        public boolean isInvalid() { return invalid; }
        public void setInvalid(boolean invalid) { this.invalid = invalid; }
        public LocalDate getFinalScheduledDate() { return finalScheduledDate; }
        public void setFinalScheduledDate(LocalDate finalScheduledDate) { this.finalScheduledDate = finalScheduledDate; }
        public String getActionType() { return actionType; }
        public void setActionType(String actionType) { this.actionType = actionType; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Long getNextRuleId() { return nextRuleId; }
        public void setNextRuleId(Long nextRuleId) { this.nextRuleId = nextRuleId; }
    }

    public ActionResult executeAction(QmsScheduleRuleAction action, LocalDate candidateDate) {
        if (action == null || action.getActionType() == null) {
            return new ActionResult(true, false, false, false, candidateDate, "SCHEDULE_MEETING", "Default Schedule Action", null);
        }

        String type = action.getActionType().toUpperCase().trim();

        switch (type) {
            case "SCHEDULE_MEETING":
            case "SCHEDULE":
                return new ActionResult(true, false, true, false, candidateDate, type, "Scheduled meeting on " + candidateDate, null);

            case "SCHEDULE_ON_DAY_OF_MONTH":
            case "SET_DAY_OF_MONTH":
            case "SCHEDULE_ON_DATE":
            case "SCHEDULE_ON_SPECIFIC_DAY":
                int targetDay = parseTargetDay(action.getActionParams());
                if (targetDay <= 0) targetDay = 5;
                int maxDay = candidateDate.lengthOfMonth();
                int actualDay = Math.min(Math.max(targetDay, 1), maxDay);
                LocalDate scheduledDate = candidateDate.withDayOfMonth(actualDay);
                return new ActionResult(true, false, true, false, scheduledDate, type, "Scheduled meeting directly on day " + actualDay + " of month: " + scheduledDate, null);

            case "SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY":
            case "SCHEDULE_ON_DAY_OF_MONTH_NEXT_WORKING_DAY":
                int targetDayN = parseTargetDay(action.getActionParams());
                if (targetDayN <= 0) targetDayN = 5;
                int maxDayN = candidateDate.lengthOfMonth();
                int actualDayN = Math.min(Math.max(targetDayN, 1), maxDayN);
                LocalDate schedDateN = candidateDate.withDayOfMonth(actualDayN);
                if (!datePropertyResolver.isWorkingDay(schedDateN)) {
                    schedDateN = datePropertyResolver.getNextWorkingDay(schedDateN);
                }
                return new ActionResult(true, false, true, false, schedDateN, type, "Scheduled meeting on day " + actualDayN + " of month (auto-shifted to next working day if holiday/weekend): " + schedDateN, null);

            case "SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY":
            case "SCHEDULE_ON_DAY_OF_MONTH_PREV_WORKING_DAY":
                int targetDayP = parseTargetDay(action.getActionParams());
                if (targetDayP <= 0) targetDayP = 5;
                int maxDayP = candidateDate.lengthOfMonth();
                int actualDayP = Math.min(Math.max(targetDayP, 1), maxDayP);
                LocalDate schedDateP = candidateDate.withDayOfMonth(actualDayP);
                if (!datePropertyResolver.isWorkingDay(schedDateP)) {
                    schedDateP = datePropertyResolver.getPreviousWorkingDay(schedDateP);
                }
                return new ActionResult(true, false, true, false, schedDateP, type, "Scheduled meeting on day " + actualDayP + " of month (auto-shifted to prev working day if holiday/weekend): " + schedDateP, null);

            case "MOVE_BY_DAYS":
            case "SHIFT_BY_DAYS":
                int daysOffset = parseDaysOffset(action.getActionParams());
                LocalDate shiftedDate = candidateDate.plusDays(daysOffset);
                return new ActionResult(true, false, false, false, shiftedDate, type, "Shifted date by " + daysOffset + " days: " + shiftedDate, null);

            case "SKIP_DATE":
            case "SKIP":
                return new ActionResult(false, true, true, false, null, type, "Skipped candidate date " + candidateDate, null);

            case "MOVE_TO_PREVIOUS_DAY":
                LocalDate prevDay = candidateDate.minusDays(1);
                return new ActionResult(true, false, false, false, prevDay, type, "Moved date to previous day: " + prevDay, null);

            case "MOVE_TO_NEXT_DAY":
                LocalDate nextDay = candidateDate.plusDays(1);
                return new ActionResult(true, false, false, false, nextDay, type, "Moved date to next day: " + nextDay, null);

            case "MOVE_TO_PREVIOUS_WORKING_DAY":
                LocalDate prevWorkDay = datePropertyResolver.getPreviousWorkingDay(candidateDate);
                return new ActionResult(true, false, false, false, prevWorkDay, type, "Moved date to previous working day: " + prevWorkDay, null);

            case "MOVE_TO_NEXT_WORKING_DAY":
                LocalDate nextWorkDay = datePropertyResolver.getNextWorkingDay(candidateDate);
                return new ActionResult(true, false, false, false, nextWorkDay, type, "Moved date to next working day: " + nextWorkDay, null);

            case "SELECT_FIRST_WORKING_DAY":
                LocalDate firstWorkDay = datePropertyResolver.getFirstWorkingDayOfMonth(candidateDate);
                return new ActionResult(true, false, false, false, firstWorkDay, type, "Selected first working day of month: " + firstWorkDay, null);

            case "SELECT_LAST_WORKING_DAY":
                LocalDate lastWorkDay = datePropertyResolver.getLastWorkingDayOfMonth(candidateDate);
                return new ActionResult(true, false, false, false, lastWorkDay, type, "Selected last working day of month: " + lastWorkDay, null);

            case "TRY_ANOTHER_CANDIDATE":
                LocalDate anotherCandidate = candidateDate.plusDays(1);
                return new ActionResult(false, false, false, false, anotherCandidate, type, "Trying next candidate date: " + anotherCandidate, null);

            case "APPLY_ANOTHER_RULE":
                Long targetRuleId = parseTargetRuleId(action.getActionParams());
                return new ActionResult(false, false, false, false, candidateDate, type, "Delegated to another rule ID: " + targetRuleId, targetRuleId);

            case "STOP_PROCESSING":
                return new ActionResult(false, true, true, false, null, type, "Stopped rule processing", null);

            case "MARK_AS_INVALID":
                return new ActionResult(false, false, true, true, null, type, "Marked date as invalid", null);

            default:
                return new ActionResult(true, false, true, false, candidateDate, type, "Executed action " + type, null);
        }
    }

    private int parseTargetDay(String params) {
        if (params == null || params.trim().isEmpty()) return 5;
        try {
            if (params.contains("\"dayOfMonth\":")) {
                String val = params.split("\"dayOfMonth\":")[1].split("[,}]")[0].trim().replaceAll("\"", "");
                return Integer.parseInt(val);
            }
            if (params.contains("\"day\":")) {
                String val = params.split("\"day\":")[1].split("[,}]")[0].trim().replaceAll("\"", "");
                return Integer.parseInt(val);
            }
            String clean = params.replaceAll("[^0-9]", "");
            return clean.isEmpty() ? 5 : Integer.parseInt(clean);
        } catch (Exception e) {
            return 5;
        }
    }

    private int parseDaysOffset(String params) {
        if (params == null || params.trim().isEmpty()) return 0;
        try {
            if (params.contains("\"days\":")) {
                String val = params.split("\"days\":")[1].split("[,}]")[0].trim().replaceAll("\"", "");
                return Integer.parseInt(val);
            }
            String clean = params.trim().replaceAll("[^0-9\\-+]", "");
            return clean.isEmpty() ? 0 : Integer.parseInt(clean);
        } catch (Exception e) {
            return 0;
        }
    }

    private Long parseTargetRuleId(String params) {
        if (params == null || params.trim().isEmpty()) return null;
        try {
            if (params.contains("\"targetRuleId\":")) {
                String val = params.split("\"targetRuleId\":")[1].split("[,}]")[0].trim();
                return Long.parseLong(val);
            }
            return Long.parseLong(params.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return null;
        }
    }
}
