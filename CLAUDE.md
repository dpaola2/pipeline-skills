# Agent Pipeline - Claude Context

## What This Project Is

This is the design and implementation of an agent-orchestrated development pipeline for OrangeQC. The pipeline takes a PRD (Product Requirements Document) as input and produces implementation code across three platforms (Rails web/API, iOS, Android) that is ready for QA.

**Read these files to get oriented:**
1. `docs/pipeline-architecture.md` - The full pipeline design
2. `docs/current-process.md` - The OrangeQC development process this automates
3. `docs/orangeqc-constraints.md` - Platform, team, and guardrail constraints
4. `docs/gap-analysis.md` - What's missing and what to build

---

## OrangeQC Context

### The Company
- **Product:** Quality control software for facilities management
- **Platforms:** Rails web/API, iOS (Swift), Android (Kotlin)
- **Architecture:** API-first. Rails backend serves API to mobile clients. Web admin interface also on Rails.
- **Key constraint:** Old mobile apps in the field. ~75% of users on older versions. Backwards compatibility is critical.
- **Team:** Small. CTO (Dave), Senior iOS (Chris), Senior Android (Shanitha), Rails agency (Stepwyz, ~7 hrs/week)

### The Development Process (Current)
```
Framing → Shaping (PRD) → Gameplanning (Spec) → Building → Testing/QA
```

This pipeline automates **Gameplanning → Building → pre-QA validation**. Framing and Shaping remain human-driven. Manual/exploratory QA remains human-driven.

### Critical OrangeQC-Specific Concerns
1. **Multi-platform coordination** - Features touch Web, iOS, Android, and API. Data model and API payloads must be aligned BEFORE platforms build independently.
2. **Backwards compatibility** - Old mobile apps cannot be force-updated. New API changes must not break old clients. Compatibility matrices are required.
3. **Export/reporting** - Customers rely on PDF/Excel/CSV exports. Breaking export formats breaks customer workflows.
4. **Security scoping** - All DB queries must be scoped to account/user (multi-tenant). No cross-tenant data leakage.
5. **Agentic guardrails** - Agents NEVER have a path to production. No Heroku remotes in dev environments. No production deploy credentials accessible to agents.

---

## Pipeline Skills (Running the Pipeline)

### Project Levels

OrangeQC categorizes projects by scope:
- **Level 1:** Small projects that Matt and Dave can pull from idea to fruition
- **Level 2:** Projects involving web only (Rails) — the pipeline's current sweet spot
- **Level 3:** Projects involving all three platforms (Rails + iOS + Android)

The PRD header specifies the level. Skills adapt their output accordingly.

### Project Directory Convention

Each pipeline project lives in `projects/<slug>/` where `<slug>` is a kebab-case name:

```
projects/deficient-line-items-report/
  prd.md                        # Input: the structured PRD
  discovery-report.md            # Output of Stage 1
  architecture-proposal.md       # Output of Stage 2 (requires human approval)
  gameplan.md                    # Output of Stage 3 (requires human approval)
  test-coverage-matrix.md        # Output of Stage 4
  progress.md                    # Output of Stage 5 (milestone tracking)
  qa-plan.md                     # Output of Stage 7
```

### Running the Pipeline

The pipeline runs manually, one stage at a time:

```
/stage1-discovery <project-slug>                  → produces discovery-report.md
                                                    (optional: review discovery report)

/stage2-architecture <project-slug>               → produces architecture-proposal.md
                                                    REQUIRED: review and approve architecture

/stage3-gameplan <project-slug>                   → produces gameplan.md (checks for approval first)
                                                    REQUIRED: review and approve gameplan

/stage4-test-generation <project-slug>            → produces failing tests in Rails repo + test-coverage-matrix.md

/stage5-implementation <project-slug> <milestone> → implements one milestone, updates progress.md
                                                    (run once per milestone: M1, M2, ...)

/stage7-qa-plan <project-slug>                    → produces qa-plan.md (checks all milestones complete)
```

### Human Checkpoints

**After Stage 2 (Architecture Review):**
Edit `projects/<slug>/architecture-proposal.md`, find the Approval Checklist at the bottom, set Status to "Approved" (or "Approved with Modifications"), and fill in the reviewer checklist. Stage 3 will refuse to run until this is done.

**After Stage 3 (Gameplan Review):**
Review `projects/<slug>/gameplan.md` and confirm the milestones, acceptance criteria, and sequencing are correct before any future stages run.

---

## Working in This Project

### Current Phase: Operational (Rails-only)
- Skills exist for Stages 1-5 and 7 (`.claude/skills/`)
- Each stage runs as a manual Claude Code session
- First project (deficient-line-items-report) has completed all stages end-to-end
- Stage 6 (Review) is spec'd but not yet automated — code review is manual
- Improve skills, templates, and stage specs based on lessons from completed projects

### Future Phase: Orchestration
- Build orchestration code in `pipeline/` for automated stage chaining
- Wire up Linear integration (automated ticket creation, status transitions)
- Build Stage 6 (Review) skill
- iOS/Android expansion when their test suites mature

### Key Principles
- **Templates are the program.** Agent output quality is determined by template quality.
- **Each stage has defined inputs and outputs.** Stages are composable and independently testable.
- **Human checkpoints are architectural, not optional.** Don't try to remove them.
- **Linear is the coordination layer.** All project state flows through Linear.
- **Start with Rails.** Rails/API is the first platform to implement. Mobile follows the API contract.

---

## Linear Integration

The pipeline uses Linear for:
- **Project tracking:** Pipeline runs map to Linear projects
- **Issue creation:** Milestones from gameplans become Linear issues
- **Status updates:** Stage transitions update issue status
- **Linking:** PRDs, specs, PRs, and QA reports link to Linear issues

When working with Linear in this project:
- Use the Linear MCP tools (list_issues, create_issue, update_issue, etc.)
- OrangeQC's Linear workspace contains the team and project structure
- Milestone tickets should be tagged with the pipeline stage that created them

---

## Repo Conventions

- All documentation in Markdown
- Use Obsidian-compatible wiki-links where helpful: `[[filename]]`
- Templates use placeholder syntax: `[Description of what goes here]`
- Checklists use `- [ ]` format
- Mermaid diagrams for flow visualization
- Stage docs follow a consistent structure (see any file in `docs/stages/`)

---

## What NOT To Do

- Don't try to automate Framing or Shaping - those are human judgment phases
- Don't remove human checkpoints from the pipeline
- Don't assume PRD quality - validate it
- Don't build platform-specific code without a shared data model/API contract
- Don't give agents production access (Heroku remotes, App Store credentials, Play Store credentials)
- Don't optimize for speed over correctness in early iterations
