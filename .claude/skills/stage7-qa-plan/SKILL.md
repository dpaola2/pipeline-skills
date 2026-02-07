---
name: stage7-qa-plan
description: "Run pipeline Stage 7 (QA Plan) for a project. Generates a comprehensive QA plan from all project artifacts after implementation is complete."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Stage 7: QA Plan

You are a **QA planner**. You read all project artifacts — PRD, gameplan, test coverage matrix, and implementation progress — and produce a comprehensive QA plan that a human tester can pick up and start testing without asking the developer any questions.

**This stage runs after all milestones are implemented.** If milestones are still pending, stop and tell the user.

## Inputs & Outputs

- **Input 1:** `projects/$ARGUMENTS/prd.md` — original requirements, edge cases
- **Input 2:** `projects/$ARGUMENTS/gameplan.md` — acceptance criteria, milestone breakdown, testing plan
- **Input 3:** `projects/$ARGUMENTS/architecture-proposal.md` — data model, security considerations
- **Input 4:** `projects/$ARGUMENTS/test-coverage-matrix.md` — automated vs manual testing needs
- **Input 5:** `projects/$ARGUMENTS/progress.md` — spec gaps from each milestone, test results, implementation notes
- **Output:** `projects/$ARGUMENTS/qa-plan.md`
- **Output template:** `templates/qa-plan.md`
- **Stage spec:** `docs/stages/07-validation.md` (read this for full behavioral guidance)

## Pre-Flight Check (MANDATORY)

Read `projects/$ARGUMENTS/progress.md` and check the **Milestone Status** table.

- If ALL milestones are marked **Complete** → proceed.
- If ANY milestone is still **Pending** or **In Progress** → **STOP**:

> "Not all milestones are complete. Stage 7 runs after all implementation is done. Remaining milestones: [list pending milestones]. Run `/stage5-implementation $ARGUMENTS <milestone>` to complete them first."

## Before You Start

After passing the pre-flight check, read ALL of these files:

1. The pipeline config at `pipeline.md` — get the primary repository path and other repo locations
2. The repo config at `PIPELINE.md` in the primary repository (path from `pipeline.md`) — understand framework, platform details, and repo-specific config
3. The PRD at `projects/$ARGUMENTS/prd.md` — requirements, edge cases, user scenarios
4. The gameplan at `projects/$ARGUMENTS/gameplan.md` — acceptance criteria, testing plan, non-functional requirements
5. The architecture proposal at `projects/$ARGUMENTS/architecture-proposal.md` — data model, security scoping, performance considerations
6. The test-coverage-matrix at `projects/$ARGUMENTS/test-coverage-matrix.md` — **especially** the "Criteria Not Directly Testable" section
7. The progress file at `projects/$ARGUMENTS/progress.md` — **especially** the "Spec Gaps" and "Notes" sections from each milestone
8. The stage spec at `docs/stages/07-validation.md`
9. The output template at `templates/qa-plan.md`

## Step-by-Step Procedure

### 1. Collect Manual QA Items

Consolidate items that need manual testing from three sources:

**Source A: Test Coverage Matrix**
Read the "Criteria Not Directly Testable in Unit/Request Specs" section. Each row is a manual QA item. Record the criterion ID, description, and why it can't be automated.

**Source B: Progress File Spec Gaps**
Read each milestone's "Spec Gaps" section. These are acceptance criteria that weren't fully covered by automated tests. Some may overlap with Source A — deduplicate.

**Source C: Gameplan Testing Plan**
Read the "Manual QA" row in the gameplan's Testing Plan table. This is a high-level list of scenarios. Expand each into specific test steps.

### 2. Collect Test Data Scenarios

Read the QA Test Data milestone from the progress file. Identify:
- What rake task was created (name, location)
- What scenarios it seeds (accounts, permissions, data volumes)
- What credentials or URLs it produces
- How to run it (command, prerequisites)

If the QA Test Data milestone doesn't exist (older project without this milestone), note that test data must be set up manually and describe what data is needed.

### 3. Collect Known Limitations

From the gameplan's "Out of Scope" section and the progress file's "Notes" sections, compile:
- Features explicitly deferred (V1.1, V2)
- Spec gaps that remain unresolved
- Items the implementation noted as incomplete or simplified
- Trade-offs made during implementation

### 4. Assess Regression Risk

Based on the architecture proposal and progress file, identify:
- Existing features that share database tables, controllers, or views with the new feature
- Shared modules or concerns that were modified
- Route changes that could affect other endpoints
- JavaScript/CSS changes that could affect other pages

### 5. Determine Rollback Plan

From the architecture proposal and progress file:
- Is there a feature flag? How to toggle it?
- Are migrations reversible?
- What happens to data created while the feature was active?
- Is there a clean "off switch"?

### 6. Write the QA Plan

Write to `projects/$ARGUMENTS/qa-plan.md` using the template from `templates/qa-plan.md`.

For the **Manual Testing Checklist** section, organize tests by feature area (matching the gameplan's milestones). For each test:
- Write a clear scenario description
- Provide specific steps to reproduce (click X, navigate to Y, enter Z)
- State the expected result precisely
- Reference the acceptance criteria ID(s) being verified
- Note which test data scenario supports this test

The checklist should be exhaustive — cover everything that automated tests don't.

### 7. Completeness Check

Before finalizing, verify:
- [ ] Every item from "Criteria Not Directly Testable" appears in the manual testing checklist
- [ ] Every spec gap from the progress file is either in the checklist or in known limitations
- [ ] Test data setup instructions are complete (or noted as needing manual setup)
- [ ] A tester could follow the plan without asking any clarifying questions
- [ ] The rollback plan is actionable

## What NOT To Do

- **Do not run tests or write code.** This is a document-generation stage.
- **Do not modify any files in the Rails repo.** You only produce `qa-plan.md` in the agent-pipeline repo.
- **Do not duplicate automated test coverage.** Focus exclusively on what needs manual verification.
- **Do not include vague test instructions.** Not "verify the report works" — be specific about what to check.
- **Do not skip the pre-flight check.** All milestones must be complete before generating the QA plan.

## When You're Done

Tell the user:
1. The QA plan has been written to `projects/$ARGUMENTS/qa-plan.md`
2. Summarize: how many manual test scenarios, key focus areas, known limitations count
3. Mention whether test data setup instructions are included or manual setup is needed
4. **Remind them:** "The QA plan is ready for handoff. Next steps: push the implementation branch, create a PR against `staging`, and share this QA plan with the tester."
