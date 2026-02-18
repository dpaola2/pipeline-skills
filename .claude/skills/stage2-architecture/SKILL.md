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
- **Output (conditional):** `<projects-path>/$ARGUMENTS/decisions/ADR-*.md` — one per significant decision with 2+ viable alternatives

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
5. The conventions file in the primary repository (path and filename from `PIPELINE.md` Repository Details) — **critical**: pay special attention to database conventions, serialization patterns, API response structure, security scoping patterns, and API versioning. Cross-reference with the API Conventions and Multi-Tenant Security sections in `PIPELINE.md`.

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

### 10. Generate ADRs

For each significant decision that had 2+ genuinely viable alternatives, write an ADR file to `<projects-path>/$ARGUMENTS/decisions/ADR-NNN-<kebab-title>.md`.

- Use the ADR Template section below as the format
- Sequential numbering starting at 001 (e.g., `ADR-001-service-vs-concern.md`)
- Set `Stage: 2` in the metadata
- Not every design choice needs an ADR — only choices where alternatives were genuinely viable and the rationale matters for future understanding
- If no decisions warrant an ADR, skip this step

### 11. Write the Architecture Proposal

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

Write the proposal (with frontmatter) to `<projects-path>/$ARGUMENTS/architecture-proposal.md` using the Output Template section below.

**Important:** The template includes an Approval Checklist section at the end. Leave the Status as "Pending" — the human reviewer will update it. The `pipeline_approved_at` field is left empty — Stage 3 will fill it when it reads the approval date.

### 12. Commit Pipeline Artifacts

Commit the architecture proposal and any ADRs to version control in the projects directory:

1. Check if the projects directory is inside a git repository:
   ```bash
   cd <projects-path> && git rev-parse --git-dir 2>/dev/null
   ```
   If this command fails (not a git repo), skip this step silently.

2. Stage and commit:
   ```bash
   cd <projects-path> && git add $ARGUMENTS/architecture-proposal.md $ARGUMENTS/decisions/ && git commit -m "pipeline: architecture-proposal for $ARGUMENTS"
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
3. List ADRs generated (with titles), or "None" if no decisions warranted an ADR
4. List the open questions that need human input
5. **Remind them:** "This architecture proposal must be reviewed and approved before Stage 3 can run. To approve: edit `<projects-path>/$ARGUMENTS/architecture-proposal.md`, find the Approval Checklist at the bottom, and set Status to 'Approved' (or 'Approved with Modifications'). Then run `/stage3-gameplan $ARGUMENTS`."

## ADR Template

````markdown
# ADR-NNN: [Title]

**Date:** [YYYY-MM-DD]
**Status:** Accepted
**Project:** [project-slug]
**Stage:** [2 or 5]

## Context

[What problem or question arose, and why a decision was needed]

## Decision

[What was decided]

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Chosen approach** | ... | ... |
| Alternative 1 | ... | ... |

## Consequences

[What this enables, constrains, or implies for future work]
````

## Output Template

````markdown
---
pipeline_stage: 2
pipeline_stage_name: architecture
pipeline_project: "[slug]"
pipeline_started_at: "[ISO 8601 timestamp]"
pipeline_completed_at: "[ISO 8601 timestamp]"
pipeline_approved_at: "[ISO 8601 timestamp — filled by Stage 3]"
---

# [Feature Name] - Architecture Proposal

> **Generated by:** Pipeline Stage 2 (Architecture)
> **Date:** [Date]
> **PRD:** [Link]
> **Discovery Report:** [Link]
> **Linear:** [Link]

---

## 1. Data Model Changes

### New Tables

```sql
CREATE TABLE [table_name] (
  id [primary key type per PIPELINE.md API Conventions],
  [column_name] [type] [constraints],
  [foreign_key]_id uuid NOT NULL REFERENCES [parent_table](id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_[table]_[column] ON [table_name] ([column]);
CREATE INDEX idx_[table]_[column] ON [table_name] ([column]);
```

### Modified Tables

```sql
-- Add columns to [existing_table]
ALTER TABLE [existing_table]
  ADD COLUMN [column_name] [type] [constraints];
```

### Models

```
[Model code following framework conventions from PIPELINE.md and the conventions file.
Include: associations/relationships, validations/constraints, scopes/queries, class methods.
If PIPELINE.md has Multi-Tenant Security, include the tenant-scoping scope/query.
Use the language and framework idioms from PIPELINE.md Framework & Stack.]
```

### Associations Map

```
[Parent] 1──* [Child] 1──* [Grandchild]
    │
    └── belongs_to [Account] (scoping)
```

### Migration Plan

| Migration | Type | Notes |
|-----------|------|-------|
| Create [table] | DDL | Standard table creation per framework conventions |
| Add index on [table.column] | DDL | Concurrent if supported by framework/database |
| Backfill [column] | Data | [Strategy: batch update, background job, etc.] |

### Expected Data Volumes

| Table | Expected Records | Access Frequency | Growth Rate |
|-------|-----------------|------------------|-------------|
| [table] | [estimate] | [reads/writes per day] | [per month] |

---

## 2. API Endpoints

<!-- CONDITIONAL: Include this section only if PIPELINE.md has an "API Conventions" section.
     Otherwise write: "N/A — this project does not expose an API." -->

### New Endpoints

#### [METHOD] /api/v1/[path]

**Purpose:** [What this endpoint does]

**Authorization:** [Who can call this, what permissions needed]

**Scoping:** [per PIPELINE.md Multi-Tenant Security, if applicable]

**Request:**
```json
{
  "[resource]": {
    "[field]": "[value]",
    "[field]": "[value]"
  }
}
```

**Response (2XX):**
```json
{
  "[resource]": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "[field]": "[value]",
    "[field]": "[value]",
    "created_at": "2026-02-05T14:30:00Z",
    "updated_at": "2026-02-05T14:30:00Z"
  }
}
```

**Error Response (422):**
```json
[Error format per PIPELINE.md API Conventions]
```

**Error Response (401):**
```json
[Error format per PIPELINE.md API Conventions]
```

---

#### [METHOD] /api/v1/[path]

[Repeat for each endpoint]

---

### Modified Endpoints

| Endpoint | Change | Backwards Compatible? |
|----------|--------|----------------------|
| [Existing endpoint] | [What changes] | Yes / No |

### Serializers

```
[Serializer code following the serialization framework from PIPELINE.md Framework & Stack
and patterns from the conventions file in the primary repository.
Include fields, associations, and custom formatting.]
```

---

## 3. Backwards Compatibility

<!-- CONDITIONAL: Include this section only if PIPELINE.md has a "Backwards Compatibility" section.
     Otherwise write: "N/A — no backwards compatibility concerns for this project." -->

### Compatibility Matrix

| Feature / Behavior | [Column per active platform and old version from PIPELINE.md Platforms] |
|-------------------|:---:|
| [Behavior 1] | [Full/Partial/None per platform] |
| [Behavior 2] | [Full/Partial/None per platform] |

### Old Client Behavior

> One subsection per platform with old versions (from PIPELINE.md Backwards Compatibility).

**[Platform] v[old]:**
- [What old client sees/doesn't see]
- [Any degraded functionality]
- [Any data that appears differently]

### API Versioning

[Does this change require API versioning? If so, what approach?]

### Data Migration

| Migration | Strategy | Rollback |
|-----------|----------|----------|
| [Existing data change] | [How: batch update, background job] | [How to undo] |

---

## 4. Security Design

### Query Scoping

<!-- CONDITIONAL: Include scoping chains only if PIPELINE.md has a "Multi-Tenant Security" section.
     Otherwise focus on authentication and authorization only. -->

| Resource | Scoping Chain |
|----------|--------------|
| [Resource] | [Scoping chain per PIPELINE.md Multi-Tenant Security, if applicable] |
| [Nested resource] | [Scoping chain, if applicable] |

### Authorization

| Action | Permitted Roles | Check |
|--------|----------------|-------|
| [Action 1] | [Admin, Manager, etc.] | [How verified] |
| [Action 2] | [Roles] | [How verified] |

### New Attack Surface

| Vector | Risk | Mitigation |
|--------|------|------------|
| [Vector] | [Risk level] | [How mitigated] |

---

## 5. Export Impact

<!-- CONDITIONAL: Include this section if the PRD mentions exports or the project has export features.
     Otherwise write: "N/A — no export impact." -->

| Export | Format | Changes | Backwards Compatible? |
|-------|--------|---------|----------------------|
| [Export name] | [PDF/Excel/CSV] | [What changes] | [Yes/No] |

---

## 6. Open Questions for Human Review

| # | Question | Options | Recommendation |
|---|----------|---------|---------------|
| 1 | [Decision needed] | A: [option] / B: [option] | [Agent's recommendation with rationale] |
| 2 | [Decision needed] | [Options] | [Recommendation] |

---

## 7. Alternatives Considered

### [Alternative Approach Name]

**Description:** [What the alternative was]
**Pros:** [Advantages]
**Cons:** [Disadvantages]
**Why rejected:** [Reason]

---

## 8. Architecture Decision Records

> ADRs for significant decisions are in the `decisions/` subdirectory. Only decisions with 2+ genuinely viable alternatives are recorded here.

<!-- If no ADRs were generated, replace the table below with: "No decisions in this project warranted a standalone ADR." -->

| ADR | Title | Summary |
|-----|-------|---------|
| [ADR-001](decisions/ADR-001-title.md) | [Title] | [One-line summary] |

---

## 9. Summary

### Files to Create
| File | Purpose |
|------|---------|
| `[models dir from PIPELINE.md]/[model file]` | [Purpose] |
| `[controllers dir from PIPELINE.md]/[controller file]` | [Purpose] |
| `[serializers dir from PIPELINE.md]/[serializer file]` | [Purpose — if applicable] |
| `[migrations dir from PIPELINE.md]/[migration file]` | [Purpose] |

### Files to Modify
| File | Changes |
|------|---------|
| `[models dir from PIPELINE.md]/[existing_model file]` | Add association |
| `[routes path from PIPELINE.md]` | Add new routes |

---

## Approval Checklist

> **This architecture proposal requires human review and approval before the gameplan is generated.**

### Reviewer: [Name]
### Date: [Date]
### Status: [Pending / Approved / Approved with Modifications / Rejected]

#### Must Verify
- [ ] Data model is architecturally sound (tables, columns, relationships, constraints)
- [ ] API design is consistent with existing patterns (envelopes, error format, pagination)
- [ ] Backwards compatibility is handled correctly (compatibility matrix filled out)
- [ ] Security scoping is correct (all queries scoped to account, authorization checked)
- [ ] Migration strategy is safe (concurrent indexes, backfill approach)

#### Should Check
- [ ] Serializer design matches existing conventions
- [ ] Export impact is addressed
- [ ] Open questions are answerable
- [ ] API payloads are complete enough for mobile engineers to build against
- [ ] No conflicts with in-progress work or upcoming changes

#### Notes
[Reviewer notes, modifications requested, or rejection reasons]
````

## Success Criteria

- [ ] Data model complete (no "TBD" fields)
- [ ] Every API endpoint has full request AND response JSON examples
- [ ] Backwards compatibility matrix filled out (if PIPELINE.md has that section)
- [ ] Migrations specified (not just "we'll need a migration")
- [ ] Security scoping explicit for every new data access path
- [ ] Proposal follows existing codebase patterns
- [ ] Open questions specific and actionable
- [ ] Engineer on another platform could read API section and know exactly what to build
- [ ] Self-contained enough for human to review without running code
