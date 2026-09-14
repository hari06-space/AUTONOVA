package com.autonoma.erp.service.ai;

import com.autonoma.erp.modules.notebook.entity.Notebook;
import com.autonoma.erp.modules.notebook.entity.NotebookNote;
import com.autonoma.erp.modules.notebook.entity.NotebookSource;
import com.autonoma.erp.modules.notebook.repository.NotebookNoteRepository;
import com.autonoma.erp.modules.notebook.repository.NotebookRepository;
import com.autonoma.erp.modules.notebook.repository.NotebookSourceRepository;
import com.autonoma.erp.modules.notebook.repository.NotebookChatRepository;
import com.autonoma.erp.modules.notebook.service.LiveErpGroundingService;
import com.autonoma.erp.modules.notebook.service.NotebookService;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.util.SpringContext;
import com.autonoma.erp.config.TenantContextHolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class NotebookServicePermissionTest {

    @Mock
    private NotebookRepository notebookRepository;

    @Mock
    private NotebookNoteRepository noteRepository;

    @Mock
    private NotebookSourceRepository sourceRepository;

    @Mock
    private NotebookChatRepository chatRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeMasterRepository employeeRepository;

    @Mock
    private LiveErpGroundingService liveErpGroundingService;

    @Mock
    private BosUserPageAuthService pageAuthService;

    @Mock
    private GeminiService geminiService;

    @Mock
    private com.autonoma.erp.modules.notebook.service.BosIntentEngine intentEngine;

    @Mock
    private com.autonoma.erp.modules.notebook.service.AiPermissionEngine permissionEngine;

    @Mock
    private com.autonoma.erp.modules.notebook.service.AiQueryPlanner queryPlanner;

    @Mock
    private com.autonoma.erp.modules.notebook.service.AiSkillRegistry skillRegistry;

    @InjectMocks
    private NotebookService notebookService;

    private Notebook notebook;

    @BeforeEach
    void setUp() {
        notebook = new Notebook();
        notebook.setId(1L);
        notebook.setOwnerId(1L);
        notebook.setTitle("Test Notebook");

        when(notebookRepository.findById(1L)).thenReturn(Optional.of(notebook));
        when(noteRepository.findByNotebookIdAndActiveStatus(1L, "Y")).thenReturn(Collections.emptyList());
        when(sourceRepository.findByNotebookIdAndActiveStatus(1L, "Y")).thenReturn(Collections.emptyList());

        // Initialize static SecurityUtils repositories
        new SecurityUtils(userRepository, employeeRepository);

        // Mock ApplicationContext for SpringContext.getBean
        ApplicationContext mockContext = mock(ApplicationContext.class);
        when(mockContext.getBean(UserRepository.class)).thenReturn(userRepository);
        when(mockContext.getBean(EmployeeMasterRepository.class)).thenReturn(employeeRepository);
        new SpringContext().setApplicationContext(mockContext);

        // Set up mock intent, permission context, and query plan to mock the AI platform execution loop
        com.autonoma.erp.modules.notebook.dto.IntentResult mockIntent = new com.autonoma.erp.modules.notebook.dto.IntentResult(
            com.autonoma.erp.modules.notebook.dto.IntentResult.IntentCategory.EMPLOYEE_QUERY,
            java.util.Set.of("EMPLOYEE"),
            false,
            false,
            "EMPLOYEE",
            "HRA",
            com.autonoma.erp.modules.notebook.dto.IntentResult.DataScope.COMPANY,
            false,
            false
        );
        when(intentEngine.classify(anyString())).thenReturn(mockIntent);

        com.autonoma.erp.modules.notebook.dto.AiPermissionContext mockPermCtx = new com.autonoma.erp.modules.notebook.dto.AiPermissionContext(
            "ADMIN",
            1L,
            1L,
            1L,
            "HRA",
            java.util.Set.of("EMPLOYEE"),
            java.util.Set.of(),
            java.util.Set.of("EMPLOYEE"),
            java.util.Set.of(com.autonoma.erp.modules.notebook.dto.IntentResult.DataScope.COMPANY),
            com.autonoma.erp.modules.notebook.dto.AiPermissionContext.SensitivityLevel.INTERNAL,
            true,
            true,
            true,
            true,
            true,
            true,
            new java.util.ArrayList<>(),
            false
        );
        when(permissionEngine.evaluate(anyString(), any(), any())).thenReturn(mockPermCtx);

        // Define a query plan with a mock tool invocation to emulate Employee tool being triggered
        com.autonoma.erp.modules.notebook.dto.QueryPlan mockPlan = new com.autonoma.erp.modules.notebook.dto.QueryPlan(
            java.util.List.of(new com.autonoma.erp.modules.notebook.dto.QueryPlan.ToolInvocation(
                "EMPLOYEE",
                java.util.Map.of("query", "who are all in hra department"),
                com.autonoma.erp.modules.notebook.dto.OperationType.LIST
            )),
            new java.util.ArrayList<>(),
            "Mock Plan",
            false,
            false
        );
        when(queryPlanner.plan(any(), any(), anyString())).thenReturn(mockPlan);

        // Mock Checklist/Employee skill execution stubbing
        com.autonoma.erp.modules.notebook.service.BosEntitySkill mockSkill = mock(com.autonoma.erp.modules.notebook.service.BosEntitySkill.class);
        when(mockSkill.entity()).thenReturn("EMPLOYEE");
        com.autonoma.erp.modules.notebook.dto.ToolResult mockResult = com.autonoma.erp.modules.notebook.dto.ToolResult.of(
            "EMPLOYEE",
            "LIST",
            "Grounded Department Employees",
            "EMPLOYEE: John Doe\nROLE: HR Lead\n"
        );
        when(mockSkill.execute(any())).thenReturn(mockResult);
        when(skillRegistry.getSkill(anyString())).thenReturn(mockSkill);
    }

    private void setupSecurityContext(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(username);

        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        TenantContextHolder.setTenantId("AUTONOMA");
    }

    @Test
    public void testQueryNotebook_WithHraPermission_RetrievesDepartmentEmployees() {
        setupSecurityContext("ADMIN");
        notebook.setOwnerId(1L);

        UserCredential credential = new UserCredential();
        credential.setUserId("ADMIN");
        credential.setEmpId(1L);
        when(userRepository.findByUserId("ADMIN")).thenReturn(Optional.of(credential));

        // Mock permission check to return true
        when(pageAuthService.hasPermission("ADMIN", "M2210", "read")).thenReturn(true);
        when(liveErpGroundingService.fetchDepartmentEmployees("HRA")).thenReturn("EMPLOYEE: John Doe\nROLE: HR Lead\n");

        // Set up active query plan that triggers the skill
        com.autonoma.erp.modules.notebook.dto.QueryPlan mockPlan = new com.autonoma.erp.modules.notebook.dto.QueryPlan(
            java.util.List.of(new com.autonoma.erp.modules.notebook.dto.QueryPlan.ToolInvocation(
                "EMPLOYEE",
                java.util.Map.of("query", "who are all in hra department"),
                com.autonoma.erp.modules.notebook.dto.OperationType.LIST
            )),
            new java.util.ArrayList<>(),
            "Mock Plan Active",
            false,
            false
        );
        when(queryPlanner.plan(any(), any(), anyString())).thenReturn(mockPlan);

        com.autonoma.erp.modules.notebook.service.BosEntitySkill mockSkill = mock(com.autonoma.erp.modules.notebook.service.BosEntitySkill.class);
        when(mockSkill.entity()).thenReturn("EMPLOYEE");
        when(mockSkill.execute(any())).thenAnswer(inv -> {
            // Emulate execution and invoke grounding service
            String data = liveErpGroundingService.fetchDepartmentEmployees("HRA");
            return com.autonoma.erp.modules.notebook.dto.ToolResult.of("EMPLOYEE", "LIST", "Grounded Department Employees", data);
        });
        when(skillRegistry.getSkill(anyString())).thenReturn(mockSkill);

        // Mock Gemini service query execution
        when(geminiService.generateResponse(anyString(), anyString()))
                .thenAnswer(invocation -> {
                    String context = invocation.getArgument(1);
                    // Verify that the new structured platform context format is present
                    assertThat(context).contains("=== Business Skill Result: EMPLOYEE (LIST) ===");
                    assertThat(context).contains("EMPLOYEE: John Doe");
                    return "John Doe is the HR Lead.";
                });

        notebookService.queryNotebook(1L, "who are all in hra department");

        verify(liveErpGroundingService, times(1)).fetchDepartmentEmployees("HRA");
    }

    @Test
    public void testQueryNotebook_WithoutHraPermission_InjectsSecurityRestriction() {
        setupSecurityContext("USER_1");
        notebook.setOwnerId(2L); // Set owner ID to 2L to match USER_1's empId of 2L

        UserCredential credential = new UserCredential();
        credential.setUserId("USER_1");
        credential.setEmpId(2L);
        when(userRepository.findByUserId("USER_1")).thenReturn(Optional.of(credential));

        // Mock permission check to return false
        when(pageAuthService.hasPermission("USER_1", "M2210", "read")).thenReturn(false);
        when(pageAuthService.hasPermission("USER_1", "HA1110", "read")).thenReturn(false);

        // Define a query plan with security notices to block execution
        com.autonoma.erp.modules.notebook.dto.QueryPlan mockPlanDenied = new com.autonoma.erp.modules.notebook.dto.QueryPlan(
            java.util.List.of(),
            java.util.List.of("The user does NOT have permission to access the Employee Master page / HRA module"),
            "Mock Plan Denied",
            false,
            true
        );
        when(queryPlanner.plan(any(), any(), anyString())).thenReturn(mockPlanDenied);

        // Mock Gemini service query execution
        when(geminiService.generateResponse(anyString(), anyString()))
                .thenAnswer(invocation -> {
                    String context = invocation.getArgument(1);
                    // Verify that security instruction is present and no employees were fetched
                    assertThat(context).contains("=== Security Restrictions (MUST ENFORCE) ===");
                    assertThat(context).contains("The user does NOT have permission");
                    return "You do not have permission to access the Employee Master page / HRA module, so I cannot retrieve this information for you.";
                });

        notebookService.queryNotebook(1L, "who are all in hra department");

        verify(liveErpGroundingService, never()).fetchDepartmentEmployees(anyString());
    }
}

