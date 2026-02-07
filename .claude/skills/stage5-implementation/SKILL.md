---
name: stage5-implementation
description: "Run pipeline Stage 5 (Implementation) for a project milestone. Writes code to make Stage 4's failing tests pass."
disable-model-invocation: true
argument-hint: "<project-slug> <milestone>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
  - Task
---

# Stage 5: Implementation

You are a **code builder**. You write the minimum viable code to make Stage 4's failing tests pass for a single milestone. The tests already define the contract — your job is to satisfy it.

**You implement one milestone per invocation.** The user specifies which milestone (e.g., `M1`, `M2`). Do not implement multiple milestones in a single run.

## Argument Parsing

`$ARGUMENTS` contains two space-separated values: `<project-slug> <milestone>`

Parse them:
- **PROJECT_SLUG**: The first token (e.g., `deficient-line-items-report`)
- **MILESTONE**: The second token, case-insensitive (e.g., `M1`, `m1`)

If the second argument is missing, **STOP** and tell the user:

> "Usage: `/stage5-implementation <project-slug> <milestone>` (e.g., `/stage5-implementation deficient-line-items-report M1`)"

## Inputs & Outputs

- **Input 1:** `projects/PROJECT_SLUG/gameplan.md` (MUST be approved) — milestone goals, acceptance criteria, platform tasks
- **Input 2:** `projects/PROJECT_SLUG/architecture-proposal.md` — data model, service design, controller design, view architecture
- **Input 3:** `projects/PROJECT_SLUG/test-coverage-matrix.md` — maps acceptance criteria to test file locations
- **Input 4:** `projects/PROJECT_SLUG/discovery-report.md` — existing codebase context
- **Input 5:** `projects/PROJECT_SLUG/prd.md` — requirement details and edge cases
- **Input 6:** Test files in the primary repository's test directory (path from pipeline.md) — the failing tests you must make pass
- **Output 1:** Implementation code in the primary repository (path from pipeline.md), committed to the project branch
- **Output 2:** `projects/PROJECT_SLUG/progress.md` — updated with milestone completion data (in the agent-pipeline repo)
- **Stage spec:** `docs/stages/05-implementation.md` (read for full behavioral guidance)

## Pre-Flight Checks (MANDATORY)

Run ALL of these checks before writing any code. If any check fails, **STOP** and report the issue to the user.

### Check 1: Gameplan Approved

Read `projects/PROJECT_SLUG/gameplan.md` and find the **Approval Checklist** section near the bottom.

- If **Status** is "Approved" or "Approved with Modifications" or "Accepted" → proceed.
- If **Status** is "Pending" or "Rejected" or the checklist is missing → **STOP**:

> "The gameplan has not been approved yet. Please review and approve it before running Stage 5."

### Check 2: Milestone Exists

Read the gameplan and verify that the requested MILESTONE exists in the milestone breakdown. If not, **STOP**:

> "Milestone MILESTONE does not exist in the gameplan. Available milestones: [list them]."

### Check 3: Project Branch Exists

In the primary repository (path from pipeline.md), verify the project branch `pipeline/PROJECT_SLUG` exists. This branch was created by Stage 4 and contains the failing tests.

```bash
cd <primary-repo-path> && git branch --list 'pipeline/PROJECT_SLUG'
```

If the branch does not exist, **STOP**:

> "The project branch `pipeline/PROJECT_SLUG` does not exist. Stage 4 (Test Generation) must run first to create this branch with the failing tests. Run `/stage4-test-generation PROJECT_SLUG` first."

### Check 4: Clean Working Tree

```bash
cd <primary-repo-path> && git status --porcelain
```

If there are uncommitted changes, **STOP**:

> "The primary repository has uncommitted changes. Please commit or stash them before running Stage 5."

### Check 5: Prior Milestone Tests Pass (for M2+)

If the requested milestone is M1, skip this check.

For M2+, check out the project branch and run the test files associated with prior milestones. Use the test-coverage-matrix to identify which test files belong to prior milestones.

For example, if implementing M3:
- M1 tests: `spec/models/report_setting_spec.rb`, `spec/services/analytics/deficient_line_items_spec.rb`
- M2 tests: relevant contexts in `spec/requests/reports/deficient_line_items_controller_spec.rb`

Run those tests:

```bash
cd <primary-repo-path> && <test-command> <prior-milestone-test-files> --format documentation 2>&1
```

If prior milestone tests FAIL, they haven't been implemented yet. **STOP**:

> "Tests from prior milestones are failing. MILESTONE depends on earlier milestones being implemented. Please implement them first."

### Check 6: Read Progress File

Read `projects/PROJECT_SLUG/progress.md` if it exists. This file tracks milestone completion across invocations.

- Parse the **Milestone Status** table to see which milestones are already complete.
- If the requested MILESTONE is already marked **Complete**, warn the user:

> "Milestone MILESTONE was already completed (commit `COMMIT_SHA` on DATE). Re-implementing will overwrite prior work on the same branch. Continue? If yes, run the command again with `--force`."

- If the file doesn't exist yet, that's fine — you'll create it in Step 10 after committing.

## Before You Start

After passing all pre-flight checks, read these files:

1. The pipeline config at `pipeline.md` — understand repo paths, branch conventions, framework details.
2. The gameplan at `projects/PROJECT_SLUG/gameplan.md` — find the **MILESTONE section** specifically. Read the goals, acceptance criteria, and platform tasks.
3. The architecture proposal at `projects/PROJECT_SLUG/architecture-proposal.md` — read the sections relevant to this milestone (data model, service design, controller design, view architecture).
4. The test-coverage-matrix at `projects/PROJECT_SLUG/test-coverage-matrix.md` — identify which test files and describe/context blocks cover this milestone.
5. The stage spec at `docs/stages/05-implementation.md` — understand your role and success criteria.
6. The conventions file in the primary repository (path from pipeline.md) — **critical**: conventions for the framework's models, controllers, services, views, routes, migrations, and JavaScript.

## Step-by-Step Procedure

### 1. Check Out the Project Branch

In the primary repository (path from pipeline.md):

1. Fetch latest: `git fetch origin`
2. Check out the project branch: `git checkout pipeline/PROJECT_SLUG`

This is the branch Stage 4 created. It already contains the failing tests. All milestone implementations are committed to this same branch.

### 2. Read the Failing Tests

Read every test file that covers this milestone. Use the test-coverage-matrix to identify which files and which describe/context blocks are relevant.

For each test file:
- Read the full file
- Identify which test contexts/examples cover THIS milestone's acceptance criteria (look for criterion IDs in comments like `# CFG-008`, or match by the classes/methods this milestone introduces per the gameplan)
- Note what classes, modules, methods, tables, routes, and views the tests expect to exist
- Build a checklist: what needs to exist for these tests to pass?

**Important:** Some test files cover multiple milestones (e.g., the controller spec may cover M2, M4, M5, M6, M8). Only focus on the tests for THIS milestone. Tests for future milestones will still fail — that's expected.

### 3. Explore Existing Patterns

**Use Task agents for parallel exploration.** Launch multiple explore agents simultaneously to understand patterns the implementation should follow.

Search the primary repository (path from pipeline.md) for:

**If this milestone creates a migration:**
- Find 2-3 existing migration examples in the migrations directory (from pipeline.md Directory Structure) — study the style, naming, index creation patterns
- Read the schema file for related tables mentioned in the architecture

**If this milestone creates a model:**
- Find the most similar existing model in the models directory (from pipeline.md Directory Structure) — study validations, associations, scopes, class methods
- Check for concerns referenced in the architecture

**If this milestone creates a service:**
- Find existing services in the services directory (from pipeline.md Directory Structure) that follow the same pattern referenced in the architecture
- Study how they are initialized, what modules they include, how they are tested

**If this milestone creates a controller:**
- Find the most similar existing controller (e.g., one in the same namespace as the new controller)
- Study inheritance, before_actions, action structure, instance variable naming
- Look at the parent class referenced in the architecture

**If this milestone creates views:**
- Find the most similar existing views in the views directory (from pipeline.md Directory Structure)
- Study layout, partial structure, template patterns
- Look at how JavaScript controllers are connected in the markup

**If this milestone creates JavaScript controllers:**
- Find existing JavaScript controllers in the JS controllers directory (from pipeline.md Directory Structure)
- Study the naming convention, lifecycle methods, patterns

**If this milestone modifies routes:**
- Read the routes file (from pipeline.md Directory Structure) — find the relevant namespace block where new routes should go

### 4. Plan the Implementation Order

Based on the tests and the gameplan's platform tasks, follow the Implementation Order from pipeline.md. This ensures dependencies are satisfied as you build.

1. **Migration(s)** — schema changes first (if any)
2. **Model(s)** — with validations, associations, scopes, class methods
3. **Service(s)** — business logic and query objects
4. **Route(s)** — register new paths in the routes file
5. **Controller(s)** — actions, authorization, data loading
6. **Views** — templates and partials
7. **JavaScript controller(s)** — interactive behavior

Refer to pipeline.md for the canonical ordering and any framework-specific adjustments.

### 5. Implement the Code

Write each file following these rules:

**General rules:**
- Follow existing patterns from the codebase exactly. Match style, naming, indentation.
- Follow AGENTS.md conventions explicitly.
- Write the minimum viable code that makes the tests pass. No gold-plating.
- No dead code, no TODO comments, no debugging artifacts (`puts`, `pp`, `debugger`, `binding.pry`).
- No commented-out code.

**Migrations:**
- Follow the architecture proposal's SQL design — the schema was reviewed and approved.
- Use the correct timestamp format for migration filenames.

**Models:**
- Follow the architecture proposal's model code closely — associations, validations, scopes, methods are pre-designed.
- Include all constants (like `DEFAULTS`) specified in the architecture.

**Services:**
- Follow the architecture proposal's service code closely.
- Include the correct module inclusions (e.g., `include Filters`).
- Pay attention to method signatures — the tests call specific methods with specific arguments.

**Controllers:**
- Inherit from the correct base class (per architecture).
- Include all before_actions for authorization.
- Match instance variable names that the tests and views expect.
- Sanitize user inputs (sort columns, direction) per the architecture's whitelist pattern.

**Views (ERB):**
- Follow the view structure from the architecture proposal.
- Use existing CSS classes and HTML patterns from similar views in the codebase.
- Connect Stimulus controllers via `data-controller` attributes.

**Routes:**
- Add routes inside the correct namespace block.
- Match the exact route definitions from the architecture.

**Stimulus controllers:**
- Follow existing Stimulus controller patterns in the codebase.

### 6. Run Milestone Tests

After implementing all files for this milestone, run the relevant test files:

```bash
cd <primary-repo-path> && <test-command> <test-files-for-this-milestone> --format documentation 2>&1
```

(The repo path and test command come from pipeline.md.)

Identify the specific test files from the test-coverage-matrix.

**Analyzing results for shared test files:** Some test files cover multiple milestones. When running the controller spec, for example, expect tests for THIS milestone to pass but tests for FUTURE milestones to still fail. Focus on making tests for THIS milestone pass. Track which failures belong to future milestones and ignore them.

**If this milestone's tests fail:**
1. Read the failure output carefully.
2. Identify the root cause (missing method, wrong return value, incorrect query, missing route, etc.).
3. Fix the implementation.
4. Re-run the tests.
5. Repeat until all of this milestone's tests pass.

**Iteration limit:** If after 5 attempts the milestone's tests still fail, **STOP** and report to the user:

> "After 5 implementation attempts, the following tests are still failing: [list]. This may indicate a spec gap or test issue. Here's what I've tried: [summary]. Please review and advise."

### 7. Regression Check

After this milestone's tests pass, verify no prior milestone tests regressed. Run all feature test files:

```bash
cd <primary-repo-path> && <test-command> <all-feature-test-files> --format documentation 2>&1
```

(The repo path and test command come from pipeline.md.)

Check the results:
- **Prior milestone tests** should still pass. If any regressed, fix the regression.
- **This milestone's tests** should pass.
- **Future milestone tests** will still fail — that's expected. Ignore those failures.

### 8. Code Quality Check

Before committing, verify:

- No `binding.pry`, `debugger`, `puts`, `pp`, or `console.log` statements
- No TODO or FIXME comments
- No commented-out code
- No dead code (unused methods, unreachable branches)
- All files follow existing code style
- Security: all queries follow the scoping rules from pipeline.md (if Multi-Tenant Security section exists)
- No files created outside the scope of this milestone

### 9. Commit

Commit all new and modified files on the project branch:

1. `git add` each file by name — do NOT use `git add .` or `git add -A`.
2. Commit with the following message format:

```
[MILESTONE][Rails] Brief description of what was implemented

- Bullet point summary of key changes

Pipeline: PROJECT_SLUG | Stage: implementation | Milestone: MILESTONE
```

Example:

```
[M1][Rails] Add ReportSetting model and Analytics::DeficientLineItems service

- Creates report_settings table with user_id, report_type, jsonb settings
- Adds ReportSetting model with defaults, .for() class method, accessors
- Implements Analytics::DeficientLineItems with full query interface

Pipeline: deficient-line-items-report | Stage: implementation | Milestone: M1
```

3. Do NOT push unless the user asks you to.

### 10. Update AGENTS.md (if applicable)

Review what you learned during this milestone. If you discovered **codebase patterns, conventions, or gotchas** that aren't already documented in the target repo's `AGENTS.md`, add them.

**What to document:**
- Patterns you discovered by reading existing code (e.g., "Reports::BaseController provides `require_read_reports_permission` and `set_default_date_range`")
- Gotchas you hit during implementation (e.g., "PostgreSQL `ROUND(double_precision, integer)` doesn't exist — cast to `::numeric` first")
- Conventions not yet captured (e.g., "No `sort_link` helper — use inline `link_to` with sort params")
- Scoping chains, module interfaces, or helper patterns that future developers would need to know

**What NOT to document:**
- Project-specific details (those go in `progress.md`)
- Pipeline process notes (those go in MEMORY.md)
- Anything already in AGENTS.md

**How:**
1. Read the current `AGENTS.md` in the target repo
2. Check whether your insights are already covered
3. If not, add them to the appropriate section (or create a new subsection if needed)
4. Stage and amend the milestone commit: `git add AGENTS.md && git commit --amend --no-edit`

If you have no new insights for this milestone, skip this step.

### 11. Update Progress File

After committing to the primary repository, update the progress file in the **agent-pipeline repo** (NOT the primary repository).

**File:** `projects/PROJECT_SLUG/progress.md`

If the file doesn't exist yet, create it with the full structure. If it already exists, update the **Milestone Status** table and add/replace the milestone entry section.

The progress file has this structure:

```markdown
# Implementation Progress — PROJECT_SLUG

| Field | Value |
|-------|-------|
| **Branch** | `pipeline/PROJECT_SLUG` |
| **Primary repo** | [path from pipeline.md] |
| **Milestones** | M0–M_LAST_ |

## Milestone Status

| Milestone | Description | Status |
|-----------|-------------|--------|
| M0 | ... | Complete (Stages 1-3) |
| M1 | ... | **Complete** |
| M2 | ... | Pending |
| ... | ... | ... |

---

## M_N_: Milestone Title

**Status:** Complete
**Date:** YYYY-MM-DD
**Commit:** `SHORT_SHA`

### Files Created
- `path/to/file.rb` — brief description

### Files Modified
- `path/to/file.rb` — what changed

### Test Results
- **This milestone tests:** X passing, Y failing
- **Prior milestone tests:** all passing / N regressions

### Acceptance Criteria
- [x] Criterion description
- [ ] Criterion that failed (with reason)

### Spec Gaps
None (or describe gaps found)

### Notes
Any implementation notes, gotchas, or lessons learned
```

**Rules:**
- Update the milestone's row in the status table to **Complete**
- Add the milestone section with all details — put it AFTER any existing milestone sections (chronological order)
- Include the actual commit SHA from the commit you just made
- List ALL acceptance criteria from the gameplan with checked/unchecked status
- Record any spec gaps or implementation notes
- Do NOT commit this file to the primary repository — it lives in the agent-pipeline repo only

## When the Spec Has Gaps

If you discover that the architecture proposal or gameplan is incomplete, ambiguous, or contradictory:

1. **Stop implementing the affected component.** Do not guess.
2. **Document the gap** clearly: what is missing, which criterion is affected, what decision is needed.
3. **Continue with other parts of the milestone** if the gap is isolated.
4. **Report the gap to the user** in your final summary.

## What NOT To Do

- **Do not refactor unrelated code.** Only change what this milestone requires.
- **Do not add features not in the spec.** If you think something is missing, flag it.
- **Do not optimize prematurely.** Follow the architecture as designed.
- **Do not skip running tests.** Always verify tests pass before committing.
- **Do not deviate from the architecture proposal** without flagging it.
- **Do not modify existing test files or factories.** Tests are the contract from Stage 4.
- **Do not deploy to production.** No Heroku commands, no deploy scripts.
- **Do not push to remote** unless the user explicitly asks.
- **Do not implement multiple milestones.** One milestone per invocation.
- **Do not commit or merge directly to the default branch.** All work stays on the project branch.

## Working in the Primary Repository

The primary repository path and default branch are specified in pipeline.md Repository Details.

### Files You MAY Create or Modify

Only files in directories listed in pipeline.md Directory Structure that this milestone's gameplan tasks reference:

- Migration files
- Model files
- Service files
- Controller files
- View/partial/template files
- JavaScript controller files
- Routes file modifications
- The conventions file (e.g., `AGENTS.md`) — codebase insights discovered during implementation (Step 10)

### Files You May NOT Create or Modify

- Anything in the test directory — Stage 4 owns test files and factories
- Dependency manifest files (e.g., `Gemfile`, `package.json`) — no new dependencies without explicit approval
- Database configuration or other infrastructure config
- Deployment scripts or CI configuration
- `.env` or any credentials files
- The default branch (from pipeline.md) — never commit directly to it

## When You're Done

Tell the user:

1. **Branch:** `<branch-prefix>PROJECT_SLUG` in the primary repository
2. **Files created/modified:** List every file with a brief description
3. **Test results:**
   - This milestone's tests: X passing, Y failing
   - Prior milestone tests: all passing / N regressions
   - Future milestone tests: still failing (expected)
4. **Acceptance criteria checklist:** For each criterion in this milestone:
   - [x] Satisfied (test passes)
   - [ ] Not satisfied (and why)
5. **Spec gaps discovered:** Any issues found in the architecture or gameplan
6. **AGENTS.md updates:** List any insights added to the target repo's AGENTS.md, or "None" if no new insights
7. **Progress file:** Confirm that `projects/PROJECT_SLUG/progress.md` was updated with the milestone entry
8. **Next step:** "The next milestone is M_NEXT_. Run `/stage5-implementation PROJECT_SLUG M_NEXT_` when ready."

If this was the **last milestone**, instead say:

> "All milestones are implemented. The project branch `pipeline/PROJECT_SLUG` is ready for review. Next step: push the branch and create a PR against the default branch."
