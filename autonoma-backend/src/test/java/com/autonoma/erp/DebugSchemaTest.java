package com.autonoma.erp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class DebugSchemaTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testSchema() {
        System.out.println("========== DATABASES ==========");
        try {
            List<Map<String, Object>> dbs = jdbcTemplate.queryForList("SELECT name FROM sys.databases");
            for (Map<String, Object> db : dbs) {
                System.out.println("DATABASE: " + db.get("name"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("=================================");

        String[] dbsToTry = {"ERPDb_NUTECH", "NT_FSS"};
        for (String db : dbsToTry) {
            System.out.println("========== TESTING DATABASE: " + db + " ==========");
            try {
                // Check if quality_plan exists
                List<Map<String, Object>> qpCount = jdbcTemplate.queryForList("SELECT COUNT(*) as cnt FROM " + db + ".dbo.quality_plan");
                System.out.println(db + ".dbo.quality_plan COUNT: " + qpCount.get(0).get("cnt"));

                // Check if items exists
                List<Map<String, Object>> itemsCount = jdbcTemplate.queryForList("SELECT COUNT(*) as cnt FROM " + db + ".dbo.items");
                System.out.println(db + ".dbo.items COUNT: " + itemsCount.get(0).get("cnt"));

                // Print first 5 items from quality_plan and check code mapping
                List<Map<String, Object>> samples = jdbcTemplate.queryForList(
                    "SELECT TOP 5 qp.id, qp.item_id, i.item_code " +
                    "FROM " + db + ".dbo.quality_plan qp " +
                    "LEFT JOIN " + db + ".dbo.items i ON qp.item_id = i.id"
                );
                for (Map<String, Object> row : samples) {
                    System.out.println("quality_plan row: id=" + row.get("id") + ", item_id=" + row.get("item_id") + ", item_code=" + row.get("item_code"));
                }
            } catch (Exception e) {
                System.out.println("Error testing database " + db + ": " + e.getMessage());
            }
        }

        System.out.println("========== NPD_PRODUCT_MASTER COUNT ==========");
        try {
            List<Map<String, Object>> npdCount = jdbcTemplate.queryForList("SELECT COUNT(*) as cnt FROM NPD_PRODUCT_MASTER");
            System.out.println("NPD_PRODUCT_MASTER COUNT: " + npdCount.get(0).get("cnt"));

            List<Map<String, Object>> npdSample = jdbcTemplate.queryForList("SELECT TOP 5 ITEM_NO, ITEM_CODE, ITEM_NAME FROM NPD_PRODUCT_MASTER");
            for (Map<String, Object> row : npdSample) {
                System.out.println("NPD_PRODUCT_MASTER row: ITEM_NO=" + row.get("ITEM_NO") + ", ITEM_CODE=" + row.get("ITEM_CODE") + ", ITEM_NAME=" + row.get("ITEM_NAME"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("=============================================");
    }
}

