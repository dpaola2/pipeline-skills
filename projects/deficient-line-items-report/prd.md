# Deficient Line Item Report — PRD

|  |  |
| -- | -- |
| **Product** | OrangeQC |
| **Version** | 2 |
| **Author** | Product |
| **Date** | February 4, 2026 |
| **Status** | Ready for Engineering |
| **Platforms** | Web only |
| **Level** | 2 (Web only) |
| **Framing Doc** | [Framing](https://linear.app/orangeqc/document/framing-89723348f5d4) |
| **Shaping Doc** | [Shaping V4](https://linear.app/orangeqc/document/shaping-v4-d785b208089c) |
| **Mockups** | [V2 Mockups](https://linear.app/orangeqc/document/v2-mockups-ea0f18c153d3) |

---

## What We're Building

A new Deficient Line Item Report that surfaces repeat deficiency patterns across a BSC's account. The report is organized line-item-first: it shows which tasks are failing most consistently, lets users drill down to see where failures are concentrated, how severe they are, and whether they are trending better or worse. Users can filter by area and inspection form, configure thresholds, and export to PDF or CSV.

## Why We're Building It

Repeat deficiencies are the #1 reason BSCs lose cleaning contracts. By the time a client raises the issue in a QBR, the pattern has been building for months. The existing Overall Report shows a small summary of lowest/highest scoring line items but lacks expandability, complete metrics, severity signals, and trend visibility. BSCs are forced to manually piece together data from CSV exports, or they don't track repeat patterns at all. This report closes that gap.

## Key Design Principles

* **Line-item-first.** Users start with the failing task, then drill into where it's failing. Not the other way around.
* **Severity over volume.** Default sort is deficiency rate, not absolute count. A line item that fails 8 out of 10 times is worse than one that fails 20 out of 500.
* **Transparent defaults.** Every threshold that shapes the report is visible on screen, editable, and persistent. No hidden filters.
* **Insight, not workflow.** V1 surfaces the problem. Connected actions, corrective action logging, and alerting are future scope.

---

## 2. Users & Personas

**BSC Account Manager** — The primary user. Manages the relationship with one or more client accounts. Prepares for QBRs, investigates complaints, and drives corrective action. Uses this report to identify which line items are failing, where, and whether things are improving. Needs to export data for client presentations.

**BSC Operations Manager** — Oversees multiple account managers and their portfolios. Uses this report to spot systemic issues across accounts (e.g., floor care is failing everywhere, not just one building). Needs a quick scan of what's broken without drilling into every account.

**BSC Executive** — Needs high-level visibility into quality trends for strategic decisions. Unlikely to use the report directly day-to-day but may review exported PDFs during leadership meetings or QBRs.

All three personas have the `read_reports` permission and access the report via the web.

---

## 3. Goals & Success Metrics

### Goals

| Goal | Description |
| -- | -- |
| Surface hidden patterns | BSCs can identify repeat deficiency patterns that are not visible in any existing report. |
| Reduce time to insight | BSCs no longer need to manually export and pivot data to find problem line items. |
| Enable proactive correction | BSCs can identify and act on deficiency trends before clients raise them in QBRs. |
| Support QBR preparation | BSCs can export professional, client-ready deficiency data in PDF and CSV formats. |

### Success Metrics

| Metric | Target | Measurement | Timeframe |
| -- | -- | -- | -- |
| Report adoption | 40% of users with `read_reports` open the report at least once | Report page load events / eligible users | 60 days post-launch |
| Repeat usage | 25% of users who open the report return within 14 days | Unique users with 2+ sessions / total unique users | 90 days post-launch |
| Drill-down engagement | Average of 2+ drill-downs per session | Drill-down events / report sessions | 60 days post-launch |
| Export usage | 15% of sessions result in at least one export (PDF or CSV) | Export events / report sessions | 60 days post-launch |
| Reduction in manual analysis | Qualitative — gathered through customer interviews | Customer feedback | 90 days post-launch |

---

## 4. Feature Requirements

### 4.1 Entry View — Summary Cards

| ID | Requirement |
| -- | -- |
| ENT-001 | The entry view displays four summary cards above the line item table: Total Deficiencies, Total Inspected, Overall Deficiency Rate, and Line Items Tracked. |
| ENT-002 | Total Deficiencies shows the sum of all deficient inspection items across all line items meeting the current thresholds. |
| ENT-003 | Total Inspected shows the total inspection count, excluding items marked N/A. |
| ENT-004 | Overall Deficiency Rate shows Total Deficiencies / Total Inspected as a percentage, with a comparison to the prior equivalent period (e.g., "↑ 3% vs. prior period"). |
| ENT-005 | Line Items Tracked shows the count of line items currently meeting the configured repeat and minimum sample thresholds. |

### 4.2 Entry View — Line Item Table

| ID | Requirement |
| -- | -- |
| ENT-010 | The entry view displays a table where each row represents a unique line item, aggregated across all inspection forms and all areas. |
| ENT-011 | The table displays six columns: Line Item, # Deficient, # Total, % Deficient, Unique Areas, Avg Score, and Trend. |
| ENT-012 | Line Item displays the line item name. |
| ENT-013 | # Deficient displays the absolute count of deficient inspection items for that line item across all forms and areas. |
| ENT-014 | # Total displays the total number of times that line item was inspected across all forms and areas, excluding N/A responses. |
| ENT-015 | % Deficient displays the deficiency rate (# Deficient / # Total) as a percentage alongside a visual risk bar. |
| ENT-016 | Unique Areas displays the count of distinct areas where at least one deficiency occurred for that line item. |
| ENT-017 | Avg Score displays the average score of deficient instances only (not all instances). |
| ENT-018 | Trend displays a directional badge: ↑ Worsening (red), ↓ Improving (green), or — Flat (gray). See TRD requirements for calculation. |
| ENT-019 | The table defaults to sorting by % Deficient descending. |
| ENT-020 | All columns except Trend are sortable. Clicking a column header sorts by that column. |
| ENT-021 | The active sort column displays a directional arrow indicating sort direction (ascending or descending). |
| ENT-022 | Only line items meeting both the repeat threshold (default: 2+ deficiencies) and minimum sample threshold (default: 5+ total inspections) appear in the table. |
| ENT-023 | Only line items within the user's supervisory zone access appear in the table. |
| ENT-024 | Clicking any row navigates to the drill-down view for that line item (showing top-level areas). |
| ENT-025 | Rows highlight on hover to indicate clickability. |
| ENT-026 | The entry table paginates when the number of qualifying line items exceeds the page size. Page size is determined by engineering based on performance testing. |

### 4.3 Entry View — Defaults Banner

| ID | Requirement |
| -- | -- |
| CFG-001 | A persistent banner is displayed below the report header showing the current threshold settings in plain language (e.g., "Showing line items with 2+ deficiencies, 5+ inspections, flagging areas above 60% deficiency rate"). |
| CFG-002 | The banner displays an "Edit Defaults" button. |
| CFG-003 | Clicking "Edit Defaults" opens a modal with three configurable threshold inputs. |
| CFG-004 | The modal contains a Repeat Threshold input: minimum number of deficiencies for a line item to appear. Default: 2. |
| CFG-005 | The modal contains a Minimum Sample Size input: minimum number of total inspections for a line item to appear. Default: 5. |
| CFG-006 | The modal contains a High Risk Threshold input: deficiency rate (%) at or above which areas are flagged as HIGH RISK in the drill-down view. Default: 60. |
| CFG-007 | Each input displays helper text explaining what the setting controls. |
| CFG-008 | Clicking "Save" closes the modal and the report refreshes immediately with the new thresholds applied. |
| CFG-009 | Clicking "Cancel" closes the modal with no changes applied. |
| CFG-010 | All three threshold settings persist per-user across sessions. If a user changes a threshold, that value is retained until the user changes it again. |
| CFG-011 | The defaults banner text updates to reflect the current threshold values after a save. |

### 4.4 Filters

| ID | Requirement |
| -- | -- |
| FLT-001 | A "Filters" button is displayed in the report header toolbar. |
| FLT-002 | Clicking the Filters button opens a slide-out panel from the right side of the screen. |
| FLT-003 | The filter panel contains two sections: Areas and Inspection Forms. |
| FLT-004 | The Areas section displays a hierarchical tree of areas matching the user's supervisory zone access, with expand/collapse controls for parent areas. |
| FLT-005 | The Areas section includes a search field that filters the area tree by name. |
| FLT-006 | Areas are selectable via checkboxes. Selecting a parent area selects all its children. |
| FLT-007 | A parent area displays a partial-selection indicator when some but not all of its children are selected. |
| FLT-008 | The Areas section includes a "Clear" link that deselects all areas. |
| FLT-009 | The Inspection Forms section displays a flat list of all inspection forms available within the user's access, selectable via checkboxes. |
| FLT-010 | The Inspection Forms section includes a "Clear" link that deselects all forms. |
| FLT-011 | The panel footer displays "Apply Filters" and "Cancel" buttons. Clicking "Apply Filters" applies the selections and closes the panel. Clicking "Cancel" discards changes and closes the panel. |
| FLT-012 | The panel footer displays a "Clear all" link that resets all selections across both sections. |
| FLT-013 | When filters are active, pill badges appear below the report header showing the count of active selections (e.g., "3 areas selected", "2 forms selected") with a "Clear all" link. |
| FLT-014 | When filters are active, the Filters button displays the total active filter count (e.g., "Filters (5)"). |
| FLT-015 | Active filters apply to both the entry view and the drill-down view. If a user filters to specific areas and drills down, only data from those areas is shown. |
| FLT-016 | The date filter uses the existing OrangeQC date filter pattern. It defaults to the current period and respects the user's last selection. |

### 4.5 Drill-Down View — Navigation

| ID | Requirement |
| -- | -- |
| DDV-001 | The drill-down view is accessed by clicking a row in the entry table. |
| DDV-002 | Breadcrumb navigation is displayed at the top of the drill-down view. Initial format: "All Line Items / [Line Item Name]". |
| DDV-003 | When the user drills into an area, the breadcrumb extends to include the area path (e.g., "All Line Items / Floor Care / Riverside Medical / Building A"). |
| DDV-004 | Clicking any segment in the breadcrumb navigates back to that level. |
| DDV-005 | The browser back button navigates to the previous level in the drill-down hierarchy. |

### 4.6 Drill-Down View — Summary Cards

| ID | Requirement |
| -- | -- |
| DDV-010 | The drill-down view displays five summary cards scoped to the selected line item + form: # Deficient, # Total Inspected, Deficiency Rate, Unique Areas, and Avg Score. |
| DDV-011 | The Deficiency Rate card displays a trend badge (worsening, improving, or flat) based on the prior period comparison. |
| DDV-012 | The Unique Areas card displays context showing how many areas had deficiencies out of total areas inspected (e.g., "4 of 12 inspected"). |
| DDV-013 | The Avg Score card is labeled as a severity indicator and reflects the average score of deficient instances only. |

### 4.7 Drill-Down View — Trend Chart

| ID | Requirement |
| -- | -- |
| DDV-020 | The drill-down view displays a bar chart showing deficiency data over time. The chart spans the full width of the content area. |
| DDV-021 | The chart uses adaptive time bucketing: daily buckets for date ranges ≤7 days, weekly buckets for 8–60 days, monthly buckets for 61+ days. |
| DDV-022 | Each bar displays two layers: total inspections (light fill) and deficient count (contrasting overlay). |
| DDV-023 | A legend distinguishes the total inspections layer from the deficient count layer. |
| DDV-024 | The chart header displays the prior period comparison (e.g., "vs. prior period: ↑ 18% worse"). |

### 4.8 Drill-Down View — Area Concentration Table

| ID | Requirement |
| -- | -- |
| DDV-030 | The drill-down view displays an Area Concentration table below the trend chart. The table spans the full width of the content area. |
| DDV-031 | On initial drill-down from the entry view, the table displays only top-level areas where the selected line item was deficient. Sub-areas are not shown until the user drills deeper. |
| DDV-032 | The table defaults to sorting by % Deficient descending. |
| DDV-033 | The table displays five columns: Area, # Deficient, # Total, % Deficient, and Avg Score. |
| DDV-034 | The Area column displays the area name. Metrics for each area are aggregated totals including all of that area's sub-areas. |
| DDV-035 | Areas at or above the user's configured high risk threshold are flagged with a red "HIGH RISK" badge and a subtle red background tint on the row. |
| DDV-036 | Areas with sub-areas display a chevron (▸) indicating they can be clicked to drill into sub-areas. |
| DDV-037 | Clicking an area with sub-areas navigates into that area, showing only its direct children (sub-areas) in the table. The summary cards and trend chart update to reflect data scoped to the selected area and its descendants. |
| DDV-038 | Leaf areas (areas with no sub-areas) display an arrow (→) indicating they can be clicked to see inspection forms. |
| DDV-039 | Clicking a leaf area transitions the table from area comparison to inspection form comparison (see DDV-040). |

### 4.9 Drill-Down View — Inspection Form Comparison (Leaf Level)

| ID | Requirement |
| -- | -- |
| DDV-040 | When the user clicks a leaf area, the table switches from area comparison to inspection form comparison. |
| DDV-041 | The table header updates to "Inspection Forms at [Area Name]". |
| DDV-042 | The table displays five columns: Inspection Form, # Deficient, # Total, % Deficient, and Avg Score. |
| DDV-043 | Each row represents an inspection form assigned to that leaf area which contains the selected line item. |
| DDV-044 | This view allows the user to compare how the same line item performs across different inspection forms at that specific location (e.g., "Floor Care" deficiency rate on the Restroom Inspection form vs. the Office Inspection form at Building A Floor 2). |
| DDV-045 | Inspection forms at or above the user's configured high risk threshold are flagged with a red "HIGH RISK" badge. |
| DDV-046 | Inspection form rows are not clickable — this is the terminal level of the drill-down. |
| DDV-047 | The breadcrumb shows the full path to the leaf area (e.g., "All Line Items / Floor Care / Riverside Medical / Building A / Floor 2"). |
| DDV-048 | The summary cards at the leaf level display: # Deficient, # Total, Deficiency Rate, Forms (count of inspection forms with the line item at this area), and Avg Score. |

### 4.10 Drill-Down View — Mixed Areas and Forms

| ID | Requirement |
| -- | -- |
| DDV-050 | When an area has both sub-areas AND inspection forms directly assigned to it, the drill-down view displays two separate tables stacked vertically. |
| DDV-051 | The sub-areas table is displayed first, followed by the inspection forms table. |
| DDV-052 | The sub-areas table header displays "Sub-Areas of [Area Name] ([count])". |
| DDV-053 | The inspection forms table header displays "Inspection Forms at [Area Name] ([count])". |
| DDV-054 | Each table paginates independently. Pagination controls appear only if that table has 11+ items. Default page size is 10. |
| DDV-055 | Sub-area rows display aggregated metrics (deficiencies, totals, rates) that include all descendants of that sub-area. |
| DDV-056 | Inspection form rows display metrics specific to that form at the current area only (not including sub-areas). |
| DDV-057 | Sub-areas remain clickable (▸ for areas with children, → for leaf areas). Inspection form rows are not clickable. |
| DDV-058 | If an area has only sub-areas (no direct forms), only the sub-areas table is shown. If an area has only forms (leaf area), only the forms table is shown. |
| DDV-059 | The summary cards at a mixed level display metrics aggregated across all sub-areas and direct forms combined. |

### 4.11 Trend Calculation

| ID | Requirement |
| -- | -- |
| TRD-001 | The trend badge compares the deficiency rate of the current selected period to the deficiency rate of the equivalent prior period (e.g., viewing January compares to December; viewing Q1 compares to prior Q4). |
| TRD-002 | The comparison uses deficiency rate (not absolute count). |
| TRD-003 | Worsening (↑, red): current period rate is more than 5 percentage points above prior period rate. |
| TRD-004 | Improving (↓, green): current period rate is more than 5 percentage points below prior period rate. |
| TRD-005 | Flat (—, gray): difference between current and prior period rate is within ±5 percentage points. |
| TRD-006 | The 5-percentage-point threshold is hardcoded and not user-configurable. |
| TRD-007 | If no inspection data exists for the prior equivalent period, the trend badge is not displayed. |

### 4.12 Shared UI Components

#### Risk Bar

| ID | Requirement |
| -- | -- |
| UI-001 | The % Deficient column in both the entry table and the area concentration table displays a horizontal risk bar alongside the percentage value. |
| UI-002 | The risk bar is color-coded: red at or above the user's high risk threshold (default 60%), amber from 35% to below the threshold, green below 35%. |

#### Empty States

| ID | Requirement |
| -- | -- |
| UI-010 | When no line items have deficiencies in the selected date range, the entry view displays: "No deficient line items found for [date range]. Adjust the date range or threshold to see results." |
| UI-011 | When no line items meet the configured thresholds, the entry view displays: "No line items have [X]+ deficiencies with [Y]+ inspections in this period. Try lowering the threshold." |
| UI-012 | When the user has no inspection data at all (zero areas or zero inspections), the entry view displays: "No inspection data available for your areas. Inspections must be completed before deficiency data can be reported." |
| UI-013 | The Export button is disabled when there is no data to export. |

---

## 5. Platform Requirements

### 5.1 Web

#### Viewing Reports

| ID | View | What's Being Built |
| -- | -- | -- |
| WEB-001 | Deficient Line Item Report — Entry View | Net new. Sortable line item table with summary cards, defaults banner, filter panel, and export modal. |
| WEB-002 | Deficient Line Item Report — Drill-Down View | Net new. Single line item detail with summary cards, trend chart, area concentration table, and export modal. |
| WEB-003 | Edit Defaults Modal | Net new. Three-threshold configuration modal accessible from the defaults banner. |
| WEB-004 | Filter Panel | Net new. Slide-out panel with hierarchical area tree and inspection form list. |
| WEB-005 | Export Modal | Net new. Format selection (PDF/CSV) with section checkboxes for PDF. Pilots unified export pattern. |

#### Not Required on Web

| ID | Requirement |
| -- | -- |
| WEB-010 | No inline editing of inspection data from this report is required. This is a read-only reporting view. |

### 5.2 iOS

| ID | Requirement |
| -- | -- |
| IOS-001 | The Deficient Line Item Report is not required on iOS. This is a desk-based reporting tool for operations leaders. |

### 5.3 Android

| ID | Requirement |
| -- | -- |
| AND-001 | The Deficient Line Item Report is not required on Android. This is a desk-based reporting tool for operations leaders. |

### 5.4 Platform Parity

| ID | Requirement |
| -- | -- |
| PAR-001 | No parity requirements. This feature is web-only. iOS and Android are not affected. |

---

## 6. Export Requirements

### PDF Export

| ID | Requirement |
| -- | -- |
| PDF-001 | User can export a PDF from both the entry view and the drill-down view via the Export modal. |
| PDF-002 | The Export modal presents a "PDF" format option. When selected, the user is shown checkboxes for available sections. |
| PDF-003 | Entry view PDF sections: Summary Cards, Line Item Table. Both are selected by default. |
| PDF-004 | Drill-down view PDF sections: Summary Cards, Trend Chart, Area Concentration Table. All are selected by default. |
| PDF-005 | The generated PDF includes only the sections the user selected. |
| PDF-006 | The PDF is branded with the account logo (existing OrangeQC branding pattern). |
| PDF-007 | The PDF displays the date range, generation timestamp, and current threshold settings. |
| PDF-008 | The PDF reflects the current report state including all active filters and sort order. |
| PDF-009 | A drill-down PDF exports the currently viewed line item only. There is no option to batch-export multiple drill-downs in a single PDF. |
| PDF-010 | This report pilots the unified export pattern (user selects sections, single file generated). If engineering determines this adds significant scope, fall back to the existing per-section export pattern for launch and retrofit the unified pattern later. |

### CSV Export

| ID | Requirement |
| -- | -- |
| CSV-001 | User can export a CSV from both the entry view and the drill-down view via the Export modal. |
| CSV-002 | The Export modal presents a "CSV" format option. When selected, no section selection is shown — the export always contains the full dataset matching current filters. |
| CSV-003 | The CSV exports one row per individual inspection item at inspection-level grain (not aggregated). |
| CSV-004 | The CSV contains nine columns: Line Item, Inspection Form, Area (Full Path), Area (Top Level), Inspection Date, Score, Deficient (Yes/No), Inspector, Comment. |
| CSV-005 | Area (Full Path) displays the full hierarchy path (e.g., "Client A / Building 3 / Floor 2"). |
| CSV-006 | Area (Top Level) displays only the top-level area name for easy pivoting. |
| CSV-007 | The CSV respects the current date range, threshold filters, and area/form filters. |
| CSV-008 | The CSV does not include summary card metrics. Users can derive these from the raw data. |
| CSV-009 | The export modal displays a description of the CSV contents and the current filter context before download. |

### Email Notifications

Not applicable for V1. Proactive alerting (which would include email notifications) is scoped to V1.1.

---

## 7. Backwards Compatibility Requirements

**Not applicable.** This is a net new, web-only report. There is no existing feature being modified, no mobile implementation, and no prior data format being changed. Users on any version of the mobile app are unaffected because this feature does not exist on mobile.

The existing Overall Report behavior is unchanged. The summary of lowest/highest scoring line items remains in the Overall Report.

---

## 8. User Flows

### Flow 1: User Views the Entry Report

**Entry point:** User clicks "Deficient Line Item Report" from the Reports menu.

1. Report loads with the entry view: defaults banner, summary cards, and line item table.
2. The defaults banner displays current threshold settings (e.g., "Showing line items with 2+ deficiencies, 5+ inspections, flagging areas above 60% deficiency rate").
3. Summary cards display account-wide metrics.
4. Line item table displays all qualifying rows sorted by % Deficient descending.
5. User scans the table to identify the highest-deficiency line items.
6. User optionally clicks a column header to re-sort.

**Edge cases:**

* No data exists for the user's areas → UI-012 empty state is shown.
* No line items meet the thresholds → UI-011 empty state is shown.
* No deficiencies in the date range → UI-010 empty state is shown.

---

### Flow 2: User Drills Down into a Line Item

**Entry point:** User clicks a row in the entry table.

 1. Drill-down view loads for the selected line item.
 2. Breadcrumb displays: "All Line Items / [Line Item Name]".
 3. Summary cards display metrics scoped to this line item (aggregated across all areas and all forms).
 4. Trend chart displays deficiency data over time (aggregated across all areas and forms).
 5. Area Concentration table displays **top-level areas only** where this line item was deficient, sorted by % Deficient descending.
 6. Areas with sub-areas show a chevron (▸). Leaf areas (no sub-areas) show an arrow (→).
 7. User identifies which top-level areas have the highest deficiency rate and which are flagged HIGH RISK.
 8. User clicks a top-level area (e.g., "Riverside Medical ▸").
 9. View updates based on what exists at Riverside Medical:
    * **If only sub-areas:** Single table "Sub-Areas of Riverside Medical (3)" showing Building A, Building B, etc.
    * **If only forms:** Single table "Inspection Forms at Riverside Medical (2)" — this area is a leaf.
    * **If both sub-areas AND forms:** Two stacked tables — "Sub-Areas of Riverside Medical (3)" first, then "Inspection Forms at Riverside Medical (2)" below it.
10. In the mixed scenario, sub-area metrics are rolled up (include all descendants). Form metrics are specific to that form at the current area only.
11. User continues drilling through the area hierarchy as needed (sub-area → sub-sub-area → etc.).
12. When user reaches a leaf area (no sub-areas), only the inspection forms table is shown.
13. Inspection form rows are not clickable — this is the terminal data.
14. User clicks any breadcrumb segment to navigate back up the hierarchy, or clicks "All Line Items" to return to the entry view.

**Edge cases:**

* User navigates directly to a drill-down URL for a line item that doesn't meet thresholds → redirect to entry view.
* User changes date range while on drill-down and line item no longer qualifies → return to entry view with a message.
* Leaf area has only one inspection form → table shows single row.
* Table has 11+ items → pagination controls appear (10 per page).

---

### Flow 3: User Edits Default Thresholds

**Entry point:** User clicks "Edit Defaults" on the defaults banner.

1. Modal opens with three threshold inputs pre-populated with current values.
2. User adjusts one or more thresholds (e.g., lowers repeat threshold from 2 to 1).
3. User clicks "Save".
4. Modal closes. Report refreshes immediately with new thresholds applied.
5. Defaults banner text updates to reflect the new values.
6. New threshold values persist for this user across future sessions.

**Edge cases:**

* User clicks "Cancel" → modal closes, no changes applied.
* User changes thresholds while on the drill-down view and the current line item no longer qualifies → user is returned to the entry view with a message.

---

### Flow 4: User Filters the Report

**Entry point:** User clicks the "Filters" button in the report header.

1. Filter panel slides out from the right.
2. User expands area tree and selects specific areas (or uses search to find them).
3. User selects specific inspection forms.
4. User clicks "Apply Filters".
5. Panel closes. Report refreshes showing only data matching the selected areas and forms.
6. Filter pill badges appear below the header (e.g., "3 areas selected", "2 forms selected").
7. Filters button updates to show count (e.g., "Filters (5)").

**Edge cases:**

* User applies filters and then drills down → drill-down data is also filtered.
* User clicks "Cancel" in the panel → panel closes, no changes applied.
* User clicks "Clear all" in pill badges → all filters removed, report shows full dataset.

---

### Flow 5: User Exports PDF from Entry View

**Entry point:** User clicks "Export" in the report header.

1. Export modal opens with format options: PDF and CSV.
2. User selects PDF.
3. Modal displays section checkboxes: Summary Cards (checked), Line Item Table (checked).
4. User optionally unchecks sections they don't want.
5. User clicks "Export".
6. PDF is generated and downloaded. It includes the selected sections, branded with account logo, showing the date range and current thresholds.

**Edge cases:**

* No data to export → Export button is disabled (UI-013).

---

### Flow 6: User Exports PDF from Drill-Down View

**Entry point:** User clicks "Export" in the drill-down view header.

1. Export modal opens with format options: PDF and CSV.
2. User selects PDF.
3. Modal displays section checkboxes: Summary Cards (checked), Trend Chart (checked), Area Concentration Table (checked).
4. User optionally unchecks sections.
5. User clicks "Export".
6. PDF is generated and downloaded for the currently viewed line item only.

---

### Flow 7: User Exports CSV

**Entry point:** User clicks "Export" from either the entry view or drill-down view.

1. Export modal opens.
2. User selects CSV.
3. Modal displays a description of the CSV contents (one row per inspection item, nine columns) and the current filter context.
4. User clicks "Export".
5. CSV file is generated and downloaded containing the full dataset matching current filters.

---

## 9. UI Mockups

### 9.1 Entry View

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Deficient Line Item Report                  [Date Filter ▼] [Filters] [Export] │
│                                                                              │
│  ┌─ Defaults Banner ───────────────────────────────────────────────────────┐ │
│  │ Showing line items with 2+ deficiencies, 5+ inspections,               │ │
│  │ flagging areas above 60% deficiency rate.              [Edit Defaults] │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ Total Defic. │ │ Total Insp.  │ │ Overall Rate │ │ Line Items   │       │
│  │    847       │ │   4,231      │ │   20.0%      │ │    34        │       │
│  │              │ │              │ │  ↑ 2% vs pri │ │  tracked     │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                              │
│  ┌────────────────┬───────┬───────┬────────────────┬───────┬───────┬──────┐ │
│  │ Line Item      │ # Def │ # Tot │ % Deficient  ▼ │ Areas │ Avg   │ Tren │ │
│  ├────────────────┼───────┼───────┼────────────────┼───────┼───────┼──────┤ │
│  │ Floor Care     │   42  │   58  │ 72.4% ████████ │   8   │ 34.2% │ ↑    │ │
│  │                │       │       │           [RED]│       │       │      │ │
│  ├────────────────┼───────┼───────┼────────────────┼───────┼───────┼──────┤ │
│  │ Trash Removal  │   31  │   52  │ 59.6% ███████  │   5   │ 45.1% │ —    │ │
│  │                │       │       │        [AMBER] │       │       │      │ │
│  ├────────────────┼───────┼───────┼────────────────┼───────┼───────┼──────┤ │
│  │ Restroom Suppl │   18  │   67  │ 26.9% ████     │   3   │ 62.0% │ ↓    │ │
│  │                │       │       │        [GREEN] │       │       │      │ │
│  └────────────────┴───────┴───────┴────────────────┴───────┴───────┴──────┘ │
│                                                                              │
│                          [ ◀ 1  2  3 ▶ ]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Drill-Down View (Top-Level Areas)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◀ All Line Items / Floor Care                                              │
│                                                    [Date Filter ▼] [Export]  │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────┐ ┌──────────┐    │
│  │ # Defic. │ │ # Total  │ │ Defic. Rate   │ │ Areas    │ │ Avg Score│    │
│  │   42     │ │   58     │ │  72.4%  ↑     │ │ 4 of 8   │ │  34.2%   │    │
│  │          │ │          │ │  worsening    │ │ w/ defic │ │ severity │    │
│  └──────────┘ └──────────┘ └───────────────┘ └──────────┘ └──────────┘    │
│                                                                              │
│  Trend                                        vs. prior period: ↑ 18% worse │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  12│       ░░░                                                           ││
│  │  10│  ░░░  ███       ░░░                                                ││
│  │   8│  ███  ███  ░░░  ███  ░░░                    ░░░                    ││
│  │   6│  ███  ███  ███  ███  ███  ░░░  ░░░  ░░░    ███                    ││
│  │   4│  ███  ███  ███  ███  ███  ███  ███  ███    ███                    ││
│  │   2│  ███  ███  ███  ███  ███  ███  ███  ███    ███                    ││
│  │   0└──W1───W2───W3───W4───W5───W6───W7───W8─────W9──                   ││
│  │                                                                          ││
│  │  ░░░ Total Inspected    ███ Deficient                                   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Area Concentration (Top-Level Areas)                                        │
│  ┌──────────────────────┬────────┬────────┬─────────────────────────┬───────┐│
│  │ Area                 │ # Def  │ # Tot  │ % Deficient           ▼ │ Avg   ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Riverside Medical ▸  │   18   │   20   │ 90.0% ████████████████  │ 22.5% ││
│  │  [HIGH RISK]         │        │        │                  [RED]  │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Greenfield Office ▸  │   12   │   18   │ 66.7% ████████████      │ 38.0% ││
│  │  [HIGH RISK]         │        │        │                  [RED]  │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ City Hall Annex   ▸  │    8   │   14   │ 57.1% ██████████        │ 41.3% ││
│  │                      │        │        │               [AMBER]   │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Lincoln Elementary → │    4   │   16   │ 25.0% ████              │ 55.0% ││
│  │                      │        │        │               [GREEN]   │       ││
│  └──────────────────────┴────────┴────────┴─────────────────────────┴───────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.2.1 Drill-Down View — Sub-Area Level

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◀ All Line Items / Floor Care / Riverside Medical                          │
│                                                    [Date Filter ▼] [Export]  │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────┐ ┌──────────┐    │
│  │ # Defic. │ │ # Total  │ │ Defic. Rate   │ │ Areas    │ │ Avg Score│    │
│  │   18     │ │   22     │ │  81.8%  ↑     │ │ 3 of 4   │ │  18.5%   │    │
│  │          │ │          │ │  worsening    │ │ inspected│ │ severity │    │
│  └──────────┘ └──────────┘ └───────────────┘ └──────────┘ └──────────┘    │
│                                                                              │
│  Trend (Riverside Medical)                    vs. prior period: ↑ 22% worse │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  [Chart showing trend data scoped to Riverside Medical only]            ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Sub-Areas of Riverside Medical                                              │
│  ┌──────────────────────┬────────┬────────┬─────────────────────────┬───────┐│
│  │ Area                 │ # Def  │ # Tot  │ % Deficient           ▼ │ Avg   ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Building A        ▸  │   10   │   11   │ 90.9% ████████████████  │ 12.0% ││
│  │  [HIGH RISK]         │        │        │                  [RED]  │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Building B        ▸  │    6   │    8   │ 75.0% █████████████     │ 22.5% ││
│  │  [HIGH RISK]         │        │        │                  [RED]  │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Parking Garage       │    2   │    3   │ 66.7% ██████████        │ 35.0% ││
│  │  [HIGH RISK]         │        │        │                  [RED]  │       ││
│  └──────────────────────┴────────┴────────┴─────────────────────────┴───────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.2.2 Drill-Down View — Mixed Scenario (Sub-Areas + Inspection Forms)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◀ All Line Items / Floor Care / Riverside Medical                          │
│                                                    [Date Filter ▼] [Export]  │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────┐ ┌──────────┐    │
│  │ # Defic. │ │ # Total  │ │ Defic. Rate   │ │ Areas    │ │ Avg Score│    │
│  │   22     │ │   28     │ │  78.6%  ↑     │ │ 4 of 5   │ │  21.2%   │    │
│  │          │ │          │ │  worsening    │ │ w/ defic │ │ severity │    │
│  └──────────┘ └──────────┘ └───────────────┘ └──────────┘ └──────────┘    │
│                                                                              │
│  Trend (Riverside Medical)                    vs. prior period: ↑ 22% worse │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  [Chart showing trend data scoped to Riverside Medical]                 ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Sub-Areas of Riverside Medical (3)                                          │
│  ┌──────────────────────┬────────┬────────┬─────────────────────────┬───────┐│
│  │ Area                 │ # Def  │ # Tot  │ % Deficient           ▼ │ Avg   ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Building A        ▸  │   10   │   11   │ 90.9% ████████████████  │ 12.0% ││
│  │  [HIGH RISK]         │        │        │       (rolled up) [RED] │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Building B        ▸  │    6   │    8   │ 75.0% █████████████     │ 22.5% ││
│  │  [HIGH RISK]         │        │        │       (rolled up) [RED] │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Parking Garage    →  │    2   │    3   │ 66.7% ██████████        │ 35.0% ││
│  │  [HIGH RISK]         │        │        │       (rolled up) [RED] │       ││
│  └──────────────────────┴────────┴────────┴─────────────────────────┴───────┘│
│                                                                              │
│  Inspection Forms at Riverside Medical (2)                                   │
│  ┌──────────────────────┬────────┬────────┬─────────────────────────┬───────┐│
│  │ Inspection Form      │ # Def  │ # Tot  │ % Deficient           ▼ │ Avg   ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Campus-Wide Inspect  │    3   │    4   │ 75.0% █████████████     │ 18.0% ││
│  │  [HIGH RISK]         │        │        │    (this area only)[RED]│       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Exterior Grounds     │    1   │    2   │ 50.0% ████████          │ 42.0% ││
│  │                      │        │        │    (this area only)     │       ││
│  └──────────────────────┴────────┴────────┴─────────────────────────┴───────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.2.3 Drill-Down View — Leaf Level (Inspection Form Comparison)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◀ All Line Items / Floor Care / Riverside Medical / Parking Garage         │
│                                                    [Date Filter ▼] [Export]  │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────┐ ┌──────────┐    │
│  │ # Defic. │ │ # Total  │ │ Defic. Rate   │ │ Forms    │ │ Avg Score│    │
│  │    2     │ │    3     │ │  66.7%  ↑     │ │   2      │ │  35.0%   │    │
│  │          │ │          │ │  worsening    │ │ assigned │ │ severity │    │
│  └──────────┘ └──────────┘ └───────────────┘ └──────────┘ └──────────┘    │
│                                                                              │
│  Trend (Parking Garage)                       vs. prior period: ↑ 12% worse │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  [Chart showing trend data scoped to Parking Garage only]               ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Inspection Forms at Parking Garage                                          │
│  ┌──────────────────────┬────────┬────────┬─────────────────────────┬───────┐│
│  │ Inspection Form      │ # Def  │ # Tot  │ % Deficient           ▼ │ Avg   ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ Restroom Inspection  │    2   │    2   │ 100.0% ████████████████ │ 28.0% ││
│  │  [HIGH RISK]         │        │        │                  [RED]  │       ││
│  ├──────────────────────┼────────┼────────┼─────────────────────────┼───────┤│
│  │ General Cleaning     │    0   │    1   │ 0.0%                    │  N/A  ││
│  │                      │        │        │               [GREEN]   │       ││
│  └──────────────────────┴────────┴────────┴─────────────────────────┴───────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Edit Defaults Modal

```
┌─────────────────────────────────────────────────┐
│  Edit Report Defaults                        ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Repeat Threshold                               │
│  Minimum deficiencies to appear in the report   │
│  ┌──────┐                                       │
│  │  2   │ + deficiencies                        │
│  └──────┘                                       │
│                                                 │
│  Minimum Sample Size                            │
│  Minimum inspections to appear in the report    │
│  ┌──────┐                                       │
│  │  5   │ + inspections                         │
│  └──────┘                                       │
│                                                 │
│  High Risk Threshold                            │
│  Areas at or above this rate are flagged        │
│  ┌──────┐                                       │
│  │  60  │ % deficiency rate                     │
│  └──────┘                                       │
│                                                 │
├─────────────────────────────────────────────────┤
│                          [Cancel]  [Save]       │
└─────────────────────────────────────────────────┘
```

### 9.4 Filter Panel (Slide-Out)

```
                              ┌─────────────────────────────────────┐
                              │  Filters                         ✕  │
                              ├─────────────────────────────────────┤
                              │                                     │
                              │  AREAS                      Clear   │
                              │  ┌───────────────────────────────┐  │
                              │  │ Search areas...               │  │
                              │  └───────────────────────────────┘  │
                              │                                     │
                              │  ☑ Riverside Medical          ▾     │
                              │     ☑ Building A                    │
                              │     ☑ Building B                    │
                              │     ☐ Building C                    │
                              │  ☐ Greenfield Office Park     ▸     │
                              │  ☑ City Hall Annex            ▸     │
                              │  ☐ Lincoln Elementary         ▸     │
                              │                                     │
                              │  ─────────────────────────────────  │
                              │                                     │
                              │  INSPECTION FORMS              Clear │
                              │                                     │
                              │  ☑ Restroom Inspection              │
                              │  ☑ Nightly Cleaning Checklist       │
                              │  ☐ Weekly Deep Clean                │
                              │  ☐ Monthly Safety Audit             │
                              │                                     │
                              ├─────────────────────────────────────┤
                              │  Clear all                          │
                              │           [Cancel]  [Apply Filters] │
                              └─────────────────────────────────────┘
```

### 9.5 Export Modal — PDF (Entry View)

```
┌─────────────────────────────────────────────────┐
│  Export Report                                ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Format                                         │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  ● PDF       │  │  ○ CSV       │             │
│  └──────────────┘  └──────────────┘             │
│                                                 │
│  Include in PDF:                                │
│                                                 │
│  ☑ Summary Cards                                │
│    Total deficiencies, inspections, rate,        │
│    line items tracked                           │
│                                                 │
│  ☑ Line Item Table                              │
│    All line items with deficiency rates,        │
│    unique areas, and trends                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                          [Cancel]  [Export]      │
└─────────────────────────────────────────────────┘
```

### 9.6 Export Modal — CSV

```
┌─────────────────────────────────────────────────┐
│  Export Report                                ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Format                                         │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  ○ PDF       │  │  ● CSV       │             │
│  └──────────────┘  └──────────────┘             │
│                                                 │
│  CSV Export                                     │
│                                                 │
│  One row per inspection item. Includes:         │
│  Line Item, Inspection Form, Area (Full Path),  │
│  Area (Top Level), Inspection Date, Score,      │
│  Deficient, Inspector, Comment                  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Jan 1 – Jan 31, 2026                     │  │
│  │ 2+ deficiencies · 5+ inspections         │  │
│  │ 3 areas · 2 forms                        │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│                          [Cancel]  [Export]      │
└─────────────────────────────────────────────────┘
```

### 9.7 Active Filters — Pill Badges

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Deficient Line Item Report          [Date Filter ▼] [Filters (5)] [Export]  │
│                                                                              │
│  [ 3 areas selected ✕ ]  [ 2 forms selected ✕ ]  Clear all                  │
│                                                                              │
│  ┌─ Defaults Banner ─────────────────────────────────────────────────────┐  │
│  │ ...                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
```

### 9.8 PDF Export Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [Account Logo]                                  [OrangeQC Logo] │
│                                                                  │
│  DEFICIENT LINE ITEM REPORT                                      │
│  Jan 1, 2026 – Jan 31, 2026                                     │
│  Defaults: 2+ deficiencies, 5+ inspections, 60% high risk       │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ Total Def. │ │ Total Insp │ │ Overall %  │ │ Line Items │   │
│  │    847     │ │   4,231    │ │   20.0%    │ │     34     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  ┌──────────────┬──────┬──────┬───────────┬──────┬──────┬─────┐ │
│  │ Line Item    │ #Def │ #Tot │ %Deficient│ Areas│ Avg  │Trend│ │
│  ├──────────────┼──────┼──────┼───────────┼──────┼──────┼─────┤ │
│  │ Floor Care   │  42  │  58  │ 72.4% ███ │   8  │34.2% │  ↑  │ │
│  │ Restroom Ins │      │      │           │      │      │     │ │
│  ├──────────────┼──────┼──────┼───────────┼──────┼──────┼─────┤ │
│  │ ...          │      │      │           │      │      │     │ │
│  └──────────────┴──────┴──────┴───────────┴──────┴──────┴─────┘ │
│                                                                  │
│  ───────────────────────────────────────────────────────────────  │
│  Page 1 of 2                    Generated Feb 2, 2026 at 3:14pm  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.9 CSV Export — Sample Data

```
Line Item,Inspection Form,Area (Full Path),Area (Top Level),Inspection Date,Score,Deficient,Inspector,Comment
Floor Care,Restroom Inspection,"Riverside Medical / Bldg A / Floor 2",Riverside Medical,2026-01-15,25.0%,Yes,Maria Lopez,Floors not mopped in east wing
Floor Care,Restroom Inspection,"Riverside Medical / Bldg A / Floor 3",Riverside Medical,2026-01-15,50.0%,Yes,Maria Lopez,Partial completion
Floor Care,Restroom Inspection,"Greenfield Office / Bldg B",Greenfield Office,2026-01-16,0.0%,Yes,James Park,Not performed
Floor Care,Restroom Inspection,"City Hall Annex / Main",City Hall Annex,2026-01-17,100.0%,No,Sarah Kim,
Trash Removal,Nightly Cleaning,"Riverside Medical / Bldg A / Floor 2",Riverside Medical,2026-01-15,0.0%,Yes,Maria Lopez,Bins overflowing
```

---

## 10. Edge Cases & Business Rules

### Data Rules

| Scenario | Behavior |
| -- | -- |
| Line item has only N/A responses | Excluded entirely. N/A items are excluded from totals, so zero total inspections = does not appear. |
| Line item has 1 deficiency (below default threshold) | Not shown at default 2+ threshold. Appears if user lowers threshold to 1+. |
| All deficiencies for a line item are at deleted areas | Excluded. Deleted structures (`deleted_at IS NOT NULL`) are filtered from the report. |
| Line item exists on a deleted form | Still appears. Inspection data from deleted forms is valid historical data. Form name displays as-is. |
| 100% deficiency rate with very low sample (e.g., 2/2) | Minimum sample threshold (default 5+) filters these out. If user lowers threshold, they appear with full context (# Total visible). |
| Date range returns zero inspections | Empty state with guidance to adjust date range (UI-010). |

### Permission Rules

| Scenario | Behavior |
| -- | -- |
| User has `read_reports` = false | Report is not accessible. User does not see it in the reports menu. |
| User's supervisory zone changes mid-period | Report reflects current access at time of viewing. Historical data outside current access is not shown. |
| Admin user with full access | Sees all data across all areas. No area filtering applied. |

### Interaction Rules

| Scenario | Behavior |
| -- | -- |
| User changes date range while on drill-down view | Drill-down refreshes. If the line item no longer meets thresholds, user is returned to entry view with a message. |
| User changes thresholds while on drill-down view | Same behavior as date range change. |
| User navigates directly to a drill-down URL | If line item exists and meets thresholds, display normally. Otherwise redirect to entry view. |
| User has no data and clicks Export | Export button is disabled when there is no data to export (UI-013). |
| Prior period has no inspection data | Trend badge is not displayed (TRD-007). |

---

## 11. Out of Scope

| Item | Rationale | Future Plan |
| -- | -- | -- |
| Proactive alerting (JTBD 5) | Requires notification infrastructure, threshold tuning, and alert fatigue prevention. Significant additional scope. | V1.1 — fast follow. Edit Defaults modal is designed to accommodate alerting config. |
| Attribution to people (cleaners, teams, managers) | System does not currently track who is responsible for a specific area at a given time. Requires data model changes. | Future iteration |
| Custom comparison period selection | Prior equivalent period covers the primary use case. Custom selection adds UI and query complexity. | V1.1 — alongside alerting |
| Drill-down by inspection form | Line items are grouped by `line_item_id` + `inspection_form_id`, so form is already implicit. A separate form drill-down is redundant. | Permanently out unless grouping strategy changes |
| Connected actions (create ticket, assign corrective action) | V1 is about surfacing insight. Workflow integration adds significant scope and requires a new interaction pattern. | Future iteration |
| Corrective action logging | Record what corrective action was taken for a deficiency pattern and resurface it if the pattern re-emerges. Requires new data entity and association model. High-value differentiator. | V2 |
| Mobile (iOS/Android) | Desk-based reporting tool for operations leaders. Mobile is not the right context. | No current plans |
| Excel/XLSX export | Current system supports CSV only. No Excel export infrastructure exists. | No current plans |

---

## 12. Constraints & Dependencies

| Constraint / Dependency | Type | Notes |
| -- | -- | -- |
| Existing `read_reports` permission | Dependency | Report visibility and access rely on this existing permission. No new permissions are being created. |
| Supervisory zone access control | Dependency | Report data scoping relies on the existing supervisory zone model. |
| Existing date filter pattern | Dependency | Report uses the established OrangeQC date filter component. |
| Existing account branding (logo) | Dependency | PDF export uses the existing account logo branding pattern. |
| No Excel export infrastructure | Technical constraint | Only CSV is supported. Excel/XLSX is not available. |
| Pagination page size | Engineering decision | Page size for the entry table is TBD based on performance testing with representative data volumes. |
| Per-user preference storage | Engineering decision | Storage approach for persisting the three threshold settings per-user is TBD. |
| Pre-aggregation strategy | Engineering decision | Engineering to determine if real-time aggregation is performant or if materialized views / background pre-computation are needed. |
| Unified PDF export scope | Engineering decision | If section-selection PDF generation adds significant scope, fall back to per-section export and retrofit later (PDF-010). |
| Trend chart rendering in PDF | Engineering decision | Approach for rendering the trend chart as a static image within the PDF is TBD. |

---

## 13. Release Plan

### V1 — Single Phase

All requirements in this PRD ship together as a single release. There is no phased rollout.

**Deliverables:**

* Entry view with summary cards, sortable line item table, and defaults banner
* Edit Defaults modal with three configurable thresholds (per-user persistence)
* Drill-down view with summary cards, trend chart, and area concentration table
* Filter panel with hierarchical area tree and inspection form list
* Export modal with PDF (section selection) and CSV
* Trend calculation (5-percentage-point hardcoded threshold)
* Empty states for all no-data scenarios
* Pagination for large datasets

### V1.1 — Fast Follow (not in this PRD)

* Proactive alerting with threshold configuration
* Custom comparison period selection
* Alerting config added to the Edit Defaults modal

---

## 14. Open Questions

| # | Question | Status | Notes |
| -- | -- | -- | -- |
| 1 | Pagination page size for the entry table | Open | Engineering to determine based on performance testing with 500+ qualifying line items. |
| 2 | Storage approach for per-user threshold preferences | Open | Existing user preferences table or new key-value store. Engineering decision during gameplan. |
| 3 | Pre-aggregation vs. real-time query | Open | Engineering to assess query performance and determine if materialized views or background computation are needed. |
| 4 | Unified PDF export effort | Open | If section-selection PDF generation is high-effort, fall back to per-section export (PDF-010). |
| 5 | Trend chart rendering in PDF | Open | Engineering to determine approach for rendering the chart as a static image in the PDF. |

---

## 15. Appendix

### A. Reference Documents

* **Framing Document:** [Deficient Line Item Report — Framing Document] — Problem definition and JTBD analysis.
* **Shaping Document:** [Deficient Line Item Report — Shaping Document] — Solution discovery, scope decisions, and open question resolution.
* **Interactive Mockups:** [Deficient Line Item Report — React JSX Mockup] — Clickable prototype demonstrating all views, modals, filter panel, export modal, and PDF preview.

### B. Existing Report Context

The Overall Report currently contains a small summary section showing the lowest and highest scoring line items. This section is not being modified. The Deficient Line Item Report is an entirely separate, net new report. Users access it from the Reports menu as a distinct entry.

### C. Key Data Definitions

* **Deficient:** A line item inspection result where the score falls below the passing threshold defined on the inspection form.
* **N/A:** A line item marked as not applicable (`not_applicable_at` is set). Excluded from all counts and calculations.
* **Deficiency Rate:** # Deficient / # Total (excluding N/A). Expressed as a percentage.
* **Prior Equivalent Period:** The time period of equal length immediately preceding the selected date range (e.g., January → December, Q1 → prior Q4).
* **Supervisory Zone:** The access control model that determines which areas a user can see. All report data is scoped to the user's zones.
