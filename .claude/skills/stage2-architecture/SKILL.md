---
name: stage2-architecture
description: "Run pipeline Stage 2 (Architecture) for a project. Designs data model, API endpoints, migrations, and security scoping."
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
- **Constraints:** `docs/orangeqc-constraints.md` (read for OrangeQC-specific rules)

## Before You Start

Read these files in order:

1. The PRD at `projects/$ARGUMENTS/prd.md` — understand what we're building
2. The Discovery Report at `projects/$ARGUMENTS/discovery-report.md` — understand what exists today
3. The stage spec at `docs/stages/02-architecture.md` — understand your role, success criteria, and the approval checkpoint
4. The output template at `templates/architecture-proposal.md` — understand your output format (including the Approval Checklist at the end)
5. The Rails AGENTS.md at `~/projects/orangeqc/orangeqc/AGENTS.md` — **critical**: pay special attention to:
   - Database conventions (table tiers, UUIDv7 via `DistributedEntity`, naming)
   - Serialization patterns (Blueprinter for new code)
   - API response structure (resource-keyed envelopes, error format)
   - Security scoping patterns (`current_account`, `accessible_to(user)`)
   - API versioning (date-based for new endpoints)
6. The OrangeQC constraints at `docs/orangeqc-constraints.md` — understand the reference materials section and key API conventions

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
- Full schema with UUIDv7 primary keys (use `DistributedEntity` concern per AGENTS.md)
- All columns with types, constraints, defaults, nullability
- Foreign keys with references
- Indexes (including which need `disable_ddl_transaction!` for concurrent creation)
- Follow OrangeQC table naming conventions from AGENTS.md

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
- Error response examples using OrangeQC's flat format: `{"error": "Type", "message": "..."}`
- Authorization requirements
- Scoping chain (how the query is scoped to `current_account`)
- Serializer/Blueprint design following Blueprinter conventions

**Important:** Use resource-keyed response envelopes (`{"tickets": [...]}` for collections, `{"ticket": {...}}` for single resources). This is NOT the Rails default.

### 5. Analyze Backwards Compatibility

Generate the compatibility matrix:
- What each platform version sees
- For Level 2 (web-only) projects: the matrix is simpler but still required — document what web users see and confirm no impact on existing API consumers
- What breaks vs what continues to work
- API versioning approach (if needed)

### 6. Design Security Model

For every new data access path:
- Query scoping chain (always scoped to `current_account`)
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

The Rails repo is at `~/projects/orangeqc/orangeqc/`. When you need to:
- Verify existing patterns: search the codebase
- Check naming conventions: look at existing models, controllers, serializers
- Understand auth patterns: look at existing controllers
- See serialization examples: look at `app/blueprints/`

The API docs are at `~/projects/orangeqc/apiv4/`. Reference these for:
- Existing response shapes
- Pagination patterns
- Error format examples
- Sync patterns

**Do NOT modify any files in these repos.** Read only.

## What NOT To Do

- **Do not leave any section as "TBD."** Complete every section or flag it as an open question with options.
- **Do not skip the backwards compatibility matrix.** Even for web-only features.
- **Do not skip security scoping.** Every new data access path needs a scoping chain.
- **Do not modify any files in the Rails repo or API docs repo.**
- **Do not generate the gameplan.** That is Stage 3, and it requires approved architecture first.
- **Do not invent new patterns** when existing codebase patterns will work. Follow what exists.

## When You're Done

Tell the user:
1. The architecture proposal has been written
2. Summarize the key design decisions (new tables, endpoints, migration approach)
3. List the open questions that need human input
4. **Remind them:** "This architecture proposal must be reviewed and approved before Stage 3 can run. To approve: edit `projects/$ARGUMENTS/architecture-proposal.md`, find the Approval Checklist at the bottom, and set Status to 'Approved' (or 'Approved with Modifications'). Then run `/stage3-gameplan $ARGUMENTS`."
