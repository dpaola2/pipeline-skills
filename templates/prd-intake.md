---
pipeline_stage: 0
pipeline_stage_name: prd
pipeline_project: "[slug]"
pipeline_started_at: "[ISO 8601 timestamp]"
pipeline_completed_at: "[ISO 8601 timestamp]"
---

# [Feature Name] - PRD

> **Status:** Draft | Review | Approved
> **Author:** [Name]
> **Date:** [Date]
> **Linear Project:** [Link]

---

## 1. Executive Summary

**What:** [1-2 sentences: what we're building]

**Why:** [Business driver: customer request, regulatory, business need, tech debt]

**Key Design Principles:**
- [Non-negotiable principle 1]
- [Non-negotiable principle 2]

---

## 2. Goals & Success Metrics

### Goals
- [Goal 1]
- [Goal 2]

### Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| [Metric 1] | [Target] | 30 days |
| [Metric 2] | [Target] | 60 days |
| [Metric 3] | [Target] | 90 days |

---

## 3. Feature Requirements

> Number every requirement with a prefix (e.g., SEC-001 for sections). Each requirement must be specific and testable.

### [Functional Area 1]

| ID | Requirement | Platform | Priority |
|----|------------|----------|----------|
| [XX-001] | [Specific, testable requirement] | [Platform from PIPELINE.md] / All | Must / Should / Nice |
| [XX-002] | [Specific, testable requirement] | [Platform] | [Priority] |

### [Functional Area 2]

| ID | Requirement | Platform | Priority |
|----|------------|----------|----------|
| [XX-010] | [Specific, testable requirement] | [Platform] | [Priority] |

---

## 4. Platform-Specific Requirements

> Include one subsection per active platform from PIPELINE.md Platforms table.
> Mark platforms not in scope as "No changes required — Level [N] project."

### [Primary Platform from PIPELINE.md]
- [Platform-specific requirements, UI expectations, workflows]

<!-- CONDITIONAL: Include one subsection per additional active platform from PIPELINE.md Platforms -->
### [Additional Platform]
- [Platform-specific requirements, UI patterns, device considerations]
- **Old app compatibility:** [What old versions see/don't see — if PIPELINE.md has Backwards Compatibility section]

<!-- CONDITIONAL: Include only if PIPELINE.md has API Conventions section -->
### API
- [API requirements that serve all platforms]
- [Authentication/authorization requirements]

---

## 5. User Flows

### Flow 1: [Flow Name]
**Persona:** [Who]
**Entry Point:** [Where they start]

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. **Success:** [What happens when it works]
5. **Error:** [What happens when it fails]

### Flow 2: [Flow Name]
...

---

## 6. UI Mockups / Wireframes

> Include mockups, screenshots, ASCII layouts, or links to design files.

### [Screen/View Name]
```
[ASCII mockup or description]
```

---

## 7. Backwards Compatibility

<!-- CONDITIONAL: Include this section only if PIPELINE.md has a Backwards Compatibility section.
     Otherwise write: "N/A — no backwards compatibility concerns for this project." -->

### Compatibility Matrix

| Feature | [Column per active platform and old version from PIPELINE.md Platforms] |
|---------|:---:|
| [Feature aspect 1] | [Full/Partial/None per platform] |

### Migration Strategy
- [How existing data transitions]
- [What happens to in-progress work]
- [Rollback plan if migration fails]

---

## 8. Edge Cases & Business Rules

| Scenario | Expected Behavior | Platform |
|----------|-------------------|----------|
| [Edge case 1] | [What should happen] | [Platform] |
| [Edge case 2] | [What should happen] | [Platform] |
| [What if user does X?] | [Defined behavior] | [Platform] |
| [What if data is in state Y?] | [Defined behavior] | [Platform] |

---

## 9. Export Requirements

| Export Type | Format | Changes | Backwards Compatible? |
|-------------|--------|---------|----------------------|
| [Report name] | PDF / Excel / CSV | [What changes] | Yes / No / N/A |

---

## 10. Out of Scope

> Explicitly list what we are NOT building. This prevents scope creep.

- [Deferred feature 1]
- [Deferred feature 2]
- [Explicitly excluded capability]

---

## 11. Open Questions

| # | Question | Status | Decision | Blocking? |
|---|----------|--------|----------|-----------|
| 1 | [Question] | Open / Resolved | [Decision if resolved] | Yes / No |
| 2 | [Question] | Open / Resolved | [Decision if resolved] | Yes / No |

> **All blocking questions must be resolved before this PRD enters the pipeline.**

---

## 12. Release Plan

### Phases

| Phase | What Ships | Flag | Audience |
|-------|-----------|------|----------|
| Phase 1 | [Scope] | Beta flag | Internal + select accounts |
| Phase 2 | [Scope] | GA flag | All accounts |

### Feature Flag Strategy
- Flag name: `[flag_name]`
- Rollout: [Per-account / percentage / global]
- Default: Off

---

## 13. Assumptions

> Things we're assuming are true. If false, the approach may need to change.

- [Assumption 1]
- [Assumption 2]
- [Assumption 3]

---

## Appendix: Linked Documents

| Document | Link |
|----------|------|
| Framing Doc | [Link] |
| Linear Project | [Link] |
| Design Files | [Link] |
| Related PRDs | [Link] |
