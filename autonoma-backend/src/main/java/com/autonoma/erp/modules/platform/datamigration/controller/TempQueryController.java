package com.autonoma.erp.modules.platform.datamigration.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class TempQueryController {

    @Autowired
    @Qualifier("secondaryJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/temp-query")
    public List<Map<String, Object>> query() {
        return jdbcTemplate.queryForList("SELECT TOP 1 * FROM EMPLOYEE");
    }
}
