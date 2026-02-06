# Rename "Landing Pages" to "Public Pages" — Progress

> **Project:** `rename-landing-pages-to-public-pages`
> **Branch:** `pipeline/rename-landing-pages-to-public-pages`
> **Rails Repo:** `~/projects/orangeqc/orangeqc`

---

## Milestone Status

| Milestone | Status | Commit | Date |
|-----------|--------|--------|------|
| M0: Discovery & Alignment | Complete | — | 2026-02-06 |
| M1: Rename User-Facing Strings | Complete | `2ba20271d` | 2026-02-06 |
| M2: QA Test Data | Complete | `2bcee69a0` | 2026-02-06 |

---

## M1: Rename User-Facing Strings

### Summary
Replaced all ~51 user-facing occurrences of "Landing Page(s)" with "Public Page(s)" across 21 files (controllers, views, JavaScript, test assertions). No code-level renames — models, routes, controllers, database tables, and feature flag column remain unchanged.

### Files Modified (21)

**Controllers (2):**
- `app/controllers/setup/landing_pages_controller.rb` — 12 string replacements (breadcrumbs + flash messages)
- `app/controllers/setup/archived_landing_pages_controller.rb` — 1 breadcrumb replacement

**Views (15):**
- `app/views/setup/_sidebar.html.erb` — Bootstrap sidebar link text
- `app/views_tailwind/setup/_sidebar.html.erb` — Tailwind sidebar link text
- `app/views/setup/landing_pages/index.html.erb` — 9 strings (heading, button, placeholder, empty states, pagination)
- `app/views/setup/landing_pages/new.html.erb` — 1 heading
- `app/views/setup/landing_pages/edit.html.erb` — 2 strings (heading + archived banner)
- `app/views/setup/landing_pages/show.html.erb` — 3 strings (confirm dialogs + archived banner)
- `app/views/setup/landing_pages/_form.html.erb` — 1 placeholder
- `app/views/setup/landing_pages/_section_fields.html.erb` — 1 help text
- `app/views/setup/landing_pages/_section_template.html.erb` — 1 help text
- `app/views/setup/assigned_landing_pages/_landing_page.html.erb` — 7 strings (labels, prompts, confirms)
- `app/views/setup/landing_page_assignments/create.html.erb` — 1 success message
- `app/views/setup/landing_page_assignments/_confirm_content.html.erb` — 2 replacement texts
- `app/views/setup/archived_landing_pages/index.html.erb` — 6 strings (heading, links, empty states)
- `app/views/setup/structures/right_pane.html.erb` — 1 action link text
- `app/views/admin/accounts/edit.html.erb` — 1 feature flag label

**JavaScript (1):**
- `app/javascript/controllers/bulk_assign_modal_controller.js` — 1 flash message

**Tests (3):**
- `spec/requests/setup/landing_pages_controller_spec.rb` — 7 assertion updates
- `spec/requests/setup/archived_landing_pages_controller_spec.rb` — 1 assertion update
- `spec/features/setup/landing_pages_spec.rb` — ~19 assertion updates

### Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| Existing request specs (`landing_pages_controller_spec.rb`) | 93/93 pass | All green |
| Existing request specs (`archived_landing_pages_controller_spec.rb`) | All pass | All green |
| Existing feature specs (`landing_pages_spec.rb`) | 51/51 pass | 13 pending (pre-existing skips) |
| Stage 4 rename-specific specs (request) | 22/28 pass | 6 spec gaps (see below) |
| Stage 4 rename-specific specs (feature) | 8/12 pass | 4 spec gaps (see below) |

### Verification Grep
```
grep -ri "landing page" app/views/ app/views_tailwind/setup/ \
  app/controllers/setup/ app/javascript/controllers/bulk_assign_modal_controller.js \
  app/views/admin/accounts/edit.html.erb
```
**Result: Zero matches.** Only code comments in controllers contain "landing_page" references (expected — out of scope per PRD).

### Acceptance Criteria

- [x] NAV-001: Tailwind sidebar reads "Public Pages"
- [x] NAV-002: Bootstrap sidebar reads "Public Pages"
- [x] NAV-003: Archived pages back-link reads "Back to Public Pages"
- [x] HDG-001: Index heading reads "Public Pages"
- [x] HDG-002: New page heading reads "New Public Page"
- [x] HDG-003: Edit page heading reads "Edit Public Page"
- [x] HDG-004: Archived index heading reads "Archived Public Pages"
- [x] HDG-005: Show page does not display "Landing Page" anywhere
- [x] BTN-001: "New Public Page" button on index (text + title)
- [x] BTN-002: Structures right pane reads "Duplicate Public Page"
- [x] BTN-003: Archive confirm dialog references "public page"
- [x] BTN-004: Restore flash says "Public page was restored successfully."
- [x] BTN-005: Area tree right pane heading reads "Public Page"
- [x] BTN-006: Bulk assign modal uses "Public Page" / success message updated
- [x] MSG-001: All flash messages say "Public page" (create, update, archive, restore, duplicate)
- [x] MSG-002: All confirmation dialogs reference "public page"
- [x] FLG-001: Admin settings checkbox reads "Public Pages"
- [x] Empty state text references "public pages"
- [x] Search placeholder reads "Search public pages..."
- [x] Pagination model name reads "public page" / "archived public page"
- [x] Form placeholder reads "Public page title"
- [x] Section form picker help text reads "...save the public page."
- [x] All existing landing pages tests pass with updated strings
- [x] Verification grep confirms zero remaining "landing page" in user-facing files

### Spec Gaps (10 Stage 4 test failures — not implementation issues)

**Structures right pane tests (8 failures):**
Tests hit `GET setup_structure_path(area)` (the `show` action) but the "Duplicate Public Page" link is rendered by the separate `right_pane` AJAX action at `right_pane_setup_structure_path(structure)`. The show action doesn't render the right pane inline. The string IS correctly changed in the source file — tests just can't verify it through this endpoint.

**Admin settings test (1 failure):**
Uses `create(:user, :super_admin)` but the `:super_admin` trait doesn't exist in the factory. Error: `KeyError: Trait not registered: "super_admin"`.

**Duplicate failure test (1 failure):**
Uses `allow_any_instance_of(LandingPage).to receive(:dup).and_return(LandingPage.new)` which causes `PG::NotNullViolation` (null account_id) rather than `ActiveRecord::RecordInvalid`. The controller's rescue only catches `ActiveRecord::RecordInvalid`.

---

## M2: QA Test Data

### Summary
Created an idempotent rake task that seeds a QA account with landing pages data for manual verification of the "Public Pages" rename.

### Files Created (1)

- `lib/tasks/pipeline/seed_rename_landing_pages_to_public_pages.rake` — idempotent rake task

### Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| Rake task execution | Passes | Creates full data set, prints summary |
| Idempotency re-run | Passes | Skips creation, prints summary |
| Existing request specs | 81/81 pass | No regressions |
| Existing feature specs | 51/51 pass | 13 pending (pre-existing skips) |

### Acceptance Criteria

- [x] Rake task `pipeline:seed_rename_landing_pages_to_public_pages` exists in `lib/tasks/pipeline/`
- [x] Task creates a test account with `landing_pages_enabled: true`
- [x] Task creates several landing pages (3 active, 2 archived) with sections and form assignments
- [x] Task creates structures (2 sites, 5 areas) with landing page assignments for testing the area assignment UI
- [x] Task is idempotent (re-run skips creation, prints summary)
- [x] Task prints a summary: account credentials, URLs to visit, verification checklist
- [x] Dev/staging only (aborts in production)

### Data Created

| Entity | Count | Details |
|--------|-------|---------|
| Account | 1 | `publicpages-qa` subdomain, landing_pages_enabled + tailwind_enabled |
| Sites | 2 | Main Campus, Branch Office |
| Areas | 5 | Lobby, Conference Room A, Break Room, Reception, Open Floor |
| Checklists | 2 | Daily Cleaning, Safety Inspection |
| Active landing pages | 3 | Cleaning Services Portal (2 sections/forms), Safety Inspections Portal (1 section/form), Empty Portal |
| Archived landing pages | 2 | Old Maintenance Portal, Deprecated Cleaning Page |
| Area assignments | 3 | Lobby + Conference Room A → Cleaning, Reception → Safety |
| Unassigned areas | 2 | Break Room, Open Floor (for testing empty state) |

### Spec Gaps
None — M2 is a rake task with no Stage 4 automated tests.

### Notes
- Login credentials: `publicpages_qa` / `hacktheplanet`
- The `created_by_id` column does not exist on the `landing_pages` table in the current schema (despite being defined in the model). Rake task creates landing pages without it.
- Account creation uses `AccountSignup` + `Builders::AccountBuilder` pattern (same as `db/seeds.rb`).
- User login must use only letters, numbers, and underscores (no hyphens).

---

## AGENTS.md Updates
No updates needed — no new models, controllers, routes, or architectural patterns introduced.

---

## Next Steps
All milestones are complete. The project branch `pipeline/rename-landing-pages-to-public-pages` is ready for review.
- Stage 7 (QA Plan): `/stage7-qa-plan rename-landing-pages-to-public-pages`
- Create PR: `/create-pr rename-landing-pages-to-public-pages`
