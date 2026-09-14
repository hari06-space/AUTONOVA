# BOS ERP - AI DEVELOPMENT & ARCHITECTURE RULES

Version: 1.0

Purpose:
This document defines mandatory development rules for BOS ERP.
Every Developer, AI Coding Agent, and Automation Tool must follow these standards.

====================================================
1. CORE DEVELOPMENT PRINCIPLES
====================================================
Before creating any new code:
1. Analyze existing architecture.
2. Search existing services/components.
3. Reuse existing functionality.
4. Avoid duplicate APIs, tables, logic.

====================================================
2. TECHNOLOGY ARCHITECTURE
====================================================
Frontend: React JS
Backend: Spring Boot REST API
Database: Microsoft SQL Server

Architecture: React -> Spring Boot API -> Service Layer -> Repository Layer -> SQL Server

====================================================
3. TRANSACTION DATA RULE
====================================================
Transaction data must always be real-time.
Never cache: Stock, Inventory Balance, Sales, Purchase, Production, Invoice, Payment, Accounting Transactions, Approval Status
Source of truth: SQL Server Database
Do not use: LocalStorage, Session storage, Browser cache for transaction data.

====================================================
4. GLOBAL MASTER DATA RULE
====================================================
All reference/master data must follow Global Master Data Layer.
Do not create page-specific master loading.
Correct: Global Master Service: getMaster("division")

====================================================
5. MASTER DATA CATEGORIES
====================================================
The system must support all future masters (Org, Product, Inventory, HR, Sales/Purchase, Quality, Common).

====================================================
6. GLOBAL MASTER IMPLEMENTATION RULE
====================================================
Frontend: Use Zustand / TanStack Query
Backend: Use MasterDataService

====================================================
7. CACHE RULE
====================================================
Cache allowed ONLY for master/reference data. NO transaction data caching.

====================================================
8. API DEVELOPMENT RULE
====================================================
Every API must: Use DTO, Return required fields only, Have validation, Have exception handling.
Never Return Entity directly.

====================================================
9. API RESPONSE RULE
====================================================
Avoid Huge JSON response. Do not return Audit data, Child collections, Unused fields.

====================================================
10. PAGE LOADING RULE
====================================================
Every page must follow:
Step 1: Render UI immediately
Step 2: Load required master data
Step 3: Load transaction data
Step 4: Background refresh if required
Never freeze complete page waiting for APIs.

====================================================
11. EDIT PAGE RULE
====================================================
Edit pages must use lightweight APIs (e.g., /api/product/edit/{id}).
Return Only editable fields. Do not load Audit, History, Documents unless requested.

====================================================
12. FIRST LOAD OPTIMIZATION RULE
====================================================
Avoid first time slow loading. Implement Application warmup. Preload Common masters. Do not block login.

====================================================
13. REACT DEVELOPMENT RULES
====================================================
Use: Lazy loading, Code splitting, Pagination.
Optimize rendering with React.memo, useMemo, useCallback.

====================================================
14. LARGE DATA RULE
====================================================
Never load 10000+ records directly. Use Server pagination, Virtual scrolling.

====================================================
15. SEARCH RULE
====================================================
Search must be optimized. Frontend: Use debounce. Backend: Use indexed columns. Avoid LIKE '%value%' without proper indexing.

====================================================
16. DATABASE RULES
====================================================
Mandatory fields: created_by, created_date, modified_by, modified_date, active_status

====================================================
17. SQL QUERY RULES
====================================================
Never use SELECT *. Always SELECT required columns. Optimize Joins, Filters, Pagination.

====================================================
18. INDEX RULES
====================================================
Create indexes for Search columns, Foreign keys, Status fields, Date filters, Code fields.

====================================================
19. JPA / HIBERNATE RULES
====================================================
Avoid FetchType.EAGER and N+1 queries. Prefer FetchType.LAZY and DTO projection.

====================================================
20. FILE MANAGEMENT RULE
====================================================
Do not store large files directly in database. Store File path + metadata.

====================================================
21. AUDIT RULE
====================================================
All important transactions require audit. Maintain LIVE TABLE, AUDIT TABLE, ARCHIVE TABLE.

====================================================
22. SECURITY RULES
====================================================
Mandatory: JWT security, Role based access, API authorization.

====================================================
23. MULTI COMPANY RULE
====================================================
All business tables should support COMPANY_ID, DIVISION_ID.

====================================================
24. BACKGROUND PROCESS RULE
====================================================
Heavy operations must not block UI. Use Async, Scheduler, Queue.

====================================================
25. REAL TIME UPDATE RULE
====================================================
For live updates Use WebSocket / Server Sent Events. Avoid frequent polling.

====================================================
26. MONITORING RULE
====================================================
Track API execution time, Database time, Errors, Slow pages. Use Spring Boot Actuator.

====================================================
27. TESTING RULE
====================================================
Every major feature requires Frontend (Component, UI) and Backend (Unit, API) tests.

====================================================
28. AI AGENT CODING RULES
====================================================
Before generating code AI MUST:
1. Understand existing code.
2. Search existing implementation.
3. Reuse services.
4. Follow project structure.
5. Avoid duplicate code.
AI MUST NOT: Create duplicate APIs, tables, dependencies. Return entity directly. Load huge data.

====================================================
29. CODE REVIEW CHECKLIST
====================================================
Check Performance (API/Query optimized), Architecture (Reusable, Global master used), Security.

====================================================
30. FINAL GOLDEN RULE
====================================================
Every new BOS development must be: Fast, Reusable, Secure, Scalable, Real-time, Enterprise Ready.
No temporary fixes. Always improve the architecture.
