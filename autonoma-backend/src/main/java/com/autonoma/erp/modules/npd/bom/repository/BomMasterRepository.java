package com.autonoma.erp.modules.npd.bom.repository;

import com.autonoma.erp.modules.npd.bom.dto.BomListSummaryProjection;
import com.autonoma.erp.modules.npd.bom.entity.BomMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface BomMasterRepository extends JpaRepository<BomMaster, Long> {
    List<BomMaster> findByProductId(Long productId);

    java.util.Optional<BomMaster> findByBomNo(String bomNo);

    boolean existsByBomNo(String bomNo);

    @Query("SELECT COUNT(DISTINCT b.bomNo) FROM BomMaster b")
    long countDistinctBomNos();

    @Query(value = """
            SELECT a.ID AS id,
                   a.BOM_NO AS bomNo,
                   a.REV_NO AS revNo,
                   a.REV_DATE AS revDate,
                   a.IS_ACTIVE AS isActive,
                   a.BASE_QUANTITY AS baseQuantity,
                   a.BOM_USAGE AS bomUsage,
                   a.REMARKS AS remarks,
                   p.ID AS productId,
                   p.ITEM_NO AS productItemNo,
                   p.ITEM_NAME AS productItemName,
                   ISNULL(b.process_ctr, 0) AS processCount,
                   ISNULL(c.mat_ctr, 0) AS materialCount,
                   ISNULL(d.mach_ctr, 0) AS machineCount,
                   ISNULL(e.tool_ctr, 0) AS toolCount
            FROM NPD_BOM_MASTER a
            JOIN NPD_PRODUCT_MASTER p ON p.ID = a.PRODUCT_ID
            LEFT JOIN (SELECT BOM_ID, COUNT(*) AS process_ctr FROM NPD_BOM_PROCESS GROUP BY BOM_ID) b ON b.BOM_ID = a.ID
            LEFT JOIN (SELECT x.BOM_ID, COUNT(y.ID) AS mat_ctr FROM NPD_BOM_PROCESS x INNER JOIN NPD_BOM_PROCESS_MATERIAL y ON x.ID = y.BOM_PROCESS_ID GROUP BY x.BOM_ID) c ON c.BOM_ID = a.ID
            LEFT JOIN (SELECT x.BOM_ID, COUNT(y.ID) AS mach_ctr FROM NPD_BOM_PROCESS x INNER JOIN NPD_BOM_PROCESS_MACHINE y ON x.ID = y.BOM_PROCESS_ID GROUP BY x.BOM_ID) d ON d.BOM_ID = a.ID
            LEFT JOIN (SELECT x.BOM_ID, COUNT(y.ID) AS tool_ctr FROM NPD_BOM_PROCESS x INNER JOIN NPD_BOM_PROCESS_TOOL y ON x.ID = y.BOM_PROCESS_ID GROUP BY x.BOM_ID) e ON e.BOM_ID = a.ID
            ORDER BY a.ID DESC
            """, nativeQuery = true)
    List<BomListSummaryProjection> findAllBomListSummary();
}
