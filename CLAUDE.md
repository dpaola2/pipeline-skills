# Agent Pipeline - Claude Context

## What This Project Is

This is a toolkit for agent-orchestrated software development. The pipeline takes a PRD (Product Requirements Document) as input and produces implementation code that is ready for QA. It works with any codebase that has a conventions file with a `## Pipeline Configuration` section.

**This repo is the skill source.** Skills are copied into target repos and run from there — Claude Code sessions happen in the target repo directory, not here.

**Read these files to get oriented:**
1. `docs/workspace-setup.md` - How the workspace is organized and how to get started
2. `docs/pipeline-architecture.md` - The full pipeline design
3. `docs/gap-analysis.md` - What's missing and what to build
4. `docs/roadmap.md` - Future improvements

---

## Pipeline Configuration

Configuration lives in a single place: the **conventions file** in each target repo.

### Conventions File (each target repo)

Each target repo has a conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md`) with a `## Pipeline Configuration` section. This section contains everything skills need:

- **Work Directory** — projects path, inbox path (where project artifacts live)
- **Project Tracker** — Linear, GitHub Issues, or none
- **Related Repositories** — paths to API docs, mobile repos, etc. (optional)
- **Repository Details** — default branch, test command, branch prefix, PR base branch
- **Platforms** — which platforms this project targets
- **Framework & Stack** — language, test framework, database, frontend
- **Directory Structure** — where models, controllers, tests, etc. live
- **Implementation Order** — natural build sequence for milestones
- **Optional sections** — API conventions, multi-tenant security, backwards compat, feature flags, post-flight checks, complexity analysis, guardrails

Skills locate the conventions file in the repo root (first of `CLAUDE.md`, `AGENTS.md`, `CONVENTIONS.md` found) and read the `## Pipeline Configuration` section for all config.

**To add a new product to the pipeline:**
1. Copy the skills from `.claude/skills/` into the target repo
2. Add a `## Pipeline Configuration` section to the target repo's conventions file (use an existing repo's section as a template)
3. Create the projects directory (e.g., `../pipeline-projects/` with an `inbox/` subdirectory)

Sections marked REQUIRED apply to every project. Sections marked OPTIONAL can be omitted if they don't apply.

**Why project artifacts live outside the target repo:** Project artifacts (PRDs, gameplans, progress files) are *pipeline-scoped*, not *repo-scoped*. A multi-platform project may touch several repos simultaneously — its artifacts can't live inside any single target repo.

---

## Pipeline Skills (Running the Pipeline)

### Project Levels

Projects are categorized by scope. Level definitions adapt based on what Pipeline Configuration → Platforms lists:

**If Platforms lists only ONE active platform:**
- **Level 1:** Small, self-contained changes (1-2 files)
- **Level 2:** Medium scope features (new pages, reports, workflows)
- **Level 3:** Large scope features (significant new capability, multiple milestones)

**If Platforms lists MULTIPLE active platforms:**
- **Level 1:** Small, single-platform only
- **Level 2:** Primary platform only (may involve model + controller + views but stays within one platform)
- **Level 3:** Cross-platform features (requires coordinated changes across all active platforms)

The PRD header specifies the level. Skills adapt their output accordingly.

### Project Directory Convention

Project artifacts live **outside the target repo**, in a configurable directory. The path is set in Pipeline Configuration → Work Directory → Projects. Each project is a subdirectory named with a kebab-case slug:

```
<projects-path>/my-feature/
  prd.md                        # Input: the structured PRD
  discovery-report.md            # Output of Stage 1
  architecture-proposal.md       # Output of Stage 2 (requires human approval)
  gameplan.md                    # Output of Stage 3 (requires human approval)
  test-coverage-matrix.md        # Output of Stage 4
  progress.md                    # Output of Stage 5 (milestone tracking)
  qa-plan.md                     # Output of Stage 7
  decisions/                     # ADRs — significant technical decisions (Stages 2, 5)
```

The inbox (raw input notes for Stage 0) also lives externally, at Pipeline Configuration → Work Directory → Inbox.

### Running the Pipeline

The pipeline runs manually from the target repo directory, one stage at a time:

```
/stage0-prd                                       → lists inbox files, asks for selection + slug,
                                                    produces prd.md (REVIEW BEFORE CONTINUING)

/stage1-discovery <project-slug>                  → produces discovery-report.md
                                                    (optional: review discovery report)

/stage2-architecture <project-slug>               → produces architecture-proposal.md
                                                    REQUIRED: review and approve architecture

/stage3-gameplan <project-slug>                   → produces gameplan.md (checks for approval first)
                                                    REQUIRED: review and approve gameplan

/stage4-test-generation <project-slug>            → produces failing tests + test-coverage-matrix.md

/stage5-implementation <project-slug> <milestone> → implements one milestone, updates progress.md
                                                    (run once per milestone: M1, M2, ...)

/stage7-qa-plan <project-slug>                    → produces qa-plan.md (checks all milestones complete)

/create-pr <project-slug>                         → pushes branch, creates PR against default branch

/release-notes <cycle_number>                     → generates release notes from Linear cycle data
                                                    (standalone utility, not a pipeline stage)
```

### Human Checkpoints

**After Stage 2 (Architecture Review):**
Edit `<projects-path>/<slug>/architecture-proposal.md`, find the Approval Checklist at the bottom, set Status to "Approved" (or "Approved with Modifications"), and fill in the reviewer checklist. Stage 3 will refuse to run until this is done.

**After Stage 3 (Gameplan Review):**
Review `<projects-path>/<slug>/gameplan.md` and confirm the milestones, acceptance criteria, and sequencing are correct before any future stages run.

---

## Working in This Project

### Current Phase: Operational
- Skills exist for Stages 0-7, plus create-pr, metrics, quality, release-notes, and backfill-timing (`.claude/skills/`)
- Each stage runs as a manual Claude Code session from the target repo
- Skills are self-contained — templates and success criteria are embedded, not external files

### Future Phase: Orchestration
- Build orchestration code in `pipeline/` for automated stage chaining
- Wire up Linear integration (automated ticket creation, status transitions)

### Key Principles
- **Skills are self-contained.** Each skill embeds its own template and success criteria. No external file dependencies at runtime.
- **Each stage has defined inputs and outputs.** Stages are composable and independently testable.
- **Human checkpoints are architectural, not optional.** Don't try to remove them.
- **The conventions file is the source of truth** for how a target repo works. Skills read it for all framework-specific details.

---

## Linear Integration

The pipeline uses Linear for:
- **Project tracking:** Pipeline runs map to Linear projects
- **Issue creation:** Milestones from gameplans become Linear issues
- **Status updates:** Stage transitions update issue status
- **Linking:** PRDs, specs, PRs, and QA reports link to Linear issues

When working with Linear in this project:
- Use the Linear MCP tools (list_issues, create_issue, update_issue, etc.)
- Milestone tickets should be tagged with the pipeline stage that created them

---

## Repo Conventions

- All documentation in Markdown
- Use Obsidian-compatible wiki-links where helpful: `[[filename]]`
- Checklists use `- [ ]` format
- Mermaid diagrams for flow visualization
- Stage design docs in `docs/stages/` are architectural reference only (not runtime dependencies)

---

## What NOT To Do

- Don't try to automate Framing or Shaping - those are human judgment phases
- Don't remove human checkpoints from the pipeline
- Don't assume PRD quality - validate it
- Don't build platform-specific code without a shared data model/API contract
- Don't give agents production access (no deploy credentials, no production remotes)
- Don't optimize for speed over correctness in early iterations
