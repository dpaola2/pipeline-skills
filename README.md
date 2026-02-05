# OrangeQC Agent Pipeline

> **Vision:** Ingest a PRD, produce implementation code across three platforms (Rails web/API, iOS, Android), ready for QA.

---

## What This Is

An agent-orchestrated development pipeline tailored to OrangeQC's multi-platform architecture and development process. The pipeline automates the journey from **Product Requirements Document** to **code ready for QA** through seven discrete agent stages with human checkpoints at critical judgment gates.

This is not a generic CI/CD tool. It encodes OrangeQC's specific:
- Multi-platform coordination patterns (Rails API-first, mobile follows)
- Backwards compatibility requirements (old mobile apps in the field)
- Development process (Framing → Shaping → Gameplanning → Building → Testing)
- Quality standards (TDD, security scoping, convention enforcement)
- Agentic guardrails (agents never touch production)

---

## Quick Start

1. **Start here:** Read `HOW_IT_WORKS.md` for a complete walkthrough of how the pipeline works end-to-end
2. Read `docs/pipeline-architecture.md` for detailed stage specs and error handling
3. Read `docs/gap-analysis.md` for what needs to be built and in what order
4. See `docs/stages/` for deep specs on each pipeline stage
5. See `templates/` for input/output templates used by each stage

---

## Project Structure

```
.
├── README.md                          # You are here
├── HOW_IT_WORKS.md                    # End-to-end pipeline walkthrough (share this)
├── CLAUDE.md                          # Claude context for this project
├── docs/
│   ├── current-process.md             # OrangeQC's existing development process
│   ├── pipeline-architecture.md       # Full pipeline design (7 stages + checkpoints)
│   ├── orangeqc-constraints.md        # Platform, team, and guardrail constraints
│   ├── gap-analysis.md                # What's missing, what to build, priority order
│   └── stages/
│       ├── 01-discovery.md            # PRD → Discovery Report
│       ├── 02-architecture.md         # Discovery → Technical Design
│       ├── 03-gameplan.md             # Design → Spec/Gameplan
│       ├── 04-test-generation.md      # Spec → Failing Tests (TDD)
│       ├── 05-implementation.md       # Tests → Passing Code
│       ├── 06-review.md              # Code → Reviewed Code
│       └── 07-validation.md           # Reviewed Code → QA-Ready
├── templates/
│   ├── prd-intake.md                  # Structured PRD input format
│   ├── discovery-report.md            # Discovery stage output
│   ├── architecture-proposal.md       # Architecture stage output
│   ├── gameplan.md                    # Gameplan stage output
│   └── qa-readiness-report.md         # Validation stage output
└── pipeline/                          # (future) Orchestration code lives here
```

---

## Key Principles

1. **PRD quality is the bottleneck.** The pipeline is only as good as the input. Garbage in, garbage out.
2. **Human checkpoints are non-negotiable.** Agents propose, humans dispose. Architecture review happens before code generation.
3. **Agents never touch production.** All guardrails from the agentic development policy apply.
4. **Templates are the program.** The markdown templates define what agents produce. Improving templates improves output.
5. **Linear is the source of truth** for project state, tickets, and status tracking.
6. **Multi-platform alignment before implementation.** Data model and API payloads are shared contracts agreed upon before any platform writes code.

---

## Linear Integration

This pipeline is Linear-enabled:
- PRDs link to Linear projects/initiatives
- Each pipeline stage can create/update Linear issues
- Milestones from gameplans become Linear tickets
- Stage transitions update issue status
- QA readiness reports link back to all related issues

---

## Status

**Phase: Design & Documentation**

This project is in the design phase. The markdown files in this repo define the pipeline. Implementation will follow.
