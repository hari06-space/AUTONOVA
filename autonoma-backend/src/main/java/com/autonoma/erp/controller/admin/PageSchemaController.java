package com.autonoma.erp.controller.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;

@RestController
@RequestMapping("/api/page-schemas")
@CrossOrigin
public class PageSchemaController {

    private static final Map<String, List<Class<?>>> PAGE_ENTITY_MAP = new HashMap<>();

    static {
        // Map Page Codes to their respective JPA Entity classes dynamically
        try {
            // Purchase Request
            PAGE_ENTITY_MAP.put("AD1200", Arrays.asList(
                Class.forName("com.autonoma.erp.model.PurchaseRequestHead"),
                Class.forName("com.autonoma.erp.model.PurchaseRequestTrans")
            ));
            
            // Visitor Pass
            PAGE_ENTITY_MAP.put("OM1000", Arrays.asList(
                Class.forName("com.autonoma.erp.model.VisitorGatePass")
            ));

            // Employee Master
            PAGE_ENTITY_MAP.put("M2210", Arrays.asList(
                Class.forName("com.autonoma.erp.model.payroll.HrPayrollEmployeeDetail")
            ));

            // Company Profile
            PAGE_ENTITY_MAP.put("AD1110", Arrays.asList(
                Class.forName("com.autonoma.erp.model.admin.CompanyCredential")
            ));

            // Default fallback mappings if any other page is requested
            PAGE_ENTITY_MAP.put("default", Arrays.asList(
                Class.forName("com.autonoma.erp.model.admin.CompanyCredential")
            ));
        } catch (ClassNotFoundException e) {
            System.err.println("PageSchemaController: Error loading entity classes for reflection - " + e.getMessage());
        }
    }

    @GetMapping("/{pageCode}")
    public ResponseEntity<List<Map<String, Object>>> getPageSchema(@PathVariable String pageCode) {
        List<Class<?>> classes = PAGE_ENTITY_MAP.get(pageCode);
        if (classes == null || classes.isEmpty()) {
            // Try fallback
            classes = PAGE_ENTITY_MAP.get("default");
        }

        List<Map<String, Object>> treeNodes = new ArrayList<>();
        if (classes == null) {
            return ResponseEntity.ok(treeNodes);
        }

        for (Class<?> clazz : classes) {
            Map<String, Object> node = new HashMap<>();
            String className = clazz.getSimpleName();
            String entityPrefix = decapitalize(className);
            
            node.put("label", formatLabel(className) + " Columns");
            node.put("id", entityPrefix + "_fields");

            List<Map<String, String>> children = new ArrayList<>();
            // Reflect declared fields
            Field[] fields = clazz.getDeclaredFields();
            for (Field field : fields) {
                // Ignore static or transient helper fields
                if (Modifier.isStatic(field.getModifiers()) || Modifier.isTransient(field.getModifiers())) {
                    continue;
                }
                
                // Ignore collection fields (mapped as lists of child entities) to keep design canvas tidy
                if (Collection.class.isAssignableFrom(field.getType())) {
                    continue;
                }

                String fieldName = field.getName();
                Map<String, String> child = new HashMap<>();
                child.put("label", formatLabel(fieldName) + " ({{" + entityPrefix + "." + fieldName + "}})");
                child.put("id", entityPrefix + "." + fieldName);
                child.put("value", entityPrefix + "." + fieldName);
                children.add(child);
            }
            node.put("children", children);
            treeNodes.add(node);
        }

        return ResponseEntity.ok(treeNodes);
    }

    private String formatLabel(String camelCase) {
        if (camelCase == null || camelCase.isEmpty()) return "";
        // Convert camelCase to Title Case (e.g. prNo -> Pr No, companyName -> Company Name)
        String r = camelCase.replaceAll("(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])", " ");
        return r.substring(0, 1).toUpperCase() + r.substring(1);
    }

    private String decapitalize(String string) {
        if (string == null || string.isEmpty()) return "";
        return string.substring(0, 1).toLowerCase() + string.substring(1);
    }
}
