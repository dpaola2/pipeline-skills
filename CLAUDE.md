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

## Working in This Project

### Design Phase (Current)
- The markdown files ARE the deliverable right now
- Edit and improve docs, templates, and stage specs
- Think critically about gaps, edge cases, and failure modes
- Reference OrangeQC's actual process and constraints

### Implementation Phase (Future)
- Build orchestration code in `pipeline/`
- Implement each stage as a discrete agent
- Wire up Linear integration
- Build human checkpoint interfaces
- Test against real PRDs

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
