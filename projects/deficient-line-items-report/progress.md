# Implementation Progress — deficient-line-items-report

| Field | Value |
|-------|-------|
| **Branch** | `pipeline/deficient-line-items-report` |
| **Rails repo** | `~/projects/orangeqc/orangeqc/` |
| **Milestones** | M0–M8 |

## Milestone Status

| Milestone | Description | Status |
|-----------|-------------|--------|
| M0 | Discovery & Alignment | Complete (Stages 1-3) |
| M1 | Data Model & Core Analytics | **Complete** |
| M2 | Entry View — Summary Cards & Line Item Table | **Complete** |
| M3 | Configurable Thresholds | **Complete** |
| M4 | Filters — Date Range, Areas, Forms | Pending |
| M5 | Drill-Down View — Navigation, Summary, Area Concentration | Pending |
| M6 | Drill-Down View — Trend Chart & Mixed Areas | Pending |
| M7 | Export — PDF & CSV | Pending |
| M8 | Empty States, Edge Cases & Polish | Pending |

---

## M1: Data Model & Core Analytics

**Status:** Complete
**Date:** 2026-02-05
**Commit:** `29c5d53`

### Files Created
- `db/migrate/20260205211647_create_report_settings.rb` — report_settings table with user_id, report_type, jsonb settings, unique index
- `app/models/report_setting.rb` — ReportSetting model with DEFAULTS, .for(), accessors
- `app/services/analytics/deficient_line_items.rb` — full analytics service with all query methods

### Test Results
- **M1 tests:** 58 passing, 0 failing
- **Prior milestone tests:** N/A (first milestone)

### Acceptance Criteria
- [x] `report_settings` table exists with `user_id`, `report_type`, `settings` (jsonb), and unique index on `(user_id, report_type)`
- [x] `ReportSetting` model validates presence of `report_type`, uniqueness scoped to `user_id`, and presence of `settings`
- [x] `ReportSetting.for(user, report_type)` returns existing settings or initializes with defaults (repeat: 2, sample: 5, high risk: 60)
- [x] `Analytics::DeficientLineItems` includes `Analytics::Filters` module
- [x] `#total_deficiencies` returns count of deficient inspection items within scoped date range and access
- [x] `#total_inspected` returns count of all applicable, active inspection items (excluding N/A) within scope
- [x] `#overall_deficiency_rate` returns `total_deficiencies / total_inspected * 100`, rounded to 1 decimal
- [x] `#qualifying_line_items` returns line items meeting both repeat threshold AND minimum sample size thresholds, with correct columns
- [x] `qualifying_line_items` supports `sort_column`, `sort_direction`, `page`, `per_page` params
- [x] `qualifying_line_items` uses `FILTER (WHERE ...)` PostgreSQL syntax for conditional aggregates
- [x] All queries scoped through `InspectionItem.accessible_to(current_user).between(start_date, end_date).active.applicable`
- [x] Prior period calculated as mirror-duration window immediately preceding selected date range
- [x] `prior_period_rates_for(line_item_ids)` batch-computes prior period deficiency rates in a single query
- [x] `trend_badge(current_rate:, prior_rate:)` returns correct symbols based on ±5pp threshold
- [x] `drill_down_summary(line_item_id:, structure:)` returns metrics for a specific line item optionally scoped to structure subtree
- [x] `area_concentration(line_item_id:, parent_structure:)` returns per-area metrics for direct children
- [x] `form_comparison(line_item_id:, structure:)` returns per-inspection-form metrics at a specific leaf area
- [x] `trend_data(line_item_id:, structure:)` returns time-bucketed deficiency counts using `suggested_grouping_by_time`

### Spec Gaps
None

### Notes
- PostgreSQL `ROUND(double_precision, integer)` does not exist — AVG() results must be cast to `::numeric` before rounding
- StandardRB pre-commit hook auto-formatted the service file (minor whitespace changes)

---

## M2: Entry View — Summary Cards & Line Item Table

**Status:** Complete
**Date:** 2026-02-05
**Commit:** `60f06aa`

### Files Created
- `app/controllers/reports/deficient_line_items_controller.rb` — controller with index and show actions
- `app/views/reports/deficient_line_items/index.html.erb` — entry view layout
- `app/views/reports/deficient_line_items/show.html.erb` — drill-down view layout
- `app/views/reports/deficient_line_items/_summary_cards.html.erb` — four metric cards
- `app/views/reports/deficient_line_items/_line_item_table.html.erb` — sortable table with risk bars and trend badges
- `app/views/reports/deficient_line_items/_risk_bar.html.erb` — colored deficiency rate bar
- `app/views/reports/deficient_line_items/_pagination.html.erb` — page controls

### Files Modified
- `config/routes.rb` — added `resources :deficient_line_items, only: [:index, :show]` to reports namespace
- `app/views/reports/index.html.erb` — added report entry link with `can?(:read, :inspections)` guard
- `app/services/analytics/deficient_line_items.rb` — added `qualifying_line_items_count`, `line_items_tracked`, `prior_period_deficiency_rate`

### Test Results
- **M2 tests:** 26 passing, 0 failing (includes M5/M6 show tests which also pass)
- **Prior milestone tests (M1):** 58 passing, 0 regressions

### Acceptance Criteria
- [x] ENT-001: Entry view displays four summary cards (Total Deficiencies, Total Inspected, Overall Deficiency Rate, Line Items Tracked)
- [x] ENT-002: Total Deficiencies shows sum of all deficient inspection items
- [x] ENT-003: Total Inspected shows total inspection count excluding N/A items
- [x] ENT-004: Overall Deficiency Rate shows percentage
- [x] ENT-005: Line Items Tracked shows count of line items meeting thresholds
- [x] ENT-010: Table displays one row per unique line item
- [x] ENT-011: Table has seven columns (Line Item, # Deficient, # Total, % Deficient, Unique Areas, Avg Score, Trend)
- [x] ENT-018: Trend column shows directional badges
- [x] TRD-007: Trend badge not displayed when no prior period data
- [x] ENT-019: Table defaults to sorting by % Deficient descending
- [x] ENT-020: All columns except Trend are sortable
- [x] ENT-021: Active sort column displays directional arrow
- [x] ENT-022: Only line items meeting both thresholds appear
- [x] ENT-023: Only line items within user's supervisory zone appear
- [x] ENT-024: Clicking any row navigates to drill-down view
- [x] ENT-025: Rows highlight on hover (cursor: pointer style)
- [x] ENT-026: Table paginates (25 per page)
- [x] UI-001: % Deficient column displays horizontal risk bar
- [x] UI-002: Risk bar is red (>= high risk threshold), amber (35%-threshold), green (<35%)
- [x] WEB-001: Entry view at /reports/deficient_line_items
- [x] Report appears in Reports menu with `can?(:read, :inspections)` guard
- [x] Report accessible only to users with read_reports permission

### Spec Gaps
None

### Notes
- The show action (M5/M6 drill-down) was implemented alongside index since both share the same controller and routes. All 26 tests in the controller spec pass, including the drill-down tests.
- Three methods were added to the analytics service that weren't needed for M1 tests but are required by the controller: `qualifying_line_items_count`, `line_items_tracked`, `prior_period_deficiency_rate`
- StandardRB passed on the first commit attempt (no auto-formatting needed)

---

## M3: Configurable Thresholds

**Status:** Complete
**Date:** 2026-02-05
**Commit:** `8cab0ac`

### Files Created
- `app/controllers/reports/deficient_line_item_settings_controller.rb` — settings controller with PATCH update action
- `app/views/reports/deficient_line_items/_defaults_banner.html.erb` — persistent banner showing current threshold values with Edit Defaults button
- `app/views/reports/deficient_line_items/_edit_defaults_modal.html.erb` — Bootstrap modal with three number inputs and helper text
- `app/javascript/controllers/deficient_line_items_settings_controller.js` — Stimulus controller for modal management

### Files Modified
- `config/routes.rb` — added `resource :deficient_line_item_settings, only: [:update]` to reports namespace
- `app/views/reports/deficient_line_items/index.html.erb` — renders defaults banner and edit defaults modal

### Test Results
- **M3 tests:** 9 passing, 0 failing
- **Prior milestone tests (M1+M2):** 84 passing, 0 regressions

### Acceptance Criteria
- [x] CFG-001: Persistent banner below report header showing current thresholds in plain language
- [x] CFG-002: Banner displays "Edit Defaults" button
- [x] CFG-003: Clicking "Edit Defaults" opens a modal with three inputs
- [x] CFG-004: Repeat Threshold input — minimum deficiencies for a line item to appear. Default: 2.
- [x] CFG-005: Minimum Sample Size input — minimum inspections for a line item to appear. Default: 5.
- [x] CFG-006: High Risk Threshold input — deficiency rate at or above which areas are flagged HIGH RISK. Default: 60.
- [x] CFG-007: Each input displays helper text
- [x] CFG-008: Clicking "Save" closes modal, report refreshes with new thresholds applied
- [x] CFG-009: Clicking "Cancel" closes modal with no changes
- [x] CFG-010: All three thresholds persist per-user across sessions (stored in report_settings table)
- [x] CFG-011: Defaults banner text updates after save
- [x] WEB-003: Edit Defaults Modal is net new

### Spec Gaps
None

### Notes
- The settings controller uses `redirect_back fallback_location:` which falls back to the index path in tests (no HTTP_REFERER)
- `setting_params.to_h.transform_values(&:to_i)` ensures partial updates work — only submitted keys are merged
- Bootstrap's `data-toggle="modal"` / `data-dismiss="modal"` handles basic open/close; Stimulus controller provides programmatic control
- StandardRB passed on first commit attempt
