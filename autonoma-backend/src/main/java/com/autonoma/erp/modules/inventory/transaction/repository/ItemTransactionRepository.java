package com.autonoma.erp.modules.inventory.transaction.repository;

import com.autonoma.erp.modules.inventory.transaction.entity.ItemTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ItemTransactionRepository extends JpaRepository<ItemTransaction, Long> {

    // Find all by division with pagination
    Page<ItemTransaction> findByDivisionId(Long divisionId, Pageable pageable);

    // Stock Movement Report (shows all transactions or filter by status if needed, but usually shows all)
    @Query("SELECT it FROM ItemTransaction it WHERE it.divisionId = :divisionId " +
           "AND it.transDate BETWEEN :startDate AND :endDate ORDER BY it.transDate DESC, it.id DESC")
    Page<ItemTransaction> findStockMovement(
            @Param("divisionId") Long divisionId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    // Rejection Stock Report
    @Query("SELECT it FROM ItemTransaction it WHERE it.divisionId = :divisionId " +
           "AND it.transCategory = 'REJECTION' ORDER BY it.transDate DESC")
    Page<ItemTransaction> findRejectionTransactions(
            @Param("divisionId") Long divisionId,
            Pageable pageable);

    // Get Ledger transactions for a specific product - only POSTED
    @Query("SELECT it FROM ItemTransaction it WHERE it.divisionId = :divisionId " +
           "AND it.productId = :productId " +
           "ORDER BY it.transDate ASC, it.id ASC")
    List<ItemTransaction> findLedgerByProduct(
            @Param("divisionId") Long divisionId,
            @Param("productId") Long productId);

    // Current Stock query - fetching grouped aggregates
    // Grouping by productId, uom
    @Query("SELECT new map(" +
           "it.productId as productId, " +
           "MAX(p.itemName) as productName, " +
           "it.uom as uom, " +
           "SUM(it.qtyIn) as totalIn, " +
           "SUM(it.qtyOut) as totalOut) " +
           "FROM ItemTransaction it " +
           "JOIN ProductMaster p ON it.productId = p.id " +
           "WHERE it.divisionId = :divisionId " +
           "AND (:productId IS NULL OR it.productId = :productId) " +
           "AND (:inventoryType IS NULL OR it.inventoryType = :inventoryType) " +
           "AND (:batchId IS NULL OR it.batchId = :batchId) " +
           "GROUP BY it.productId, it.uom")
    List<java.util.Map<String, Object>> getCurrentStockAggregates(
            @Param("divisionId") Long divisionId,
            @Param("productId") Long productId,
            @Param("inventoryType") String inventoryType,
            @Param("batchId") String batchId);

    // Grouped stock by productId and divisionId for given products
    @Query("SELECT new map(" +
           "it.productId as productId, " +
           "it.divisionId as divisionId, " +
           "SUM(it.qtyIn - it.qtyOut) as stock, " +
           "AVG(it.price) as avgPrice) " +
           "FROM ItemTransaction it " +
           "WHERE it.productId IN :productIds " +
           "GROUP BY it.productId, it.divisionId")
    List<java.util.Map<String, Object>> getStockByProductIdsAndDivision(
            @Param("productIds") List<Long> productIds);

    // Get available stock for validation
    @Query("SELECT COALESCE(SUM(it.qtyIn), 0) - COALESCE(SUM(it.qtyOut), 0) " +
           "FROM ItemTransaction it " +
           "WHERE it.divisionId = :divisionId " +
           "AND it.productId = :productId")
    java.math.BigDecimal findAvailableStock(
            @Param("divisionId") Long divisionId,
            @Param("productId") Long productId);

    // Get last transaction no for a type
    @Query("SELECT MAX(it.transNo) FROM ItemTransaction it " +
           "WHERE it.transType = :transType " +
           "AND it.divisionId = :divisionId")
    String findLastTransactionNo(
            @Param("divisionId") Long divisionId,
            @Param("transType") String transType);
}
