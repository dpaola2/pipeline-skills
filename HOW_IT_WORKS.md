# How the Pipeline Works

> **Audience:** Team members, stakeholders, anyone who wants to understand what this pipeline does without reading all the detailed specs.

---

## The Big Picture

OrangeQC's development process has five phases:

```
Framing → Shaping (PRD) → Gameplanning (Spec) → Building → Testing/QA
```

This pipeline automates **Gameplanning through pre-QA validation**. Framing and Shaping remain human-driven. Manual/exploratory QA remains human-driven. The pipeline sits in the middle, turning a finished PRD into code that's ready for QA.

---

## What Goes In, What Comes Out

**Input:** A PRD in structured markdown — every requirement numbered (e.g., SEC-001), platforms explicit, edge cases tabled, backwards compatibility matrix filled out.

**Output:**
- Merged code across Rails, iOS, and Android
- Passing test suites with comprehensive coverage
- A QA Readiness Report telling a human tester exactly what to test

---

## The Seven Stages

The pipeline has two halves separated by a human checkpoint:

```
Analysis (low risk, produces documents)
  Stage 1: Discovery
  Stage 2: Architecture
  Stage 3: Gameplan
       ↓
  Human Checkpoint ← You review and approve here
       ↓
Execution (writes code, creates PRs)
  Stage 4: Test Generation
  Stage 5: Implementation
  Stage 6: Review
  Stage 7: Validation
```

Stages 1-3 are safe to run on any PRD with zero risk — they only produce documents. The expensive, risky part (writing code) only happens after human approval.

---

### Stage 1: Discovery

**What it does:** An explorer agent reads the PRD, extracts entity names and keywords, then searches across all three repos (Rails, iOS, Android). It finds existing models, controllers, serializers, tests, and API endpoints related to the feature.

**Output:** A Discovery Report documenting "here's how things work TODAY." This is the automated version of M0 Discovery — understanding the current state before proposing changes.

**Why it matters:** Agents that design without understanding what exists will propose things that conflict with the codebase. Discovery prevents that.

---

### Stage 2: Architecture

**What it does:** A designer agent takes the PRD + Discovery Report and proposes the technical design:
- New tables with full schema (UUIDv7 PKs, indexes, constraints)
- Migration plan (DDL, concurrent indexes, backfills)
- Full API endpoint specs with example request AND response JSON
- Backwards compatibility matrix (what each app version sees)
- Security scoping chains (how every query is scoped to account)
- Export impact (how new data appears in existing exports)

**Output:** An Architecture Proposal — the shared contract that all platforms build against.

**Why it matters:** This is the single source of truth for data model and API payloads. If a platform discovers the contract is wrong during implementation, the contract gets updated — not worked around.

---

### Stage 3: Gameplan

**What it does:** A planner agent synthesizes the PRD, Discovery Report, and Architecture Proposal into an engineering spec:
- Breaks the PRD into functional milestones (organized by feature area, not platform)
- Generates testable acceptance criteria per milestone
- Maps platform-specific tasks (Web/API, iOS, Android) within each milestone
- Fills the non-functional requirements checklist (security, performance, observability, exports, feature flags)
- Identifies dependencies and risks

**Output:** An Engineering Gameplan — the document the team builds against. Linear tickets are drafted (one per milestone).

**Why it matters:** This is the most important document in the pipeline. Everything downstream builds from it.

---

### Human Checkpoint: Spec Review

**This is non-negotiable.** Before any code is generated, the tech lead / CTO reviews and approves the gameplan.

**What you're checking:**
- Does the data model make sense architecturally?
- Is the API design consistent with existing patterns?
- Is backwards compatibility handled correctly?
- Are milestones properly scoped and sequenced?
- Are acceptance criteria correct and complete?
- Is anything missing that the agent wouldn't know about? (Upcoming related changes, customer promises, in-progress work on other branches, political context)

**Outcomes:**
1. **Approved** — Stage 4 begins, Linear tickets are created
2. **Approved with modifications** — agent incorporates feedback, re-generates affected sections
3. **Rejected** — returns to Stage 2 (architecture issues) or Stage 1 (fundamental misunderstanding)

---

### Stage 4: Test Generation (TDD)

**What it does:** A test writer agent reads the approved spec and writes failing tests — before any implementation code exists. Each acceptance criterion maps to one or more tests:

- **Rails:** Request specs (API endpoints), model specs (validations, associations), system specs (admin UI)
- **iOS:** Unit tests (model parsing, API client calls)
- **Android:** Unit tests (model parsing, API client calls)

The agent also produces a coverage matrix mapping every acceptance criterion to its test files and line numbers.

**Output:** PRs containing failing test suites, organized by milestone. All tests should fail — nothing is implemented yet.

**Why it matters:** Tests define the contract. They're the objective measure of "done" for implementation.

---

### Stage 5: Implementation

**What it does:** A builder agent works milestone-by-milestone, writing code to make the failing tests pass. The execution order is strict:

```
For each milestone:
  1. Rails API (migrations → models → controllers → serializers)
     → Deploy to staging
  2. iOS (builds against real staging API)
  3. Android (parallel with iOS, also against staging API)
  4. Rails Admin UI (parallel with mobile)
```

One PR per milestone per platform. The agent follows AGENTS.md conventions for each repo.

**Output:** Implementation PRs with passing tests.

**Why Rails goes first:** Mobile agents build against a real staging API, not a spec document. This catches integration mismatches early instead of at QA time, which is where multi-platform coordination historically breaks down.

---

### Stage 6: Review

**What it does:** A reviewer agent checks each PR against six dimensions:

1. **Convention compliance** — matches AGENTS.md patterns
2. **Security** — scoped queries, authorization, no injection vulnerabilities
3. **Spec compliance** — implementation matches the approved gameplan
4. **Cross-platform consistency** — API payloads match across platforms
5. **Code quality** — no dead code, no TODOs, no debugging artifacts
6. **Test coverage** — acceptance criteria are covered

**Auto-fix vs escalate:** Convention and style issues loop back to Stage 5 automatically. Architectural concerns and cross-platform inconsistencies escalate to a human. Maximum 3 review loops before human escalation.

**Output:** Approved PRs, or specific change requests sent back to Stage 5.

---

### Stage 7: Validation

**What it does:** After all PRs are reviewed and merged, a validator agent runs a final sweep:
- Full test suite across all platforms (zero failures, zero regressions)
- Acceptance criteria coverage audit (every criterion either has automated tests or is flagged for manual QA)
- Backwards compatibility verification
- Feature flag configuration check
- Cross-platform consistency final check

**Output:** A QA Readiness Report that tells a human tester:
- What was built (milestone summary)
- What's tested automatically (with test references)
- What needs manual/exploratory testing (with steps and expected results)
- Backwards compatibility scenarios to verify
- How to set up test data
- How to roll back if issues are found

Linear tickets transition to "Ready for QA."

---

## After the Pipeline

The pipeline's job is done. What follows is human-driven:

- **Manual QA** — exploratory testing, UX review, real-device testing (guided by the QA Readiness Report)
- **Stakeholder review** — demo, approval
- **Production deployment** — human-triggered, agents never have production access
- **Post-deploy monitoring**

---

## How Linear Ties It All Together

Linear is the state machine for the entire pipeline:

| Event | Linear Action |
|-------|--------------|
| Pipeline starts | Project created, linked to PRD |
| Discovery complete | Project updated with findings |
| Architecture proposed | Architecture review issue created |
| Gameplan approved | Milestone tickets created |
| Tests generated | Test PRs linked to milestone tickets |
| Implementation complete | Milestone tickets → "In Progress" |
| Review passes | Milestone tickets → "In Review" |
| Validation passes | Milestone tickets → "Ready for QA" |

Every artifact links back: PRD → Discovery Report → Architecture Proposal → Gameplan → Test PRs → Implementation PRs → QA Report. Traceability is end-to-end.

---

## Guardrails

These are non-negotiable across all stages:

| Rule | Why |
|------|-----|
| Agents never have production access | No Heroku remotes, no App Store credentials, no Play Store credentials in agent environments |
| Human approves before code generation | The spec review checkpoint catches what agents miss: product judgment, political context, undocumented work |
| All CI checks must pass | No bypassing failed checks, ever |
| Human approves all merges | AI writes code → Human reviews → Human approves merge → CI/CD deploys |
| Backwards compatibility is verified | ~75% of mobile users are on older versions that can't be force-updated |
| All queries scoped to account | Multi-tenant. No cross-tenant data leakage. |

---

## Current Status

**This pipeline is in the design phase, preparing for first use on Rails-only projects.**

The pipeline launches with **Rails only**. Rails test infrastructure is in place (RSpec in CI, coverage expanding), and Rails capacity is the team's biggest bottleneck. iOS and Android test infrastructure is developing rapidly but isn't ready for pipeline use yet. Mobile stages will be added later.

For Rails-only projects, the pipeline still designs the API contract that mobile will eventually build against — we don't skip API design, we just defer mobile implementation.

**What's ready:**
- Stage specs, templates, and process documentation are complete
- Rails test infrastructure (RSpec in CI)

**What's next:**
1. **AGENTS.md for the Rails repo** — documented conventions so agents produce OrangeQC-flavored code
2. **A structured PRD** — convert one real PRD to the pipeline's input format
3. **Prototype Stages 1-3** — run Discovery → Architecture → Gameplan against the real PRD and evaluate output

**What comes later:**
- Orchestration code (currently each stage runs as a manual Claude Code session)
- iOS/Android expansion (when their test suites mature)

See `docs/gap-analysis.md` for the full prioritized roadmap.

---

## Further Reading

| Document | What It Covers |
|----------|---------------|
| `docs/pipeline-architecture.md` | Detailed stage specs, error handling, cross-cutting concerns |
| `docs/current-process.md` | The OrangeQC development process this automates |
| `docs/orangeqc-constraints.md` | Platform, team, and guardrail constraints |
| `docs/gap-analysis.md` | What's missing, priority order, implementation sequence |
| `docs/stages/01-07` | Deep specs for each individual stage |
| `templates/` | Input/output templates used by each stage |
