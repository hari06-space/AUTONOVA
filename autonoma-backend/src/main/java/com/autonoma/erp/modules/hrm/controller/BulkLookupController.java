package com.autonoma.erp.modules.hrm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.autonoma.erp.modules.master.service.MasterDataService;

@RestController
@RequestMapping("/api/lookups")
public class BulkLookupController {

    @Autowired
    private MasterDataService masterDataService;

    @GetMapping("/bulk")
    public ResponseEntity<Map<String, Object>> getBulkLookups(@RequestParam("types") String types) {
        Map<String, Object> result = new HashMap<>();
        String[] typeArray = types.split(",");

        for (String type : typeArray) {
            String cleanType = type.trim().toUpperCase();
            try {
                Object data = masterDataService.getLookupByType(cleanType);
                if (data != null) {
                    // Convert type to camelCase key
                    String key = cleanType.equals("MEETING_SCHEDULES_ACTIVE") 
                        ? "meetingSchedules" 
                        : cleanType.toLowerCase().replaceAll("_([a-z])", "$1"); // Basic camelCase logic for keys
                    
                    switch (cleanType) {
                        case "DEPARTMENTS": result.put("departments", data); break;
                        case "DESIGNATIONS": result.put("designations", data); break;
                        case "TYPES":
                        case "EMPLOYEE_TYPES": result.put("types", data); break;
                        case "CATEGORIES": result.put("categories", data); break;
                        case "LEVELS": result.put("levels", data); break;
                        case "DESIGNATION_LEVELS": result.put("designationLevels", data); break;
                        case "EMPLOYEES": result.put("employees", data); break;
                        case "PAYROLL_EMPLOYEES": result.put("payrollEmployees", data); break;
                        case "USERS": result.put("users", data); break;
                        case "GRADES": result.put("grades", data); break;
                        case "DIVISIONS": result.put("divisions", data); break;
                        case "SEGMENTS": result.put("segments", data); break;
                        case "SUB_SEGMENTS": result.put("subSegments", data); break;
                        case "AUDIT_TYPE": result.put("auditTypes", data); break;
                        case "AUDIT_CRITERIA": result.put("auditCriterias", data); break;
                        case "CUSTOMERS": result.put("customers", data); break;
                        case "CONTACTS": result.put("contacts", data); break;
                        case "AUDIT_AREA": result.put("auditAreas", data); break;
                        case "PROCESS": result.put("process", data); break;
                        case "MEETINGS": 
                        case "MY_MEETINGS": result.put("meetings", data); break;
                        case "INVENTORY_TYPES": result.put("inventoryTypes", data); break;
                        case "ITEM_GROUPS": result.put("itemGroups", data); break;
                        case "ITEM_CATEGORIES": result.put("itemCategories", data); break;
                        case "ITEM_SUB_CATEGORIES": result.put("itemSubCategories", data); break;
                        case "OEMS": result.put("oems", data); break;
                        case "CAPACITIES": result.put("capacities", data); break;
                        case "HSNS": result.put("hsns", data); break;
                        case "ELEMENTS": result.put("elements", data); break;
                        case "MATERIAL_GRADES": result.put("materialGrades", data); break;
                        case "SHAPES": result.put("shapes", data); break;
                        case "CONDITIONS": result.put("conditions", data); break;
                        case "UOMS": result.put("uoms", data); break;
                        case "MODELS": result.put("models", data); break;
                    }
                }
            } catch (Exception e) {
                System.err.println("Error fetching bulk lookup for type: " + cleanType + " -> " + e.getMessage());
            }
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/common")
    public ResponseEntity<Map<String, Object>> getCommonMasters() {
        return ResponseEntity.ok(masterDataService.getCommonMasterData());
    }

    @GetMapping("/product")
    public ResponseEntity<Map<String, Object>> getProductMasters() {
        return ResponseEntity.ok(masterDataService.getProductMasterData());
    }

    @GetMapping("/hr")
    public ResponseEntity<Map<String, Object>> getHrMasters() {
        return ResponseEntity.ok(masterDataService.getHrMasterData());
    }
}
