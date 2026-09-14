package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.dto.RuleMetadataDto;
import com.autonoma.erp.modules.qms.meeting.dto.RuleSimulationRequestDto;
import com.autonoma.erp.modules.qms.meeting.dto.RuleSimulationResultDto;
import com.autonoma.erp.modules.qms.meeting.engine.DatePropertyResolver;
import com.autonoma.erp.modules.qms.meeting.engine.RuleActionExecutor;
import com.autonoma.erp.modules.qms.meeting.engine.RuleConditionEvaluator;
import com.autonoma.erp.modules.qms.meeting.entity.*;
import com.autonoma.erp.modules.qms.meeting.repository.QmsScheduleRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicRuleEngineService {

    private final QmsScheduleRuleRepository ruleRepository;
    private final DatePropertyResolver datePropertyResolver;
    private final RuleConditionEvaluator conditionEvaluator;
    private final RuleActionExecutor actionExecutor;

    public RuleMetadataDto getRuleMetadata() {
        RuleMetadataDto metadata = new RuleMetadataDto();

        // 1. Fields
        List<RuleMetadataDto.FieldOption> fields = new ArrayList<>();
        fields.add(new RuleMetadataDto.FieldOption("DATE", "Date", "DATE", "DATE", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("DAY_OF_WEEK", "Day of Week", "DATE", "LIST", List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")));
        fields.add(new RuleMetadataDto.FieldOption("DAY_OF_MONTH", "Day of Month", "DATE", "NUMBER", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("WEEK_OF_MONTH", "Week of Month", "DATE", "NUMBER", List.of("1", "2", "3", "4", "5")));
        fields.add(new RuleMetadataDto.FieldOption("WEEK_OF_YEAR", "Week of Year", "DATE", "NUMBER", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("MONTH", "Month", "DATE", "LIST", List.of("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")));
        fields.add(new RuleMetadataDto.FieldOption("QUARTER", "Quarter", "DATE", "LIST", List.of("Q1", "Q2", "Q3", "Q4")));
        fields.add(new RuleMetadataDto.FieldOption("YEAR", "Year", "DATE", "NUMBER", List.of()));

        fields.add(new RuleMetadataDto.FieldOption("WEEK_OCCURRENCE", "Week Occurrence", "OCCURRENCE", "NUMBER", List.of("1", "2", "3", "4", "5")));
        fields.add(new RuleMetadataDto.FieldOption("NTH_OCCURRENCE", "Nth Occurrence", "OCCURRENCE", "NUMBER", List.of("1", "2", "3", "4", "5")));
        fields.add(new RuleMetadataDto.FieldOption("FIRST_OCCURRENCE", "First Occurrence", "OCCURRENCE", "BOOLEAN", List.of("true", "false")));
        fields.add(new RuleMetadataDto.FieldOption("LAST_OCCURRENCE", "Last Occurrence", "OCCURRENCE", "BOOLEAN", List.of("true", "false")));

        fields.add(new RuleMetadataDto.FieldOption("IS_WORKING_DAY", "Is Working Day", "WORKING_DAY", "BOOLEAN", List.of("true", "false")));
        fields.add(new RuleMetadataDto.FieldOption("IS_WEEKEND", "Is Weekend", "WORKING_DAY", "BOOLEAN", List.of("true", "false")));
        fields.add(new RuleMetadataDto.FieldOption("PREVIOUS_WORKING_DAY", "Previous Working Day", "WORKING_DAY", "DATE", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("NEXT_WORKING_DAY", "Next Working Day", "WORKING_DAY", "DATE", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("FIRST_WORKING_DAY", "First Working Day", "WORKING_DAY", "DATE", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("LAST_WORKING_DAY", "Last Working Day", "WORKING_DAY", "DATE", List.of()));

        fields.add(new RuleMetadataDto.FieldOption("IS_HOLIDAY", "Is Holiday", "HOLIDAY", "BOOLEAN", List.of("true", "false")));
        fields.add(new RuleMetadataDto.FieldOption("HOLIDAY_TYPE", "Holiday Type", "HOLIDAY", "TEXT", List.of("Public Holiday", "National Holiday", "Festival")));
        fields.add(new RuleMetadataDto.FieldOption("CONSECUTIVE_HOLIDAY_COUNT", "Consecutive Holiday Count", "HOLIDAY", "NUMBER", List.of()));

        fields.add(new RuleMetadataDto.FieldOption("FINANCIAL_YEAR", "Financial Year", "FINANCIAL", "TEXT", List.of()));
        fields.add(new RuleMetadataDto.FieldOption("CURRENT_FINANCIAL_YEAR", "Current Financial Year", "FINANCIAL", "TEXT", List.of()));

        fields.add(new RuleMetadataDto.FieldOption("FREQUENCY", "Frequency", "SCHEDULE", "LIST", List.of("DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "HALF YEARLY", "YEARLY")));
        metadata.setFields(fields);

        // 2. Operators
        List<RuleMetadataDto.OperatorOption> operators = new ArrayList<>();
        operators.add(new RuleMetadataDto.OperatorOption("EQUALS", "Equals", List.of("TEXT", "NUMBER", "DATE", "BOOLEAN", "LIST")));
        operators.add(new RuleMetadataDto.OperatorOption("NOT_EQUALS", "Not Equals", List.of("TEXT", "NUMBER", "DATE", "BOOLEAN", "LIST")));
        operators.add(new RuleMetadataDto.OperatorOption("CONTAINS", "Contains", List.of("TEXT")));
        operators.add(new RuleMetadataDto.OperatorOption("IN", "In", List.of("TEXT", "NUMBER", "LIST")));
        operators.add(new RuleMetadataDto.OperatorOption("NOT_IN", "Not In", List.of("TEXT", "NUMBER", "LIST")));
        operators.add(new RuleMetadataDto.OperatorOption("GREATER_THAN", "Greater Than", List.of("NUMBER", "DATE")));
        operators.add(new RuleMetadataDto.OperatorOption("LESS_THAN", "Less Than", List.of("NUMBER", "DATE")));
        operators.add(new RuleMetadataDto.OperatorOption("GREATER_THAN_OR_EQUAL", "Greater Than Or Equal", List.of("NUMBER", "DATE")));
        operators.add(new RuleMetadataDto.OperatorOption("LESS_THAN_OR_EQUAL", "Less Than Or Equal", List.of("NUMBER", "DATE")));
        operators.add(new RuleMetadataDto.OperatorOption("BETWEEN", "Between", List.of("NUMBER", "DATE")));
        operators.add(new RuleMetadataDto.OperatorOption("IS_TRUE", "Is True", List.of("BOOLEAN")));
        operators.add(new RuleMetadataDto.OperatorOption("IS_FALSE", "Is False", List.of("BOOLEAN")));
        operators.add(new RuleMetadataDto.OperatorOption("BEFORE", "Before", List.of("DATE")));
        operators.add(new RuleMetadataDto.OperatorOption("AFTER", "After", List.of("DATE")));
        metadata.setOperators(operators);

        // 3. Actions
        List<RuleMetadataDto.ActionOption> actions = new ArrayList<>();
        actions.add(new RuleMetadataDto.ActionOption("SCHEDULE_MEETING", "Schedule Meeting (Schedule Date)", "Schedule the meeting on the schedule date", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("SCHEDULE_ON_DAY_OF_MONTH", "Schedule on Specific Day of Month", "Directly schedule meeting on a specific day of the month (e.g. 5th)", List.of("dayOfMonth")));
        actions.add(new RuleMetadataDto.ActionOption("SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY", "Schedule on Specific Day (or Next Working Day if Holiday)", "Schedule on specific day; if holiday/weekend, auto-move to next working day", List.of("dayOfMonth")));
        actions.add(new RuleMetadataDto.ActionOption("SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY", "Schedule on Specific Day (or Prev Working Day if Holiday)", "Schedule on specific day; if holiday/weekend, auto-move to prev working day", List.of("dayOfMonth")));
        actions.add(new RuleMetadataDto.ActionOption("MOVE_BY_DAYS", "Shift Date (+/- Days)", "Shift schedule date by N days", List.of("days")));
        actions.add(new RuleMetadataDto.ActionOption("MOVE_TO_PREVIOUS_DAY", "Move To Previous Day", "Shift schedule date by -1 day", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("MOVE_TO_NEXT_DAY", "Move To Next Day", "Shift schedule date by +1 day", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("MOVE_TO_PREVIOUS_WORKING_DAY", "Move To Previous Working Day", "Shift date to preceding non-holiday working day", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("MOVE_TO_NEXT_WORKING_DAY", "Move To Next Working Day", "Shift date to next non-holiday working day", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("SELECT_FIRST_WORKING_DAY", "Select First Working Day", "Select 1st working day of the month", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("SELECT_LAST_WORKING_DAY", "Select Last Working Day", "Select last working day of the month", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("SKIP_DATE", "Skip Date", "Skip the schedule date", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("TRY_ANOTHER_CANDIDATE", "Try Next Schedule Date", "Advance search to next schedule date", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("APPLY_ANOTHER_RULE", "Apply Another Rule", "Delegate to target rule", List.of("targetRuleId")));
        actions.add(new RuleMetadataDto.ActionOption("STOP_PROCESSING", "Stop Processing", "Stop further rule evaluations", List.of()));
        actions.add(new RuleMetadataDto.ActionOption("MARK_AS_INVALID", "Mark As Invalid", "Mark schedule date as invalid", List.of()));
        metadata.setActions(actions);

        // 4. Date Generators
        List<RuleMetadataDto.DateGeneratorOption> generators = new ArrayList<>();
        generators.add(new RuleMetadataDto.DateGeneratorOption("FREQUENCY_DATE", "Frequency Date", "Generate based on meeting recurrence frequency"));
        generators.add(new RuleMetadataDto.DateGeneratorOption("DAY_OF_MONTH", "Day of Month", "Generate on specific day of month (e.g. 15th)"));
        generators.add(new RuleMetadataDto.DateGeneratorOption("DAY_OF_WEEK", "Day of Week", "Generate on specific weekday (e.g. every Saturday)"));
        generators.add(new RuleMetadataDto.DateGeneratorOption("NTH_OCCURRENCE", "Nth Occurrence of Weekday", "Generate on Nth occurrence of weekday in month"));
        metadata.setDateGenerators(generators);

        // 5. Fallbacks
        List<RuleMetadataDto.FallbackOption> fallbacks = new ArrayList<>();
        fallbacks.add(new RuleMetadataDto.FallbackOption("MOVE_TO_NEXT_WORKING_DAY", "Move To Next Working Day", "If primary date fails, move to next working day"));
        fallbacks.add(new RuleMetadataDto.FallbackOption("MOVE_TO_PREVIOUS_WORKING_DAY", "Move To Previous Working Day", "If primary date fails, move to previous working day"));
        fallbacks.add(new RuleMetadataDto.FallbackOption("TRY_ANOTHER_CANDIDATE", "Try Next Schedule Date", "If primary date fails, try next schedule date"));
        fallbacks.add(new RuleMetadataDto.FallbackOption("SKIP_DATE", "Skip Schedule Date", "If primary date fails, skip date"));
        metadata.setFallbacks(fallbacks);

        return metadata;
    }

    @Transactional
    public QmsScheduleRule saveRule(QmsScheduleRule incoming) {
        QmsScheduleRule ruleToSave;
        if (incoming.getId() != null) {
            ruleToSave = ruleRepository.findById(incoming.getId()).orElse(incoming);
            ruleToSave.setRuleName(incoming.getRuleName());
            ruleToSave.setDescription(incoming.getDescription());
            ruleToSave.setConfigId(incoming.getConfigId());
            ruleToSave.setMeetingId(incoming.getMeetingId());
            ruleToSave.setBaseDateGenerator(incoming.getBaseDateGenerator());
            ruleToSave.setBaseDateParams(incoming.getBaseDateParams());
            ruleToSave.setPriority(incoming.getPriority());
            ruleToSave.setStatus(incoming.getStatus());
            ruleToSave.setIsActive(incoming.getIsActive());
            ruleToSave.setUpdatedDate(java.time.LocalDateTime.now());
            ruleToSave.setUpdatedBy(incoming.getUpdatedBy());
        } else {
            ruleToSave = incoming;
            ruleToSave.setCreatedDate(java.time.LocalDateTime.now());
        }

        // Rebuild root condition groups and nested hierarchy in-place
        if (ruleToSave.getConditionGroups() == null) {
            ruleToSave.setConditionGroups(new ArrayList<>());
        } else {
            ruleToSave.getConditionGroups().clear();
        }
        if (incoming.getConditionGroups() != null) {
            for (QmsScheduleRuleGroup grp : incoming.getConditionGroups()) {
                if (grp.getParentGroup() == null) {
                    QmsScheduleRuleGroup builtGroup = buildGroupHierarchy(grp, ruleToSave, null);
                    ruleToSave.getConditionGroups().add(builtGroup);
                }
            }
        }

        // Rebuild Actions in-place
        if (ruleToSave.getActions() == null) {
            ruleToSave.setActions(new ArrayList<>());
        } else {
            ruleToSave.getActions().clear();
        }
        if (incoming.getActions() != null) {
            for (QmsScheduleRuleAction act : incoming.getActions()) {
                QmsScheduleRuleAction newAct = new QmsScheduleRuleAction();
                newAct.setRule(ruleToSave);
                newAct.setActionType(act.getActionType());
                newAct.setActionParams(act.getActionParams());
                ruleToSave.getActions().add(newAct);
            }
        }

        // Rebuild Fallbacks in-place
        if (ruleToSave.getFallbacks() == null) {
            ruleToSave.setFallbacks(new ArrayList<>());
        } else {
            ruleToSave.getFallbacks().clear();
        }
        if (incoming.getFallbacks() != null) {
            for (QmsScheduleRuleFallback fb : incoming.getFallbacks()) {
                QmsScheduleRuleFallback newFb = new QmsScheduleRuleFallback();
                newFb.setRule(ruleToSave);
                newFb.setFallbackActionType(fb.getFallbackActionType());
                newFb.setPriority(fb.getPriority() != null ? fb.getPriority() : 1);
                newFb.setTargetRuleId(fb.getTargetRuleId());
                newFb.setActionParams(fb.getActionParams());
                ruleToSave.getFallbacks().add(newFb);
            }
        }

        QmsScheduleRule saved = ruleRepository.saveAndFlush(ruleToSave);
        initializeRuleCollections(saved);
        return saved;
    }

    private void initializeRuleCollections(QmsScheduleRule rule) {
        if (rule == null) return;
        if (rule.getConditionGroups() != null) {
            for (QmsScheduleRuleGroup group : rule.getConditionGroups()) {
                initializeGroupCollections(group);
            }
        }
        if (rule.getActions() != null) {
            rule.getActions().size();
        }
        if (rule.getFallbacks() != null) {
            rule.getFallbacks().size();
        }
    }

    private void initializeGroupCollections(QmsScheduleRuleGroup group) {
        if (group == null) return;
        if (group.getConditions() != null) {
            group.getConditions().size();
        }
        if (group.getChildGroups() != null) {
            for (QmsScheduleRuleGroup child : group.getChildGroups()) {
                initializeGroupCollections(child);
            }
        }
    }

    private QmsScheduleRuleGroup buildGroupHierarchy(QmsScheduleRuleGroup incomingGrp, QmsScheduleRule rule, QmsScheduleRuleGroup parentGrp) {
        QmsScheduleRuleGroup g = new QmsScheduleRuleGroup();
        g.setRule(rule);
        g.setParentGroup(parentGrp);
        g.setLogicalOperator(incomingGrp.getLogicalOperator() != null ? incomingGrp.getLogicalOperator() : "ALL");

        if (incomingGrp.getConditions() != null) {
            List<QmsScheduleRuleCondition> condList = new ArrayList<>();
            for (QmsScheduleRuleCondition c : incomingGrp.getConditions()) {
                QmsScheduleRuleCondition newC = new QmsScheduleRuleCondition();
                newC.setGroup(g);
                newC.setFieldCode(c.getFieldCode());
                newC.setOperatorCode(c.getOperatorCode());
                newC.setConditionValue(c.getConditionValue());
                newC.setDataType(c.getDataType() != null ? c.getDataType() : "TEXT");
                newC.setLogicalOperator(c.getLogicalOperator() != null ? c.getLogicalOperator() : "AND");
                condList.add(newC);
            }
            g.setConditions(condList);
        }

        if (incomingGrp.getChildGroups() != null) {
            List<QmsScheduleRuleGroup> childList = new ArrayList<>();
            for (QmsScheduleRuleGroup cg : incomingGrp.getChildGroups()) {
                childList.add(buildGroupHierarchy(cg, rule, g));
            }
            g.setChildGroups(childList);
        }

        return g;
    }

    @Transactional(readOnly = true)
    public List<QmsScheduleRule> getRulesForConfig(Long configId) {
        List<QmsScheduleRule> rules = ruleRepository.findByConfigIdOrderByPriorityAsc(configId);
        rules.forEach(this::initializeRuleCollections);
        return rules;
    }

    @Transactional(readOnly = true)
    public List<QmsScheduleRule> getRulesForMeeting(Long meetingId) {
        List<QmsScheduleRule> rules = ruleRepository.findByMeetingIdOrderByPriorityAsc(meetingId);
        rules.forEach(this::initializeRuleCollections);
        return rules;
    }

    @Transactional
    public void deleteRule(Long id) {
        ruleRepository.deleteById(id);
    }

    @Transactional
    public void deleteRuleByName(String ruleName, Long meetingId, Long configId) {
        ruleRepository.deleteByRuleNameAndTarget(ruleName, meetingId, configId);
    }

    @Transactional
    public void reorderRulePriorities(List<Map<String, Object>> priorityList) {
        if (priorityList == null || priorityList.isEmpty()) return;

        for (Map<String, Object> item : priorityList) {
            Long id = ((Number) item.get("id")).longValue();
            Integer priority = ((Number) item.get("priority")).intValue();

            ruleRepository.findById(id).ifPresent(r -> {
                r.setPriority(priority);
                r.setUpdatedDate(java.time.LocalDateTime.now());
                ruleRepository.save(r);
            });
        }
    }

    public boolean hasActiveRules(Long configId, Long meetingId) {
        return hasActiveRules(configId, meetingId, null);
    }

    public boolean hasActiveRules(Long configId, Long meetingId, Long meetingTypeId) {
        List<QmsScheduleRule> rules = ruleRepository.findActiveRulesByConfigOrMeeting(configId, meetingId, meetingTypeId);
        return rules != null && !rules.isEmpty();
    }

    public LocalDate evaluateCandidateDate(Long configId, Long meetingId, LocalDate candidateDate, Map<String, Object> scheduleContext) {
        return evaluateCandidateDate(configId, meetingId, null, candidateDate, scheduleContext);
    }

    public LocalDate evaluateCandidateDate(Long configId, Long meetingId, Long meetingTypeId, LocalDate candidateDate, Map<String, Object> scheduleContext) {
        List<QmsScheduleRule> rules = ruleRepository.findActiveRulesByConfigOrMeeting(configId, meetingId, meetingTypeId);

        if (rules == null || rules.isEmpty()) {
            return candidateDate; // No custom rules -> fallback to standard behavior
        }

        // When custom rules exist, scan candidate dates within the target month (starting from 1st of month)
        // to find the exact target date matching the active rules (e.g. 1st Saturday = 03/10/2026)
        LocalDate startOfMonth = candidateDate.withDayOfMonth(1);
        LocalDate curr = startOfMonth;
        int daysInMonth = candidateDate.lengthOfMonth();

        for (int day = 0; day < daysInMonth; day++) {
            Map<String, Object> props = datePropertyResolver.resolveProperties(curr, scheduleContext);

            for (QmsScheduleRule rule : rules) {
                boolean groupMatched = true;
                if (rule.getConditionGroups() != null && !rule.getConditionGroups().isEmpty()) {
                    for (QmsScheduleRuleGroup group : rule.getConditionGroups()) {
                        if (!conditionEvaluator.evaluateGroup(group, props)) {
                            groupMatched = false;
                            break;
                        }
                    }
                }

                if (groupMatched) {
                    if (rule.getActions() != null && !rule.getActions().isEmpty()) {
                        for (QmsScheduleRuleAction action : rule.getActions()) {
                            RuleActionExecutor.ActionResult actRes = actionExecutor.executeAction(action, curr);
                            if (actRes.isScheduled()) {
                                return actRes.getFinalScheduledDate();
                            }
                            if (actRes.isSkipped() || actRes.isInvalid()) {
                                return null;
                            }
                            if (actRes.getFinalScheduledDate() != null) {
                                curr = actRes.getFinalScheduledDate();
                                props = datePropertyResolver.resolveProperties(curr, scheduleContext);
                            }
                        }
                    } else {
                        return curr;
                    }
                } else {
                    if (rule.getFallbacks() != null && !rule.getFallbacks().isEmpty()) {
                        List<QmsScheduleRuleFallback> sortedFallbacks = rule.getFallbacks().stream()
                                .sorted(Comparator.comparingInt(QmsScheduleRuleFallback::getPriority))
                                .collect(Collectors.toList());

                        for (QmsScheduleRuleFallback fb : sortedFallbacks) {
                            QmsScheduleRuleAction fbAction = new QmsScheduleRuleAction();
                            fbAction.setActionType(fb.getFallbackActionType());
                            fbAction.setActionParams(fb.getActionParams());

                            RuleActionExecutor.ActionResult fbRes = actionExecutor.executeAction(fbAction, curr);
                            if (fbRes.isScheduled()) {
                                return fbRes.getFinalScheduledDate();
                            }
                            if (fbRes.isSkipped() || fbRes.isInvalid()) {
                                return null;
                            }
                            if (fbRes.getFinalScheduledDate() != null) {
                                curr = fbRes.getFinalScheduledDate();
                                props = datePropertyResolver.resolveProperties(curr, scheduleContext);
                            }
                        }
                    }
                }
            }
            curr = curr.plusDays(1);
        }

        return candidateDate;
    }

    /**
     * Rule Simulation Engine for testing schedule rules over a given date range.
     */
    public RuleSimulationResultDto simulateRules(RuleSimulationRequestDto request) {
        RuleSimulationResultDto result = new RuleSimulationResultDto();
        result.setStartDate(request.getStartDate());
        result.setEndDate(request.getEndDate());

        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : start.plusMonths(3);

        List<QmsScheduleRule> rules;
        if (request.getRuleIds() != null && !request.getRuleIds().isEmpty()) {
            rules = ruleRepository.findAllById(request.getRuleIds());
            rules.sort(Comparator.comparingInt(QmsScheduleRule::getPriority));
        } else {
            rules = ruleRepository.findActiveRulesByConfigOrMeeting(request.getConfigId(), request.getMeetingId());
        }

        List<RuleSimulationResultDto.SimulationRow> rows = new ArrayList<>();
        int scheduledCount = 0;

        String freq = request.getFrequency() != null ? request.getFrequency().toUpperCase().trim() : "MONTHLY";

        if ("MONTHLY".equals(freq)) {
            LocalDate currentMonthStart = start.withDayOfMonth(1);
            while (!currentMonthStart.isAfter(end)) {
                LocalDate monthEnd = currentMonthStart.with(TemporalAdjusters.lastDayOfMonth());
                if (monthEnd.isAfter(end)) monthEnd = end;

                LocalDate dayIter = currentMonthStart.isBefore(start) ? start : currentMonthStart;
                RuleSimulationResultDto.SimulationRow bestRow = null;

                while (!dayIter.isAfter(monthEnd)) {
                    RuleSimulationResultDto.SimulationRow row = evaluateSingleDate(dayIter, rules, freq);
                    if ("MATCHED".equals(row.getStatus()) || "FALLBACK_APPLIED".equals(row.getStatus())) {
                        bestRow = row;
                        break;
                    }
                    dayIter = dayIter.plusDays(1);
                }

                if (bestRow == null) {
                    int targetDay = Math.min(start.getDayOfMonth(), currentMonthStart.lengthOfMonth());
                    LocalDate fallbackCandidate = currentMonthStart.withDayOfMonth(targetDay);
                    bestRow = evaluateSingleDate(fallbackCandidate, rules, freq);
                }

                rows.add(bestRow);
                if ("MATCHED".equals(bestRow.getStatus()) || "FALLBACK_APPLIED".equals(bestRow.getStatus())) {
                    scheduledCount++;
                }

                currentMonthStart = currentMonthStart.plusMonths(1);
            }
        } else {
            List<LocalDate> candidates = generateCandidateDates(start, end, freq);
            for (LocalDate candidate : candidates) {
                RuleSimulationResultDto.SimulationRow row = evaluateSingleDate(candidate, rules, freq);
                rows.add(row);
                if ("MATCHED".equals(row.getStatus()) || "FALLBACK_APPLIED".equals(row.getStatus())) {
                    scheduledCount++;
                }
            }
        }

        result.setTotalCandidates(rows.size());
        result.setTotalScheduled(scheduledCount);
        result.setResults(rows);
        return result;
    }

    private RuleSimulationResultDto.SimulationRow evaluateSingleDate(LocalDate candidate, List<QmsScheduleRule> rules, String frequency) {
        RuleSimulationResultDto.SimulationRow row = new RuleSimulationResultDto.SimulationRow();
        row.setCandidateDate(candidate);
        row.setHoliday(datePropertyResolver.isHoliday(candidate));
        row.setWeekend(datePropertyResolver.isWeekend(candidate));

        Map<String, Object> props = datePropertyResolver.resolveProperties(candidate, Map.of("FREQUENCY", frequency));

        boolean matched = false;
        if (rules != null && !rules.isEmpty()) {
            for (QmsScheduleRule rule : rules) {
                boolean groupMatch = true;
                StringBuilder condSummary = new StringBuilder();

                if (rule.getConditionGroups() != null && !rule.getConditionGroups().isEmpty()) {
                    for (QmsScheduleRuleGroup group : rule.getConditionGroups()) {
                        boolean res = conditionEvaluator.evaluateGroup(group, props);
                        condSummary.append(group.getLogicalOperator()).append(" Group Evaluated: ").append(res).append("; ");
                        if (!res) {
                            groupMatch = false;
                            break;
                        }
                    }
                }

                if (groupMatch) {
                    matched = true;
                    row.setMatchedRuleName(rule.getRuleName());
                    row.setMatchedRuleId(rule.getId());
                    row.setConditionsCheckedSummary(buildHumanReadableRuleDescription(rule));

                    QmsScheduleRuleAction mainAction = (rule.getActions() != null && !rule.getActions().isEmpty()) ? rule.getActions().get(0) : null;
                    RuleActionExecutor.ActionResult actRes = actionExecutor.executeAction(mainAction, candidate);

                    row.setActionApplied(actRes.getActionType());
                    row.setFinalScheduledDate(actRes.getFinalScheduledDate());
                    row.setStatus(actRes.isScheduled() ? "MATCHED" : "SKIPPED");
                    row.setMessage(actRes.getMessage());
                    break;
                } else {
                    if (rule.getFallbacks() != null && !rule.getFallbacks().isEmpty()) {
                        QmsScheduleRuleFallback fb = rule.getFallbacks().get(0);
                        QmsScheduleRuleAction fbAction = new QmsScheduleRuleAction();
                        fbAction.setActionType(fb.getFallbackActionType());

                        RuleActionExecutor.ActionResult fbRes = actionExecutor.executeAction(fbAction, candidate);

                        row.setMatchedRuleName(rule.getRuleName() + " (Fallback)");
                        row.setMatchedRuleId(rule.getId());
                        row.setConditionsCheckedSummary(buildHumanReadableRuleDescription(rule));
                        row.setFallbackUsed(fb.getFallbackActionType());
                        row.setActionApplied(fbRes.getActionType());
                        row.setFinalScheduledDate(fbRes.getFinalScheduledDate());
                        row.setStatus("FALLBACK_APPLIED");
                        row.setMessage(fbRes.getMessage());
                        matched = true;
                        break;
                    }
                }
            }
        }

        if (!matched) {
            row.setMatchedRuleName("None (Default Frequency)");
            row.setConditionsCheckedSummary("WHEN Standard Schedule Date THEN Schedule Meeting");
            row.setFinalScheduledDate(candidate);
            row.setStatus("NO_MATCH");
            row.setActionApplied("DEFAULT_SCHEDULE");
            row.setMessage("No custom rule matched. Evaluated standard schedule date.");
        }

        return row;
    }

    public String buildHumanReadableRuleDescription(QmsScheduleRule rule) {
        if (rule == null) return "-";
        if (rule.getDescription() != null && !rule.getDescription().trim().isEmpty() && !rule.getDescription().startsWith("ALL Group")) {
            return rule.getDescription().trim();
        }

        StringBuilder sb = new StringBuilder();
        sb.append("WHEN ");

        if (rule.getConditionGroups() != null && !rule.getConditionGroups().isEmpty()) {
            List<String> grpTexts = new ArrayList<>();
            for (QmsScheduleRuleGroup group : rule.getConditionGroups()) {
                String gt = formatGroupText(group);
                if (gt != null && !gt.trim().isEmpty()) {
                    grpTexts.add(gt);
                }
            }
            if (!grpTexts.isEmpty()) {
                sb.append(String.join(" AND ", grpTexts));
            } else {
                sb.append("Always");
            }
        } else {
            sb.append("Always");
        }

        sb.append(" THEN ");
        if (rule.getActions() != null && !rule.getActions().isEmpty()) {
            List<String> actTexts = new ArrayList<>();
            for (QmsScheduleRuleAction act : rule.getActions()) {
                actTexts.add(formatActionText(act));
            }
            sb.append(String.join(", ", actTexts));
        } else {
            sb.append("Schedule Meeting (Candidate Date)");
        }

        return sb.toString();
    }

    private String formatGroupText(QmsScheduleRuleGroup group) {
        if (group == null) return "";
        List<String> parts = new ArrayList<>();
        String defaultOp = "ALL".equalsIgnoreCase(group.getLogicalOperator()) ? "AND" : "OR";

        if (group.getConditions() != null && !group.getConditions().isEmpty()) {
            List<String> condList = new ArrayList<>();
            for (int i = 0; i < group.getConditions().size(); i++) {
                QmsScheduleRuleCondition c = group.getConditions().get(i);
                String fieldName = formatFieldDisplayName(c.getFieldCode());
                String op = (c.getOperatorCode() != null ? c.getOperatorCode().toLowerCase().replace('_', ' ') : "equals");
                String val = c.getConditionValue() != null ? c.getConditionValue() : "";
                String expr = fieldName + " " + op + " \"" + val + "\"";

                if (i == 0) {
                    condList.add(expr);
                } else {
                    String conn = (c.getLogicalOperator() != null && !c.getLogicalOperator().isEmpty()) ? c.getLogicalOperator().toUpperCase() : defaultOp;
                    condList.add(conn + " " + expr);
                }
            }
            parts.add(String.join(" ", condList));
        }

        if (group.getChildGroups() != null && !group.getChildGroups().isEmpty()) {
            for (QmsScheduleRuleGroup cg : group.getChildGroups()) {
                String cgt = formatGroupText(cg);
                if (cgt != null && !cgt.isEmpty()) {
                    parts.add("(" + cgt + ")");
                }
            }
        }

        return String.join("ALL".equalsIgnoreCase(group.getLogicalOperator()) ? " AND " : " OR ", parts);
    }

    private String formatFieldDisplayName(String fieldCode) {
        if (fieldCode == null) return "";
        switch (fieldCode.toUpperCase().trim()) {
            case "WEEK_OCCURRENCE": return "Week Occurrence";
            case "DAY_OF_MONTH": return "Day of Month";
            case "DAY_OF_WEEK": return "Day of Week";
            case "MONTH": return "Month";
            case "YEAR": return "Year";
            case "QUARTER": return "Quarter";
            case "IS_WORKING_DAY": return "Is Working Day";
            case "IS_HOLIDAY": return "Is Holiday";
            case "IS_WEEKEND": return "Is Weekend";
            default:
                String[] words = fieldCode.split("_");
                StringBuilder result = new StringBuilder();
                for (String w : words) {
                    if (!w.isEmpty()) {
                        result.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase()).append(" ");
                    }
                }
                return result.toString().trim();
        }
    }

    private String formatActionText(QmsScheduleRuleAction act) {
        if (act == null || act.getActionType() == null) return "Schedule Meeting (Candidate Date)";
        switch (act.getActionType().toUpperCase().trim()) {
            case "SCHEDULE_MEETING": return "Schedule Meeting (Candidate Date)";
            case "MOVE_TO_NEXT_WORKING_DAY": return "Move to Next Working Day";
            case "MOVE_TO_PREV_WORKING_DAY": return "Move to Prev Working Day";
            case "SKIP_MEETING": return "Skip Meeting";
            case "SCHEDULE_ON_DAY_OF_MONTH": return "Schedule on Day of Month";
            case "SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY": return "Schedule on Day of Month (or Next Working Day)";
            case "SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY": return "Schedule on Day of Month (or Prev Working Day)";
            case "SHIFT_BY_DAYS": return "Shift Date by Days";
            default: return act.getActionType().replace('_', ' ');
        }
    }

    private List<LocalDate> generateCandidateDates(LocalDate start, LocalDate end, String frequency) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate curr = start;
        String freq = (frequency != null) ? frequency.toUpperCase().trim() : "MONTHLY";

        while (!curr.isAfter(end)) {
            dates.add(curr);
            switch (freq) {
                case "DAILY":
                    curr = curr.plusDays(1);
                    break;
                case "WEEKLY":
                    curr = curr.plusDays(7);
                    break;
                case "MONTHLY":
                    curr = curr.plusMonths(1);
                    break;
                case "QUARTERLY":
                    curr = curr.plusMonths(3);
                    break;
                case "HALF YEARLY":
                case "BI-ANNUAL":
                    curr = curr.plusMonths(6);
                    break;
                case "YEARLY":
                case "ANNUAL":
                    curr = curr.plusYears(1);
                    break;
                default:
                    curr = curr.plusMonths(1);
                    break;
            }
        }
        return dates;
    }
}
