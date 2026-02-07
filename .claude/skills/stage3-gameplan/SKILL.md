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

- **Input 1:** `<projects-path>/$ARGUMENTS/prd.md`
- **Input 2:** `<projects-path>/$ARGUMENTS/discovery-report.md`
- **Input 3:** `<projects-path>/$ARGUMENTS/architecture-proposal.md` (MUST be approved)
- **Output:** `<projects-path>/$ARGUMENTS/gameplan.md`
- **Output template:** `templates/gameplan.md`
- **Stage spec:** `docs/stages/03-gameplan.md` (read this for full behavioral guidance)

## Pre-Flight Check (MANDATORY)

Before doing anything else, read `<projects-path>/$ARGUMENTS/architecture-proposal.md` and scroll to the **Approval Checklist** section at the bottom.

- If **Status** is "Approved" or "Approved with Modifications" → proceed.
- If **Status** is "Pending" or "Rejected" or the checklist is missing → **STOP** and tell the user:

> "The architecture proposal has not been approved yet. Please review and approve it before running Stage 3. To approve: edit `<projects-path>/$ARGUMENTS/architecture-proposal.md`, find the Approval Checklist at the bottom, and set Status to 'Approved'."

This gate is non-negotiable.

## Before You Start

After passing the pre-flight check, read these files:

1. The pipeline config at `pipeline.md` — get the primary repository path, the **projects path** (from Work Directory → Projects), and other repo locations
2. The repo config at `PIPELINE.md` in the primary repository (path from `pipeline.md`) — understand platforms, framework, and which optional concerns apply (multi-tenant, feature flags, exports, backwards compat)
3. The PRD at `<projects-path>/$ARGUMENTS/prd.md`
4. The Discovery Report at `<projects-path>/$ARGUMENTS/discovery-report.md`
5. The APPROVED Architecture Proposal at `<projects-path>/$ARGUMENTS/architecture-proposal.md`
6. The stage spec at `docs/stages/03-gameplan.md`
7. The output template at `templates/gameplan.md`

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
- Size each milestone using t-shirt sizes: **S** (1-3 files, no new patterns), **M** (5-10 files, follows existing conventions), **L** (10-20 files, new patterns), **XL** (20+ files, should probably be split)
- If a milestone is L or XL, consider splitting it into smaller milestones
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

### 7. Write the Engineering Gameplan

Write to `<projects-path>/$ARGUMENTS/gameplan.md` using the template from `templates/gameplan.md`.

Update the header to reference the approved architecture:
- Set "Approved Architecture" to the path of the architecture proposal

**Important:** Include the Approval Checklist section from the template (with Status: Pending). This is the gate Stage 4 checks before generating tests.

### 8. Coherence Verification (MANDATORY)

After writing the gameplan, re-read it alongside the PRD and architecture proposal and run every check below. **Fix any failures before presenting the gameplan to the user.** These checks prevent errors that propagate through Stage 4 (tests), Stage 5 (implementation), and Stage 7 (QA plan).

#### Check 1: Traceability Completeness

For every requirement ID in the **PRD Traceability Matrix** (Section at the bottom of the gameplan), verify that at least one milestone has a matching acceptance criterion checkbox that references that ID.

- **Pass:** Every row in the traceability matrix has a corresponding `- [ ] ID:` checkbox in a milestone
- **Fail:** Requirement ID appears in the traceability matrix but has no acceptance criterion → add the missing criterion to the correct milestone

#### Check 2: Reverse Traceability

For every acceptance criterion that references a PRD requirement ID (e.g., `IMP-004`, `SUB-001`), verify that the ID exists in the PRD.

- **Pass:** Every referenced ID exists in the PRD's requirements sections
- **Fail:** Acceptance criterion references a non-existent ID → fix the ID or remove the criterion

#### Check 3: Architecture Element Coverage

Read the architecture proposal's "Files to Create" and "Files to Modify" lists (or equivalent sections). Verify every file appears in at least one milestone's platform tasks.

- **Pass:** Every file from the architecture proposal is referenced in a milestone
- **Fail:** Architecture proposes a file that no milestone creates/modifies → add it to the appropriate milestone

#### Check 4: PRD Edge Cases

Read PRD Section 8 (Edge Cases & Business Rules). For each edge case row, verify one of:
- An acceptance criterion explicitly addresses it, OR
- The edge case is handled by existing system behavior (note this in the gameplan if not obvious)

- **Pass:** Every PRD edge case is traceable to a criterion or documented as already-handled
- **Fail:** Edge case has no coverage → add an acceptance criterion or a note explaining why it's already covered

#### Check 5: Dependency DAG

Verify that milestone dependencies form a valid directed acyclic graph:
- No milestone depends on itself
- No circular dependency chains (e.g., M2 → M3 → M2)
- Every dependency references a milestone that exists in the gameplan

#### Check 6: Milestone Self-Consistency

Every milestone (except M0) must have ALL of:
- A `**What:**` description
- A `**Size:**` designation (S/M/L/XL)
- At least one acceptance criterion (`- [ ]` checkbox)
- At least one platform task
- A `**Dependencies:**` line

#### Check 7: Cross-Milestone File Consistency

No two milestones should both claim to **create** the same file. A file created in M1 can be **modified** in M3, but it should not appear as a creation task in both.

---

If all 7 checks pass, the gameplan is ready for human review. If any check fails, fix the gameplan and re-run that check before proceeding.

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
4. **Remind them:** "This gameplan must be reviewed and approved before Stage 4 (Test Generation) can run. To approve: edit `<projects-path>/$ARGUMENTS/gameplan.md`, find the Approval Checklist near the bottom, and set Status to 'Approved'. Then run `/stage4-test-generation $ARGUMENTS`."
