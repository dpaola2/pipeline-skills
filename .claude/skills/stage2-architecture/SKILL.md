---
name: stage2-architecture
description: "Run pipeline Stage 2 (Architecture) for a project. Designs data model, API endpoints, migrations, and security scoping based on pipeline.md configuration."
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

- **Input 1:** `projects/$ARGUMENTS/prd.md`
- **Input 2:** `projects/$ARGUMENTS/discovery-report.md`
- **Output:** `projects/$ARGUMENTS/architecture-proposal.md`
- **Output template:** `templates/architecture-proposal.md`
- **Stage spec:** `docs/stages/02-architecture.md` (read this for full behavioral guidance)
- **Constraints:** Project constraints doc if one exists (e.g., `docs/orangeqc-constraints.md`)

## Before You Start

Read these files in order:

1. The pipeline config at `pipeline.md` — understand repo paths, framework, API conventions, security model, and all platform-specific details
2. The PRD at `projects/$ARGUMENTS/prd.md` — understand what we're building
3. The Discovery Report at `projects/$ARGUMENTS/discovery-report.md` — understand what exists today
4. The stage spec at `docs/stages/02-architecture.md` — understand your role, success criteria, and the approval checkpoint
5. The output template at `templates/architecture-proposal.md` — understand your output format (including the Approval Checklist at the end)
6. The conventions file in the primary repository (path from `pipeline.md`) — **critical**: pay special attention to database conventions, serialization patterns, API response structure, security scoping patterns, and API versioning. Cross-reference with the API Conventions and Multi-Tenant Security sections in `pipeline.md`.
7. If a project constraints file exists (e.g., `docs/orangeqc-constraints.md`), read it for additional platform-specific rules

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
- Full schema following the primary key convention from `pipeline.md` API Conventions and the conventions file
- All columns with types, constraints, defaults, nullability
- Foreign keys with references
- Indexes (following the migration conventions from the conventions file)
- Follow table naming conventions from the conventions file

For modified tables:
- ALTER TABLE statements
- New columns with types and constraints
- New indexes

Include:
- Rails model code (associations, validations, scopes)
- Associations map (visual representation of relationships)
- Expected data volumes and growth rates

### 3. Plan Migrations

For each migration:
- Type (DDL, data migration, concurrent index)
- SQL or Rails migration code
- Whether it needs `disable_ddl_transaction!`
- Backfill strategy (if migrating existing data)
- Rollback plan

### 4. Design API Endpoints (if applicable)

For each endpoint:
- HTTP method, path, purpose
- Full example request JSON (with all fields, realistic values)
- Full example response JSON (with all fields, realistic values)
- Error response examples following the error format from `pipeline.md` API Conventions
- Authorization requirements
- Scoping chain (following the security model from `pipeline.md` Multi-Tenant Security, if applicable)
- Serializer design following the serialization framework from `pipeline.md` Framework & Stack

**Important:** Follow the response envelope convention from `pipeline.md` API Conventions.

### 5. Analyze Backwards Compatibility

Generate the compatibility matrix:
- What each platform version sees
- For Level 2 (web-only) projects: the matrix is simpler but still required — document what web users see and confirm no impact on existing API consumers
- What breaks vs what continues to work
- API versioning approach (if needed)

### 6. Design Security Model

For every new data access path (if `pipeline.md` has a Multi-Tenant Security section, follow those rules):
- Query scoping chain (per the scoping rules in `pipeline.md`)
- Authorization model (who can do what, which roles/permissions)
- Permission requirements
- New attack surface analysis

### 7. Assess Export Impact

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

Write to `projects/$ARGUMENTS/architecture-proposal.md` using the template from `templates/architecture-proposal.md`.

**Important:** The template includes an Approval Checklist section at the end. Leave the Status as "Pending" — the human reviewer will update it.

## Referencing the Codebase

The primary repository path is in `pipeline.md` Target Repositories. When you need to:
- Verify existing patterns: search the codebase using the directories from `pipeline.md` Directory Structure
- Check naming conventions: look at existing code in the relevant directories
- Understand auth patterns: look at existing controllers
- See serialization examples: look at the serializer directory from `pipeline.md`

If `pipeline.md` lists an API docs repository, reference it for existing response shapes, pagination patterns, error format examples, and sync patterns.

**Do NOT modify any files in these repos.** Read only.

## What NOT To Do

- **Do not leave any section as "TBD."** Complete every section or flag it as an open question with options.
- **Do not skip the backwards compatibility matrix.** Even for web-only features.
- **Do not skip security scoping.** Every new data access path needs a scoping chain.
- **Do not modify any files in the target repos.**
- **Do not generate the gameplan.** That is Stage 3, and it requires approved architecture first.
- **Do not invent new patterns** when existing codebase patterns will work. Follow what exists.

## When You're Done

Tell the user:
1. The architecture proposal has been written
2. Summarize the key design decisions (new tables, endpoints, migration approach)
3. List the open questions that need human input
4. **Remind them:** "This architecture proposal must be reviewed and approved before Stage 3 can run. To approve: edit `projects/$ARGUMENTS/architecture-proposal.md`, find the Approval Checklist at the bottom, and set Status to 'Approved' (or 'Approved with Modifications'). Then run `/stage3-gameplan $ARGUMENTS`."
