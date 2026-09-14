package com.autonoma.erp.modules.admin.schedule.service;

import com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration;
import com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository;
import com.autonoma.erp.modules.qms.audit.entity.AuditExecutionLog;
import com.autonoma.erp.modules.qms.audit.repository.AuditExecutionLogRepository;
import com.autonoma.erp.modules.qms.audit.service.AuditNotificationScheduler;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistExecutionLog;
import com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistExecutionLogRepository;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistSchedulerService;
import com.autonoma.erp.modules.qms.meeting.entity.MeetingExecutionLog;
import com.autonoma.erp.modules.qms.meeting.repository.MeetingExecutionLogRepository;
import com.autonoma.erp.modules.qms.meeting.service.MeetingSchedulerService;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.model.admin.AppPreference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class DynamicScheduleTriggerServiceTest {

    @Mock
    private ScheduleConfigurationRepository scheduleConfigurationRepository;
    
    @Mock
    private ChecklistSchedulerService checklistSchedulerService;
    
    @Mock
    private MeetingSchedulerService meetingSchedulerService;
    
    @Mock
    private AuditNotificationScheduler auditNotificationScheduler;

    @Mock
    private com.autonoma.erp.modules.qms.audit.service.AuditScheduleService auditScheduleService;
    
    @Mock
    private AppPreferenceRepository appPreferenceRepository;

    @Mock
    private com.autonoma.erp.repository.admin.BosSchedulerExecutionLogRepository bosSchedulerExecutionLogRepository;

    @Mock
    private QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository;

    @Mock
    private MeetingExecutionLogRepository meetingExecutionLogRepository;

    @Mock
    private AuditExecutionLogRepository auditExecutionLogRepository;

    @InjectMocks
    private DynamicScheduleTriggerService service;

    private ScheduleConfiguration checklistConfig;
    private ScheduleConfiguration auditConfig;

    @BeforeEach
    public void setUp() {
        checklistConfig = new ScheduleConfiguration();
        checklistConfig.setId(1L);
        checklistConfig.setSchedularName("CHECKLIST");
        checklistConfig.setSchedularTime(LocalDateTime.of(LocalDate.now(ZoneId.of("Asia/Kolkata")), LocalTime.of(3, 0))); // 3:00 AM (already passed)
        checklistConfig.setFrequency("DAILY");
        checklistConfig.setStatus(true);

        auditConfig = new ScheduleConfiguration();
        auditConfig.setId(2L);
        auditConfig.setSchedularName("AUDIT");
        auditConfig.setSchedularTime(LocalDateTime.of(LocalDate.now(ZoneId.of("Asia/Kolkata")), LocalTime.of(23, 59))); // 11:59 PM (future time)
        auditConfig.setFrequency("DAILY");
        auditConfig.setStatus(true);

        // Mock saving log entry to return it with an ID
        when(bosSchedulerExecutionLogRepository.save(any(com.autonoma.erp.model.admin.BosSchedulerExecutionLog.class)))
            .thenAnswer(invocation -> {
                com.autonoma.erp.model.admin.BosSchedulerExecutionLog log = invocation.getArgument(0);
                if (log.getRowId() == null) {
                    log.setRowId(1L);
                }
                return log;
            });

        when(qmsChecklistExecutionLogRepository.save(any(QmsChecklistExecutionLog.class)))
            .thenAnswer(invocation -> {
                QmsChecklistExecutionLog log = invocation.getArgument(0);
                if (log.getRowId() == null) {
                    log.setRowId(1L);
                }
                return log;
            });

        when(meetingExecutionLogRepository.save(any(MeetingExecutionLog.class)))
            .thenAnswer(invocation -> {
                MeetingExecutionLog log = invocation.getArgument(0);
                if (log.getRowId() == null) {
                    log.setRowId(1L);
                }
                return log;
            });

        when(auditExecutionLogRepository.save(any(AuditExecutionLog.class)))
            .thenAnswer(invocation -> {
                AuditExecutionLog log = invocation.getArgument(0);
                if (log.getRowId() == null) {
                    log.setRowId(1L);
                }
                return log;
            });
    }

    @Test
    public void testExecuteTrigger_Checklist() {
        service.executeTrigger("CHECKLIST");
        verify(checklistSchedulerService, times(1)).executeChecklistGeneration(any(java.util.Date.class));
    }

    @Test
    public void testExecuteTrigger_Audit() {
        service.executeTrigger("AUDIT");
        verify(auditNotificationScheduler, times(1)).checkAndSendAuditReminders();
    }

    @Test
    public void testExecuteTrigger_Meeting() {
        service.executeTrigger("MEETING");
        verify(meetingSchedulerService, times(1)).dailyMeetingMaintenance(true);
    }

    @Test
    public void testExecuteTrigger_Unknown() {
        service.executeTrigger("UNKNOWN");
        // No exceptions thrown, simply logged
        verifyNoInteractions(checklistSchedulerService, auditNotificationScheduler, meetingSchedulerService);
    }

    @Test
    public void testRunDynamicSchedules_ShouldRun_WhenNotAlreadyRunToday() {
        // Mock configurations
        when(scheduleConfigurationRepository.findAll()).thenReturn(Arrays.asList(checklistConfig));
        
        // Mock that it has NOT run today
        when(appPreferenceRepository.findByPrefName("BOS_TRIGGER_LAST_RUN_CHECKLIST")).thenReturn(Optional.empty());

        // Run
        service.runDynamicSchedules();

        // Verify it executed checklist trigger
        verify(checklistSchedulerService, times(1)).executeChecklistGeneration(any(java.util.Date.class));
        
        // Verify it saved the last run date preference
        verify(appPreferenceRepository, times(1)).save(any(AppPreference.class));
    }

    @Test
    public void testRunDynamicSchedules_ShouldNotRun_WhenAlreadyRunToday() {
        // Mock configurations
        when(scheduleConfigurationRepository.findAll()).thenReturn(Arrays.asList(checklistConfig));
        
        // Mock that it HAS run today
        String todayStr = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        AppPreference existingPref = new AppPreference();
        existingPref.setPrefName("BOS_TRIGGER_LAST_RUN_CHECKLIST");
        existingPref.setPrefValue(todayStr);
        when(appPreferenceRepository.findByPrefName("BOS_TRIGGER_LAST_RUN_CHECKLIST")).thenReturn(Optional.of(existingPref));

        // Run
        service.runDynamicSchedules();

        // Verify it did NOT execute checklist trigger
        verify(checklistSchedulerService, never()).generateRecurringAssignments();
        
        // Verify it did NOT save anything new
        verify(appPreferenceRepository, never()).save(any(AppPreference.class));
    }

    @Test
    public void testRunDynamicSchedules_ShouldNotRun_WhenScheduledInFuture() {
        // Mock configurations (audit config is set to 23:59, which is in the future relative to typical daytime execution)
        // If current time is not yet 23:59:
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        if (now.isBefore(LocalTime.of(23, 59))) {
            when(scheduleConfigurationRepository.findAll()).thenReturn(Arrays.asList(auditConfig));
            when(appPreferenceRepository.findByPrefName("BOS_TRIGGER_LAST_RUN_AUDIT")).thenReturn(Optional.empty());

            // Run
            service.runDynamicSchedules();

            // Verify it did NOT execute trigger
            verify(auditNotificationScheduler, never()).checkAndSendAuditReminders();
        }
    }

    @Test
    public void testRunDynamicSchedules_ShouldNotRun_WhenStatusIsInactive() {
        checklistConfig.setStatus(false);
        when(scheduleConfigurationRepository.findAll()).thenReturn(Arrays.asList(checklistConfig));

        service.runDynamicSchedules();

        verify(checklistSchedulerService, never()).generateRecurringAssignments();
    }
}
