# Stage 3: Gameplan

> **Principle:** Organize by functional requirements first, then address non-functional requirements as a cross-cutting checklist.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Project planner |
| **Input** | PRD + Discovery Report + Architecture Proposal |
| **Output** | Engineering Gameplan (Spec) |
| **Repos Accessed** | None (works from documents) |
| **Human Review** | **Required** - this is the human checkpoint |
| **Linear** | Creates milestone tickets upon approval |

---

## What This Stage Does

The gameplan agent produces a complete engineering spec - the document the team builds against. It synthesizes the PRD (what to build), the discovery report (what exists), and the architecture proposal (how to build it) into an actionable implementation plan.

### Specific Tasks

1. **Break PRD into functional milestones:**
   - Organize by feature area, not by platform
   - Each milestone is independently shippable (even if behind a feature flag)
   - M0 is always Discovery & Alignment (already done by Stages 1-2)
   - Subsequent milestones progress from data/core → UI → integration

2. **Generate acceptance criteria per milestone:**
   - Extract from PRD requirements (numbered IDs like SEC-001)
   - Each criterion is specific and testable
   - No ambiguity about what "done" means
   - Include both happy path and edge cases

3. **Map platform tasks within each milestone:**
   - Web/API tasks
   - iOS tasks
   - Android tasks
   - Mark N/A where a platform isn't involved

4. **Fill non-functional requirements checklist:**
   - Data model (from architecture proposal)
   - API (from architecture proposal)
   - Performance considerations
   - Security & access control
   - Observability & debuggability
   - Testing plan
   - Feature flags & rollout
   - Mobile-specific needs
   - Legacy & migration
   - Export requirements

5. **Identify dependencies and risks:**
   - Inter-milestone dependencies
   - External dependencies (third-party services, team availability)
   - Technical risks with mitigation strategies

6. **Define release plan:**
   - Phased rollout approach
   - Feature flag strategy
   - Done criteria for each phase

7. **Prepare Linear tickets:**
   - One ticket per milestone
   - Acceptance criteria in ticket description
   - Dependencies linked
   - Platform labels applied

---

## Agent Behavior

### Synthesis, Not Copy-Paste

The gameplan agent should SYNTHESIZE information from its three inputs, not just copy sections:

- PRD says "Admin can reorder sections" → Gameplan says "M2: Section Reordering - Web/API: PATCH /sections/:id with position param, validates uniqueness within checklist. iOS: drag-and-drop in section list, calls reorder API. Android: same. Acceptance: sections display in new order on all platforms after reorder."

### Milestone Sizing

- Each milestone should be roughly 1-3 days of agent implementation time
- If a milestone is too large, split by sub-feature
- If a milestone is too small, combine with related work
- M0 (Discovery) is always pre-done by Stages 1-2

### Completeness Check

Before producing output, the agent should verify:
- Every PRD requirement appears in at least one milestone
- Every architecture proposal element (table, endpoint, migration) appears in at least one milestone
- No milestone has undefined acceptance criteria
- Dependencies form a valid DAG (no circular dependencies)

---

## Output: Engineering Gameplan

Uses template: `templates/gameplan.md`

This is the most important document in the pipeline. It's the contract for everything that follows.

Key sections:
1. **Project Overview** - Goals, scope, out of scope, constraints
2. **Open Questions & Decisions** - Resolved from Stages 1-2, plus any new ones
3. **Functional Milestones** - M0 through MN, with platform tasks
4. **Non-Functional Requirements Checklist** - Complete
5. **Dependencies & Risks** - With mitigation
6. **Release Plan** - Phases and done criteria
7. **Estimates** - Per milestone (agent estimate + buffer)

---

## Human Checkpoint

**This is the critical gate in the pipeline.**

The human reviewer (tech lead / CTO) checks:

### Must Approve
- [ ] Data model is architecturally sound
- [ ] API design is consistent with existing patterns
- [ ] Backwards compatibility is handled correctly
- [ ] Milestones are properly scoped and sequenced
- [ ] Acceptance criteria are correct and complete
- [ ] Security implications are addressed

### Should Check
- [ ] Nothing missed that the agent wouldn't know about
  - Upcoming related changes
  - Political context ("Matt wants it done this way")
  - In-progress work on other branches
  - Customer promises or commitments
- [ ] Estimates feel reasonable
- [ ] Release plan makes sense for the business

### Approval Outcomes
1. **Approved** → Stage 4 begins, Linear tickets created
2. **Approved with modifications** → Agent incorporates feedback, re-generates affected sections
3. **Rejected** → Returns to Stage 2 (if architecture issues) or Stage 1 (if fundamental misunderstanding)

---

## Linear Integration

Upon approval:
- Create one Linear issue per milestone
- Link all milestone issues to the parent project
- Set milestone dependencies (blocked-by relationships)
- Apply platform labels (web, ios, android)
- Set initial status to "Ready for Development"
- Include acceptance criteria in issue description

---

## Success Criteria

- [ ] Every PRD requirement is traceable to a milestone
- [ ] Every milestone has specific, testable acceptance criteria
- [ ] Platform tasks are explicit (no "all platforms do the same thing" without specifics)
- [ ] Non-functional checklist is complete (every item checked or marked N/A)
- [ ] Dependencies are clear and form a valid sequence
- [ ] A developer could read this and know exactly what to build
- [ ] A QA person could read the acceptance criteria and know exactly what to test

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Milestone too large (> 3 days work) | Human review | Split into sub-milestones |
| Missing PRD requirement | Traceability check fails | Add missing milestone or acceptance criteria |
| Incorrect acceptance criteria | Human review | Correct and update |
| Unrealistic estimates | Human review | Adjust with context |
| Missing platform tasks | Platform engineer review | Add platform-specific details |
