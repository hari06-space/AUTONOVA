# Autonoma ERP — Project Rules & Development Standards

> **Purpose:** Single source of truth for Autonoma ERP development standards and project rules.
>
> **Scope:** These rules apply to human developers, AI coding agents, automated development tools, and code generated or modified through development automation.
>
> **Rule authority:** Existing source code, database schema, migrations, runtime configuration, and established architecture must be inspected before making changes. Do not invent project behavior.

---

# 1. RULE PRIORITY AND AUTHORITY

## 1.1 Priority

When rules appear to conflict, use this order:

1. Explicit user requirement for the current task.
2. Safety, security, and data-integrity requirements.
3. Rules in this `AGENTS.md`.
4. Existing Autonoma architecture and established implementation patterns.
5. Project documentation and analysis documents.
6. General framework/library best practices.

If a major architectural conflict cannot be safely resolved, stop and ask the user before making the change.

## 1.2 Human & AI Development Standard

These rules are not only for AI agents.

- Human developers, AI agents, and automated development tools should follow the same
  Autonoma architecture and development standards.
- AI agents must not bypass a project rule merely because a human could perform the
  operation manually.
- Human developers should not introduce patterns that conflict with these standards
  without explicitly documenting or approving the architectural change.
- User requirements for the current task may intentionally override a project rule;
  such exceptions should be explicit and limited to the requested scope.

## 1.3 Rule Strength

Rules use these meanings:

- **MUST / NEVER** — mandatory unless the user explicitly authorizes an exception.
- **SHOULD / PREFER** — recommended when compatible with the existing architecture.
- **MAY** — optional and use-case dependent.

Do not turn a `SHOULD` rule into a mandatory architectural change.

## 1.4 Existing Code vs New Development

- Do not refactor unrelated existing code merely to satisfy a new rule.
- For new code, follow the current rules.
- For modified code, preserve existing behavior unless the task requires a change.
- If existing code violates a rule but the task does not require fixing it, do not perform unrelated cleanup.
- If the requested change depends on correcting an existing violation, include that correction in the implementation plan.

---

# 2. AI AGENT OPERATING WORKFLOW

Before changing code:

1. Understand the user's requested outcome.
2. Locate the relevant frontend, backend, database, configuration, and documentation.
3. Search for existing implementations before creating anything new.
4. Trace the affected flow end-to-end when business logic is involved.
5. Identify dependencies, callers, consumers, statuses, permissions, and database relationships.
6. Check existing patterns and reuse them where appropriate.
7. Determine the smallest safe implementation.
8. Implement only the required change.
9. Verify the affected flow and related dependencies.
10. Run appropriate tests, lint, type checks, build, or quality checks.
11. Review the final diff for accidental or unrelated changes.
12. Report what changed, what was verified, and any unresolved risks.

### Critical Verification Rule

Never assume that a documentation file, previous analysis, user description, or memory represents the current implementation.

Use this practical hierarchy:

**Actual source code / schema / migrations → existing runtime architecture → project documentation → assumptions.**

If documentation conflicts with the actual implementation, report the conflict before making a risky architectural decision.

---

# 3. AUTONOMA ERP ARCHITECTURE

- **Frontend:** React JS / existing React application architecture.
- **Backend:** Spring Boot REST API.
- **Database:** Microsoft SQL Server.
- Reuse the existing project architecture before introducing new frameworks, libraries, patterns, services, tables, or abstractions.
- Do not introduce a parallel implementation when an existing project mechanism already provides the required functionality.

---

# 4. GENERAL DEVELOPMENT PRINCIPLES

- Analyze existing architecture before creating new code.
- Search existing services, components, utilities, APIs, repositories, entities, and database objects.
- Reuse existing functionality whenever suitable.
- Avoid duplicate APIs, tables, business logic, components, utilities, and dependencies.
- Do not create temporary fixes when a maintainable solution can reasonably be implemented.
- Keep changes focused on the requested scope.
- Preserve backward compatibility unless the task explicitly requires a breaking change.
- Do not make assumptions about business rules, statuses, IDs, permissions, database relationships, or API contracts.
- Do not hardcode environment-specific values, database IDs, status IDs, URLs, credentials, or filesystem paths.

---

# 5. REUSABILITY — BOS COMPONENTS, PAGES, WINDOWS & BACKEND

- Before creating a new UI page, BOS Page, component, window, dialog, or backend
  functionality, search the existing project for reusable implementations.
- Always check whether an existing BOS Page or reusable window already provides
  the required functionality before implementing a new one.
- If the same window/functionality is required in multiple places, prefer one
  reusable implementation with appropriate configuration/customization rather than
  duplicating the implementation.
- Reusable BOS Pages/components should support appropriate customization through
  existing project mechanisms such as props, parameters, callbacks, or configuration.
- The same reusability principle applies to backend services, managers, utilities,
  APIs, repositories, and shared business functionality.
- Before implementing new backend functionality, search for existing services,
  managers, utilities, APIs, and common business logic that can be reused or extended.
- Do not duplicate business logic merely because multiple modules currently require
  similar behavior.
- Do not create reusable abstractions prematurely when there is no real reuse
  requirement and no established project pattern supporting the abstraction.
- When an existing reusable implementation is unsuitable, explain why before creating
  a parallel implementation for a major shared feature.

# 6. FILE HEADER RULES

Every newly created source/code/configuration file that follows the project's file-header convention MUST contain:

```text
Organization: <ORGANIZATION_NAME>
Owner: <GIT_USER_NAME>
Created At: <CURRENT_DATE>
Description: <DESCRIPTION>
```

For an existing file being substantially modified, use the project's established update-header convention. If update metadata is required, use:

```text
Updated By: <GIT_USER_NAME>
Updated At: <CURRENT_DATE>
```

### Header Value Rules

- **Owner / Updated By:** obtain from Git using `git config user.name`.
- **Created At / Updated At:** use the actual current date.
- **Organization:** NEVER guess or invent it.
- If the organization is not already known from the file/project context, ask the user for the organization name before creating the file.
- Preserve existing creation metadata when updating a file.
- Do not replace an existing organization with another organization unless explicitly instructed.
- Do not hardcode a personal developer name into these rules.

### Header Applicability

- Follow the existing language/file format when adding a header.
- Do not add a header to files where the file format does not support comments or where adding one would break generated/minified/vendor files.
- Do not modify unrelated files solely to add headers.

---

# 7. SPRING BOOT / JAVA RULES

- Follow the project's existing Spring Boot architecture and Java conventions.
- Controllers MUST NOT contain business logic.
- Put business logic in the established service/manager layer.
- Interfaces should define contracts/forwarding behavior and should not contain business logic.
- Use DTOs at API boundaries.
- Do not return JPA entities directly from APIs unless the existing architecture explicitly requires it.
- Return only the fields required by the consumer.
- Reuse existing exception classes and global exception handling.
- Reuse the project's common logging functionality.
- Add useful logs at appropriate levels; avoid noisy logging.
- Use type-safe methods, parameters, fields, and return values.
- Use descriptive names; avoid generic names and unnecessary single-character identifiers.
- Keep imports at the top and remove unused imports.
- Use `Path`, `Paths.get(...)`, and related APIs for filesystem paths instead of hardcoded separators.
- Avoid unnecessary `try/catch` blocks where errors can be prevented or validated beforehand.
- Avoid `FetchType.EAGER` and N+1 query patterns; prefer established lazy-loading and DTO/projection patterns where appropriate.
- Database access MUST use the existing repository/data-access/database-manager architecture.
- Run applicable Checkstyle, SpotBugs, Sonar, tests, and build checks when configured by the repository.
- Do not automatically start long-running Spring Boot services unless explicitly requested.

---

# 8. REACT / FRONTEND RULES

- Follow the existing React architecture and project conventions.
- Reuse existing components, hooks, utilities, API modules, layouts, state management, and data-fetching patterns.
- Do not create duplicate components, hooks, API wrappers, or state logic.
- API/wrapper/adapter layers should primarily handle communication, transformation, and forwarding; do not place business logic there.
- Use the project's existing Zustand, TanStack Query, or other established state/data-fetching patterns where applicable.
- Do not introduce a new state-management or data-fetching library without justification.
- Use TypeScript/type validation according to the project's existing standard.
- Follow configured ESLint and Prettier rules.
- Remove unused imports, variables, functions, and constants.
- Use lazy loading and code splitting where appropriate.
- Use server-side pagination for large datasets.
- Do not load unnecessarily large transaction datasets into the browser.
- Debounce user-driven search requests.
- Use `React.memo`, `useMemo`, and `useCallback` only when they provide a meaningful benefit; do not add them mechanically.
- Do not cache transaction data unless explicitly supported by the existing architecture.
- Master/reference data may use the established project caching/data-fetching mechanism.
- Reuse existing form validation and UI feedback patterns.
- Do not automatically start long-running React/npm services unless explicitly requested.

---

# 9. PYTHON RULES

- Follow the existing Autonoma Python architecture and project configuration.
- Follow configured PEP 8, Flake8, Pylint, and type-checking standards where applicable.
- Use descriptive names and type hints.
- Keep imports at the top.
- Do not use broad `try/except` blocks around normal imports.
- If an optional dependency requires guarded import behavior, follow the existing project pattern and catch only the appropriate exception.
- Reuse existing services, managers, utilities, exception handling, and logging.
- Keep API modules thin and place business logic in the established service/manager layer.
- Database access MUST use the project's designated database/data-access layer.
- Use `pathlib.Path`, `os.path.join`, or other platform-safe path APIs instead of hardcoded separators.
- Do not blindly modify `sys.path`; follow the repository's actual package/import architecture.
- Do not update dependencies blindly; inspect compatibility before changing requirements.
- Run applicable Pylint, Flake8, type checks, tests, and other configured checks.
- Do not automatically start long-running Python services unless explicitly requested.

---

# 10. DATABASE AND SQL RULES

## 10.1 Database Target

- Always use the database configured as the application's active/primary database.
- Determine the effective database from the application's actual configuration,
  including `application.properties`, `application.yml`, environment variables,
  launch configuration, and other runtime configuration.
- Do not hardcode a database name in project rules.
- Do not assume that the local, development, staging, and production databases are the same.
- When `launch.json` or another launch configuration overrides application properties
  for local execution, treat the runtime configuration as the effective database target.
- Before performing database operations, verify which database the application is
  currently configured to use.
- Never connect to, inspect, seed, or modify a different database merely because its
  name appears in documentation or another environment configuration.

## 10.2 Migrations

- Database structure and master-data changes MUST use versioned SQL migration scripts under:
  `autonoma-backend/src/main/resources/dbscripts/`
- Never rely on manual local queries for deployable database changes.
- Never alter existing migration history merely to change database targets or retroactively rewrite previous migrations unless explicitly instructed.
- New DDL/DML migrations SHOULD be idempotent using appropriate existence/metadata guards.
- Do not seed mock, dummy, or placeholder production data.

## 10.3 Queries

- Never use `SELECT *`.
- Select only required columns.
- Optimize joins, filters, and query conditions based on the actual schema and execution requirements.
- Do not automatically add `NOLOCK` to every query.
- For reporting/read-only queries where blocking is a concern, evaluate isolation level, query design, consistency requirements, and indexes first. Use `NOLOCK`/`READ UNCOMMITTED` only when justified.

## 10.4 Schema

- Follow existing naming and relationship conventions.
- Use `NVARCHAR` rather than `VARCHAR` for new SQL definitions where the project's Unicode standard requires it.
- Do not create duplicate user, permission, supplier, customer, ledger, or other master tables when an existing authoritative table already exists.
- Create indexes based on actual search, foreign-key, status, and query requirements rather than mechanically indexing every field.

## 10.5 Entity / Audit

- Before creating an entity, inspect existing entities and migrations for the actual audit-column conventions.
- Newly created business entities should follow the established audit fields:
  `createdBy`, `createdDate`, `updatedBy`, `updatedDate`, and applicable active-status conventions.
- Reuse the existing `UserCredential` relationship where required.
- Do not invent foreign-key relationships without verifying the schema.

---

# 11. API RULES

- Every API must follow the existing Autonoma API architecture.
- Use DTOs for request/response boundaries.
- Never expose persistence entities directly unless explicitly required by the established architecture.
- Return only required data.
- Avoid unnecessarily large JSON payloads.
- Do not include audit data or child collections unless required.
- Use the existing `StandardResponse` contract where it is already established.
- Keep controllers/API handlers thin.
- Business logic belongs in the established service/manager layer.
- Reuse existing APIs before creating a new endpoint.
- Verify frontend consumers before changing an existing response contract.

---

# 12. MASTER DATA RULES

- Master/reference data must use the existing Global Master Data architecture.
- Reuse the existing master-data service and frontend master-data mechanism.
- Do not create duplicate master tables or duplicate master APIs.
- Before adding a new master, search the existing master architecture and database.
- Transaction data must remain real-time.
- Cache only master/reference data when the existing architecture supports safe caching.
- Never hardcode master IDs.

---

# 13. USER, PERMISSION, AND SECURITY RULES

- Do not create a new user or permission table when an existing one provides the required functionality.
- Reuse:
  `com.autonoma.erp.model.admin.UserCredential`
  and the existing `AD_USER_CREDENTIAL` architecture where applicable.
- Page permissions must use the existing `BOS_USER_PAGE_AUTH` architecture.
- Follow the existing JWT, role-based access, and API authorization implementation.
- Do not bypass authorization checks when adding or modifying APIs.
- Never expose credentials, tokens, secrets, or sensitive configuration in source code, logs, responses, or commits.

---

# 14. STATUS AND WORKFLOW RULES

- Statuses are part of the application's business workflow and MUST be verified against the actual status architecture before changes.
- Use the existing `StatusMaster` / `AD_STATUS_MASTER` mechanism.
- Do not hardcode numeric status IDs.
- Compare statuses using their configured names where appropriate and resolve IDs through the existing status mechanism.
- Do not create duplicate statuses.
- If a required status does not exist, determine the established project process for creating master data before inserting it.
- Do not change status transitions without tracing all affected pages, APIs, database fields, reports, notifications, and downstream workflows.
- When modifying a workflow, analyze the complete affected document lifecycle rather than only the current page.

---

# 15. MULTI-COMPANY / DIVISION RULES

- Business data must respect the existing company/division architecture.
- Use existing `COMPANY_ID` and `DIVISION_ID` relationships where required by the schema.
- Do not bypass company/division filtering.
- Verify tenant/company/division behavior before changing queries or APIs.

---

# 16. PERFORMANCE RULES

- Optimize based on actual bottlenecks and data volume.
- Do not apply performance patterns mechanically.
- Use pagination for large datasets.
- Avoid loading thousands of unnecessary records.
- Avoid N+1 database access.
- Avoid unnecessarily large API responses.
- Avoid blocking the UI with independent data requests.
- Use asynchronous/background processing only when the operation is genuinely heavy and the existing architecture supports it.
- Prefer real-time mechanisms such as WebSocket/SSE only when the feature actually requires live updates.
- Do not introduce caching merely for perceived performance; verify data-consistency requirements first.

---

# 17. UI / UX RULES

- Reuse existing UI components and design patterns.
- Preserve established page layouts unless the task requires a redesign.
- Invalid form fields should follow the project's standard invalid-field styling and validation feedback.
- The first invalid field should receive focus when the established form-validation pattern supports it.
- Prefer compact, meaningful grouping of related header fields rather than unnecessary fragmented cards.
- Preserve the established sticky page-header behavior where required.
- Do not introduce a new visual pattern when an existing component already provides the required behavior.

---

# 18. BOS / PAGE RULES

## 18.1 Page Manuals

For newly created or substantially refactored BOS pages:

- Follow the existing page-specific User Manual/SOP architecture.
- Reuse the existing `MainCard` and `pageCode` mechanism.
- Store manuals in the established frontend configuration location.
- Register manuals using the existing centralized registration mechanism.
- Do not store page manuals in the database.
- Before creating a manual, inspect existing manuals and registration patterns.

## 18.2 BOS Pages

- New BOS modules/pages must follow the existing `BOS_PAGES` insertion architecture.
- Use SQL migrations for page insertion.
- Reuse the existing module ID resolution mechanism.
- Do not create duplicate page-permission entries for child pages when the established page-code architecture allows sharing.

## 18.3 Price Master Naming

For new related price-master schemas, follow the established naming convention:

- Master: `SALES_PRICE_LIST_MASTER`
- Transaction/detail: `SALES_PRICE_LIST_TRANS`

Do not rename existing tables solely to enforce a new naming convention unless explicitly requested.

---

# 19. GST AND TAX RULES

- Use itemized CGST, SGST, and IGST fields where the project's tax model requires them.
- Determine intra-state vs inter-state treatment using the established state-code logic.
- For intra-state transactions, apply CGST and SGST according to the existing business rules and do not apply IGST.
- For inter-state transactions, apply IGST and do not apply CGST/SGST.
- Do not display all three tax types simultaneously when the established UI requires conditional rendering.
- Reuse the existing GST treatment/type mechanism rather than introducing a parallel one.

---

# 20. DOCUMENT NUMBER RULES

For document numbers generated through Prefix Credentials:

```text
{Prefix}{Sequence}{Suffix}
```

Example:

```text
PR/00001/2627
```

- Do not place the sequence after the suffix.
- Sequence extraction must correctly ignore prefix and suffix before parsing.
- Do not add department or other dynamic prefixes unless explicitly requested.
- Reuse the existing prefix/sequence generation mechanism.

---

# 21. FILE AND DOCUMENT MANAGEMENT

- Do not store large files directly in the database when the existing architecture supports filesystem/object storage.
- Store file paths/references and metadata according to the existing storage architecture.
- Do not introduce a new storage mechanism without checking the current implementation.
- Use platform-safe path APIs.
- Do not commit local secrets or environment-specific configuration.

---

# 22. GIT AND CONFIGURATION RULES

- Do not commit local configuration/property files that are intentionally developer-specific or environment-specific.
- Preserve the repository's existing Git strategy.
- Never commit secrets, credentials, access tokens, private keys, or local environment data.
- Before modifying Git tracking behavior, inspect the current repository state.
- Do not rewrite Git history unless explicitly requested.
- Do not commit or push changes unless explicitly requested.

---

# 23. DEPLOYMENT AND SERVICE EXECUTION

- Do not automatically start long-running services unless explicitly requested.
- When deployment/restart scripts poll for backend readiness, use dynamic health/port polling rather than arbitrary short fixed sleeps.
- Backend startup may require sufficient time for migrations; deployment scripts should fail clearly when readiness is not achieved.
- Do not alter deployment infrastructure unrelated to the requested task.
- Verify environment-specific configuration before deployment changes.

---

# 24. TESTING AND VERIFICATION

For every meaningful code change:

- Verify the changed behavior.
- Run the narrowest relevant tests first.
- Run frontend lint/type checks for frontend changes.
- Run backend tests/build/quality checks for backend changes.
- Run migration validation for database changes where available.
- Check API contracts when frontend/backend boundaries change.
- Check related workflows when status/business logic changes.
- Do not claim a test/build passed unless it was actually run.
- If a check cannot be run, state that clearly.

---

# 25. CHANGE SCOPE CONTROL

- Do not modify unrelated files.
- Do not perform broad refactoring during a focused bug fix unless it is necessary for correctness.
- Do not rename existing APIs, tables, components, or files without checking all consumers.
- Before deleting code, search for references and verify that it is genuinely unused.
- Before changing a shared component/service, inspect its consumers.

---

# 26. TOOL USAGE, FILE INSPECTION & SENSITIVE FILE SAFEGUARDS

## 26.1 File Searching & Inspection (No Sandbox Prompts)
- For code searching, inspection, and viewing, the agent MUST prefer built-in IDE tools (`grep_search`, `view_file`, `list_dir`) over terminal shell commands (`Select-String`, `findstr`, `Get-ChildItem`, `cat`, etc.).
- Never run shell or PowerShell commands merely to search or read files unless explicitly requested by the user.
- This ensures file inspection is instant, strictly read-only, and executes silently without triggering terminal sandbox permission prompts.

## 26.2 Sensitive Configuration Files
- The agent MUST NEVER modify, overwrite, or delete sensitive configuration files (including `application.properties`, `application.yml`, `.env`, credentials, launch configurations, database connection settings, or production properties) without asking the user for explicit confirmation first.
- If a task involves configuration changes, explain the exact proposed changes and obtain confirmation before modifying the file.

## 26.3 Git & Commit Operations
- The agent MUST ALWAYS ask for explicit user permission before executing git staging, committing, or pushing changes (`git add`, `git commit`, `git push`, `git checkout`, `git reset`, etc.).
- Never alter git history, commits, or tracking without explicit user authorization.

---

# 27. NEW RULE / RULE MAINTENANCE

This section exists to keep `AGENTS.md` future-proof.

## Adding a New Rule

When a new project rule is introduced:

1. Check whether an existing rule already covers it.
2. If yes, update the existing rule instead of adding a duplicate.
3. Place the new rule under the correct section.
4. State whether it is **MUST**, **SHOULD**, or **MAY**.
5. Make the rule specific enough for both humans and AI agents to act on.
6. Define when the rule applies; avoid unnecessary global rules.
7. Avoid rules based on assumptions that have not been verified in the project.
8. Avoid embedding temporary task instructions as permanent rules.
9. Do not add a rule that contradicts an existing rule without resolving the conflict.
10. Keep personal, developer-specific, company-specific, environment-specific, and
    secret values out of the permanent rules unless they are intentionally project-wide.
11. If a rule is temporary or task-specific, keep it in the task/request instead of
    `AGENTS.md`.
12. When a rule depends on a tool, framework, file, configuration, or architecture,
    reference the existing project mechanism rather than inventing a parallel one.
13. If a new rule changes an existing architecture convention, update the affected
    rule instead of leaving two competing conventions in the file.

## Rule Quality Standard

A good rule should answer:

- What must the agent do?
- When does the rule apply?
- What must the agent avoid?
- Is it mandatory or preferred?
- What existing project mechanism should it use?

## Periodic Cleanup

When modifying this file:

- Remove duplicate rules.
- Merge overlapping rules.
- Resolve contradictions.
- Remove obsolete rules.
- Keep project-specific rules current.
- Do not silently remove a meaningful business rule.
- Preserve historical intent when consolidating rules.

---

# 28. FINAL AGENT CHECKLIST

Before declaring a task complete, confirm:

- [ ] I understood the requested behavior.
- [ ] I inspected the existing implementation.
- [ ] I searched for reusable functionality.
- [ ] I checked affected dependencies and consumers.
- [ ] I verified database/schema requirements where applicable.
- [ ] I followed existing Autonoma architecture.
- [ ] I did not create unnecessary duplicate logic.
- [ ] I did not hardcode IDs, secrets, environment values, or paths.
- [ ] I kept controllers/API wrappers free of business logic.
- [ ] I followed the applicable Java/React/Python rules.
- [ ] I preserved required status/master-data architecture.
- [ ] I respected security and permission requirements.
- [ ] I avoided unrelated changes.
- [ ] I ran applicable verification checks.
- [ ] I did not claim verification that was not performed.
- [ ] I reviewed the final changed files/diff.
- [ ] I reported any limitations or unresolved issues.

---

# 29. FINAL PRINCIPLE

**Understand first. Reuse existing architecture. Change only what is required. Verify before assuming. Prefer maintainable solutions over temporary fixes.**

This file is the single project-level source of AI development rules for Autonoma ERP.

---

# 27. AUDIT TRAIL / EDIT PAGES

- Every Edit Page (Forms that modify existing records) MUST implement the standard Audit Trail UI.
- Pass uditProps to the MainCard component wrapping the page.
- Provide isEdit, ormData (containing created/updated metadata), and uditLogs within uditProps.
- Do not hardcode custom drawers or custom buttons for audit history.

