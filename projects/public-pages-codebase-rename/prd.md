# Rename Landing Pages to Public Pages — Codebase Rename — PRD

|  |  |
| -- | -- |
| **Product** | OrangeQC |
| **Version** | 1 |
| **Author** | Product |
| **Date** | February 6, 2026 |
| **Status** | Ready for Engineering |
| **Platforms** | Web only (backend) |
| **Level** | 2 (Web only) |
| **Linear Issue** | [PM-226](https://linear.app/orangeqc/issue/PM-226/question-is-it-too-late-to-rename-feature-to-public-pages) |
| **Linear Project** | [Level 2: QR Codes Landing Page 1.0](https://linear.app/orangeqc/project/level-2-qr-codes-landing-page-10-16876909c150) |
| **Prerequisite** | [[rename-landing-pages-to-public-pages]] (cosmetic rename) should ship first |

---

## 1. Executive Summary

**What:** Complete the rename of "Landing Pages" to "Public Pages" at the code level — database tables, model classes, controllers, routes, URL paths, Stimulus controllers, helpers, services, factories, and tests. This is the structural follow-up to the cosmetic rename project ([[rename-landing-pages-to-public-pages]]) which handles user-facing strings only.

**Why:** After the cosmetic rename ships, the codebase will have a split identity — users see "Public Pages" but every file, class, table, and route still says `landing_page`. This creates ongoing cognitive overhead for developers: every new feature, bug fix, or code review requires mentally translating between the user-facing name and the code name. Completing the rename now, while the feature is young (private beta, limited integrations), is dramatically cheaper than doing it later when more code depends on the current names.

**Key Design Principles:**
- Sequenced after cosmetic rename — this project assumes user-facing strings already say "Public Pages"
- Atomic per layer — each migration step should be independently deployable and rollback-safe
- No functional changes — behavior, permissions, and business logic are completely untouched
- Comprehensive — when complete, `landing_page` should not appear anywhere in the codebase except migration history

---

## 2. Goals & Success Metrics

### Goals
- Eliminate the naming split between user-facing "Public Pages" and code-level "landing_page"
- Reduce developer confusion when working on the feature
- Establish clean naming before the feature exits beta and accumulates more dependent code

### Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| References to `landing_page` in app code (excluding migrations) | Zero | At deploy |
| All existing tests pass | 100% green | At deploy |
| No downtime during rename | Zero minutes of downtime | At deploy |
| Developer onboarding friction | New developer can find all Public Pages code by searching "public_page" | Immediately |

---

## 3. Feature Requirements

### 3.1 Database Tables & Columns

| ID | Requirement | Priority |
|----|------------|----------|
| DB-001 | Rename table `landing_pages` to `public_pages`. | Must |
| DB-002 | Rename table `landing_page_sections` to `public_page_sections`. | Must |
| DB-003 | Rename table `landing_page_section_forms` to `public_page_section_forms`. | Must |
| DB-004 | Rename column `structures.landing_page_id` to `structures.public_page_id`. | Must |
| DB-005 | Rename column `accounts.landing_pages_enabled` to `accounts.public_pages_enabled`. | Must |
| DB-006 | Rename all associated indexes and foreign key constraints to reflect new table/column names. | Must |
| DB-007 | Rename column `landing_page_section_forms.landing_page_section_id` to `public_page_section_forms.public_page_section_id`. | Must |
| DB-008 | Rename column `landing_page_sections.landing_page_id` to `public_page_sections.public_page_id`. | Must |
| DB-009 | All migrations are reversible (`up`/`down` or `change` with reversible `rename_table`/`rename_column`). | Must |

### 3.2 Models

| ID | Requirement | Priority |
|----|------------|----------|
| MDL-001 | Rename `LandingPage` to `PublicPage` (file: `app/models/public_page.rb`). | Must |
| MDL-002 | Rename `LandingPageSection` to `PublicPageSection` (file: `app/models/public_page_section.rb`). | Must |
| MDL-003 | Rename `LandingPageSectionForm` to `PublicPageSectionForm` (file: `app/models/public_page_section_form.rb`). | Must |
| MDL-004 | Update `Account` association: `has_many :landing_pages` → `has_many :public_pages`. | Must |
| MDL-005 | Update `Structure` association: `belongs_to :landing_page` → `belongs_to :public_page` (including `counter_cache: true`). | Must |
| MDL-006 | Delete old model files (`landing_page.rb`, `landing_page_section.rb`, `landing_page_section_form.rb`). | Must |

### 3.3 Controllers

| ID | Requirement | Priority |
|----|------------|----------|
| CTL-001 | Rename `Setup::LandingPagesController` to `Setup::PublicPagesController` (file: `public_pages_controller.rb`). | Must |
| CTL-002 | Rename `Setup::LandingPageSectionsController` to `Setup::PublicPageSectionsController`. | Must |
| CTL-003 | Rename `Setup::LandingPageSectionFormsController` to `Setup::PublicPageSectionFormsController`. | Must |
| CTL-004 | Rename `Setup::LandingPageAssignmentsController` to `Setup::PublicPageAssignmentsController`. | Must |
| CTL-005 | Rename `Setup::ArchivedLandingPagesController` to `Setup::ArchivedPublicPagesController`. | Must |
| CTL-006 | Rename `Setup::AssignedLandingPagesController` to `Setup::AssignedPublicPagesController`. | Must |
| CTL-007 | Update `Go::StructuresController` references: `render_landing_page` → `render_public_page`, `structure.landing_page` → `structure.public_page`. | Must |
| CTL-008 | Update all internal variable names, params keys, and `before_action` method names (`set_landing_page` → `set_public_page`, etc.). | Must |
| CTL-009 | Delete old controller files. | Must |

### 3.4 Routes

| ID | Requirement | Priority |
|----|------------|----------|
| RTE-001 | Rename `resources :landing_pages` to `resources :public_pages` in `config/routes.rb`. | Must |
| RTE-002 | Rename all nested resources (`landing_page_sections` → `public_page_sections`, etc.). | Must |
| RTE-003 | Rename `archived_landing_pages` resource to `archived_public_pages`. | Must |
| RTE-004 | Rename `assigned_landing_page` resource to `assigned_public_page`. | Must |
| RTE-005 | Add redirect routes from old paths (`/setup/landing_pages/*`) to new paths (`/setup/public_pages/*`) to avoid broken bookmarks. | Should |

### 3.5 Views

| ID | Requirement | Priority |
|----|------------|----------|
| VW-001 | Move `app/views/setup/landing_pages/` to `app/views/setup/public_pages/`. | Must |
| VW-002 | Move `app/views/setup/landing_page_assignments/` to `app/views/setup/public_page_assignments/`. | Must |
| VW-003 | Move `app/views/setup/archived_landing_pages/` to `app/views/setup/archived_public_pages/`. | Must |
| VW-004 | Move `app/views/setup/assigned_landing_pages/` to `app/views/setup/assigned_public_pages/`. | Must |
| VW-005 | Move `app/views_tailwind/go/landing_pages/` to `app/views_tailwind/go/public_pages/`. | Must |
| VW-006 | Update all `render partial:` references, `redirect_to` paths, and URL helpers throughout views. | Must |
| VW-007 | Update all `_path` and `_url` helper calls (e.g., `setup_landing_pages_path` → `setup_public_pages_path`). | Must |

### 3.6 JavaScript & Stimulus

| ID | Requirement | Priority |
|----|------------|----------|
| JS-001 | Rename `landing_page_edit_controller.js` to `public_page_edit_controller.js`. | Must |
| JS-002 | Update the controller registration in `controllers/index.js` (`landing-page-edit` → `public-page-edit`). | Must |
| JS-003 | Update all `data-controller="landing-page-edit"` attributes in views to `data-controller="public-page-edit"`. | Must |
| JS-004 | Update all Stimulus target and action references that use the `landing-page-edit` prefix. | Must |

### 3.7 Helpers & Services

| ID | Requirement | Priority |
|----|------------|----------|
| SVC-001 | Rename `LandingPagesHelper` to `PublicPagesHelper` (file: `public_pages_helper.rb`). | Must |
| SVC-002 | Rename `LandingPages::SubmissionsQuery` to `PublicPages::SubmissionsQuery` (file: `app/services/public_pages/submissions_query.rb`). | Must |
| SVC-003 | Delete old helper and service files. | Must |

### 3.8 Tests & Factories

| ID | Requirement | Priority |
|----|------------|----------|
| TST-001 | Rename factory files: `landing_page.rb` → `public_page.rb`, `landing_page_section.rb` → `public_page_section.rb`, `landing_page_section_form.rb` → `public_page_section_form.rb`. | Must |
| TST-002 | Update factory names inside each file (`:landing_page` → `:public_page`, etc.). | Must |
| TST-003 | Rename spec files to match new controller/model names. | Must |
| TST-004 | Update all `describe`, `context`, and `it` blocks that reference "landing page". | Must |
| TST-005 | Update all factory invocations (`create(:landing_page)` → `create(:public_page)`). | Must |
| TST-006 | All existing tests pass after rename with zero failures. | Must |

---

## 4. Platform-Specific Requirements

### Web (Rails Admin)
- This is a Rails-internal refactor. All changes are to Ruby classes, file paths, database objects, and JS controllers.
- URL paths change from `/setup/landing_pages` to `/setup/public_pages`. Old paths should redirect (RTE-005).
- The public-facing route (`go` subdomain) is unchanged at the URL level — only the internal controller reference to the model changes.

### iOS
- No changes. iOS does not reference `landing_page` model names.

### Android
- No changes. Android does not reference `landing_page` model names.

### API
- No API endpoints currently serve landing page data. If any are added before this project runs, they would need updating.

---

## 5. User Flows

### Flow 1: Developer Searches for Public Pages Code

**Persona:** Developer working on a Public Pages bug
**Entry Point:** Code editor / `grep`

1. Developer searches for `public_page` or `PublicPage`.
2. All relevant models, controllers, views, and tests appear in results.
3. No results reference `landing_page` (except migration history).
4. **Success:** Developer finds all relevant code without needing to know the old name.

### Flow 2: Admin Accesses Old Bookmarked URL

**Persona:** Account admin who bookmarked `/setup/landing_pages`
**Entry Point:** Browser bookmark

1. Admin clicks bookmark to `/setup/landing_pages`.
2. Server returns a 301 redirect to `/setup/public_pages`.
3. Admin sees the Public Pages index.
4. **Success:** Bookmark still works, browser updates the saved URL.

---

## 6. UI Mockups

No UI changes. All user-facing strings were already updated in the cosmetic rename project. This project only changes what's under the hood.

---

## 7. Backwards Compatibility

### URL Redirects

| Old Path | New Path | Method |
|----------|----------|--------|
| `/setup/landing_pages` | `/setup/public_pages` | 301 redirect |
| `/setup/landing_pages/:id` | `/setup/public_pages/:id` | 301 redirect |
| `/setup/landing_pages/:id/edit` | `/setup/public_pages/:id/edit` | 301 redirect |
| `/setup/archived_landing_pages` | `/setup/archived_public_pages` | 301 redirect |

### Migration Strategy
- `rename_table` and `rename_column` are atomic PostgreSQL operations — no data loss risk.
- All migrations must be reversible for rollback safety.
- Deploy sequence: migrate → deploy code. Rails' `rename_table` immediately updates the table name, so the new code must deploy in the same release window.

### Rollback Plan
- If something goes wrong post-deploy, `rails db:rollback` reverses the table/column renames.
- Old code (pre-rename) is compatible with old table names after rollback.

---

## 8. Edge Cases & Business Rules

| Scenario | Expected Behavior |
|----------|-------------------|
| Polymorphic `form_type` column in `public_page_section_forms` | This column stores `"Checklist"` or `"InspectionForm"`, not `"LandingPageSectionForm"`. No update needed. |
| Counter cache on `structures.public_page_id` | `counter_cache: true` on the renamed `belongs_to :public_page` association. Rails derives the counter column name from the association — since the column `structures_count` is on the `public_pages` table (not named after the association), this works without additional changes. |
| `Archivable` concern checks `deleted_at` column | Column name is `deleted_at`, not related to "landing_page". No impact. |
| `LogoUploader::Attachment(:logo)` on `PublicPage` | The uploader is attached to the `:logo` column. Table rename does not affect Shrine/uploader column references. |
| ActiveRecord STI or polymorphic type columns storing "LandingPage" | No STI or polymorphic references store the class name `"LandingPage"` anywhere. `LandingPageSectionForm` has polymorphic `form_type` but it stores `"Checklist"` / `"InspectionForm"`, not the parent class. Safe. |
| Existing migration files reference old table names | Migration files are historical artifacts and should NOT be modified. They reference the names that were correct at the time they ran. |
| `Go::StructuresController` public route | The public URL path (`/v1/account/:hash/areas/:hash/:key`) is unchanged. Only the internal model reference changes (`structure.landing_page` → `structure.public_page`). |

---

## 9. Export Requirements

**Not applicable.** No exports reference internal model or table names.

---

## 10. Out of Scope

- Any behavioral or functional changes to Public Pages
- Renaming the `go` subdomain public route URL structure
- Updating old migration files (they are historical records)
- Renaming the Linear project or existing Linear issues
- Creating API endpoints for Public Pages (separate feature if needed)

---

## 11. Open Questions

| # | Question | Status | Decision | Blocking? |
|---|----------|--------|----------|-----------|
| 1 | Should old URL paths (`/setup/landing_pages/*`) redirect to new paths, or just 404? | Open | Leaning redirect (301) — low effort, avoids broken bookmarks. | No |
| 2 | Should this ship in the same deploy as the cosmetic rename, or as a separate deploy? | Open | Separate deploy recommended — reduces blast radius. Cosmetic rename ships first, structural follows. | No |
| 3 | Does the `default_landing_page_path` method in `Users::Permissions` concern need renaming? | Open | This refers to the user's home page after login, NOT the Public Pages feature. Discovery should confirm — if unrelated, leave it alone. | No |

> **No blocking questions. This PRD is ready for pipeline intake.**

---

## 12. Release Plan

### Single Phase

All structural rename changes ship together in one deploy, after the cosmetic rename has already shipped.

**Sequence:**
1. Deploy cosmetic rename ([[rename-landing-pages-to-public-pages]]) — users see "Public Pages"
2. Deploy this project — code internals match the user-facing name

**Deliverables:**
- Database migration renaming 3 tables and 3 columns
- Renamed model, controller, helper, service, and JS files
- Updated routes with redirects from old paths
- Updated factories and test files
- All tests green

---

## 13. Assumptions

- The cosmetic rename has already shipped. All user-facing strings already say "Public Pages".
- No other branches or in-flight work depend on the `landing_page` table/model names. If there are, they should merge before this project runs.
- The `default_landing_page_path` in `Users::Permissions` is unrelated to the Public Pages feature (it's the user's home page path). Discovery will confirm.
- PostgreSQL `RENAME TABLE` and `RENAME COLUMN` are atomic, lock-free operations at the scale of these tables. No downtime expected.
- No external systems (webhooks, third-party integrations) reference OrangeQC's internal table or model names.

---

## Appendix: Complete File Inventory

### Database Migrations (1 new migration file)

| Operation | Old Name | New Name |
|-----------|----------|----------|
| `rename_table` | `landing_pages` | `public_pages` |
| `rename_table` | `landing_page_sections` | `public_page_sections` |
| `rename_table` | `landing_page_section_forms` | `public_page_section_forms` |
| `rename_column` (structures) | `landing_page_id` | `public_page_id` |
| `rename_column` (accounts) | `landing_pages_enabled` | `public_pages_enabled` |
| `rename_column` (public_page_sections) | `landing_page_id` | `public_page_id` |
| `rename_column` (public_page_section_forms) | `landing_page_section_id` | `public_page_section_id` |

### Model Files (3 renamed + 2 updated)

| Old Path | New Path |
|----------|----------|
| `app/models/landing_page.rb` | `app/models/public_page.rb` |
| `app/models/landing_page_section.rb` | `app/models/public_page_section.rb` |
| `app/models/landing_page_section_form.rb` | `app/models/public_page_section_form.rb` |
| `app/models/account.rb` | (update association only) |
| `app/models/structure.rb` | (update association only) |

### Controller Files (6 renamed + 1 updated)

| Old Path | New Path |
|----------|----------|
| `app/controllers/setup/landing_pages_controller.rb` | `app/controllers/setup/public_pages_controller.rb` |
| `app/controllers/setup/landing_page_sections_controller.rb` | `app/controllers/setup/public_page_sections_controller.rb` |
| `app/controllers/setup/landing_page_section_forms_controller.rb` | `app/controllers/setup/public_page_section_forms_controller.rb` |
| `app/controllers/setup/landing_page_assignments_controller.rb` | `app/controllers/setup/public_page_assignments_controller.rb` |
| `app/controllers/setup/archived_landing_pages_controller.rb` | `app/controllers/setup/archived_public_pages_controller.rb` |
| `app/controllers/setup/assigned_landing_pages_controller.rb` | `app/controllers/setup/assigned_public_pages_controller.rb` |
| `app/controllers/go/structures_controller.rb` | (update references only) |

### View Directories (5 moved)

| Old Path | New Path |
|----------|----------|
| `app/views/setup/landing_pages/` | `app/views/setup/public_pages/` |
| `app/views/setup/landing_page_assignments/` | `app/views/setup/public_page_assignments/` |
| `app/views/setup/archived_landing_pages/` | `app/views/setup/archived_public_pages/` |
| `app/views/setup/assigned_landing_pages/` | `app/views/setup/assigned_public_pages/` |
| `app/views_tailwind/go/landing_pages/` | `app/views_tailwind/go/public_pages/` |

### JavaScript (2 files)

| Old Path | New Path |
|----------|----------|
| `app/javascript/controllers/landing_page_edit_controller.js` | `app/javascript/controllers/public_page_edit_controller.js` |
| `app/javascript/controllers/index.js` | (update registration only) |

### Helpers & Services (2 renamed)

| Old Path | New Path |
|----------|----------|
| `app/helpers/landing_pages_helper.rb` | `app/helpers/public_pages_helper.rb` |
| `app/services/landing_pages/submissions_query.rb` | `app/services/public_pages/submissions_query.rb` |

### Factories (3 renamed)

| Old Path | New Path |
|----------|----------|
| `spec/factories/landing_page.rb` | `spec/factories/public_page.rb` |
| `spec/factories/landing_page_section.rb` | `spec/factories/public_page_section.rb` |
| `spec/factories/landing_page_section_form.rb` | `spec/factories/public_page_section_form.rb` |

### Test Files (6 renamed)

| Old Path | New Path |
|----------|----------|
| `spec/requests/setup/landing_pages_controller_spec.rb` | `spec/requests/setup/public_pages_controller_spec.rb` |
| `spec/requests/setup/landing_page_assignments_controller_spec.rb` | `spec/requests/setup/public_page_assignments_controller_spec.rb` |
| `spec/requests/setup/archived_landing_pages_controller_spec.rb` | `spec/requests/setup/archived_public_pages_controller_spec.rb` |
| `spec/features/setup/landing_pages_spec.rb` | `spec/features/setup/public_pages_spec.rb` |
| `spec/services/landing_pages/submissions_query_spec.rb` | `spec/services/public_pages/submissions_query_spec.rb` |
| `spec/models/landing_page_section_spec.rb` | `spec/models/public_page_section_spec.rb` |

### Routes (1 file updated)

| File | Changes |
|------|---------|
| `config/routes.rb` | Rename all `landing_page*` resources to `public_page*`, add redirect routes |

### Navigation (2 files — path helpers only)

| File | Changes |
|------|---------|
| `app/views/setup/_sidebar.html.erb` | Update `_path` helpers |
| `app/views_tailwind/setup/_sidebar.html.erb` | Update `_path` helpers |
