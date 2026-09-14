package com.autonoma.erp.modules.npd.product.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * High-performance batch endpoint for Product Master form dropdowns.
 *
 * Instead of 14 separate API calls (which the AddProduct edit page used to fire),
 * this returns ALL dropdown data in a single HTTP request using native SQL.
 * The frontend caches the result for 5 minutes via masterDataCache.js.
 *
 * Column aliases MUST match what AddProduct.jsx getOptionLabel functions expect:
 *  - inventoryTypes: opt.code
 *  - itemGroups:     opt.groupName
 *  - itemCategories: opt.itemType
 *  - itemSubCategories: opt.subType
 *  - oems:           opt.oemName
 *  - capacities:     opt.id (as string)
 *  - hsns:           opt.hsnCode
 *  - elements:       opt.code
 *  - grades:         opt.code
 *  - shapes:         opt.code
 *  - conditions:     opt.code
 *  - uoms:           opt.uomCode
 *  - models:         opt.modelNo
 *  - divisions:      opt.divisionName
 */
@RestController
@RequestMapping("/api/master/npd/product-form-data")
@CrossOrigin(origins = "*")
public class ProductFormDataController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> getProductFormData() {
        Map<String, Object> data = new LinkedHashMap<>();

        // 1. Inventory Types — UI uses opt.code
        safeQuery(data, "inventoryTypes",
            "SELECT id, CODE as code, TYPE_NAME as typeName, STATUS as status FROM NPD_INVENTORY_TYPE WHERE STATUS = 1 ORDER BY TYPE_NAME");

        // 2. Item Groups — UI uses opt.groupName
        safeQuery(data, "itemGroups",
            "SELECT id, GROUP_NAME as groupName, STATUS as status FROM NPD_ITEM_GROUP WHERE STATUS = 1 ORDER BY GROUP_NAME");

        // 3. Item Categories (Item Types) — UI uses opt.itemType
        safeQuery(data, "itemCategories",
            "SELECT id, ITEM_TYPE as itemType, STATUS as status FROM NPD_ITEM_TYPE WHERE STATUS = 'ACTIVE' ORDER BY ITEM_TYPE");

        // 4. Item Sub-Categories (Item Subtypes) — UI uses opt.subType
        safeQuery(data, "itemSubCategories",
            "SELECT id, SUB_TYPE as subType, STATUS as status FROM NPD_ITEM_SUBTYPE WHERE STATUS = 'ACTIVE' ORDER BY SUB_TYPE");

        // 5. OEMs — UI uses opt.oemName
        safeQuery(data, "oems",
            "SELECT id, OEM_SHORT_NAME as oemName, STATUS as status FROM NPD_OEM WHERE STATUS = 'ACTIVE' ORDER BY OEM_SHORT_NAME");

        // 6. Capacities — UI uses opt.id as string
        safeQuery(data, "capacities",
            "SELECT id, UOM as uom, CAPACITY_VAL as capacityVal FROM NPD_CAPACITY ORDER BY CAPACITY_VAL");

        // 7. HSN Codes — UI uses opt.hsnCode
        safeQuery(data, "hsns",
            "SELECT id, HSN_CODE as hsnCode, DESCRIPTION as description FROM MST_HSN_MASTER ORDER BY HSN_CODE");

        // 8. Material Types (Elements) — UI uses opt.code
        safeQuery(data, "elements",
            "SELECT id, CODE as code, TYPE_NAME as typeName, STATUS as status FROM NPD_MATERIAL_TYPE WHERE STATUS = 'ACTIVE' ORDER BY CODE");

        // 9. Material Grades — UI uses opt.code
        safeQuery(data, "grades",
            "SELECT id, CODE as code, GRADE_NAME as gradeName, STATUS as status FROM NPD_MATERIAL_GRADE WHERE STATUS = 'ACTIVE' ORDER BY CODE");

        // 10. Shapes — UI uses opt.code
        safeQuery(data, "shapes",
            "SELECT id, CODE as code, SHAPE_NAME as shapeName, STATUS as status FROM NPD_SHAPE_MASTER WHERE STATUS = 'ACTIVE' ORDER BY CODE");

        // 11. Material Conditions — UI uses opt.code
        safeQuery(data, "conditions",
            "SELECT id, CODE as code, CONDITION as conditionName, STATUS as status FROM NPD_MATERIAL_CONDITIONS WHERE STATUS = 'ACTIVE' ORDER BY CODE");

        // 12. UOM — UI uses opt.uomCode
        safeQuery(data, "uoms",
            "SELECT id, UOM_CODE as uomCode, UOM_NAME as uomName FROM MST_UOM WHERE status = 'ACTIVE' ORDER BY UOM_CODE");

        // 13. Models — UI uses opt.modelNo
        safeQuery(data, "models",
            "SELECT id, MODEL_NO as modelNo, STATUS as status FROM NPD_MODEL WHERE STATUS = 'ACTIVE' ORDER BY MODEL_NO");

        // 14. Divisions — UI uses opt.divisionName
        safeQuery(data, "divisions",
            "SELECT id, DIVISION_NAME as divisionName, STATUS as status FROM AD_DIVISION WHERE STATUS = 'ACTIVE' ORDER BY DIVISION_NAME");

        return data;
    }

    private void safeQuery(Map<String, Object> data, String key, String sql) {
        try {
            data.put(key, jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            // Don't fail the whole request if one lookup table has an issue
            data.put(key, Collections.emptyList());
        }
    }
}
