package com.autonoma.erp.modules.hr.orgstructure.controller;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.service.DepartmentService;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class DepartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DepartmentService departmentService;

    @MockBean
    private DepartmentRepository departmentRepository;

    @MockBean
    private BosUserPageAuthService authService;

    @BeforeEach
    public void setUp() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("SUPER BOSS", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(authService.hasPermission(anyString(), anyString(), anyString())).thenReturn(true);
    }

    @Test
    public void testCreateDepartment_OptionalCategoryAndCustomEmail() throws Exception {
        Department dept = new Department();
        dept.setDepartmentNo("DEPT-001");
        dept.setDepartmentName("ENGINEERING");
        dept.setDepartmentMailId("engineering@nutech.com");
        dept.setCategoryId(null); // Category ID is optional

        when(departmentRepository.existsByNameNative("ENGINEERING")).thenReturn(0);
        when(departmentRepository.existsByDeptNoNative("DEPT-001")).thenReturn(0);
        when(departmentService.saveDepartment(any(Department.class))).thenReturn(dept);

        mockMvc.perform(post("/api/master/hr/departments")
                .header("userId", "SUPER BOSS")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentName").value("ENGINEERING"))
                .andExpect(jsonPath("$.departmentMailId").value("engineering@nutech.com"))
                .andExpect(jsonPath("$.categoryId").doesNotExist());
    }
}
