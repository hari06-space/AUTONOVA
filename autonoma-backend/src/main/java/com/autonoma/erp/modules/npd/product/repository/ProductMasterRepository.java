package com.autonoma.erp.modules.npd.product.repository;

import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.dto.ProductMasterListDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductMasterRepository extends JpaRepository<ProductMaster, Long>, JpaSpecificationExecutor<ProductMaster> {
    Optional<ProductMaster> findByItemNo(String itemNo);
    Optional<ProductMaster> findByItemCode(String itemCode);

    @Query("SELECT p.itemNo FROM ProductMaster p WHERE p.itemNo IS NOT NULL")
    List<String> findAllItemNos();

    @Query("SELECT new com.autonoma.erp.modules.npd.product.dto.ProductMasterListDto(" +
           "p.id, p.itemCode, p.itemNo, p.itemName, " +
           "p.inventoryType, p.itemGroup, p.itemCategory, p.itemSubCategory, " +
           "p.hsnCode, p.element, p.grade, p.shape, p.conditions, p.revNo, " +
           "p.drmReq, p.stockQty, p.uom, p.status, p.createdUser, p.createdDate, p.updatedUser, p.updatedDate, p.drawingNo, " +
           "(SELECT MIN(a.path) FROM NpdAttachmentPath a WHERE a.refId = p.id AND a.pageCode = 'M3115' AND (LOWER(a.path) LIKE '%.jpg' OR LOWER(a.path) LIKE '%.jpeg' OR LOWER(a.path) LIKE '%.png' OR LOWER(a.path) LIKE '%.gif')), " +
           "p.leadTimeMax ) " +
           "FROM ProductMaster p " +
           "ORDER BY p.itemName ASC")
    List<ProductMasterListDto> findAllProjected();

    @Query("SELECT p FROM ProductMaster p WHERE p.isActive = true AND (p.status = 'ACTIVE' OR p.status = 'Active') AND (:itemGroup IS NULL OR :itemGroup = '' OR LOWER(p.itemGroup) = LOWER(:itemGroup)) AND (LOWER(p.itemNo) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.itemName) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<ProductMaster> findBySearch(
            @org.springframework.data.repository.query.Param("search") String search, 
            @org.springframework.data.repository.query.Param("itemGroup") String itemGroup,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT a.refId as productId, MIN(a.path) as path FROM NpdAttachmentPath a WHERE a.refId IN :productIds AND a.pageCode = 'M3115' AND (LOWER(a.path) LIKE '%.jpg' OR LOWER(a.path) LIKE '%.jpeg' OR LOWER(a.path) LIKE '%.png' OR LOWER(a.path) LIKE '%.gif') GROUP BY a.refId")
    List<java.util.Map<String, Object>> getProductImages(@org.springframework.data.repository.query.Param("productIds") List<Long> productIds);
}
