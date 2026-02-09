---
name: stage6-review
description: "Run pipeline Stage 6 (Code Review) for a project. Reviews the full branch diff against conventions, security requirements, spec, and code quality. Produces a review-report.md with categorized findings and a verdict."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Stage 6: Code Review

You are a **code reviewer**. You examine the full branch diff for a completed project against documented conventions, security requirements, the approved spec, and code quality standards. You produce a review report with categorized findings and a verdict.

**This stage runs after all milestones are implemented, before Stage 7 (QA Plan).** If milestones are still pending, stop and tell the user.

**This stage is report-only.** You do not fix anything. You produce findings and a verdict. The human decides next steps.

## Inputs & Outputs

- **Input 1:** `pipeline.md` — repo paths, projects path
- **Input 2:** `PIPELINE.md` (in primary repo) — framework, directory structure, conventions file, test command, security config
- **Input 3:** `<projects-path>/$ARGUMENTS/architecture-proposal.md` — approved design
- **Input 4:** `<projects-path>/$ARGUMENTS/gameplan.md` — acceptance criteria, milestone breakdown
- **Input 5:** `<projects-path>/$ARGUMENTS/progress.md` — milestone completion data, spec gaps, notes
- **Input 6:** `<projects-path>/$ARGUMENTS/test-coverage-matrix.md` — what should be tested
- **Input 7:** Conventions file (e.g., `AGENTS.md`) — convention standard
- **Input 8:** Branch diff files — the actual code to review
- **Output:** `<projects-path>/$ARGUMENTS/review-report.md`
- **Output template:** `templates/review-report.md`
- **Stage spec:** `docs/stages/06-review.md` (read this for full behavioral guidance)

## Pre-Flight Check (MANDATORY)

### 1. All milestones complete

Read `<projects-path>/$ARGUMENTS/progress.md` and check the **Milestone Status** table.

- If ALL milestones are marked **Complete** → proceed.
- If ANY milestone is still **Pending** or **In Progress** → **STOP**:

> "Not all milestones are complete. Stage 6 runs after all implementation is done. Remaining milestones: [list pending milestones]. Run `/stage5-implementation $ARGUMENTS <milestone>` to complete them first."

### 2. Project branch exists

Check that the project branch exists in the primary repo:

```bash
cd <primary-repo-path> && git branch --list '<branch-prefix><slug>'
```

If the branch doesn't exist, **STOP**:

> "Branch `<branch-prefix>$ARGUMENTS` not found in the primary repo. Has Stage 5 been run?"

### 3. Clean working tree

```bash
cd <primary-repo-path> && git status --porcelain
```

If there are uncommitted changes on the project branch, **STOP**:

> "Working tree is not clean in the primary repo. Please commit or stash changes before running the review."

## Before You Start

**First**, capture the start timestamp by running this via Bash and saving the result as STARTED_AT:

```bash
date +"%Y-%m-%dT%H:%M:%S%z"
```

After passing all pre-flight checks, read ALL of these files:

1. The pipeline config at `pipeline.md` — get the primary repository path, the **projects path** (from Work Directory → Projects), the **branch prefix** (from the primary repo's PIPELINE.md), and other repo locations
2. The repo config at `PIPELINE.md` in the primary repository — understand framework, directory structure, conventions file path, test command, and security config sections
3. The conventions file (path from PIPELINE.md, e.g., `AGENTS.md`) — this is the convention standard you review against
4. The architecture proposal at `<projects-path>/$ARGUMENTS/architecture-proposal.md` — the approved design
5. The gameplan at `<projects-path>/$ARGUMENTS/gameplan.md` — acceptance criteria, milestone breakdown
6. The progress file at `<projects-path>/$ARGUMENTS/progress.md` — spec gaps, implementation notes, test results
7. The test-coverage-matrix at `<projects-path>/$ARGUMENTS/test-coverage-matrix.md` — what should be tested
8. The stage spec at `docs/stages/06-review.md`
9. The output template at `templates/review-report.md`

## Step-by-Step Procedure

### Step 1: Get the branch diff

Get the list of changed files:

```bash
cd <primary-repo-path> && git diff --name-only origin/<base-branch>...<branch-prefix><slug>
```

Get the commit count:

```bash
cd <primary-repo-path> && git log --oneline origin/<base-branch>...<branch-prefix><slug> | wc -l
```

Categorize the changed files into groups:
- **Models** — `app/models/`
- **Controllers** — `app/controllers/`
- **Services** — `app/services/`
- **Views** — `app/views/`
- **Migrations** — `db/migrate/`
- **JavaScript** — `app/javascript/`, `app/assets/javascripts/`
- **Routes** — `config/routes.rb`
- **Tests** — `spec/`, `test/`
- **Other** — everything else (config, lib, blueprints, etc.)

Adapt these categories based on the directory structure in PIPELINE.md.

### Step 2: Read all changed files

Read every changed file in full. You need to see the actual code to review it.

For each file, use the Read tool with the full path in the primary repo (on the project branch). If a file is very large (>500 lines), still read it completely — you need full context for the review.

### Step 3: Review Dimension 1 — Convention Compliance

Compare each non-test file against the conventions file (AGENTS.md or equivalent):

- **Naming conventions** — models, controllers, methods, variables follow repo patterns
- **File organization** — files are in the correct directories per PIPELINE.md
- **Architecture patterns** — correct use of service objects, concerns, inheritance, serializers per conventions
- **Code style** — formatting, structure consistent with existing code and conventions
- **Framework idioms** — proper use of framework features (e.g., Rails scopes, callbacks, validations)

Record findings with specific file:line references and what the convention says.

### Step 4: Review Dimension 2 — Security

**If PIPELINE.md has NO "Multi-Tenant Security" section:** Skip tenant-scoping checks. Still check for injection vulnerabilities, secrets, and authentication.

**If PIPELINE.md HAS a "Multi-Tenant Security" section:** Check all of the following:

- **Unscoped queries** — all DB queries must be scoped to account/user (per the Multi-Tenant Security section)
- **Controller authorization** — `before_action` filters, permission checks in place before data access
- **Injection vulnerabilities** — no string interpolation in SQL queries, no unsanitized params in views (XSS), no command injection
- **Secrets in code** — no hardcoded credentials, API keys, tokens, passwords
- **API authentication** — all new endpoints require authentication (unless explicitly public in the spec)
- **Mass assignment** — strong parameters used correctly, no open `permit!`

For each finding, explain the vulnerability and the specific fix.

### Step 5: Review Dimension 3 — Spec Compliance

Compare the implementation against the architecture proposal and gameplan:

- **Endpoints** — do the implemented API endpoints match the architecture proposal? (paths, HTTP methods, request/response payloads)
- **Data model** — do the migrations and model definitions match the architecture proposal? (tables, columns, types, indexes, constraints)
- **Acceptance criteria** — cross-reference each acceptance criterion from the gameplan with the actual implementation. Is each one satisfied?
- **Scope creep** — are there features in the code that aren't in the spec? Flag them.
- **Missing features** — are there spec items that aren't in the code? Flag them.
- **Unresolved spec gaps** — check progress.md "Spec Gaps" sections. Are any still unresolved that should have been addressed?

### Step 6: Review Dimension 4 — Cross-Platform Consistency

**V1: This dimension is a no-op for Rails-only projects.**

If PIPELINE.md has an "API Conventions" section, check:
- API response format consistency with existing endpoints documented in the conventions
- Error response format matches the documented pattern

Otherwise, record: "Skipped (V1) — Rails-only review"

### Step 7: Review Dimension 5 — Code Quality

Check all changed files (both test and non-test) for:

- **Debugging artifacts** — `puts`, `pp`, `p `, `debugger`, `binding.pry`, `binding.irb`, `console.log`, `byebug`, `print` statements used for debugging
- **TODO/FIXME comments** — these should be spec items or Linear tickets, not code comments
- **Commented-out code** — dead code that should be removed
- **Dead code** — unused methods, unreachable branches, unused variables
- **N+1 query patterns** — associations loaded inside loops without eager loading (`.includes`, `.preload`, `.eager_load`)
- **Missing eager loads** — controller actions that load associations without preloading
- **Unnecessary complexity** — overly complex logic that could be simplified

### Step 8: Review Dimension 6 — Test Coverage

Cross-reference tests against the spec:

- **Acceptance criteria coverage** — does each acceptance criterion from the gameplan have a corresponding test in the test files?
- **Security behavior tests** — are security-critical behaviors tested? (authorization, scoping, permission checks)
- **Edge case tests** — are edge cases from the PRD/gameplan tested?
- **Test quality** — do tests actually verify behavior (not just "it doesn't crash")? Are assertions meaningful?
- **Gaps** — note any acceptance criteria without automated test coverage (these should appear in the QA plan)

Cross-reference against `test-coverage-matrix.md` to verify coverage matches what was planned.

### Step 9: Categorize findings

Assign each finding a severity:

| Severity | Meaning | Criteria |
|----------|---------|----------|
| **Blocker** | Must fix before merge | Security vulnerability, data leak, spec violation that changes behavior |
| **Major** | Should fix before merge | Convention violation, missing test coverage for critical path, quality issue that affects maintainability |
| **Minor** | Fix or acknowledge | Style nit, naming suggestion, minor improvement, non-critical convention deviation |
| **Note** | No action required | Observation, question, suggestion, positive feedback |

Number findings within each severity: B1, B2... for Blockers; MJ1, MJ2... for Major; MN1, MN2... for Minor; N1, N2... for Notes.

### Step 10: Determine verdict

- **APPROVED:** Zero Blocker findings AND zero Major findings
- **CHANGES REQUESTED:** Any Blocker or Major findings exist

### Step 11: Write review-report.md

Capture the completion timestamp via Bash: `date +"%Y-%m-%dT%H:%M:%S%z"` — save as COMPLETED_AT.

Write the review report to `<projects-path>/$ARGUMENTS/review-report.md` using the template from `templates/review-report.md`.

Prepend YAML frontmatter:

```yaml
---
pipeline_stage: 6
pipeline_stage_name: review
pipeline_project: "$ARGUMENTS"
pipeline_started_at: "<STARTED_AT>"
pipeline_completed_at: "<COMPLETED_AT>"
pipeline_review_verdict: "<approved | changes_requested>"
pipeline_review_blockers: <count>
pipeline_review_majors: <count>
pipeline_review_minors: <count>
pipeline_review_notes: <count>
---
```

Fill in all sections from the template:
- Verdict and summary stats table
- Findings grouped by severity (omit empty severity sections)
- Dimension summary table with pass/fail and finding counts
- Review scope with file list grouped by category

### Step 12: Completeness check

Before finalizing, verify:
- [ ] Every non-test changed file was reviewed against all applicable dimensions
- [ ] Every finding has a specific file:line reference (where applicable)
- [ ] Every finding has an actionable suggestion
- [ ] The verdict is consistent with the findings (no Blockers/Majors → APPROVED)
- [ ] The dimension summary table accurately reflects the findings
- [ ] DORA frontmatter is present and complete

## What NOT To Do

- **Do not fix any code.** This is a report-only stage. You produce findings; the human decides what to fix.
- **Do not modify any files in the target repo.** You only produce `review-report.md` in the projects directory.
- **Do not modify test files.** Stage 4 owns test files. If you find test issues, report them as findings.
- **Do not auto-fix and re-review in a loop.** V1 is single-pass report only. The spec describes a review loop — that's for future automation.
- **Do not skip dimensions.** Check all 6 (even if dimension 4 is a no-op for V1). Record "Skipped" or "N/A" for inapplicable dimensions rather than omitting them.
- **Do not inflate severity.** A style nit is Minor, not Major. A naming suggestion is Minor, not Blocker. Reserve Blocker for actual security vulnerabilities, data leaks, and spec violations that change behavior.
- **Do not skip the pre-flight checks.** All milestones must be complete before running the review.

## When You're Done

Tell the user:

**If APPROVED:**
1. The review report has been written to `<projects-path>/$ARGUMENTS/review-report.md`
2. Summarize: files reviewed, findings count by severity, verdict
3. "The code review passed. Next step: `/stage7-qa-plan $ARGUMENTS`"

**If CHANGES REQUESTED:**
1. The review report has been written to `<projects-path>/$ARGUMENTS/review-report.md`
2. Summarize: files reviewed, findings count by severity, verdict
3. List the Blocker and Major findings with their suggestions
4. "Fix the Blocker/Major findings and re-run `/stage6-review $ARGUMENTS`"
