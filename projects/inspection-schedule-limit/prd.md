# Increase Inspection Schedule Limit — PRD

|  |  |
| -- | -- |
| **Product** | OrangeQC |
| **Version** | 1 |
| **Author** | Product |
| **Date** | February 6, 2026 |
| **Status** | Ready for Engineering |
| **Platforms** | Web only (backend) |
| **Level** | 2 (Web only) |
| **Linear Issue** | [ENG-362](https://linear.app/orangeqc/issue/ENG-362/increase-number-of-total-inspection-schedules-beyond-600) |
| **Help Scout** | [#11500](https://secure.helpscout.net/conversation/3221022838/) — Schedules for PCSI ORG 2 |

---

## 1. Executive Summary

**What:** Raise the per-account inspection schedule limit from 600 to 1,000 and surface a clear error message when the limit is reached.

**Why:** Customer request — PCSI ORG 2 has hit the 600-schedule hard limit and needs to add approximately 150 more. The current limit is an arbitrary ceiling set when the scheduling job showed performance degradation at scale. Extending to 1,000 is a pragmatic accommodation while the team plans a new scheduling architecture.

**Key Design Principles:**
- Minimal investment — this is a stopgap. A new scheduling approach is planned for 2026, so no architectural rework of the existing feature.
- Explicit limits — the limit should be visible and produce a clear validation message, not a silent failure.
- Observable — instrument enough to know if the scheduling job is approaching dangerous runtimes at the higher limit.

---

## 2. Goals & Success Metrics

### Goals
- PCSI ORG 2 (and any other account approaching 600) can add schedules up to 1,000
- No degradation in scheduling job reliability at the new limit
- Clear feedback when an account hits the limit

### Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| PCSI ORG 2 unblocked | Account can create their ~150 additional schedules | 7 days |
| Scheduling job stability | Zero job timeouts or Heroku cancellations for accounts with 600–1,000 schedules | 60 days |
| Support tickets about the limit | Zero new tickets from PCSI ORG 2 on this topic | 30 days |

---

## 3. Feature Requirements

### 3.1 Limit Change

| ID | Requirement | Priority |
|----|------------|----------|
| LIM-001 | The per-account inspection schedule limit is raised from 600 to 1,000. | Must |
| LIM-002 | The limit is defined in a single, named constant — not a magic number scattered across the codebase. If it's already a constant, update the value. If it's a magic number, extract it. | Must |
| LIM-003 | The limit applies to active (non-deleted) inspection schedules per account. Soft-deleted or archived schedules do not count against the limit. | Must |

### 3.2 Validation & User Feedback

| ID | Requirement | Priority |
|----|------------|----------|
| VAL-001 | When a user attempts to create a schedule that would exceed the 1,000 limit, the system returns a clear validation error (e.g., "This account has reached the maximum of 1,000 inspection schedules. Please delete unused schedules to add new ones."). | Must |
| VAL-002 | The validation error follows the existing OrangeQC error format and is surfaced in the web UI where schedules are created. | Must |
| VAL-003 | The validation prevents saving, not just warns. The schedule is not created if the limit would be exceeded. | Must |

### 3.3 Job Performance Observability

| ID | Requirement | Priority |
|----|------------|----------|
| OBS-001 | The scheduling job logs the total number of active schedules processed and the wall-clock duration of the job run. | Should |
| OBS-002 | If the scheduling job exceeds a configurable duration warning threshold (default: 30 minutes), it logs a warning. | Should |

---

## 4. Platform-Specific Requirements

### Web (Rails Admin)
- The limit change is backend-only — the constant or configuration value that enforces the 600-schedule ceiling is updated to 1,000
- If the UI for creating schedules currently lacks a limit-reached error message, add one
- No new views, no new controllers — this is a validation/config change

### iOS
- No changes. Schedule creation on iOS hits the API, which enforces the limit server-side.

### Android
- No changes. Same as iOS.

### API
- If the schedule creation API endpoint enforces the limit, the new limit of 1,000 applies there too
- Error response follows existing OrangeQC error format: `{ "error": "LimitExceeded", "message": "..." }`

---

## 5. User Flows

### Flow 1: User Creates a Schedule (Under Limit)

**Persona:** Account admin managing inspection schedules
**Entry Point:** Setup > Inspection Schedules > New

1. User fills out the schedule creation form.
2. User clicks Save.
3. Schedule is created successfully. Current behavior is unchanged.
4. **Success:** Schedule appears in the list.

### Flow 2: User Creates a Schedule (At Limit)

**Persona:** Account admin at an account with 1,000 active schedules
**Entry Point:** Setup > Inspection Schedules > New

1. User fills out the schedule creation form.
2. User clicks Save.
3. Validation fails. Error message is displayed: "This account has reached the maximum of 1,000 inspection schedules. Please delete unused schedules to add new ones."
4. Schedule is not created. User is returned to the form.

---

## 6. UI Mockups

No new UI required. The only visual change is the validation error message, which should follow the existing error display pattern for schedule creation.

---

## 7. Backwards Compatibility

**Not applicable.** This is a backend limit change. No API contract changes, no data model changes. Old mobile apps are unaffected — the API simply allows more schedules than before. An old app that checks the limit client-side (unlikely) would be more restrictive, not broken.

---

## 8. Edge Cases & Business Rules

| Scenario | Expected Behavior |
|----------|-------------------|
| Account has exactly 1,000 active schedules | Next create attempt is rejected with validation error |
| Account has 999 active schedules | Can create one more (reaching 1,000) |
| Account has 600+ schedules that were created before the limit was 600 (grandfathered) | Existing schedules are untouched. New schedules can be created up to 1,000 total. |
| User deletes a schedule, bringing count from 1,000 to 999 | User can now create a new schedule |
| Bulk import or API batch creation | Each schedule creation checks the limit. Partial batches may succeed before the limit is hit. |
| Scheduling job runs for an account with 1,000 schedules | Job completes normally. OBS-001/OBS-002 logging captures runtime. |
| Scheduling job exceeds Heroku's 24-hour limit | This is a known risk at extreme scale. Not mitigated in this change — monitored via OBS-001/OBS-002. |

---

## 9. Export Requirements

**Not applicable.** No exports are affected by this change.

---

## 10. Out of Scope

- Rearchitecting the scheduling job for better performance at scale — that's the planned 2026 initiative
- Dynamic per-account limits (e.g., configurable by support) — just use a global constant for now
- Sharding or parallelizing the scheduling job
- Adding a UI indicator showing "X of 1,000 schedules used" — nice to have but not needed for this change
- Notification when an account is approaching the limit (e.g., at 900)

---

## 11. Open Questions

| # | Question | Status | Decision | Blocking? |
|---|----------|--------|----------|-----------|
| 1 | Where is the 600 limit currently enforced? Is it a model validation, a controller check, or configuration? | Open | Discovery will determine this. | No |
| 2 | What is the current runtime of the scheduling job for PCSI ORG 2 at 600 schedules? | Open | Would help assess risk at 1,000. Not blocking — we're raising the limit regardless per product direction. | No |
| 3 | Are there any other accounts near the 600 limit that will also benefit? | Open | Nice to know but not blocking. | No |

> **No blocking questions. This PRD is ready for pipeline intake.**

---

## 12. Release Plan

### Single Phase

All changes ship together. No feature flag required — this is a non-breaking backend change.

**Deliverables:**
- Limit constant raised from 600 to 1,000
- Validation error message when limit is exceeded
- Job duration logging (if not already present)

---

## 13. Assumptions

- The 600 limit is enforced in a single location (or a small number of locations) in the codebase. If it turns out to be scattered across many files, discovery will surface this.
- The scheduling job can handle 1,000 schedules within Heroku's timeout constraints for the accounts that will reach that level. This is a calculated risk per product direction.
- PCSI ORG 2's immediate need is ~750 schedules. The 1,000 ceiling provides headroom.

---

## Appendix: Risk Assessment

### Scheduling Job Performance

The original 600-schedule limit was set because the scheduling job (which runs daily and calculates inspection schedules) showed increasing runtime at higher schedule counts. The risks at 1,000 schedules:

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Job takes noticeably longer (minutes, not hours) | High | Low | Acceptable. Logging (OBS-001) will track this. |
| Job approaches Heroku's execution timeout | Low | High | Logging warning (OBS-002) provides early signal. If triggered, escalate to engineering. |
| Job wraps around (takes 24+ hours, overlapping next day's run) | Very Low | Critical | No mitigation in this change. This would require the planned rearchitecture. |

**Product decision:** The risk is acceptable. The new scheduling architecture planned for 2026 will address the fundamental scalability issue. This change buys time for the highest-need customer.
