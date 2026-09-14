package com.autonoma.erp.modules.hr.orgstructure.controller;

import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class DesignationLevelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DesignationLevelRepository designationLevelRepository;

    @MockBean
    private LevelMasterRepository levelMasterRepository;

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
    public void testCreateDesignationLevel_CustomManualScreeningLevel() throws Exception {
        DesignationLevel level = new DesignationLevel();
        level.setLevel("L1");
        level.setBasic(10000.0);
        level.setDa(2000.0);
        level.setHra(3000.0);
        level.setScreeningLevel(5); // Custom manual entry
        level.setLtaLimit(15000.0);

        when(designationLevelRepository.existsByLevel("L1")).thenReturn(false);
        when(designationLevelRepository.save(any(DesignationLevel.class))).thenReturn(level);

        mockMvc.perform(post("/api/master/hr/designation-levels")
                .header("userId", "SUPER BOSS")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(level)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.level").value("L1"))
                .andExpect(jsonPath("$.screeningLevel").value(5));
    }

    @Test
    public void testUpdateDesignationLevel_CustomManualScreeningLevel() throws Exception {
        DesignationLevel level = new DesignationLevel();
        level.setRowId(1L);
        level.setLevel("L2");
        level.setBasic(12000.0);
        level.setDa(2500.0);
        level.setHra(3500.0);
        level.setScreeningLevel(8); // Custom manual entry
        level.setLtaLimit(20000.0);

        when(designationLevelRepository.findById(1L)).thenReturn(Optional.of(level));
        when(designationLevelRepository.existsByLevel("L2")).thenReturn(false);
        when(designationLevelRepository.save(any(DesignationLevel.class))).thenReturn(level);

        mockMvc.perform(put("/api/master/hr/designation-levels/1")
                .header("userId", "SUPER BOSS")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(level)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.level").value("L2"))
                .andExpect(jsonPath("$.screeningLevel").value(8));
    }
}
