# Database SOP Compliance Report & Remediation Plan
**Autonoma ERP** · prepared 2026-06-11 · standard: *Database Table Structure Standard*

> **Verdict: NOT COMPLIANT.** ~3 of the 15 checklist points pass today.
> This document records the current state, the two decisions taken to resolve
> conflicts inside the SOP, and a phased, reviewable remediation program. The
> accompanying migration scripts live in
> `autonoma-backend/src/main/resources/dbscripts/v_next/sop/`.

---

## 1. Decisions taken (to resolve SOP conflicts)

| # | Conflict | Decision | Rationale |
|---|---|---|---|
| D1 | SOP §4.2 mandates FK → `BOS_CREDENTIAL(ID)`, but that table **does not exist**; §9.1 of the same SOP references `AD_USER_CREDENTIAL.ID`. | **Canonical credential table = `AD_USER_CREDENTIAL`.** All audit FKs target `AD_USER_CREDENTIAL(ID)`. | It is the table that actually exists and already receives 136 FKs. "BOS_CREDENTIAL" is a typo the SOP contradicts itself on. |
| D2 | SOP §10 mandates `ID NVARCHAR(10)`; the system uses `Long` / `BIGINT IDENTITY` on every PK and stores a username (NVARCHAR(100)) in `CREATED_BY`. | **Target the SOP literally: retype PKs and audit-user columns to `NVARCHAR(10)`** (per product-owner instruction). Delivered as a phased program, not a single script. | Requested explicitly. Must be staged because it touches every PK/FK and ID-generation path. |

---

## 2. 15-Point Checklist — current state

| # | Rule | Status | Evidence |
|---|---|---|---|
| 1 | Table names ALL CAPS | ⚠️ Partial | lowercase appears in migrations: `ad_prefix_credential`, `hrm_employee_master` |
| 2 | Name includes module reference | ❌ | 3 prefixes per domain (`AD_`/`BOS_`, `SM_`/`SLS_`/`VND_`); **employee table exists under 3 names** (`HR_EMPLOYEE`, `HR_EMPLOYEE_MASTER`, `HRM_EMPLOYEE_MASTER`) |
| 3 | 4 audit columns present | ❌ | only ~40% of entities (62/157) have `CREATED_BY` |
| 4 | Audit column order | ❌ | no enforced order |
| 5 | Audit spelling/datatype consistent | ⚠️ | column names OK; field `createdUser` is **NVARCHAR(100)**, SOP wants NVARCHAR(10) |
| 6 | `CREATED_BY` stores ID only | ❌ | stores `SecurityUtils.getCurrentUserId()` → `.getUsername()` = **username string** |
| 7 | FK to credential table | ❌ | no FK; target table mismatch (see D1) |
| 8 | No names in transaction tables | ❌ | **140** denormalized `*Name` columns |
| 9 | Only reference IDs stored | ❌ | same as #8 |
| 10 | No comma-separated values | ❌ | `ChecklistClosed.FILE_PATHS`, `ChecklistAssignment.FILE_PATHS` store CSV |
| 11 | Mapping table for multi-values | ⚠️ | most M:N OK; checklist files are CSV |
| 12 | Per-module attachment table | ⚠️ | `NcrOfiAttachment`, `SupportTicketAttachment` exist; QMS checklist uses CSV |
| 13 | Attachments as rows | ❌ | CSV, not rows |
| 14 | No JSON file names | ⚠️ | CSV (not JSON) but still non-compliant |
| 15 | Path + file name stored | ⚠️ | partial |

**Pass:** parts of 1, 5, 11, 12, 14, 15. **Fail:** 2, 3, 4, 6, 7, 8, 9, 10, 13.

---

## 3. Remediation scripts delivered (review, then run on a backup)

| Script | SOP rules | Type | Notes |
|---|---|---|---|
| `V900__SOP_Attachment_Tables.sql` | §8, §9, §11 | **Additive (safe)** | Creates `QMS/HR/ATS_ATTACHMENT_PATH` exactly per SOP §11 |
| `V901__SOP_Checklist_Files_To_Rows.sql` | §7, §8.2, §9.2 | Data migration | Splits CSV `FILE_PATHS` → one row per file; column drop deferred to Phase 2 |
| `V902__SOP_Audit_Columns_And_FK_Standard.sql` | §3, §4, §5 | Additive + FK | Adds the 4 audit columns + 2 FKs to every business table missing them; canonical template included |

All scripts: SQL Server, idempotent guards, target `AD_USER_CREDENTIAL(ID)` (D1), and **assume the credential retype (Phase B) has run** so the NVARCHAR(10) FKs bind.

---

## 4. Phased retype & standardization roadmap (the destructive work)

These cannot be a single auto-run script — each phase needs DBA review, a backup,
and a verification pass on a staging copy.

**Phase A — Canonicalize table names (SOP §2)**
- Resolve the 3 employee-table names to one (`HR_EMPLOYEE_MASTER`); confirm whether they are duplicate physical tables or inconsistent FK references, then repoint all 38 FKs.
- Collapse `SM_`/`SLS_`/`VND_` → one sales prefix; reconcile `AD_`/`BOS_`.
- Rename any lowercase tables to ALL CAPS.

**Phase B — Credential PK retype (gates V900/V902)**
- Convert `AD_USER_CREDENTIAL.ID` BIGINT → `NVARCHAR(10)` (map existing numeric ids to zero-padded strings), repoint its 136 dependent FKs. Highest-risk step.

**Phase C — Audit columns (SOP §3–§5)**
- Run `V902`. Then backfill `CREATED_BY`/`UPDATED_BY` from username → user **ID** (join through `AD_USER_CREDENTIAL`). Change `BaseAuditEntity` field length 100 → 10 and store ID, not username, in `SecurityUtils`.

**Phase D — De-normalize names away (SOP §6)**
- For each of the 140 `*Name` columns on transaction tables, ensure the matching `*_ID` FK exists, backfill it, then drop the name column. Names resolve via join/DTO at read time.

**Phase E — Attachments & mappings (SOP §7–§9)**
- Run `V900` + `V901`; update Checklist app code to read/write `QMS_ATTACHMENT_PATH`; then drop `FILE_PATHS` (V901 Phase 2).
- Replace any remaining comma-separated reference columns with mapping tables (e.g. `QMS_AUDIT_DEPARTMENT_MAPPING`).

**Phase F — Full PK retype to NVARCHAR(10) (SOP §10, per D2)**
- Per table: add NVARCHAR(10) surrogate, migrate FK references, swap PK, drop old BIGINT. Replace `@GeneratedValue(IDENTITY)` with an application/prefix id generator. Do module-by-module; ~150 tables; weeks of staged work with regression testing each module.

---

## 5. Hard preconditions before ANY run
1. Full database backup + tested restore.
2. Run on a **staging copy first**; diff row counts and FK integrity.
3. Re-enable Flyway with unique versions (currently disabled; versions collide) so these become tracked, ordered, repeatable migrations.
4. Application code changes (Phases C–F) must ship **in lockstep** with each DB phase — `ddl-auto=none` means the entities will break at runtime the moment the schema and code diverge.
