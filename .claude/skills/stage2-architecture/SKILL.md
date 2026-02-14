---
name: stage2-architecture
description: "Run pipeline Stage 2 (Architecture) for a project. Designs data model, API endpoints, migrations, and security scoping based on the target repo's PIPELINE.md configuration."
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

# Stage 2: Architecture

You are a **technical designer**. You propose the data model, API endpoints, migrations, backwards compatibility approach, and security scoping for a feature. Your output is an Architecture Proposal that must be reviewed and approved by a human before the next stage.

## Inputs & Outputs

- **Input 1:** `<projects-path>/$ARGUMENTS/prd.md`
- **Input 2:** `<projects-path>/$ARGUMENTS/discovery-report.md`
- **Output:** `<projects-path>/$ARGUMENTS/architecture-proposal.md`
- **Output template:** `templates/architecture-proposal.md`
- **Stage spec:** `docs/stages/02-architecture.md` (read this for full behavioral guidance)
- **Constraints:** Project constraints doc if one exists (e.g., `docs/orangeqc-constraints.md`)

## Before You Start

**First**, capture the start timestamp by running this via Bash and saving the result as STARTED_AT:

```bash
date +"%Y-%m-%dT%H:%M:%S%z"
```

Then read these files in order:

1. The pipeline config at `pipeline.md` — get the primary repository path, the **projects path** (from Work Directory → Projects), and other repo locations
2. The repo config at `PIPELINE.md` in the primary repository (path from `pipeline.md`) — understand framework, directory structure, API conventions, security model, and all repo-specific details
3. The PRD at `<projects-path>/$ARGUMENTS/prd.md` — understand what we're building
4. The Discovery Report at `<projects-path>/$ARGUMENTS/discovery-report.md` — understand what exists today
5. The stage spec at `docs/stages/02-architecture.md` — understand your role, success criteria, and the approval checkpoint
6. The output template at `templates/architecture-proposal.md` — understand your output format (including the Approval Checklist at the end)
7. The conventions file in the primary repository (path and filename from `PIPELINE.md` Repository Details) — **critical**: pay special attention to database conventions, serialization patterns, API response structure, security scoping patterns, and API versioning. Cross-reference with the API Conventions and Multi-Tenant Security sections in `PIPELINE.md`.
8. If a project constraints file exists (e.g., `docs/orangeqc-constraints.md`), read it for additional platform-specific rules

## Step-by-Step Procedure

### 1. Start From the Discovery Report

Build on what exists. Do not reinvent. Note:
- Existing models and their associations
- Current schema for related tables
- Existing serialization patterns
- Current API response formats
- Existing test patterns

### 2. Design Data Model Changes

For new tables:
- Full schema following the primary key convention from `PIPELINE.md` API Conventions and the conventions file
- All columns with types, constraints, defaults, nullability
- Foreign keys with references
- Indexes (following the migration conventions from the conventions file)
- Follow table naming conventions from the conventions file

For modified tables:
- ALTER TABLE statements
- New columns with types and constraints
- New indexes

Include:
- Model code following the framework conventions from PIPELINE.md and the conventions file (associations, validations, scopes/queries)
- Associations map (visual representation of relationships)
- Expected data volumes and growth rates

### 3. Plan Migrations

For each migration:
- Type (DDL, data migration, concurrent index)
- Migration code per framework conventions
- Whether it needs special transaction handling (e.g., `disable_ddl_transaction!` for Rails, equivalent for other frameworks)
- Backfill strategy (if migrating existing data)
- Rollback plan

### 4. Design API Endpoints

**If PIPELINE.md has an "API Conventions" section**, design the endpoints below. **Otherwise**, mark this section as "N/A — not applicable for this project type" in the output and skip.

For each endpoint:
- HTTP method, path, purpose
- Full example request JSON (with all fields, realistic values)
- Full example response JSON (with all fields, realistic values)
- Error response examples following the error format from `PIPELINE.md` API Conventions
- Authorization requirements
- Scoping chain (following the security model from `PIPELINE.md` Multi-Tenant Security, if applicable)
- Serializer design following the serialization framework from `PIPELINE.md` Framework & Stack

**Important:** Follow the response envelope convention from `PIPELINE.md` API Conventions.

### 5. Analyze Backwards Compatibility

**If PIPELINE.md has a "Backwards Compatibility" section**, generate the compatibility matrix below. **Otherwise**, mark this section as "N/A — not applicable for this project" in the output and skip.

Generate the compatibility matrix:
- What each platform version sees
- For Level 2 (web-only) projects: the matrix is simpler but still required — document what web users see and confirm no impact on existing API consumers
- What breaks vs what continues to work
- API versioning approach (if needed)

### 6. Design Security Model

**If PIPELINE.md has a "Multi-Tenant Security" section**, follow its scoping and authorization rules for every new data access path. **Otherwise**, focus on authentication and authorization without tenant-scoping.

For every new data access path:
- Query scoping chain (per the scoping rules in `PIPELINE.md`)
- Authorization model (who can do what, which roles/permissions)
- Permission requirements
- New attack surface analysis

### 7. Assess Export Impact

**If the PRD mentions exports or PIPELINE.md has export-related features**, assess the impact below. **Otherwise**, mark this section as "N/A — no export impact" in the output and skip.

- How new data appears in existing exports (PDF, CSV, email reports)
- New export requirements from the PRD
- Export format backwards compatibility

### 8. Document Open Questions

For each unresolved decision:
- State the question clearly
- Provide 2+ options with trade-offs
- Give your recommendation with rationale
- **No "TBD" allowed.** Every section must be complete or explicitly flagged as a question with options.

### 9. Document Alternatives Considered

For significant design decisions:
- What alternative approaches you considered
- Pros and cons of each
- Why you chose the proposed approach

### 10. Write the Architecture Proposal

Capture the completion timestamp via Bash: `date +"%Y-%m-%dT%H:%M:%S%z"` — save as COMPLETED_AT.

Prepend YAML frontmatter to the proposal content before writing:

```yaml
---
pipeline_stage: 2
pipeline_stage_name: architecture
pipeline_project: "$ARGUMENTS"
pipeline_started_at: "<STARTED_AT>"
pipeline_completed_at: "<COMPLETED_AT>"
pipeline_approved_at:
---
```

Write the proposal (with frontmatter) to `<projects-path>/$ARGUMENTS/architecture-proposal.md` using the template from `templates/architecture-proposal.md`.

**Important:** The template includes an Approval Checklist section at the end. Leave the Status as "Pending" — the human reviewer will update it. The `pipeline_approved_at` field is left empty — Stage 3 will fill it when it reads the approval date.

### 11. Commit Pipeline Artifacts

Commit the architecture proposal to version control in the projects directory:

1. Check if the projects directory is inside a git repository:
   ```bash
   cd <projects-path> && git rev-parse --git-dir 2>/dev/null
   ```
   If this command fails (not a git repo), skip this step silently.

2. Stage and commit:
   ```bash
   cd <projects-path> && git add $ARGUMENTS/architecture-proposal.md && git commit -m "pipeline: architecture-proposal for $ARGUMENTS"
   ```
   If nothing to commit (no changes detected), skip silently.

## Referencing the Codebase

The primary repository path is in `pipeline.md` Target Repositories. When you need to:
- Verify existing patterns: search the codebase using the directories from `PIPELINE.md` Directory Structure
- Check naming conventions: look at existing code in the relevant directories
- Understand auth patterns: look at existing controllers
- See serialization examples: look at the serializer directory from `PIPELINE.md`

If `pipeline.md` lists an API docs repository, reference it for existing response shapes, pagination patterns, error format examples, and sync patterns.

**Do NOT modify any files in these repos.** Read only.

## What NOT To Do

- **Do not leave any section as "TBD."** Complete every section or flag it as an open question with options.
- **Do not skip the backwards compatibility matrix** if PIPELINE.md has a Backwards Compatibility section.
- **Do not skip security design.** Every new data access path needs authentication and authorization. If PIPELINE.md has Multi-Tenant Security, also include tenant scoping chains.
- **Do not modify any files in the target repos.**
- **Do not generate the gameplan.** That is Stage 3, and it requires approved architecture first.
- **Do not invent new patterns** when existing codebase patterns will work. Follow what exists.

## When You're Done

Tell the user:
1. The architecture proposal has been written
2. Summarize the key design decisions (new tables, endpoints, migration approach)
3. List the open questions that need human input
4. **Remind them:** "This architecture proposal must be reviewed and approved before Stage 3 can run. To approve: edit `<projects-path>/$ARGUMENTS/architecture-proposal.md`, find the Approval Checklist at the bottom, and set Status to 'Approved' (or 'Approved with Modifications'). Then run `/stage3-gameplan $ARGUMENTS`."
