package com.autonoma.erp.modules.platform.identity.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @GetMapping("/widget")
    public ResponseEntity<?> getMenuWidget() {
        Map<String, Object> menu = new HashMap<>();
        menu.put("id", "group-widget");
        menu.put("title", "widget");
        menu.put("type", "group");
        menu.put("icon", "widget");

        List<Map<String, Object>> children = new ArrayList<>();

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("id", "statistics");
        statistics.put("title", "statistics");
        statistics.put("type", "item");
        statistics.put("url", "/widget/statistics");
        statistics.put("icon", "statistics");
        children.add(statistics);

        Map<String, Object> data = new HashMap<>();
        data.put("id", "data");
        data.put("title", "data");
        data.put("type", "item");
        data.put("url", "/widget/data");
        data.put("icon", "data");
        children.add(data);

        Map<String, Object> chart = new HashMap<>();
        chart.put("id", "chart");
        chart.put("title", "chart");
        chart.put("type", "item");
        chart.put("url", "/widget/chart");
        chart.put("icon", "chart");
        children.add(chart);

        menu.put("children", children);

        Map<String, Object> response = new HashMap<>();
        response.put("widget", menu);

        return ResponseEntity.ok(response);
    }
}
