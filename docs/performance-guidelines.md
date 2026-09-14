# BOS ERP PERFORMANCE GUIDELINES

## 1. PERFORMANCE RULES

NEVER create unnecessary API calls.
Before creating API: Check if existing API/service already provides the data.
Avoid: Multiple calls for same master data.

## 2. TRANSACTION DATA RULE

Never cache:
- Stock
- Sales
- Purchase
- Inventory
- Production
- Accounts transactions

Always fetch latest data from database.

## 3. DATABASE RULES

Every new table/query must consider:
- Indexing
- Foreign keys
- Search columns
- Performance impact

Avoid:
Large joins without reason.

## 4. JPA / HIBERNATE RULES

Never use unnecessary:
FetchType.EAGER

Prefer:
FetchType.LAZY

Avoid:
N+1 queries

Use:
DTO projection

## 5. FRONTEND RULES

Every page must implement:
- Lazy loading
- Code splitting
- Pagination
- Optimized rendering

Avoid:
Loading thousands of records.

Use:
- React.memo
- useMemo
- useCallback

where required.
