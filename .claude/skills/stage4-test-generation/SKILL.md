---
name: stage4-test-generation
description: "Run pipeline Stage 4 (Test Generation) for a project. Writes failing TDD test suites in the Rails repo from the approved gameplan."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
  - Task
---

# Stage 4: Test Generation

You are a **test writer**. You write comprehensive, failing test suites BEFORE any implementation code exists. This is TDD at the pipeline level — your tests define the contract that Stage 5 (Implementation) must satisfy.

**No implementation code is written in this stage.** Only test files and factories.

## Inputs & Outputs

- **Input 1:** `projects/$ARGUMENTS/gameplan.md` (MUST be approved) — milestones and acceptance criteria
- **Input 2:** `projects/$ARGUMENTS/architecture-proposal.md` — data model, query patterns, security design
- **Input 3:** `projects/$ARGUMENTS/prd.md` — requirement IDs and edge cases (Section 10)
- **Input 4:** `projects/$ARGUMENTS/discovery-report.md` — existing codebase context
- **Output 1:** Test files in `~/projects/orangeqc/orangeqc/spec/` (the Rails repo)
- **Output 2:** `projects/$ARGUMENTS/test-coverage-matrix.md` — maps acceptance criteria to test locations
- **Stage spec:** `docs/stages/04-test-generation.md` (read for full behavioral guidance)

## Pre-Flight Check (MANDATORY)

Before doing anything else, read `projects/$ARGUMENTS/gameplan.md` and scroll to the **Approval Checklist** section near the bottom.

- If **Status** is "Approved" or "Approved with Modifications" → proceed.
- If **Status** is "Pending" or "Rejected" or the checklist is missing → **STOP** and tell the user:

> "The gameplan has not been approved yet. Please review and approve it before running Stage 4. To approve: edit `projects/$ARGUMENTS/gameplan.md`, find the Approval Checklist near the bottom, and set Status to 'Approved'."

This gate is non-negotiable.

## Before You Start

After passing the pre-flight check, read these files:

1. The approved gameplan at `projects/$ARGUMENTS/gameplan.md` — your primary input (milestones, acceptance criteria, platform tasks)
2. The architecture proposal at `projects/$ARGUMENTS/architecture-proposal.md` — data model, query patterns, serialization, security scoping
3. The PRD at `projects/$ARGUMENTS/prd.md` — edge cases (Section 10), detailed requirement descriptions
4. The stage spec at `docs/stages/04-test-generation.md` — your role and success criteria
5. The Rails AGENTS.md at `~/projects/orangeqc/orangeqc/AGENTS.md` — **critical**: test conventions, directory structure, factory patterns, test framework configuration

## Step-by-Step Procedure

### 1. Explore Existing Test Patterns

Search the Rails repo at `~/projects/orangeqc/orangeqc/` to understand how tests are currently written. **Use Task agents for parallel exploration** — launch multiple explore agents simultaneously to gather patterns from different areas.

**Model specs** — Find 2-3 examples in `spec/models/`:
- How validations, associations, and scopes are tested
- `let`/`before` setup patterns
- Factory usage

**Request/Controller specs** — Find 2-3 examples in `spec/requests/` or `spec/controllers/`:
- How authentication is set up in tests
- How authorization is tested (permission checks, scoping)
- How JSON responses are asserted
- How error cases are tested

**Service specs** — Find examples in `spec/services/`:
- How service objects are instantiated and tested
- How complex queries are tested
- Test data setup for analytics/reporting

**System specs** — Find examples in `spec/system/` or `spec/features/`:
- Capybara driver configuration
- How pages are visited, interacted with, and asserted
- How JavaScript-dependent features are tested

**Factories** — Read `spec/factories/`:
- Existing factory definitions for models referenced in the architecture
- Factory traits and sequences in use
- What factories exist vs. what needs creating

**Export specs** — Find examples testing PDF/CSV exports:
- How export output is verified
- How `Exporter::Csvable` and `Exporter::PdfHelper` tests are structured

### 2. Plan Test Organization

Map each milestone's acceptance criteria to test files. Follow the existing Rails test directory structure — organize by test type (model/, request/, system/, services/), NOT by milestone.

Create a plan before writing anything:

| Acceptance Criterion | Test Type | Test File |
|---------------------|-----------|-----------|
| [ID from gameplan]  | Model     | `spec/models/xxx_spec.rb` |
| [ID from gameplan]  | Request   | `spec/requests/xxx_spec.rb` |

Group related criteria into test files by subject. Don't create one file per criterion.

### 3. Write Factory Definitions

Before writing tests, create any new factories needed. Place them in `spec/factories/` following existing naming conventions.

For each new model in the architecture:
- Create a factory with reasonable defaults
- Add traits for common test variations (e.g., `:with_deficiency`, `:inactive`)
- Reference existing factories for associated models — **do not redefine them**

**Check existing factories first** with `Glob` for `spec/factories/*.rb`. Never create a factory for a model that already has one.

### 4. Write Test Files — Milestone by Milestone

Work through milestones in order (M1, M2, ...). For each milestone, write the test files covering that milestone's acceptance criteria.

**For each acceptance criterion, write tests covering:**

1. **Happy path** — the criterion is met under normal conditions
2. **Authorization** — unauthorized users get the correct error/redirect
3. **Account scoping** — data from other accounts is never visible (multi-tenant isolation)
4. **Edge cases** — from the PRD's edge case table and gameplan acceptance criteria
5. **Backwards compatibility** — if the architecture specifies compat requirements

**Test writing rules:**

- **Match existing style exactly.** Use the same `describe`/`context`/`it` structure, the same `let`/`before` patterns, the same assertion style found in step 1.
- **Use descriptive test names.** `it "returns only deficient items for the current account"` not `it "works"`.
- **Reference requirement IDs** where helpful: `context "ENT-001: summary cards"`.
- **Tests MUST be syntactically valid Ruby.** They should load and parse, but FAIL because the implementation doesn't exist yet.
- **Don't stub what doesn't exist.** If `ReportSetting` doesn't exist yet, the test should fail with `NameError` — that's expected TDD behavior.
- **Don't over-test.** One test per behavior. Don't test Rails framework behavior (e.g., that `validates :presence` works in general).
- **Keep setup minimal.** Only create the test data needed for each specific test.
- **Don't create shared helpers, shared contexts, or support modules** unless the existing codebase already uses them for similar patterns.

### 5. Handle Platform Level

Check the PRD header for the project level:

- **Level 1** (small project): Rails tests only. Minimal scope.
- **Level 2** (web only): Rails tests only. Mark iOS/Android as N/A in the coverage matrix.
- **Level 3** (all platforms): Also write iOS and Android tests per the stage spec. (iOS repo: `~/projects/orangeqc/orangeqc-ios/`, Android repo: `~/projects/orangeqc/orangeqc-android/`)

### 6. Write the Coverage Matrix

Write to `projects/$ARGUMENTS/test-coverage-matrix.md`:

```markdown
# Test Coverage Matrix — [Feature Name]

> Generated by Pipeline Stage 4 (Test Generation)
> Maps every gameplan acceptance criterion to its test location(s).

| Milestone | Criterion ID | Description | Test File | Describe/Context |
|-----------|-------------|-------------|-----------|------------------|
| M1 | AC-001 | ... | `spec/models/...` | `describe "..."` |
```

**Every acceptance criterion from every milestone must appear in this matrix.** If a criterion can't be tested (rare), document why.

### 7. Verify Tests Parse Correctly

Run a syntax check on every file you created:

```bash
ruby -c spec/path/to/new_spec.rb
```

Fix any syntax errors before finishing.

**Do NOT run the full test suite or `rspec`.** The tests are expected to fail (TDD). Just verify they parse as valid Ruby.

## What NOT To Do

- **Do not write implementation code.** No models, controllers, services, migrations, views. Tests and factories only.
- **Do not modify existing test files.** Only create new files.
- **Do not modify existing factories.** Only create new factory files.
- **Do not modify any non-spec files in the Rails repo.** Nothing outside `spec/`.
- **Do not write tests that pass.** If a test would pass against the current codebase, it's testing existing behavior — remove it.
- **Do not invent test patterns.** Match the existing codebase style exactly.
- **Do not use mocks/stubs for code that doesn't exist yet.** Let the tests fail with real errors (`NameError`, `NoMethodError`). These errors become Stage 5's implementation checklist.
- **Do not skip security/scoping tests.** Every data access path needs authorization and account-scoping tests.
- **Do not modify `spec/spec_helper.rb`, `spec/rails_helper.rb`, or any support files.**

## Working in the Rails Repo

The Rails repo is at `~/projects/orangeqc/orangeqc/`.

### Branch Management

**Before writing any files**, create a dedicated branch in the Rails repo:

1. `cd ~/projects/orangeqc/orangeqc/`
2. Verify the working tree is clean (`git status`). If there are uncommitted changes, **STOP** and ask the user how to proceed.
3. Fetch the latest from origin: `git fetch origin`
4. Create and check out a new branch from `origin/staging`: `git checkout -b pipeline/$ARGUMENTS origin/staging`

If the branch `pipeline/$ARGUMENTS` already exists, **STOP** and ask the user whether to overwrite it or use a different name. Do not delete existing branches without explicit approval.

### Pre-Write Verification

**Before writing any files**, verify:
1. You're on the correct branch (`pipeline/$ARGUMENTS`)
2. You're writing to the correct directory within `spec/` (use `ls` and `Glob` to check structure)
3. No existing file will be overwritten (use `Glob` to check)
4. New factory files don't conflict with existing factories

**Files you MAY create:**
- `spec/models/` — model specs
- `spec/requests/` or `spec/controllers/` — match whichever the codebase uses
- `spec/services/` — service specs
- `spec/system/` or `spec/features/` — match whichever the codebase uses
- `spec/factories/` — new factory definitions

**Files you may NOT create or modify:**
- Anything outside `spec/`
- Existing test files
- Existing factory files
- `spec/spec_helper.rb` or `spec/rails_helper.rb`
- `spec/support/` files

## When You're Done

### Commit the Test Files

In the Rails repo (`~/projects/orangeqc/orangeqc/`), commit all new files on the `pipeline/$ARGUMENTS` branch:

1. `git add` each new file by name (do NOT use `git add .` or `git add -A`)
2. Commit with message: `Add Stage 4 test suite for $ARGUMENTS`
3. Do NOT push unless the user asks you to

### Report to User

Tell the user:
1. The branch name: `pipeline/$ARGUMENTS` in the Rails repo
2. List every file created with a brief description of what it tests
3. The coverage matrix has been written to `projects/$ARGUMENTS/test-coverage-matrix.md`
4. How many acceptance criteria are covered and by how many test cases total
5. Any acceptance criteria that couldn't be fully tested (and why)
6. Results of the syntax check (`ruby -c`)
7. **Remind them:** "All tests are expected to FAIL — they're written before implementation (TDD). You can verify they parse with `ruby -c spec/path/to/file_spec.rb`. Next step: review the tests, then run `/stage5-implementation $ARGUMENTS` to make them pass."
