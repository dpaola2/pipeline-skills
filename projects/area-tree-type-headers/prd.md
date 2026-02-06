# Area Tree Type Headers & Icons — PRD

|  |  |
| -- | -- |
| **Product** | OrangeQC |
| **Version** | 1 |
| **Author** | Product |
| **Date** | February 6, 2026 |
| **Status** | Ready for Engineering |
| **Platforms** | Web only |
| **Level** | 2 (Web only) |
| **Linear Issue** | [WEB-106](https://linear.app/orangeqc/issue/WEB-106/area-tree-should-have-headers-and-different-icons-for-each-of) |
| **Help Scout** | [#11161](https://secure.helpscout.net/conversation/3165421267/) — Survey vs Inspection in Settings |

---

## 1. Executive Summary

**What:** Add section headers and distinct icons for Inspections, Surveys, and Checklists in the Setup > Sites area tree so users can immediately distinguish between the three types of assignable forms.

**Why:** Customer bug report (Tim Lang, Help Scout #11161). Surveys appear identical to Inspection Forms in the area tree — same icon, no grouping label. Users cannot tell what type of form they're looking at without clicking into it. Both mobile apps already have section headers for these groups; the web area tree is the only place they're visually indistinguishable.

**Key Design Principles:**
- Match mobile parity — iOS and Android already group by type with section headers
- Use existing icons — the app already has distinct FA icons for each type; reuse them
- Minimal disruption — this is a visual clarity fix, not a functional change

---

## 2. Goals & Success Metrics

### Goals
- Users can instantly distinguish Inspections, Surveys, and Checklists in the area tree
- Reduce confusion reported in Help Scout #11161
- Bring web area tree in line with mobile section header pattern

### Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Help Scout tickets about survey/inspection confusion | Zero new tickets on this topic | 60 days |
| Qualitative feedback | Tim Lang confirms the issue is resolved | 14 days |

---

## 3. Feature Requirements

### 3.1 Section Headers

| ID | Requirement | Priority |
|----|------------|----------|
| HDR-001 | Each area node in the tree displays up to three section headers: "Inspections", "Surveys", and "Checklists". | Must |
| HDR-002 | A section header is only displayed when at least one item of that type is assigned to the area. | Must |
| HDR-003 | Section headers are visually distinct from the form names beneath them — smaller font weight, muted color, uppercase or styled to read as a label, not a clickable item. | Must |
| HDR-004 | Sections are ordered: Inspections first, Surveys second, Checklists third. This matches the Setup sidebar navigation order. Note: the current DOM order is checklists → inspection forms — this change reorders them. | Must |
| HDR-005 | The Checklists section and its header only appear when the account has `service_validations_enabled`. This preserves the existing conditional. | Must |

### 3.2 Distinct Icons

| ID | Requirement | Priority |
|----|------------|----------|
| ICN-001 | Inspection Forms use the existing `fal fa-file-alt` icon (no change). | Must |
| ICN-002 | Surveys use the `fal fa-poll-h` icon, matching the Tailwind setup sidebar. | Must |
| ICN-003 | Checklists continue to use the existing `far fa-clipboard-list-check` icon (no change). | Must |

### 3.3 Grouping Logic

| ID | Requirement | Priority |
|----|------------|----------|
| GRP-001 | The current flat list of `inspection_forms_structures` is split into two groups: non-survey inspection forms (`type IS NULL`) and surveys (`type = 'Survey'`), each rendered under its own header. | Must |
| GRP-002 | Within each group, the existing sort order (ordered by form name) is preserved. | Must |
| GRP-003 | The existing checklist list (`checklist_assignments.active.ordered_by_checklist_name`) renders under the "Checklists" header with no other changes. | Must |

### 3.4 Interaction Preservation

| ID | Requirement | Priority |
|----|------------|----------|
| INT-001 | All existing CRUD operations on form assignments (assign, unassign, reorder) continue to work. | Must |
| INT-002 | Expand/collapse behavior of area nodes is unchanged. When a node is expanded, all three sections (if populated) are visible. | Must |
| INT-003 | The "Assign Inspection Form" and "Assign Checklist" action buttons continue to function. Their dropdown filtering (non-surveys only for inspection forms) is unchanged. | Must |
| INT-004 | When an inspection form is assigned via the tree dropdown, `createInspectionFormAssignment()` in `structure_tree_controller.js` inserts the new `<li>` into the correct "Inspections" `<ul>` (not the "Surveys" `<ul>`). The controller currently targets `ul.inspection-forms` by CSS selector — this selector must be updated to match the new DOM structure. | Must |
| INT-005 | `sortInspectionForms()` and `destroyInspectionFormAssignment()` in the Stimulus controller must target the "Inspections" list specifically (not surveys). These methods currently use the `inspectionFormsTarget` which maps to the single `<ul class="inspection-forms">`. | Must |
| INT-006 | Survey assignment via the right pane continues to work. Note: the right pane's `create.js.erb` only updates the right pane — it does NOT update the tree. This is pre-existing behavior. The tree picks up newly assigned surveys on next expand/collapse (server re-render). No change to this behavior is required. | Must |

---

## 4. Platform-Specific Requirements

### Web (Rails Admin)
- Changes are limited to the Setup > Sites area tree view
- **ERB partials:** `_structure_node.html.erb` (split the `<ul>` lists, add section headers, reorder sections) and `_inspection_form_assignment.html.erb` (conditionally render survey icon based on `inspection_form.type`)
- **Stimulus controller:** `structure_tree_controller.js` needs updates — the `inspectionForms` target, the `ul.inspection-forms` CSS selector in `createInspectionFormAssignment()`, and the sort/destroy methods all reference the single `<ul>` that is being split. A new `surveys` target or updated selectors are needed.
- No Rails controller changes — the grouping is done in the view using the existing `inspection_form.type` attribute
- No API changes
- No database changes

### iOS
- No changes. iOS already has section headers.

### Android
- No changes. Android already has section headers.

### API
- No changes. This is a view-only change.

---

## 5. User Flows

### Flow 1: User Views Area Tree with Mixed Assignments

**Persona:** Account admin managing area setup
**Entry Point:** Setup > Sites > click on a site > expand an area node

1. Area node expands, revealing its contents.
2. User sees section headers grouping the assigned forms: "Inspections" with file-alt icons, "Surveys" with poll-h icons, "Checklists" with clipboard-list-check icons.
3. Each section only appears if that area has at least one assignment of that type.
4. **Success:** User can instantly tell which items are inspections, which are surveys, and which are checklists.

### Flow 2: User Assigns a New Survey

**Persona:** Account admin
**Entry Point:** Setup > Sites > select an area > right pane

1. User selects an area in the tree.
2. In the right pane, user scrolls to the "Surveys" section and assigns a survey.
3. The right pane updates to show the newly assigned survey (existing `create.js.erb` behavior).
4. The tree does NOT update live — this is pre-existing behavior. When the user next collapses and expands the area node (triggering a server re-render), the survey appears under the "Surveys" header with the `fa-poll-h` icon.

### Flow 3: User Assigns an Inspection Form via Tree Dropdown

**Persona:** Account admin
**Entry Point:** Setup > Sites > expand an area node > "Assign Inspection Form" dropdown

1. User clicks "Assign Inspection Form" and selects a form from the dropdown.
2. The Stimulus controller POSTs the assignment and inserts the returned `<li>` into the "Inspections" `<ul>`.
3. The new form appears under the "Inspections" header with the `fa-file-alt` icon, sorted alphabetically.
4. **Success:** The form is correctly placed in the Inspections group, not the Surveys group.

---

## 6. UI Mockups

### 6.1 Area Node — All Three Types Assigned

```
▾ Building A
    Inspections
      📄 Nightly Cleaning Inspection
      📄 Restroom Inspection
      📄 Weekly Deep Clean
    Surveys
      📊 Customer Satisfaction Survey
      📊 Employee Feedback Survey
    Checklists
      📋 Opening Checklist
      📋 Closing Checklist
    ▸ Floor 1
    ▸ Floor 2
```

Where:
- 📄 = `fal fa-file-alt` (inspection forms — existing)
- 📊 = `fal fa-poll-h` (surveys — new)
- 📋 = `far fa-clipboard-list-check` (checklists — existing)
- Section headers ("Inspections", "Surveys", "Checklists") are styled as small, muted labels

### 6.2 Area Node — Only Inspections Assigned

```
▾ Parking Garage
    Inspections
      📄 Exterior Grounds Inspection
    ▸ Level 1
    ▸ Level 2
```

No "Surveys" or "Checklists" header appears because there are no assignments of those types.

### 6.3 Area Node — No Assignments

```
▾ Storage Room
    [+ Assign Inspection Form]  [+ Assign Checklist]
```

No section headers appear. The action buttons render as they do today.

### 6.4 Section Header Styling

```
  INSPECTIONS                          ← small caps or uppercase, muted gray, ~11px
    🔹 fa-file-alt  Nightly Cleaning   ← existing size and weight, standard text color
    🔹 fa-file-alt  Restroom Inspect
  SURVEYS                              ← same header style
    🔹 fa-poll-h    Customer Sat.
  CHECKLISTS                           ← same header style
    🔹 fa-clipboard-list-check  Opening
```

The header style should match the small label pattern used elsewhere in the settings UI. Engineering has discretion on exact font size, weight, and color as long as the header reads as a non-interactive grouping label.

---

## 7. Backwards Compatibility

**Not applicable.** This is a visual-only change to the web admin area tree. No API changes, no data model changes, no mobile impact. Old mobile apps are completely unaffected.

---

## 8. Edge Cases & Business Rules

| Scenario | Expected Behavior |
|----------|-------------------|
| Area has only inspections (no surveys, no checklists) | Only "Inspections" header shown |
| Area has only surveys | Only "Surveys" header shown |
| Area has only checklists | Only "Checklists" header shown |
| Area has inspections and surveys but no checklists | "Inspections" and "Surveys" headers shown, no "Checklists" header |
| Area has no assignments at all | No headers shown; action buttons render as today |
| Account does not have `service_validations_enabled` | "Checklists" section never appears (existing behavior preserved) |
| Survey is assigned via the right pane | Right pane updates immediately. Tree does NOT update live (pre-existing behavior). Survey appears under "Surveys" header on next node expand/collapse. |
| Survey is unassigned via the right pane | Right pane updates immediately. Tree does NOT update live (pre-existing behavior). Survey disappears from tree on next node expand/collapse. |
| Inspection form is assigned via dropdown | Form appears under "Inspections" header (dropdown already filters to non-surveys) |
| AJAX-loaded child nodes | Child nodes loaded via `_children.html.erb` also render with section headers |

---

## 9. Export Requirements

**Not applicable.** No exports are affected by this change.

---

## 10. Out of Scope

- Changing the right pane survey management UI — it already has its own "Surveys" header
- Adding drag-and-drop reordering between sections
- Adding section collapse/expand within a node (sections are always visible when the node is expanded)
- Changing icons in any other part of the app (sidebar, index pages, reports, etc.)
- Adding survey-specific behavior to the "Assign" dropdowns — surveys are still managed via the right pane
- Mobile changes — both apps already have this pattern

---

## 11. Open Questions

| # | Question | Status | Decision | Blocking? |
|---|----------|--------|----------|-----------|
| 1 | Should section headers include a count (e.g., "Inspections (3)")? | Open | Leaning no — keeps it clean, and counts are obvious from the list. | No |
| 2 | Should the section header include the icon as well as the text? | Open | Leaning no — the icon on each item is sufficient. Header is just a text label. | No |

> **No blocking questions. This PRD is ready for pipeline intake.**

---

## 12. Release Plan

### Single Phase

All changes ship together. No feature flag required — this is a non-breaking visual enhancement.

**Deliverables:**
- Section headers in the area tree for Inspections, Surveys, and Checklists
- Distinct `fa-poll-h` icon for surveys in the tree
- Conditional display (headers only shown when section has items)

---

## 13. Assumptions

- The `inspection_form.type` attribute (`nil` for inspections, `'Survey'` for surveys) is reliably set on all records. This is guaranteed by the STI pattern.
- `fal fa-poll-h` is available in the FontAwesome version bundled with the app (confirmed — already used in the Tailwind sidebar).

---

## Appendix: Current vs. Proposed

### Before (Current)
```
▾ Building A
    📄 Nightly Cleaning Inspection
    📄 Customer Satisfaction Survey    ← looks identical to inspection
    📄 Restroom Inspection
    📋 Opening Checklist
```

### After (Proposed)
```
▾ Building A
    Inspections
      📄 Nightly Cleaning Inspection
      📄 Restroom Inspection
    Surveys
      📊 Customer Satisfaction Survey  ← distinct icon + grouped under header
    Checklists
      📋 Opening Checklist
```

### Reference: Existing Icons in the App

| Type | Icon Class | Where Already Used |
|------|-----------|-------------------|
| Inspection Forms | `fal fa-file-alt` | Area tree, forms index, reports |
| Surveys | `fal fa-poll-h` | Tailwind setup sidebar |
| Checklists | `far fa-clipboard-list-check` | Area tree, checklists index |
