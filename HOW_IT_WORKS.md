# How the Pipeline Works

> **Audience:** Team members, stakeholders, anyone who wants to understand what this pipeline does without reading all the detailed specs.

---

## The Big Picture

A typical development process looks something like:

```
Framing → Shaping (PRD) → Gameplanning (Spec) → Building → Testing/QA
```

This pipeline automates **Gameplanning through pre-QA validation**. Framing and Shaping remain human-driven. Manual/exploratory QA remains human-driven. The pipeline sits in the middle, turning a finished PRD into code that's ready for QA.

---

## What Goes In, What Comes Out

**Input:** A PRD in structured markdown — every requirement numbered (e.g., SEC-001), platforms explicit, edge cases tabled, backwards compatibility matrix filled out.

**Output:**
- Implementation code on a feature branch, ready for PR
- Passing test suites with comprehensive coverage
- A QA Plan telling a human tester exactly what to test

---

## The Seven Stages

The pipeline has two halves separated by two human checkpoints:

```
Analysis (low risk, produces documents)
  Stage 1: Discovery
  Stage 2: Architecture
       ↓
  Checkpoint 1: Architecture Review ← You approve the data model and API contract
       ↓
  Stage 3: Gameplan
       ↓
  Checkpoint 2: Gameplan Review ← You approve the implementation plan
       ↓
Execution (writes code, creates PRs)
  Stage 4: Test Generation
  Stage 5: Implementation
  Stage 6: Review
  Stage 7: QA Plan
```

Stages 1-2 are safe to run on any PRD with zero risk — they only produce documents. The architecture gets reviewed and locked down before the gameplan is generated, and the gameplan gets reviewed before any code is written. This two-checkpoint approach catches design issues early (when they're cheap to fix) rather than during implementation (when they're expensive).

---

### Stage 1: Discovery

**What it does:** An explorer agent reads the PRD, extracts entity names and keywords, then searches across the target repo(s). It finds existing models, controllers, serializers, tests, and API endpoints related to the feature.

**Output:** A Discovery Report documenting "here's how things work TODAY." This is the automated version of M0 Discovery — understanding the current state before proposing changes.

**Why it matters:** Agents that design without understanding what exists will propose things that conflict with the codebase. Discovery prevents that.

---

### Stage 2: Architecture

**What it does:** A designer agent takes the PRD + Discovery Report and proposes the technical design:
- New tables/models with full schema (columns, indexes, constraints)
- Migration plan (DDL, backfills, safety considerations)
- API endpoint specs with example request and response JSON (if applicable)
- Backwards compatibility matrix (if applicable — e.g., mobile apps that can't be force-updated)
- Security scoping (how queries are scoped to the correct user/account)
- Impact on existing features (exports, integrations, etc.)

**Output:** An Architecture Proposal — the shared contract that all platforms build against.

**Why it matters:** This is the single source of truth for data model and API payloads. If a platform discovers the contract is wrong during implementation, the contract gets updated — not worked around.

---

### Stage 3: Gameplan

**What it does:** A planner agent synthesizes the PRD, Discovery Report, and **approved** Architecture Proposal into an engineering spec:
- Breaks the PRD into functional milestones (organized by feature area, not platform)
- Generates testable acceptance criteria per milestone
- Maps platform-specific tasks (Web/API, iOS, Android) within each milestone
- Fills the non-functional requirements checklist (security, performance, observability, exports, feature flags)
- Identifies dependencies and risks

**Output:** An Engineering Gameplan — the document the team builds against. Linear tickets are drafted (one per milestone).

**Why it matters:** This is the most important document in the pipeline. Everything downstream builds from it.

---

### Checkpoint 1: Architecture Review

**This is non-negotiable.** Before the gameplan is generated, the tech lead / CTO reviews and approves the architecture proposal. The data model and API contract are the foundation everything builds on — getting them wrong is expensive to fix later.

**What you're checking:**
- Does the data model make sense? (Tables, columns, relationships, constraints)
- Is the API design consistent with existing patterns? (Envelopes, error format, pagination)
- Is backwards compatibility handled correctly? (Compatibility matrix filled out)
- Is security scoping correct? (All queries scoped to account)
- Is the migration strategy safe?
- Are the open questions answerable?

**Outcomes:**
1. **Approved** — Stage 3 (Gameplan) begins
2. **Approved with modifications** — agent incorporates feedback, re-generates affected sections
3. **Rejected** — returns to Stage 2 (design issues) or Stage 1 (fundamental misunderstanding)

---

### Checkpoint 2: Gameplan Review

**Also non-negotiable.** Before any code is generated, the tech lead / CTO reviews and approves the gameplan. The architecture has already been approved — this review focuses on the implementation plan.

**What you're checking:**
- Are milestones properly scoped and sequenced?
- Are acceptance criteria correct and complete?
- Is every PRD requirement traceable to a milestone?
- Are platform tasks realistic?
- Is anything missing that the agent wouldn't know about? (Upcoming related changes, customer promises, in-progress work on other branches, political context)

**Outcomes:**
1. **Approved** — Stage 4 begins, Linear milestone tickets are created
2. **Approved with modifications** — agent incorporates feedback, re-generates affected sections
3. **Rejected** — returns to Stage 3 (gameplan issues) or Stage 2 (architecture needs revisiting)

---

### Stage 4: Test Generation (TDD)

**What it does:** A test writer agent reads the approved spec and writes failing tests — before any implementation code exists. Each acceptance criterion maps to one or more tests:

Test types depend on the framework (e.g., request specs, model specs, system specs for Rails; unit tests for mobile). The agent also produces a coverage matrix mapping every acceptance criterion to its test files.

**Output:** Failing test suites on a feature branch, organized by milestone. All tests should fail — nothing is implemented yet.

**Why it matters:** Tests define the contract. They're the objective measure of "done" for implementation.

---

### Stage 5: Implementation

**What it does:** A builder agent works milestone-by-milestone, writing code to make the failing tests pass. It follows the implementation order and conventions defined in the repo's conventions file (e.g., `AGENTS.md`, `CLAUDE.md`) — including the `## Pipeline Configuration` section for framework details, directory structure, and test commands.

For multi-platform products, the primary platform (typically the API backend) is implemented first so other platforms can build against it.

**Output:** Implementation commits with passing tests, one milestone at a time.

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

### Stage 7: QA Plan

**What it does:** After all milestones are implemented and tests pass, a QA plan agent consolidates everything a human tester needs:
- Collects manual QA items from the test-coverage-matrix (criteria not testable by automation)
- Documents test data setup (how to run the seed rake task)
- Produces a manual testing checklist with steps, expected results, and criteria references
- Identifies known limitations, regression risks, and rollback plan

**Output:** A QA Plan (`qa-plan.md`) that tells a human tester:
- What was built (milestone summary with commits)
- What's tested automatically (with test file references)
- What needs manual/exploratory testing (numbered scenarios with steps)
- Edge cases and boundary conditions to verify
- How to set up test data (rake task)
- How to roll back if issues are found

A QA tester can pick up the plan and start testing without asking questions.

---

## After the Pipeline

The pipeline's job is done. What follows is human-driven:

- **Manual QA** — exploratory testing, UX review, real-device testing (guided by the QA Plan)
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
| Architecture approved | Project status → "Architecture Approved" |
| Gameplan proposed | Gameplan review issue created |
| Gameplan approved | Milestone tickets created, status → "Building" |
| Tests generated | Test PRs linked to milestone tickets |
| Implementation complete | Milestone tickets → "In Progress" |
| Review passes | Milestone tickets → "In Review" |
| Validation passes | Milestone tickets → "Ready for QA" |

Every artifact links back: PRD → Discovery Report → Architecture Proposal → Gameplan → Test PRs → Implementation PRs → QA Plan. Traceability is end-to-end.

---

## Guardrails

These are non-negotiable across all stages:

| Rule | Why |
|------|-----|
| Agents never have production access | No deploy credentials, no production remotes, no production database access in agent environments |
| Human approves architecture and gameplan before code generation | Two checkpoints catch issues early: architecture review locks down the data model and API, gameplan review locks down the implementation plan |
| All CI checks must pass | No bypassing failed checks, ever |
| Human approves all merges | AI writes code → Human reviews → Human approves merge → CI/CD deploys |
| Backwards compatibility is verified (if applicable) | Old clients that can't be force-updated must continue to work |
| Security scoping is enforced (if applicable) | Multi-tenant apps must scope all queries to the correct account/user |

---

## Current Status

**The pipeline is operational and has been validated end-to-end on multiple projects.**

All stages (0-7) have Claude Code skills. Each skill is self-contained — templates and success criteria are embedded directly, with no external file dependencies.

**What's working:**
- Claude Code skills for all stages (run via `/prd`, `/discovery`, etc.)
- Multi-product support (copy skills into any repo with a conventions file)
- Complete end-to-end runs on real projects across multiple products
- Utility skills for metrics, quality checks, and release notes

**What's next:**
- Orchestration layer — automated stage chaining (currently each stage runs as a manual Claude Code session)
- Project tracker integration — automated ticket creation and status transitions

See `docs/roadmap.md` for planned improvements.

---

## Further Reading

| Document | What It Covers |
|----------|---------------|
| `docs/pipeline-architecture.md` | Detailed stage specs, error handling, cross-cutting concerns |
| `docs/current-process.md` | The development process this pipeline automates |
| `docs/stages/01-07` | Deep specs for each individual stage (design reference) |
| `docs/roadmap.md` | Planned improvements |
