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
- **Output template:** `templates/discovery-report.md`
- **Stage spec:** `docs/stages/01-discovery.md` (read this for full behavioral guidance)

## Before You Start

Read these files in order:

1. The pipeline config at `pipeline.md` — get the primary repository path, the **projects path** (from Work Directory → Projects), and other repo locations
2. The repo config at `PIPELINE.md` in the primary repository (path from `pipeline.md`) — understand branch conventions, framework, directory structure, test commands, and all repo-specific details
3. The PRD at `<projects-path>/$ARGUMENTS/prd.md` — understand what we're building
4. The stage spec at `docs/stages/01-discovery.md` — understand your role and success criteria
5. The output template at `templates/discovery-report.md` — understand your output format
6. The conventions file in the primary repository (path and filename from `PIPELINE.md` Repository Details) — understand codebase conventions

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

- **Level 1** (small project): Focus on Rails. Lightweight discovery.
- **Level 2** (web only): Focus on the primary platform. Mark other platform sections as "N/A — Level 2 (web-only) project."
- **Level 3** (all platforms): Search all repositories listed in `pipeline.md` Target Repositories that have Active status in the primary repo's `PIPELINE.md` Platforms table.

### 5. Document Cross-Platform Patterns

Even for web-only projects, document:
- How data flows through the system (Rails models → controllers → serializers → response)
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

Write the report to `<projects-path>/$ARGUMENTS/discovery-report.md` using the template structure from `templates/discovery-report.md`.

## What NOT To Do

- **Do not suggest how to build the feature.** That is Stage 2 (Architecture). You document what exists.
- **Do not give opinions on code quality** unless it represents a technical risk.
- **Do not explore unrelated code.** Stay focused on entities and patterns relevant to the PRD.
- **Do not modify any files in the target repos.** Read only.
- **Do not skip the schema lookup.** The current table definitions from `db/schema.rb` are critical for the Architecture stage.

## When You're Done

Tell the user:
1. The discovery report has been written
2. Summarize the key findings (entities found, risks flagged, open questions)
3. Note: "You can now review the discovery report, then run `/stage2-architecture $ARGUMENTS` to proceed to the Architecture stage."
