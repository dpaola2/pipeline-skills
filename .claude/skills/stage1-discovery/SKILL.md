---
name: stage1-discovery
description: "Run pipeline Stage 1 (Discovery) for a project. Explores the target codebase to understand current state before designing changes."
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

# Stage 1: Discovery

You are a **codebase explorer**. Your job is to understand how things work TODAY before anyone designs how they should work TOMORROW. You produce a Discovery Report.

## Inputs & Outputs

- **Input:** `<projects-path>/$ARGUMENTS/prd.md`
- **Output:** `<projects-path>/$ARGUMENTS/discovery-report.md`

## Before You Start

**First**, capture the start timestamp by running this via Bash and saving the result as STARTED_AT:

```bash
date +"%Y-%m-%dT%H:%M:%S%z"
```

Then read these files in order:

1. The pipeline config at `pipeline.md` — get the primary repository path, the **projects path** (from Work Directory → Projects), and other repo locations
2. The repo config at `PIPELINE.md` in the primary repository (path from `pipeline.md`) — understand branch conventions, framework, directory structure, test commands, and all repo-specific details
3. The PRD at `<projects-path>/$ARGUMENTS/prd.md` — understand what we're building
4. The conventions file in the primary repository (path and filename from `PIPELINE.md` Repository Details) — understand codebase conventions

## Step-by-Step Procedure

### 1. Parse the PRD

Extract:
- Feature areas / functional domains
- Entity names (models, tables, concepts referenced or implied)
- API endpoints referenced or implied
- UI views referenced or implied
- Platform designation (check the PRD header — Level 1, 2, or 3)
- Permissions and access control requirements

### 2. Search the Primary Codebase

The primary repository path is specified in `pipeline.md` Target Repositories.

For each entity/keyword extracted from the PRD, search the directories listed in the primary repo's `PIPELINE.md` Directory Structure. For each directory purpose (Models, Controllers, Views, etc.), search the corresponding path for related code.

For each finding, record:
- File path with line numbers
- Relevant code snippets (not entire files)
- How it relates to the PRD feature

### 3. Search the API Documentation

If `pipeline.md` Target Repositories lists an API docs repository, search it. (If that repo has its own `PIPELINE.md`, read it for repo-specific details.)

Look for:
- Existing endpoint documentation for related resources
- Current response shapes and field names
- Pagination patterns used by similar endpoints
- Authentication and error format examples

### 4. Handle Platform Level

Check the PRD header for the project level:

- **Level 1** (small project): Focus on the primary platform. Lightweight discovery.
- **Level 2** (primary platform only): Focus on the primary platform. Mark other platform sections as "N/A — Level 2 (primary platform only) project."
- **Level 3** (all platforms): Search all repositories listed in `pipeline.md` Target Repositories that have Active status in the primary repo's `PIPELINE.md` Platforms table.

### 5. Document Cross-Platform Patterns

Even for web-only projects, document:
- How data flows through the system (models → controllers → serializers → response)
- Current serialization format for related resources
- API versioning approach for related endpoints
- How similar existing features are structured (find a comparable feature as a reference)

### 6. Flag Technical Risks

For each risk, include severity (High/Med/Low):
- Code needing significant refactoring to support the new feature
- Missing test coverage in areas that will change
- Performance concerns (N+1 queries, missing indexes, large data volumes)
- Security concerns (unscoped queries, missing authorization)
- Backwards compatibility risks

### 7. Document Open Questions

List ambiguities the PRD doesn't resolve and that code exploration didn't clarify. Each question should:
- Be specific and actionable (not "how should this work?")
- Cite the source (PRD section or code file)
- Indicate whether it's blocking (must be answered before architecture)

### 8. Write the Discovery Report

Capture the completion timestamp via Bash: `date +"%Y-%m-%dT%H:%M:%S%z"` — save as COMPLETED_AT.

Prepend YAML frontmatter to the report content before writing:

```yaml
---
pipeline_stage: 1
pipeline_stage_name: discovery
pipeline_project: "$ARGUMENTS"
pipeline_started_at: "<STARTED_AT>"
pipeline_completed_at: "<COMPLETED_AT>"
---
```

Write the report (with frontmatter) to `<projects-path>/$ARGUMENTS/discovery-report.md` using the Output Template section below.

### 9. Commit Pipeline Artifacts

Commit the discovery report to version control in the projects directory:

1. Check if the projects directory is inside a git repository:
   ```bash
   cd <projects-path> && git rev-parse --git-dir 2>/dev/null
   ```
   If this command fails (not a git repo), skip this step silently.

2. Stage and commit:
   ```bash
   cd <projects-path> && git add $ARGUMENTS/discovery-report.md && git commit -m "pipeline: discovery-report for $ARGUMENTS"
   ```
   If nothing to commit (no changes detected), skip silently.

## What NOT To Do

- **Do not suggest how to build the feature.** That is Stage 2 (Architecture). You document what exists.
- **Do not give opinions on code quality** unless it represents a technical risk.
- **Do not explore unrelated code.** Stay focused on entities and patterns relevant to the PRD.
- **Do not modify any files in the target repos.** Read only.
- **Do not skip the schema lookup.** The current table/schema definitions (schema file path from PIPELINE.md Directory Structure) are critical for the Architecture stage.

## Output Template

````markdown
---
pipeline_stage: 1
pipeline_stage_name: discovery
pipeline_project: "[slug]"
pipeline_started_at: "[ISO 8601 timestamp]"
pipeline_completed_at: "[ISO 8601 timestamp]"
---

# [Feature Name] - Discovery Report

> **Generated by:** Pipeline Stage 1 (Discovery)
> **Date:** [Date]
> **PRD:** [Link to PRD]
> **Linear:** [Link]

---

## 1. PRD Understanding

### Feature Summary
[Agent's interpretation of what the PRD is asking for - 2-3 sentences]

### Entities Identified
| Entity | PRD Reference | Existing? | Current Location |
|--------|--------------|-----------|-----------------|
| [Entity 1] | [Requirement ID] | Yes / No | `[models directory from PIPELINE.md]/[entity file]` or N/A |
| [Entity 2] | [Requirement ID] | Yes / No | [Path] or N/A |

### Platforms Affected
> One checkbox per active platform from PIPELINE.md Platforms table.

- [ ] [Primary platform from PIPELINE.md]
- [ ] [Additional platform, if listed in PIPELINE.md Platforms]

---

## 2. Current State: Primary Platform

### Related Models
| Model | File | Key Associations | Notes |
|-------|------|------------------|-------|
| [Model] | [models directory from PIPELINE.md]/model.[ext] | [associations] | [Relevant notes] |

### Current Schema (Related Tables)

```sql
-- [table_name]
-- (from schema file: [schema path from PIPELINE.md Directory Structure])
CREATE TABLE [table_name] (
  [column definitions from schema file]
);
```

### Related Controllers
| Controller | File | Actions | Auth Pattern |
|-----------|------|---------|--------------|
| [Controller] | [controllers directory from PIPELINE.md]/... | index, show, create | [How auth works] |

### Related Serializers
| Serializer | File | Fields Exposed |
|-----------|------|----------------|
| [Serializer] | [serializers directory from PIPELINE.md]/... | [List of fields] |

### Related API Endpoints (Current)
| Method | Path | Purpose | Response Shape |
|--------|------|---------|---------------|
| GET | `/api/v1/...` | [Purpose] | [Brief shape] |

### Current API Response Examples

```json
// GET /api/v1/[endpoint]
{
  "example": "response"
}
```

### Related Tests
| Test File | Coverage | Type |
|-----------|----------|------|
| [test directory from PIPELINE.md]/... | [What's tested] | [Test type] |

### Related Background Jobs
| Job | File | Purpose |
|-----|------|---------|
| [Job] | [jobs directory from PIPELINE.md]/... | [Purpose] |

---

<!-- CONDITIONAL: Repeat the following section for each ADDITIONAL active platform from PIPELINE.md Platforms.
     If only one active platform exists, omit these sections entirely. -->

## 3. Current State: [Additional Platform Name]

### Related Code
| Component | File | Type | Notes |
|-----------|------|------|-------|
| [Component] | [Path] | [Component type] | [Notes] |

### Patterns Used
- [Architecture pattern]
- [Networking pattern: how API calls are made]
- [Data persistence approach]

### Related Tests
| Test File | Coverage |
|-----------|----------|
| [Path] | [What's tested] |

---

## 4. Cross-Platform Patterns

<!-- CONDITIONAL: If PIPELINE.md Platforms has 2+ active platforms, fill this section.
     If only one active platform, write: "N/A — single-platform project." -->

### Data Flow
```
[How data currently flows between platforms]
```

### Serialization Format
[JSON structure patterns, naming conventions (camelCase vs snake_case), etc.]

### API Versioning
[Current versioning approach, if any]

### How Similar Features Are Built
[Reference to a similar existing feature and how it's structured across platforms]

---

## 5. Technical Risks

| Risk | Severity | Details | Mitigation |
|------|----------|---------|------------|
| [Risk 1] | High / Med / Low | [Details] | [Suggested mitigation] |
| [Risk 2] | [Severity] | [Details] | [Mitigation] |

### Performance Concerns
- [N+1 query risks]
- [Missing indexes]
- [Large data volume concerns]

### Security Concerns
- [Scoping gaps in related code]
- [Authorization issues]

---

## 6. Open Questions

| # | Question | Source | Blocking? |
|---|----------|--------|-----------|
| 1 | [Question discovered during exploration] | [Where it came from] | Yes / No |
| 2 | [Ambiguity in PRD that code didn't resolve] | PRD Section [X] | Yes / No |

---

## 7. Recommendations for Architecture Stage

- [Pattern to follow for the new feature]
- [Existing code to extend vs replace]
- [Suggested approach based on existing patterns]
- [Things to avoid based on what exists]
````

## Success Criteria

- [ ] All PRD entities traced to existing code (or flagged as new)
- [ ] Current data model documented for affected tables
- [ ] Current API payloads documented for affected endpoints
- [ ] Existing code patterns identified
- [ ] Technical risks flagged with severity
- [ ] Open questions specific and actionable
- [ ] Report useful enough that human could skip reading the codebase

## When You're Done

Tell the user:
1. The discovery report has been written
2. Summarize the key findings (entities found, risks flagged, open questions)
3. Note: "You can now review the discovery report, then run `/stage2-architecture $ARGUMENTS` to proceed to the Architecture stage."
