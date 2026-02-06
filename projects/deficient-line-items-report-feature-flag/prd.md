# Deficient Line Item Report — Feature Flag PRD

|  |  |
| -- | -- |
| **Product** | OrangeQC |
| **Version** | 1 |
| **Author** | Product |
| **Date** | February 6, 2026 |
| **Status** | Ready for Engineering |
| **Platforms** | Web only |
| **Level** | 1 (Small — Matt + Dave) |
| **Parent Feature** | [Deficient Line Item Report PRD](prd.md) |

---

## What We're Building

An account-level feature flag that gates access to the Deficient Line Item Report. When the flag is disabled (the default), the report is invisible — it does not appear in the Reports menu and its routes return a 404. When the flag is enabled, the report is accessible. Existing user-level permissions (`read_inspections`) continue to apply independently and are not part of this change.

## Why We're Building It

The Deficient Line Item Report is a new, substantial feature. We need the ability to:

1. **Control rollout.** Enable the report for specific accounts during beta/soft-launch before making it generally available.
2. **Gate by plan/tier.** Some accounts may not have access to advanced reporting features. The flag provides the mechanism to include or exclude accounts.
3. **Kill switch.** If issues are discovered post-launch, disable the report for affected accounts without a code deploy.

This follows the established OrangeQC pattern used by Tickets (`tickets_enabled`), Inspection Scheduling (`scheduled_inspections_enabled`), Visit Tracking (`visit_tracking_enabled`), and other account-level features.

---

## Feature Requirements

### FLAG-001: Account Column

| ID | Requirement |
| -- | -- |
| FLAG-001 | Add a `deficient_line_items_report_enabled` boolean column to the `accounts` table, defaulting to `false` (disabled). |

### FLAG-002: Reports Menu Gating

| ID | Requirement |
| -- | -- |
| FLAG-002 | The Deficient Line Item Report link in the Reports index page (`reports/index.html.erb`) is only visible when `current_account.deficient_line_items_report_enabled?` is `true`. |

### FLAG-003: Controller Gating

| ID | Requirement |
| -- | -- |
| FLAG-003 | The `Reports::DeficientLineItemsController` checks that `current_account.deficient_line_items_report_enabled?` is `true` as a `before_action`. If the flag is `false`, the controller renders a 404 (using the existing `render_404` pattern). This applies to all actions: `index`, `show`, and any export endpoints. |

### FLAG-004: Settings Controller Gating

| ID | Requirement |
| -- | -- |
| FLAG-004 | The `Reports::DeficientLineItemSettingsController` (threshold settings) also checks the flag via `before_action`. If the flag is `false`, settings updates return a 404. |

### FLAG-005: Default Account Factory

| ID | Requirement |
| -- | -- |
| FLAG-005 | The `DefaultAccountFactory` sets `deficient_line_items_report_enabled: false` for new accounts. |

---

## What's NOT Changing

- The report itself — all views, controllers, service objects, exports, and settings remain as-is.
- Existing user-level permissions (`read_inspections`) — unchanged and independent of this flag.
- The `report_settings` table and per-user threshold preferences — unaffected by the account-level flag.

---

## Implementation Notes

### Established Pattern

This follows the account-level flag pattern used by `visit_tracking_enabled`, `tickets_enabled`, etc.:

1. **Migration:** `add_column :accounts, :deficient_line_items_report_enabled, :boolean, default: false`
2. **Controller gate:** `before_action` that calls `render_404` unless `current_account.deficient_line_items_report_enabled?`
3. **View gate:** `<% if current_account.deficient_line_items_report_enabled? %>`

The flag is managed by OrangeQC staff (admin panel or console). It is not exposed as a self-service toggle on the Account Features page.

### Branch Strategy — IMPORTANT

This project does NOT get its own branch. All work stacks on the existing `pipeline/deficient-line-items-report` branch in the Rails repo. This is additive to the same feature — the flag gates the report that's already implemented on that branch. Do not create a `pipeline/deficient-line-items-report-feature-flag` branch.

---

## Edge Cases

| Scenario | Behavior |
| -- | -- |
| Flag disabled while user is viewing the report | Next navigation/page load returns 404. No special redirect needed. |
| Flag disabled while user has saved threshold settings | Settings are preserved in `report_settings` table. If the flag is re-enabled, settings are still there. |
| Direct URL access with flag disabled | 404. No leakage of report existence. |
| API access (if any future API endpoints exist) | Same flag check applies. |
| Flag enabled for account | Report immediately appears in Reports menu for eligible users. No restart required. |

---

## Out of Scope

| Item | Rationale |
| -- | -- |
| Self-service toggle | The flag is not exposed on the Account Features page. OrangeQC staff control enablement. |
| Kill switch (global) | Account-level column is the right tool here. Kill switches are for global feature gates, not per-account access. |
| Billing/plan integration | Flag is manually toggled for now. Automated plan-based enablement is a future concern. |
| Backfill existing accounts | Flag defaults to `false` (disabled). Accounts are enabled individually or via a rake task (not in this PRD). |

---

## Testing

| ID | Test |
| -- | -- |
| TEST-001 | When flag is `false`, the report link does not appear on the Reports index page. |
| TEST-002 | When flag is `false`, GET `/reports/deficient_line_items` returns 404. |
| TEST-003 | When flag is `false`, GET `/reports/deficient_line_items/:id` returns 404. |
| TEST-004 | When flag is `false`, PATCH `/reports/deficient_line_item_settings` returns 404. |
| TEST-005 | When flag is `true`, report loads normally. |
| TEST-006 | New accounts have `deficient_line_items_report_enabled` set to `false`. |
