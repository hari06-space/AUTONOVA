# Code Review — `onboarding-OL-part4`

| | |
| :--- | :--- |
| **Branch reviewed** | `onboarding-OL-part4` |
| **Base** | `main` (merge-base diff) |
| **Scope** | 27 files, +6538 / −2357 |
| **Module** | HRA → Onboarding → Offer Letter (HA1360) |
| **Reviewed By** | Logaraj S |
| **Reviewed At** | 2026-09-01 |
| **Rules applied** | `.agents/AGENTS.md`, `docs/architecture-rules.md`, `docs/performance-guidelines.md` |
| **Verdict** | **Request changes** — 6 blockers, 6 high, 6 medium, 2 low |

---

## 1. Summary

The direction of this PR is correct: `HRA_OFFER_LETTERS` moves from JSON-only storage to typed
snapshot columns with a real `AD_STATUS_MASTER` foreign key, optimistic locking, and covering
indexes. Two genuinely reusable pieces were introduced (`salaryBalancingEngine.js`,
`SalaryStructureTable.jsx`).

It is not mergeable as-is. The status migration hardcodes tenant-specific `AD_STATUS_MASTER`
IDs, the controller owns business logic and accepts/returns JPA entities, and three code paths
report success to the user when the underlying operation failed. Several extractions that were
made for reuse are not actually wired into the callers that duplicate them.

### What already complies

- Typed snapshot columns, `StatusMaster` FK, `LOCK_VERSION` optimistic locking, covering indexes.
- `OfferLetterSummaryDto` excludes `formData` on list; edit loads detail separately.
- `SendOfferLetterDialog` reuses the existing `EmailContent` template engine and the designer's
  HTML/PDF renderer instead of building a parallel letter renderer.
- `NEXT_VERSION.md` versions were claimed before the migrations were written.

---

## 2. Blockers

### B1 — Hardcoded status IDs in migration
`autonoma-backend/src/main/resources/dbscripts/20260831_V1216.0__Unify_Hra_Offer_Letters_Single_Status_Column.sql` (L37–46)

Rule: AGENTS §14 — *"Do not hardcode numeric status IDs."*

The `CASE` maps status text to literal IDs (`THEN 34`, `53`, `54`, `56`, `24`, `8`, `86`, `9`, `5`,
`12`). These IDs are tenant-specific. In any database whose `AD_STATUS_MASTER` identities differ,
every offer letter is assigned the wrong status, and the V1216 validation gate will pass while
silently corrupting data. Resolve by name, the way V1214 already does in the same PR:

```sql
UPDATE hol
SET hol.NEW_STATUS = sm.ID
FROM [dbo].[HRA_OFFER_LETTERS] hol
INNER JOIN [dbo].[AD_STATUS_MASTER] sm
  ON UPPER(sm.[NAME]) = UPPER(TRIM(hol.[STATUS]))
WHERE hol.NEW_STATUS IS NULL;
```

Apply alias mappings (`EMAIL SENT` → `Sent`, `TO BE VERIFY` → `To Be Verified`) as name-based
lookups, not IDs.

### B2 — Business logic in the controller, entity on the API boundary
`.../modules/hra/letters/controller/HraLettersController.java` (L89–199)

Rules: AGENTS §7 (*"Controllers MUST NOT contain business logic"*), §11 (*"Use DTOs for
request/response boundaries"*).

`save()` performs status resolution, field-by-field copy of ~25 columns, authoritative sequence
allocation, and downstream candidate status synchronisation. It also accepts `@RequestBody
HraLetter` — the JPA entity — as the request contract.

Introduce `HraLetterService` for that logic and accept a request DTO. There is currently no
service class in `modules/hra/letters/`.

### B3 — Entity returned from the eligible-applicants API
`.../modules/hra/recruitment/controller/HraApplicantController.java` — `/eligible-for-offer`

Rule: AGENTS §11 — *"Never expose persistence entities directly."*

Returns `List<EmployeeMaster>`, which serialises the full employee graph (statutory, organization,
assessment relations) to the offer-letter candidate picker. Return a slim DTO: id, applicant code,
name, email, phone, department/designation ids and names, offer status.

### B4 — Entity returned for offer templates
`HraLettersController.getAll` (L72–73)

The `OFFER_TEMPLATE` branch returns raw `HraLetter` entities including `FORM_DATA`. Route it
through a DTO like the offer-letter branch.

### B5 — UI reports a successful save after the API failed
`autonoma-frontend/src/views/hra/onboarding/OfferLetterPage.jsx` (L1839–1876)

When `POST /api/hra/letters` throws (any non-409 error), the `catch` block builds a synthetic row
with `id: Date.now()`, inserts it into the grid, and shows *"Offer Letter saved successfully."*

The user believes the offer letter is persisted when it is not, and the grid diverges from the
database until refresh. Surface the API error and leave `rows` untouched unless the save succeeded.

### B6 — Email endpoint reports success after SMTP failure
`HraLettersController.sendOfferEmail` (L258–265)

Rule: AGENTS §13, §24.

The `catch` returns `success: true` with *"Offer recorded. Email queued"* — nothing is queued.
Callers will mark the letter as sent. Return a failure status and do not advance the status.
Preferably delete this endpoint: `/send-offer-letter` already covers the flow (see M3).

---

## 3. Optimization findings

### O1 — Unpaginated list API
`HraLettersController.getAll` (L67–76)

Rules: AGENTS §16, architecture-rules §14 (*"Never load 10000+ records directly. Use server
pagination"*).

`findByLetterTypeOrderByIdDesc` loads every offer letter into memory and streams it all to the
browser. Add server-side page/size/sort.

### O2 — Summary DTO is a detail dump
`OfferLetterSummaryDto`

Rule: AGENTS §11 — *"Return only required data. Do not include audit data unless required."*

It carries the company snapshot, signatory fields, probation, net/monthly CTC, and all four audit
columns — none of which the grid renders. Reduce to the grid columns:
`id, refNo, letterDate, employeeCode, employeeName, department, designation, joiningDate,
annualCtc, statusId, statusName, lockVersion`. It currently duplicates
`OfferLetterDetailDto` minus one field.

### O3 — Fabricated document number on failure
`HraLettersController.getNextOfferLetterNo` (L62–63)

Rule: AGENTS §20.

The `catch` returns the literal `OL/000001/2627`, which can collide with a real sequence and hides
a failure of the prefix-credential service. Return an explicit error instead.

### O4 — Preview writes a portal token
`.../letters/service/OfferLetterEmailService.java` (L189, L307)

The method is annotated `@Transactional(readOnly = true)` but calls
`portalTokenService.generateAndSaveToken(...)`. Every Preview click mints and persists a candidate
portal token. Generate the token only in `sendOfferLetterEmail`.

### O5 — Hardcoded company, salary and contact fallbacks
`OfferLetterEmailService` (L255–437)

Rule: AGENTS §4 — *"Do not hardcode environment-specific values."*

Hardcoded: `NUTECH WIND PARTS PVT LTD`, the SIPCOT Hosur address, `hr@nutechwind.com`,
`NUTECH HR TEAM`, `₹6,72,000 / Annum`, `₹30,000`, `Senior Production Engineer`, `Production`,
`OL/2627/0001`, and `resolvedCandidateId = ... : 1L`.

The `1L` fallback is the most serious: a missing applicant silently binds the portal token to
employee id 1. Missing master data should stay empty or fail validation.

### O6 — Duplicate master-data fetches, bypassing the global store
`OfferLetterPage.jsx` (L594–701) and hardcoded lists at L160–178

Rules: architecture-rules §4 (*"Do not create page-specific master loading"*), §6 (Zustand),
performance-guidelines §1.

Departments and designations are fetched twice — once via `/api/lookups/bulk` in
`fetchMasterData`, then again via `/api/master/hr/designations` and `/departments` in
`fetchCandidates`. The page ignores `store/useMasterDataStore.js`, which already deduplicates and
caches these lookups.

`DEPARTMENT_MASTER_DATA`, `EMPLOYMENT_TYPES`, `LOCATIONS`, and `GRADES` are hardcoded constants
used as dropdown fallbacks (L2495, L2529, L2543). Remove them and rely on the master store.

### O7 — Non-indexable status matching in the eligibility query
`.../hr/employee/repository/EmployeeMasterRepository.java` — `findAtsApplicantsEligibleForOffer`

Rules: architecture-rules §15 (*"Avoid LIKE '%value%' without proper indexing"*), AGENTS §14, §16.

The query filters on `UPPER(e.status.name) LIKE '%SELECT%'`, `'%OFFER%'`, `'%VERIF%'`,
`'%JOIN%'`, `'%REJECT%'`, `'%HOLD%'`, `'%CANCEL%'`. Leading wildcards prevent index use and the
substrings are fragile — `%SELECT%` also matches "Not Selected", and `%VERIF%` matches both
"Verified" and "To Be Verified". Compare `StatusMaster.name` exactly, or resolve IDs through
`AtsStatusResolver`, and drop the `JOIN FETCH` graph for a picker payload.

### O8 — Covering index dropped and not recreated
V1216 index cursor (L73–92) vs `20260830_V1213.0__Add_Covering_Index_Hra_Offer_Letters.sql`

The cursor drops every non-PK index containing `STATUS` or `STATUS_ID`. That includes
`IX_HRA_OFFER_LETTERS_TYPE_ID` from V1213, whose `INCLUDE` list contains `STATUS`. V1216 recreates
only `IX_HRA_OFFER_LETTERS_STATUS`, so the covering index for the list query added earlier in this
same PR is silently lost. Recreate it on `(LETTER_TYPE, ID DESC)` after the type conversion.

### O9 — Columns added and dropped within one PR
V1214 vs V1215, plus `OfferLetterPage.jsx` (L1783–1793)

V1214 adds `REPORTING_MANAGER_ID`, `REPORTING_MANAGER`, `COMPANY_GSTIN`; V1215 drops all three.
Do not add them. The frontend save payload still sends `reportingManagerId`, `reportingManager`,
and `companyGstin`, which the backend now discards — dead fields on the wire.

### O10 — Grid filters use retired status names
`OfferLetterPage.jsx` (L506–514)

Filter options are `Draft`, `Pending Approval`, `Approved`, `Email Sent`, `Candidate Accepted`,
`Cancelled`, while the backend now returns `StatusMaster` names (`Draft`, `Sent`, `Resent`,
`Accepted`, …). `Pending Approval`, `Email Sent`, and `Candidate Accepted` will never match, so
those filters return nothing. Drive the options from `StatusMaster`.

---

## 4. Reusability findings

Rules: AGENTS §5 (*"prefer one reusable implementation … Do not duplicate business logic"*), §8.

### R1 — Extracted form dialog is dead code
`autonoma-frontend/src/views/hra/onboarding/OfferLetterFormDialog.jsx`

741 lines, `memo`-wrapped, fully prop-typed — and never imported anywhere. `OfferLetterPage.jsx`
still renders the entire form inline (`BOSFormSection` blocks at L2174–2702). Either wire the
dialog and delete the inline form, or delete the file. Shipping both guarantees they drift.

### R2 — Shared salary engine not adopted by its duplicates
`autonoma-frontend/src/utils/salaryBalancingEngine.js`

The new shared engine is used by `OfferLetterPage` and `OfferLetterDesigner`, but the two original
copies remain: `modules/hra/ApplicationTrackingSystem.jsx` (L88) and
`modules/hra/InterviewFinalProcess.jsx` (L99) each still define a local
`reevaluateAndBalanceComponents`. Salary balancing is business logic; three implementations will
diverge. Move the ATS-only statutory flags (`ltaEligible`, `lossOfMinutesDeduct`, permission
allowance) into optional parameters of the shared engine and delete the local copies.

### R3 — Display helpers duplicated four times
`getDisplayString`, `normalizeGender`, `extractDateString` are redefined in `OfferLetterPage.jsx`
(L94–131), `OfferLetterFormDialog.jsx` (L51–80), and `SendOfferLetterDialog.jsx` (L35) — while
`ui-component/bos/designer/OfferLetterDesigner.jsx` already **exports** all three (L107–126).

The copies are not even equivalent: the Designer and Page map "other" to `Trans`, the FormDialog
maps it to `Other`, and the FormDialog's `extractDateString` accepts any string containing a dash.
Import the exported helpers, or promote them to `BOSUtils.js`.

### R4 — Local `getPhotoUrl` is a no-op that shadows the BOS utility
`OfferLetterPage.jsx` (L148), `OfferLetterFormDialog.jsx` (L41)

Both return the raw relative path unchanged, so a stored path never resolves to an image.
`ui-component/bos/BOSUtils.js` (L203) already exports `getPhotoUrl`, which handles `File`/`Blob`,
encodes path segments, and prefixes `/api/files/view`. Use it.

### R5 — SMTP transport rebuilt instead of reusing the send service
`OfferLetterEmailService.sendOfferLetterEmail` (L602–698)

Constructs a private `JavaMailSenderImpl`, sets host/port/properties, normalises the Gmail
password, and splits To/CC by hand. `service/admin/EmailSendingService.sendEmailWithAttachments`
(L246–256) already does all of this and is already injected into `HraLettersController`. There are
now two send endpoints (`/send-offer-letter`, `/send-offer-email`) and two transports. Consolidate
to one.

### R6 — Prop surface of the extracted dialog is not reusable
`OfferLetterFormDialog.jsx` (L82–158)

~80 flattened props (`candidateName`, `onEmailChange`, `grossVal`, `isPTaxEnabled`, …). If the
dialog stays, group them into `candidate`, `job`, `salary`, `company`, `terms` objects so the
component can be reused without a 40-line call site. AGENTS §5 asks for customisation via
props/callbacks, not a flattened mirror of one page's state.

### R7 — Conflicting gender master lists
`OfferLetterFormDialog.jsx` (L39) uses `['Male', 'Female', 'Other']`; `OfferLetterPage.jsx`
(L178) uses `['Male', 'Female', 'Trans']`. The same field has two vocabularies. Use one list from
the existing master mechanism.

---

## 5. Low severity

### L1 — File headers incomplete
Rule: AGENTS §6.

New files (`OfferLetterFormDialog.jsx`, `SalaryStructureTable.jsx`, `salaryBalancingEngine.js`,
the new DTOs) carry only `Created At` / `Description`. `Organization` and `Owner`
(`git config user.name`) are missing.

### L2 — Redundant boilerplate
- `HraLetter.java` (L135–202): `@Data` plus ~70 lines of handwritten getters/setters for the same
  fields. `getStatusId()` is a derived accessor while `setStatus` exists — Lombok already covers it.
- `OfferLetterEmailService.java` (L94): `@Slf4j` and a second manually declared
  `private static final Logger log` for the same class.

---

## 6. Suggested fix order

1. **Status correctness** — rewrite V1216 mapping by name; recreate the V1213 covering index (B1, O8).
2. **API contract** — add `HraLetterService`; DTOs in and out; stop returning `HraLetter` and
   `EmployeeMaster` (B2, B3, B4, O2).
3. **Stop reporting false success** — remove the synthetic save row, fail the email endpoint, stop
   token writes on preview (B5, B6, O4).
4. **Wire the reuse already written** — import `OfferLetterFormDialog`, adopt
   `salaryBalancingEngine` in ATS and `InterviewFinalProcess`, import the Designer helpers and
   `BOSUtils.getPhotoUrl`, move masters to `useMasterDataStore` (R1–R5, O6).
5. **List performance** — paginate `GET /api/hra/letters`, slim the summary DTO, fix status filter
   options, exact-match the eligibility query (O1, O7, O10).

---

## 7. Verification status

No build, test, lint, or migration run was performed as part of this review. Findings are based on
static reading of `git diff main...onboarding-OL-part4`. Before merge, per AGENTS §24, the
following still need to be run and reported:

- Frontend lint / type check for the changed React files.
- Backend build and tests for the letters module.
- V1214 → V1215 → V1216 migration sequence against a restored copy of the target database,
  confirming the V1216 validation gate and the resulting index set.
