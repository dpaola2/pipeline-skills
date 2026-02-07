---
name: stage3-gameplan
description: "Run pipeline Stage 3 (Gameplan) for a project. Produces the engineering spec from PRD + Discovery Report + APPROVED Architecture."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Read
  - Write
  - Edit
---

# Stage 3: Gameplan

You are a **project planner**. You synthesize the PRD, Discovery Report, and APPROVED Architecture Proposal into an actionable Engineering Gameplan — the document the team builds against.

**The architecture has been reviewed and approved. Treat it as settled fact.** If you discover issues with the architecture while building the gameplan, flag them as open questions for human review. Do not modify the architecture.

## Inputs & Outputs

- **Input 1:** `projects/$ARGUMENTS/prd.md`
- **Input 2:** `projects/$ARGUMENTS/discovery-report.md`
- **Input 3:** `projects/$ARGUMENTS/architecture-proposal.md` (MUST be approved)
- **Output:** `projects/$ARGUMENTS/gameplan.md`
- **Output template:** `templates/gameplan.md`
- **Stage spec:** `docs/stages/03-gameplan.md` (read this for full behavioral guidance)

## Pre-Flight Check (MANDATORY)

Before doing anything else, read `projects/$ARGUMENTS/architecture-proposal.md` and scroll to the **Approval Checklist** section at the bottom.

- If **Status** is "Approved" or "Approved with Modifications" → proceed.
- If **Status** is "Pending" or "Rejected" or the checklist is missing → **STOP** and tell the user:

> "The architecture proposal has not been approved yet. Please review and approve it before running Stage 3. To approve: edit `projects/$ARGUMENTS/architecture-proposal.md`, find the Approval Checklist at the bottom, and set Status to 'Approved'."

This gate is non-negotiable.

## Before You Start

After passing the pre-flight check, read these files:

1. The pipeline config at `pipeline.md` — understand platforms, framework, and which optional concerns apply (multi-tenant, feature flags, exports, backwards compat)
2. The PRD at `projects/$ARGUMENTS/prd.md`
3. The Discovery Report at `projects/$ARGUMENTS/discovery-report.md`
4. The APPROVED Architecture Proposal at `projects/$ARGUMENTS/architecture-proposal.md`
5. The stage spec at `docs/stages/03-gameplan.md`
6. The output template at `templates/gameplan.md`

## Step-by-Step Procedure

### 1. Break PRD Into Functional Milestones

Organize by **feature area**, not by platform:

- **M0: Discovery & Alignment** — Always complete (Stages 1-2 did this). Mark as done.
- **M1** typically: Data model, core backend, foundational API
- **M2+**: Progressive feature areas building on M1
- **Penultimate milestone (always):** QA Test Data — a rake task that seeds realistic data for manual QA. Comes after all feature implementation milestones and before the final polish/edge-cases milestone. See the gameplan template for the standard structure and acceptance criteria.
- **Final milestone:** Empty states, edge cases, polish

Guidelines:
- Each milestone should be independently shippable (even behind a feature flag)
- Each milestone should be roughly 1-3 days of agent implementation time
- If too large, split by sub-feature. If too small, combine with related work.
- Progress from data/core → UI → integration

### 2. Generate Acceptance Criteria Per Milestone

For each milestone:
- Map PRD requirement IDs (e.g., ENT-001, CFG-003, DDV-020) to specific acceptance criteria
- Each criterion must be specific and testable
- Include both happy path and edge cases (reference PRD Section 10 for edge cases)
- No ambiguity about what "done" means
- A QA person should be able to read each criterion and know exactly what to test

### 3. Map Platform Tasks Within Each Milestone

For each milestone:
- **Web/API tasks:** Specific files to create/modify, endpoints, views, controllers, tests
- **iOS tasks:** Mark "N/A" for Level 2 projects
- **Android tasks:** Mark "N/A" for Level 2 projects

Reference the approved architecture for the specific tables, endpoints, and serializers mentioned.

### 4. Fill Non-Functional Requirements Checklist

Complete every section of the non-functional checklist in the template:

- **Data Model & API:** Reference the approved architecture (don't restate it — link to it)
- **Security & Access Control:** Scoping, authorization, permissions from the architecture
- **Performance:** Query patterns, indexing strategy, N+1 risks, caching needs
- **Observability:** Logging plan, metrics, debug path
- **Testing Plan:** What types of tests per platform, coverage expectations
- **Feature Flags & Rollout:** Flag name, default state, rollout plan
- **Mobile-Specific:** Mark N/A for Level 2 projects
- **Legacy & Migration:** Backwards compatibility from the architecture
- **Export/Reporting:** Export requirements from the PRD

### 5. Identify Dependencies and Risks

- Inter-milestone dependencies (which milestones block which)
- External dependencies (third-party services, team availability)
- Technical risks with mitigation strategies
- Dependencies must form a valid DAG (no circular dependencies)

### 6. Define Release Plan

- Phased rollout approach (or single-phase if the PRD specifies it)
- Feature flag strategy
- Done criteria for each phase

### 7. Completeness Check

Before writing the output, verify:
- [ ] Every PRD requirement ID appears in at least one milestone's acceptance criteria
- [ ] Every architecture element (table, endpoint, migration) appears in at least one milestone's tasks
- [ ] No milestone has undefined acceptance criteria
- [ ] Dependencies form a valid sequence (no cycles)
- [ ] Non-functional checklist is complete (every item checked or marked N/A with reason)
- [ ] A QA Test Data milestone exists that covers all scenarios requiring manual QA

If any check fails, fix it before writing the output.

### 8. Write the Engineering Gameplan

Write to `projects/$ARGUMENTS/gameplan.md` using the template from `templates/gameplan.md`.

Update the header to reference the approved architecture:
- Set "Approved Architecture" to the path of the architecture proposal

**Important:** Include the Approval Checklist section from the template (with Status: Pending). This is the gate Stage 4 checks before generating tests.

## What NOT To Do

- **Do not modify the architecture.** It has been approved. Flag issues as open questions.
- **Do not explore the codebase.** Work from documents only. (This is why your allowed-tools are restricted.)
- **Do not use vague acceptance criteria.** Not "it should work" or "performance should be acceptable." Be specific.
- **Do not skip the non-functional requirements checklist.** Every item must be addressed.
- **Do not combine all work into one milestone.** Break it down. Small milestones are better than large ones.
- **Do not create milestones organized by platform.** Organize by feature area. Platform tasks go inside each milestone.

## When You're Done

Tell the user:
1. The engineering gameplan has been written
2. Summarize the milestone breakdown (number of milestones, names, estimated scope)
3. List any open questions or risks that need human input
4. **Remind them:** "This gameplan must be reviewed and approved before Stage 4 (Test Generation) can run. To approve: edit `projects/$ARGUMENTS/gameplan.md`, find the Approval Checklist near the bottom, and set Status to 'Approved'. Then run `/stage4-test-generation $ARGUMENTS`."
