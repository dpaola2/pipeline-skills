# Implementation Progress — area-tree-type-headers

| Field | Value |
|-------|-------|
| **Branch** | `pipeline/area-tree-type-headers` |
| **Rails repo** | `~/projects/orangeqc/orangeqc/` |
| **Milestones** | M0–M2 |

## Milestone Status

| Milestone | Description | Status |
|-----------|-------------|--------|
| M0 | Discovery & Alignment | Complete (Stages 1-3) |
| M1 | Section Headers, Icons & Stimulus Updates | **Complete** |
| M2 | QA Test Data | **Complete** |

---

## M1: Section Headers, Icons & Stimulus Updates

**Status:** Complete
**Date:** 2026-02-06
**Commit:** `cebc815`

### Files Modified
- `app/models/inspection_forms_structures.rb` — Added `.surveys` scope (one line, mirrors `.non_surveys`)
- `app/views/setup/structures/_structure_node.html.erb` — Replaced flat checklists/forms lists with three conditional section wrappers (Inspections, Surveys, Checklists) with headers and Stimulus targets
- `app/views/setup/inspection_form_assignments/_inspection_form_assignment.html.erb` — Added conditional icon: `fa-poll-h` for surveys, `fa-file-alt` for inspections via `is_a?(Survey)` check
- `app/javascript/controllers/structure_tree_controller.js` — Added 4 new targets (`surveys`, `surveysSection`, `inspectionFormsSection`, `checklistsSection`), fixed `checklist` → `checklists` target bug, updated `createInspectionFormAssignment` and `destroyInspectionFormAssignment` with `hasTarget` guards, added `createSection()` helper, updated `createChecklistAssignment` to use target + dynamic section creation
- `app/views/setup/structures/show.html.erb` — Added `.AreaTree__section` and `.AreaTree__section-header` CSS rules to inline styles

### Files Created
None

### Test Results
- **This milestone tests:** 3 passing, 0 failing (`spec/models/inspection_forms_structures_surveys_scope_spec.rb`)
- **Prior milestone tests:** 13 passing, 0 regressions (`spec/models/inspection_forms_structures_spec.rb`)

### Acceptance Criteria
- [x] **HDR-001:** Three section headers displayed (Inspections, Surveys, Checklists)
- [x] **HDR-002:** Headers only appear when items exist (conditional rendering)
- [x] **HDR-003:** Headers visually distinct (uppercase, muted color, 10px, 600 weight)
- [x] **HDR-004:** Sections ordered: inspections → surveys → checklists
- [x] **HDR-005:** Checklists conditional on `service_validations_enabled`
- [x] **ICN-001:** Inspection forms use `fal fa-file-alt`
- [x] **ICN-002:** Surveys use `fal fa-poll-h`
- [x] **ICN-003:** Checklists use `far fa-clipboard-list-check`
- [x] **GRP-001:** Split into non-surveys and surveys groups (`.surveys` scope added)
- [x] **GRP-002:** Sort order preserved within groups (`.ordered_by_form_name` chained)
- [x] **GRP-003:** Checklists under Checklists header
- [x] **INT-001:** Dropdown insertion targets correct `<ul>` via `inspectionFormsTarget`
- [x] **INT-002:** Expand/collapse unchanged
- [x] **INT-003:** Assign buttons function unchanged
- [x] **INT-004:** Dynamic section creation via `createSection()` helper
- [x] **INT-005:** Sort/destroy methods target inspections list only
- [x] **INT-006:** Survey right-pane behavior unchanged (no changes to right pane)
- [x] **BUG-FIX:** `checklist` → `checklists` target corrected
- [x] **EDGE:** No assignments → no headers (conditional rendering)
- [x] **EDGE:** Only surveys → only "Surveys" header
- [x] **EDGE:** Only checklists → only "Checklists" header
- [x] **EDGE:** AJAX children inherit section headers (uses same `_structure_node` partial)
- [x] **EDGE:** Last inspection removed → section disappears, "Add Area" visible
- [x] **EDGE:** Last survey removed → section disappears

### Spec Gaps
None

### Notes
- All 5 files modified exactly as specified in the architecture proposal
- The `createChecklistAssignment` method had a pre-existing bug: it called `this.sortAssignments(ulElement)` which doesn't exist as a method — changed to `this.sortChecklists()` which correctly delegates to `StructureTreeService.sortAssignmentsByName`
- The `destroyChecklistAssignment` method was also updated to clean up empty section wrappers (symmetric with the destroy inspection form logic)

---

## M2: QA Test Data

**Status:** Complete
**Date:** 2026-02-06
**Commit:** `a80de10`

### Files Created
- `lib/tasks/pipeline/seed_area_tree_type_headers.rake` — Idempotent rake task seeding 8 area scenarios

### Files Modified
None

### Test Results
- **This milestone tests:** N/A (seed task, no automated tests)
- **Prior milestone tests:** 16 passing, 0 regressions (3 `.surveys` scope + 13 existing `inspection_forms_structures`)

### Acceptance Criteria
- [x] Rake task `pipeline:seed_area_tree_type_headers` exists in `lib/tasks/pipeline/`
- [x] Enables `service_validations_enabled = true` and `surveys_enabled = true` on elm account
- [x] Creates site with 8 area scenarios:
  - All Types Room (inspections + surveys + checklists)
  - Inspections Only Room
  - Surveys Only Room
  - Checklists Only Room
  - Inspections and Surveys Room (no checklists)
  - Empty Room (no assignments)
  - Surveys With Children (surveys + child sub-areas)
  - Nested Building (Floor 1, Floor 2 — AJAX-loaded children)
- [x] Uses existing admin user with `administer` permission
- [x] Idempotent via `job_number` tag check
- [x] Prints summary with account URL, user login, and 8 scenarios to test

### Notes
- Follows established seed task pattern from `deficient-line-items-report`
- Creates 2 InspectionForms, 2 Surveys (STI), 2 Checklists
- Each InspectionForm/Survey has one InspectionFormItem (required by validation)
- Surveys on "Surveys With Children" area verify the "Add Area" button is not blocked (surveys are exempt from `hide_new_area`)
