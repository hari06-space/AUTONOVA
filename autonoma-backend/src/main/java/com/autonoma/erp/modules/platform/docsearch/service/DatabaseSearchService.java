/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Service for searching across ERP database tables (Products, Orders, Ledgers, Employees, Assets, etc.).
 */
package com.autonoma.erp.modules.platform.docsearch.service;

import com.autonoma.erp.modules.platform.docsearch.dto.DbSearchResponseDTO;
import com.autonoma.erp.modules.platform.docsearch.dto.DbSearchResultItemDTO;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseSearchService {

    private final JdbcTemplate jdbcTemplate;
    private final BosUserPageAuthService pageAuthService;

    /**
     * Check if a specific page code is permitted within the user's allowed export pages.
     * null indicates unrestricted access (Super Admin).
     */
    private boolean isPageAllowed(Set<String> allowedPages, String pageCode) {
        return allowedPages == null || allowedPages.contains(pageCode.toUpperCase());
    }

    /**
     * Search across key ERP tables for matching keyword, code, part number, reference, or text.
     * Only queries tables where the user has 'export' rights in BOS_USER_PAGE_AUTH.
     * Skips SQL queries entirely for pages the user cannot export.
     */
    public DbSearchResponseDTO searchTables(String query, String module, int page, int size, String userId) {
        if (query == null || query.trim().isEmpty()) {
            return DbSearchResponseDTO.builder()
                    .query("")
                    .totalMatches(0)
                    .page(page)
                    .size(size)
                    .totalPages(0)
                    .items(Collections.emptyList())
                    .build();
        }

        String cleanQuery = query.trim();

        // 1. Upfront Authorization Check: Determine user's allowed export pages before querying database
        Set<String> allowedPages = (userId != null && !userId.isBlank()) ? pageAuthService.getAllowedPageCodes(userId, "export") : null;
        if (allowedPages != null && allowedPages.isEmpty()) {
            log.info("User {} has no export permissions on any page in BOS_USER_PAGE_AUTH. Skipping all database queries immediately.", userId);
            return DbSearchResponseDTO.builder()
                    .query(cleanQuery)
                    .totalMatches(0)
                    .page(page)
                    .size(size)
                    .totalPages(0)
                    .items(Collections.emptyList())
                    .build();
        }

        String likePattern = "%" + cleanQuery + "%";
        List<DbSearchResultItemDTO> allHits = new ArrayList<>();

        boolean searchAll = module == null || module.isBlank() || "ALL".equalsIgnoreCase(module);

        // 1. NPD Products & Items Master (NPD_PRODUCT_MASTER) -> Page: M3115
        if ((searchAll || "NPD".equalsIgnoreCase(module) || "PRODUCT".equalsIgnoreCase(module)) && isPageAllowed(allowedPages, "M3115")) {
            searchProducts(likePattern, cleanQuery, allHits);
        }

        // 2. HR Employee Master (HR_EMPLOYEE) -> Page: M2210
        if ((searchAll || "HR".equalsIgnoreCase(module)) && isPageAllowed(allowedPages, "M2210")) {
            searchEmployees(likePattern, cleanQuery, allHits);
        }

        // 3. Finance & Ledgers / Customers / Suppliers (FA_ACCOUNT_LEDGER) -> Page: FA1110
        if ((searchAll || "FINANCE".equalsIgnoreCase(module) || "MASTER".equalsIgnoreCase(module)) && isPageAllowed(allowedPages, "FA1110")) {
            searchLedgers(likePattern, cleanQuery, allHits);
        }

        // 4. Purchase Orders & Requests (PP_PURCHASE_ORDER_HEAD, PP_PURCHASE_REQUEST_HEAD)
        if (searchAll || "PURCHASE".equalsIgnoreCase(module)) {
            searchPurchase(likePattern, cleanQuery, allHits, allowedPages);
        }

        // 5. Sales Invoices & Customer Orders (SM_INVOICE_HEADER, SM_CUSTOMER_ORDER_HEADER)
        if (searchAll || "SALES".equalsIgnoreCase(module)) {
            searchSales(likePattern, cleanQuery, allHits, allowedPages);
        }

        // 6. QMS Asset Master (QMT_ASSET_MASTER) -> Page: M2510
        if ((searchAll || "QMS".equalsIgnoreCase(module)) && isPageAllowed(allowedPages, "M2510")) {
            searchAssets(likePattern, cleanQuery, allHits);
        }

        int total = allHits.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<DbSearchResultItemDTO> pagedItems = allHits.subList(fromIndex, toIndex);
        int totalPages = (int) Math.ceil((double) total / (size <= 0 ? 20 : size));

        return DbSearchResponseDTO.builder()
                .query(cleanQuery)
                .totalMatches(total)
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .items(pagedItems)
                .build();
    }

    private void searchProducts(String likePattern, String rawQuery, List<DbSearchResultItemDTO> out) {
        String sql = "SELECT TOP 50 ID, ITEM_NO, ITEM_CODE, ITEM_NAME, PART_NO_OLD, HSN_CODE, MODEL_NO, DRAWING_NO, ITEM_GROUP, ITEM_CATEGORY " +
                "FROM dbo.NPD_PRODUCT_MASTER " +
                "WHERE (ITEM_CODE LIKE ? OR ITEM_NO LIKE ? OR ITEM_NAME LIKE ? OR PART_NO_OLD LIKE ? OR HSN_CODE LIKE ? OR MODEL_NO LIKE ? OR DRAWING_NO LIKE ?) " +
                "ORDER BY ID DESC";
        try {
            jdbcTemplate.query(sql, ps -> {
                for (int i = 1; i <= 7; i++) {
                    ps.setString(i, likePattern);
                }
            }, rs -> {
                String itemCode = rs.getString("ITEM_CODE");
                String itemNo = rs.getString("ITEM_NO");
                String itemName = rs.getString("ITEM_NAME");
                String partNoOld = rs.getString("PART_NO_OLD");
                String hsnCode = rs.getString("HSN_CODE");
                String modelNo = rs.getString("MODEL_NO");
                String drawingNo = rs.getString("DRAWING_NO");

                String matchedCol = "ITEM_NAME";
                String matchedVal = itemName;
                if (matches(itemCode, rawQuery)) { matchedCol = "ITEM_CODE"; matchedVal = itemCode; }
                else if (matches(itemNo, rawQuery)) { matchedCol = "ITEM_NO"; matchedVal = itemNo; }
                else if (matches(partNoOld, rawQuery)) { matchedCol = "PART_NO_OLD"; matchedVal = partNoOld; }
                else if (matches(hsnCode, rawQuery)) { matchedCol = "HSN_CODE"; matchedVal = hsnCode; }
                else if (matches(modelNo, rawQuery)) { matchedCol = "MODEL_NO"; matchedVal = modelNo; }
                else if (matches(drawingNo, rawQuery)) { matchedCol = "DRAWING_NO"; matchedVal = drawingNo; }

                String ref = (itemCode != null && !itemCode.isBlank() && !itemCode.equalsIgnoreCase("NIL")) ? itemCode : itemNo;
                String extra = String.format("HSN: %s | Group: %s | Category: %s",
                        rs.getString("HSN_CODE") != null ? rs.getString("HSN_CODE") : "N/A",
                        rs.getString("ITEM_GROUP") != null ? rs.getString("ITEM_GROUP") : "-",
                        rs.getString("ITEM_CATEGORY") != null ? rs.getString("ITEM_CATEGORY") : "-");

                out.add(DbSearchResultItemDTO.builder()
                        .tableName("NPD_PRODUCT_MASTER")
                        .tableDisplayName("Products & Items Master")
                        .moduleCode("NPD")
                        .moduleName("New Product Development")
                        .pageCode("M3115")
                        .pageName("Product Master")
                        .recordId(rs.getLong("ID"))
                        .referenceCode(ref)
                        .primaryTitle(itemName)
                        .matchedColumn(matchedCol)
                        .matchedValue(matchedVal)
                        .highlightedSnippet(highlight(matchedVal, rawQuery))
                        .additionalDetails(extra)
                        .build());
            });
        } catch (Exception e) {
            log.warn("Error searching NPD_PRODUCT_MASTER: {}", e.getMessage());
        }
    }

    private void searchEmployees(String likePattern, String rawQuery, List<DbSearchResultItemDTO> out) {
        String sql = "SELECT TOP 30 ID, EMP_CODE, EMPLOYEE_NAME, first_name, last_name, APPLICANT_CODE, STATUS " +
                "FROM dbo.HR_EMPLOYEE " +
                "WHERE (EMP_CODE LIKE ? OR EMPLOYEE_NAME LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR APPLICANT_CODE LIKE ?) " +
                "ORDER BY ID DESC";
        try {
            jdbcTemplate.query(sql, ps -> {
                for (int i = 1; i <= 5; i++) {
                    ps.setString(i, likePattern);
                }
            }, rs -> {
                String empCode = rs.getString("EMP_CODE");
                String empName = rs.getString("EMPLOYEE_NAME");
                String fName = rs.getString("first_name");
                String lName = rs.getString("last_name");
                String appCode = rs.getString("APPLICANT_CODE");

                String matchedCol = "EMPLOYEE_NAME";
                String matchedVal = empName;
                if (matches(empCode, rawQuery)) { matchedCol = "EMP_CODE"; matchedVal = empCode; }
                else if (matches(appCode, rawQuery)) { matchedCol = "APPLICANT_CODE"; matchedVal = appCode; }
                else if (matches(fName, rawQuery)) { matchedCol = "first_name"; matchedVal = fName; }
                else if (matches(lName, rawQuery)) { matchedCol = "last_name"; matchedVal = lName; }

                String title = (empName != null && !empName.isBlank()) ? empName : (fName != null ? fName + " " + (lName != null ? lName : "") : empCode);

                out.add(DbSearchResultItemDTO.builder()
                        .tableName("HR_EMPLOYEE")
                        .tableDisplayName("Employee Master")
                        .moduleCode("HR")
                        .moduleName("Human Resources")
                        .pageCode("M2210")
                        .pageName("Employee Master")
                        .recordId(rs.getLong("ID"))
                        .referenceCode(empCode)
                        .primaryTitle(title)
                        .matchedColumn(matchedCol)
                        .matchedValue(matchedVal)
                        .highlightedSnippet(highlight(matchedVal, rawQuery))
                        .additionalDetails("Status: " + (rs.getString("STATUS") != null ? rs.getString("STATUS") : "Active"))
                        .build());
            });
        } catch (Exception e) {
            log.warn("Error searching HR_EMPLOYEE: {}", e.getMessage());
        }
    }

    private void searchLedgers(String likePattern, String rawQuery, List<DbSearchResultItemDTO> out) {
        String sql = "SELECT TOP 30 ID, CODE, LEDGER_NAME, SHORT_NAME, CITY, GSTIN, PAN_NO, VENDOR_CODE, MAIL_ID " +
                "FROM dbo.FA_ACCOUNT_LEDGER " +
                "WHERE (CODE LIKE ? OR LEDGER_NAME LIKE ? OR SHORT_NAME LIKE ? OR GSTIN LIKE ? OR PAN_NO LIKE ? OR VENDOR_CODE LIKE ? OR MAIL_ID LIKE ?) " +
                "ORDER BY ID DESC";
        try {
            jdbcTemplate.query(sql, ps -> {
                for (int i = 1; i <= 7; i++) {
                    ps.setString(i, likePattern);
                }
            }, rs -> {
                String code = rs.getString("CODE");
                String name = rs.getString("LEDGER_NAME");
                String gstin = rs.getString("GSTIN");
                String pan = rs.getString("PAN_NO");
                String vendorCode = rs.getString("VENDOR_CODE");

                String matchedCol = "LEDGER_NAME";
                String matchedVal = name;
                if (matches(code, rawQuery)) { matchedCol = "CODE"; matchedVal = code; }
                else if (matches(gstin, rawQuery)) { matchedCol = "GSTIN"; matchedVal = gstin; }
                else if (matches(pan, rawQuery)) { matchedCol = "PAN_NO"; matchedVal = pan; }
                else if (matches(vendorCode, rawQuery)) { matchedCol = "VENDOR_CODE"; matchedVal = vendorCode; }

                String extra = String.format("City: %s | GSTIN: %s | PAN: %s",
                        rs.getString("CITY") != null ? rs.getString("CITY") : "-",
                        gstin != null ? gstin : "-",
                        pan != null ? pan : "-");

                out.add(DbSearchResultItemDTO.builder()
                        .tableName("FA_ACCOUNT_LEDGER")
                        .tableDisplayName("Account & Party Ledgers")
                        .moduleCode("FINANCE")
                        .moduleName("Finance & Accounts")
                        .pageCode("FA1110")
                        .pageName("Account Ledger")
                        .recordId(rs.getLong("ID"))
                        .referenceCode(code)
                        .primaryTitle(name)
                        .matchedColumn(matchedCol)
                        .matchedValue(matchedVal)
                        .highlightedSnippet(highlight(matchedVal, rawQuery))
                        .additionalDetails(extra)
                        .build());
            });
        } catch (Exception e) {
            log.warn("Error searching FA_ACCOUNT_LEDGER: {}", e.getMessage());
        }
    }

    private void searchPurchase(String likePattern, String rawQuery, List<DbSearchResultItemDTO> out, Set<String> allowedPages) {
        // Purchase Orders -> Page: PP0100
        if (isPageAllowed(allowedPages, "PP0100")) {
            String poSql = "SELECT TOP 20 ID, PO_NO, SUPPLIER_REFERENCE_NO, INTERNAL_NOTES " +
                    "FROM dbo.PP_PURCHASE_ORDER_HEAD " +
                    "WHERE (PO_NO LIKE ? OR SUPPLIER_REFERENCE_NO LIKE ? OR INTERNAL_NOTES LIKE ?) " +
                    "ORDER BY ID DESC";
            try {
                jdbcTemplate.query(poSql, ps -> {
                    ps.setString(1, likePattern);
                    ps.setString(2, likePattern);
                    ps.setString(3, likePattern);
                }, rs -> {
                    String poNo = rs.getString("PO_NO");
                    String supRef = rs.getString("SUPPLIER_REFERENCE_NO");
                    String notes = rs.getString("INTERNAL_NOTES");

                    String matchedCol = "PO_NO";
                    String matchedVal = poNo;
                    if (matches(supRef, rawQuery)) { matchedCol = "SUPPLIER_REFERENCE_NO"; matchedVal = supRef; }
                    else if (matches(notes, rawQuery)) { matchedCol = "INTERNAL_NOTES"; matchedVal = notes; }

                    out.add(DbSearchResultItemDTO.builder()
                            .tableName("PP_PURCHASE_ORDER_HEAD")
                            .tableDisplayName("Purchase Orders")
                            .moduleCode("PURCHASE")
                            .moduleName("Planning & Purchase")
                            .pageCode("PP0100")
                            .pageName("Purchase Order")
                            .recordId(rs.getLong("ID"))
                            .referenceCode(poNo)
                            .primaryTitle("PO #" + poNo)
                            .matchedColumn(matchedCol)
                            .matchedValue(matchedVal)
                            .highlightedSnippet(highlight(matchedVal, rawQuery))
                            .additionalDetails("Supplier Ref: " + (supRef != null ? supRef : "N/A"))
                            .build());
                });
            } catch (Exception e) {
                log.warn("Error searching PP_PURCHASE_ORDER_HEAD: {}", e.getMessage());
            }
        }

        // Purchase Requests -> Page: PP0104
        if (isPageAllowed(allowedPages, "PP0104")) {
            String prSql = "SELECT TOP 20 ID, PR_NO FROM dbo.PP_PURCHASE_REQUEST_HEAD WHERE PR_NO LIKE ? ORDER BY ID DESC";
            try {
                jdbcTemplate.query(prSql, ps -> ps.setString(1, likePattern), rs -> {
                    String prNo = rs.getString("PR_NO");
                    out.add(DbSearchResultItemDTO.builder()
                            .tableName("PP_PURCHASE_REQUEST_HEAD")
                            .tableDisplayName("Purchase Requests")
                            .moduleCode("PURCHASE")
                            .moduleName("Planning & Purchase")
                            .pageCode("PP0104")
                            .pageName("Purchase Request")
                            .recordId(rs.getLong("ID"))
                            .referenceCode(prNo)
                            .primaryTitle("PR #" + prNo)
                            .matchedColumn("PR_NO")
                            .matchedValue(prNo)
                            .highlightedSnippet(highlight(prNo, rawQuery))
                            .additionalDetails("Purchase Request Reference")
                            .build());
                });
            } catch (Exception e) {
                log.warn("Error searching PP_PURCHASE_REQUEST_HEAD: {}", e.getMessage());
            }
        }
    }

    private void searchSales(String likePattern, String rawQuery, List<DbSearchResultItemDTO> out, Set<String> allowedPages) {
        // Sales Invoices -> Page: SM1180
        if (isPageAllowed(allowedPages, "SM1180")) {
            String invSql = "SELECT TOP 20 ID, INVOICE_NO, CUSTOMER_PO, REMARKS, REF_INVOICE_NO " +
                    "FROM dbo.SM_INVOICE_HEADER " +
                    "WHERE (INVOICE_NO LIKE ? OR CUSTOMER_PO LIKE ? OR REMARKS LIKE ? OR REF_INVOICE_NO LIKE ?) " +
                    "ORDER BY ID DESC";
            try {
                jdbcTemplate.query(invSql, ps -> {
                    for (int i = 1; i <= 4; i++) {
                        ps.setString(i, likePattern);
                    }
                }, rs -> {
                    String invNo = rs.getString("INVOICE_NO");
                    String custPo = rs.getString("CUSTOMER_PO");
                    String remarks = rs.getString("REMARKS");
                    String refInv = rs.getString("REF_INVOICE_NO");

                    String matchedCol = "INVOICE_NO";
                    String matchedVal = invNo;
                    if (matches(custPo, rawQuery)) { matchedCol = "CUSTOMER_PO"; matchedVal = custPo; }
                    else if (matches(remarks, rawQuery)) { matchedCol = "REMARKS"; matchedVal = remarks; }
                    else if (matches(refInv, rawQuery)) { matchedCol = "REF_INVOICE_NO"; matchedVal = refInv; }

                    out.add(DbSearchResultItemDTO.builder()
                            .tableName("SM_INVOICE_HEADER")
                            .tableDisplayName("Sales Invoices")
                            .moduleCode("SALES")
                            .moduleName("Sales & Marketing")
                            .pageCode("SM1180")
                            .pageName("Sales Invoice")
                            .recordId(rs.getLong("ID"))
                            .referenceCode(invNo)
                            .primaryTitle("Invoice #" + invNo)
                            .matchedColumn(matchedCol)
                            .matchedValue(matchedVal)
                            .highlightedSnippet(highlight(matchedVal, rawQuery))
                            .additionalDetails("Customer PO: " + (custPo != null ? custPo : "N/A"))
                            .build());
                });
            } catch (Exception e) {
                log.warn("Error searching SM_INVOICE_HEADER: {}", e.getMessage());
            }
        }
    }

    private void searchAssets(String likePattern, String rawQuery, List<DbSearchResultItemDTO> out) {
        String assetSql = "SELECT TOP 20 ID, ASSET_ID, ASSET_NAME, MODEL_NO, SERIAL_NO, MAKE, REMARKS " +
                "FROM dbo.QMT_ASSET_MASTER " +
                "WHERE (ASSET_ID LIKE ? OR ASSET_NAME LIKE ? OR MODEL_NO LIKE ? OR SERIAL_NO LIKE ? OR MAKE LIKE ? OR REMARKS LIKE ?) " +
                "ORDER BY ID DESC";
        try {
            jdbcTemplate.query(assetSql, ps -> {
                for (int i = 1; i <= 6; i++) {
                    ps.setString(i, likePattern);
                }
            }, rs -> {
                String assetId = rs.getString("ASSET_ID");
                String assetName = rs.getString("ASSET_NAME");
                String model = rs.getString("MODEL_NO");
                String serial = rs.getString("SERIAL_NO");

                String matchedCol = "ASSET_NAME";
                String matchedVal = assetName;
                if (matches(assetId, rawQuery)) { matchedCol = "ASSET_ID"; matchedVal = assetId; }
                else if (matches(model, rawQuery)) { matchedCol = "MODEL_NO"; matchedVal = model; }
                else if (matches(serial, rawQuery)) { matchedCol = "SERIAL_NO"; matchedVal = serial; }

                out.add(DbSearchResultItemDTO.builder()
                        .tableName("QMT_ASSET_MASTER")
                        .tableDisplayName("Assets & Equipment")
                        .moduleCode("QMS")
                        .moduleName("Quality Management")
                        .pageCode("M2510")
                        .pageName("Asset Master")
                        .recordId(rs.getLong("ID"))
                        .referenceCode(assetId)
                        .primaryTitle(assetName)
                        .matchedColumn(matchedCol)
                        .matchedValue(matchedVal)
                        .highlightedSnippet(highlight(matchedVal, rawQuery))
                        .additionalDetails(String.format("Model: %s | Make: %s", model != null ? model : "-", rs.getString("MAKE") != null ? rs.getString("MAKE") : "-"))
                        .build());
            });
        } catch (Exception e) {
            log.warn("Error searching QMT_ASSET_MASTER: {}", e.getMessage());
        }
    }

    private boolean matches(String value, String query) {
        return value != null && value.toLowerCase().contains(query.toLowerCase());
    }

    private String highlight(String value, String query) {
        if (value == null || value.isBlank()) {
            return "";
        }
        if (query == null || query.isBlank()) {
            return value;
        }
        try {
            Pattern p = Pattern.compile(Pattern.quote(query), Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(value);
            return m.replaceAll("<mark>$0</mark>");
        } catch (Exception e) {
            return value;
        }
    }
}
