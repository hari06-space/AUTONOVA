# ✅ Migration Scripts — ONLY Place to Add SQL

This is the **single source of truth** for all database migration scripts in Autonoma ERP.

## How It Works

Scripts in this folder are **automatically executed at application startup** by `SqlMigrationRunner`.

- The runner scans `dbscripts/*.sql` first, then `dbscripts/v_next/*.sql`
- Scripts are executed in **alphabetical order** (which is chronological order based on the filename date)
- Each executed script is recorded in the `ERP_EXECUTED_SCRIPTS` table — **it will never run twice**
- Flyway is **disabled** (`spring.flyway.enabled=false`) — do NOT use `db/migration/`

---

## ✏️ Naming Convention — FOLLOW THIS EXACTLY

```
YYYYMMDD_VXX.0__Your_Description_Here.sql
```

| Part | Example | Rule |
|---|---|---|
| `YYYYMMDD` | `20260601` | Today's date |
| `VXX.0` | `V64.0` | Claim your version from `NEXT_VERSION.md` first! |
| `Description` | `Add_Column_To_HR_Employee` | Use underscores, be specific |

### ✅ Good examples
```
20260601_V64.0__Add_Remarks_To_HR_Leave_Master.sql
20260602_V65.0__Create_Payroll_Deduction_Table.sql
```

### ❌ Bad examples (will cause issues)
```
my_script.sql                    ← No date, no version → wrong execution order
V64.0__Add_column.sql            ← No date prefix → sorts wrongly
20260601_fix.sql                 ← No version number → conflicts with others
```

---

## 🚦 Step-by-Step: How to Add a Migration Script

1. **Open `NEXT_VERSION.md`** in this folder
2. **Claim the next version number** and update the file (increment by 1)
3. **Commit `NEXT_VERSION.md` first** — this prevents two devs taking the same number
4. **Create your script** with the correct name format
5. **Test locally** — start the backend and check the logs for your script being applied
6. **Raise a PR** — include the SQL script + the `NEXT_VERSION.md` update

---

## ⚠️ Rules

- **Never modify an already-executed script** — it won't re-run, but it will confuse everyone
- **Never use the same version number as another script** — check `NEXT_VERSION.md`
- **Never put SQL in `db/migration/`** — Flyway is disabled, those scripts never run
- **Never put SQL in the frontend folder** — the backend never reads it
- **Never delete a script** that has already been executed on SQL Server

---

## 📂 Folder Structure

```
dbscripts/
├── README.md              ← You are here
├── NEXT_VERSION.md        ← Always check this before creating a script
├── 20260512_V1.0__...sql  ← Oldest scripts (run first)
├── ...
├── 20260531_V63.0__...sql ← Most recent scripts
└── v_next/
    ├── README.md
    └── V001__Master_Module.sql  ← Schema standardization (SQL Server only)
    └── ...
```
