---
name: stage0-prd
description: "Generate a structured PRD from raw input notes. Lists inbox files, asks for file selection and project slug, then produces a pipeline-ready PRD."
disable-model-invocation: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - AskUserQuestion
---

# Stage 0 — PRD Generation

You **generate a structured PRD** from raw input notes (feature descriptions, Slack threads, meeting notes, Google Doc exports, etc.) that conforms to the pipeline's PRD template. The human reviews and edits the output before it enters the pipeline — Stage 0 assists, not replaces.

## Inputs

- `inbox/` directory — contains one or more raw input files
- `templates/prd-intake.md` — the target PRD structure
- `pipeline.md` — target repository paths
- `PIPELINE.md` in primary repo — framework, platforms, directory structure

## Step-by-Step Procedure

### Step 1: List Inbox and Get User Input

List all files in the `inbox/` directory, excluding `.gitkeep`.

If no files are found, **STOP**:

> "No files found in `inbox/`. Drop your raw notes, feature descriptions, or Slack exports there first, then re-run `/stage0-prd`."

If files are found, present them to the user using `AskUserQuestion`. Ask two things:

1. **Which file** to use as input (if multiple files exist, list them as options)
2. **What project slug** to use (kebab-case, e.g., `deficient-line-items-report`)

If only one file exists, suggest it as the default but still confirm with the user.

### Step 2: Validate

Check whether `projects/<slug>/` already exists:

- If it exists **and** contains a `prd.md` → **STOP**:
  > "Project `<slug>` already exists with a PRD at `projects/<slug>/prd.md`. Choose a different slug or delete the existing project directory first."
- If it exists but has no `prd.md` → proceed (the directory may have been created manually).
- If it doesn't exist → proceed (you'll create it in Step 5).

Read the selected inbox file.

### Step 3: Read Context

Read these files to understand the target format and project context:

1. **`pipeline.md`** — target repository paths and project tracker
2. **`PIPELINE.md`** from the primary repository (path from `pipeline.md`) — framework, platforms, directory structure, API conventions, security model
3. **`templates/prd-intake.md`** — the PRD template structure

### Step 4: Generate PRD

Analyze the raw input and produce a structured PRD that follows the template. The PRD must include ALL sections from the template — never omit a section. For sections where the raw input provides insufficient information, include the section with placeholder markers.

#### Header

Generate a metadata table at the top of the PRD:

```markdown
# [Feature Name] — PRD

|  |  |
| -- | -- |
| **Product** | [Product name from PIPELINE.md or raw input] |
| **Version** | 1 |
| **Author** | Stage 0 (Pipeline) |
| **Date** | [Today's date] |
| **Status** | Draft — Review Required |
| **Platforms** | [CONFIRM — suggest based on scope: "Web only", "Web + API", "All platforms"] |
| **Level** | [CONFIRM — suggest 1, 2, or 3 based on scope] |
```

Level guidance:
- **Level 1** — Small, self-contained changes. Config tweaks, simple UI additions, backend-only adjustments. One developer, no cross-platform coordination.
- **Level 2** — Web-only features. New pages, reports, workflows, settings. May involve model + controller + views but stays within one platform.
- **Level 3** — Cross-platform features. Requires coordinated changes across Rails, iOS, and Android. New API endpoints consumed by mobile clients.

#### Section-by-Section Rules

For each section, follow these rules:

**§1 Executive Summary** — Always generate. Synthesize What, Why, and Key Design Principles from the raw input. If the "why" isn't clear, mark: `[NEEDS INPUT — why is this being built?]`

**§2 Goals & Success Metrics** — Extract goals from the raw input. If no metrics are specified, suggest reasonable defaults and mark `[NEEDS REVIEW]`.

**§3 Feature Requirements** — This is the most critical section.
- Extract every requirement from the raw input
- Assign IDs using section-appropriate prefixes (e.g., `ENT-001` for entry/entity, `CFG-001` for configuration, `RPT-001` for reporting, `VAL-001` for validation, `SEC-001` for security, `UI-001` for UI)
- Organize into functional area subsections
- Each requirement must be specific and testable — rewrite vague input into testable statements
- Set Platform based on the suggested Level
- Set Priority: Must (core functionality), Should (important but not blocking), Nice (enhancement)

**§4 Platform-Specific Requirements** — Based on the suggested Level:
- Level 1/2: Fill Web section, mark iOS/Android as "No changes required — Level [N] project"
- Level 3: Attempt to break out requirements per platform from the raw input

**§5 User Flows** — Generate step-by-step user flows from the raw input. If the raw input describes workflows or user interactions, formalize them. If it doesn't, generate reasonable default flows based on the requirements and mark `[NEEDS REVIEW — generated from requirements, verify accuracy]`.

**§6 UI Mockups / Wireframes** — If the feature is UI-heavy, generate ASCII mockups based on descriptions in the raw input. If the feature is backend-only or the raw input doesn't describe UI, write "N/A — backend changes only" or "No mockups provided in source material. Add wireframes or ASCII mockups here if needed."

**§7 Backwards Compatibility** — Include the compatibility matrix if Level 3 or if the raw input mentions API changes. For Level 1/2 web-only features with no API changes, write "N/A — no API or client-facing changes."

**§8 Edge Cases & Business Rules** — Extract from the raw input. Also infer additional edge cases based on the feature type (e.g., empty states, permission boundaries, concurrent access, data limits). Mark inferred cases with `[INFERRED]`.

**§9 Export Requirements** — Include if the feature involves reports, exports, or data output. Otherwise "N/A."

**§10 Out of Scope** — Extract explicit non-goals from the raw input. If the raw input doesn't specify, add `[DEFINE — what is explicitly NOT being built in this version?]`.

**§11 Open Questions** — Collect anything ambiguous or unresolved from the raw input. Also add questions you identified while analyzing the input. Mark each as blocking or non-blocking. Include a final assessment: "Blocking questions remain — resolve before pipeline intake" or "No blocking questions — this PRD is ready for pipeline intake (after human review)."

**§12 Release Plan** — Default to single-phase rollout with a feature flag unless the raw input specifies otherwise. Suggest a feature flag name based on the feature slug.

**§13 Assumptions** — List what's assumed to be true based on the raw input and project context.

**Appendix: Linked Documents** — Include links from the raw input. Add a row for the inbox source file.

#### Placeholder Markers

Use these markers consistently:

| Marker | Meaning |
|--------|---------|
| `[CONFIRM]` | Value suggested but needs human confirmation (e.g., Level, Platform) |
| `[NEEDS INPUT — ...]` | Section requires information not present in the raw input |
| `[NEEDS REVIEW]` | Content was generated/inferred and should be verified |
| `[INFERRED]` | Edge case or requirement inferred by the pipeline, not from raw input |
| `[DEFINE — ...]` | Section needs the human to define something specific |

### Step 5: Write Output

1. Create the project directory if it doesn't exist:
   ```bash
   mkdir -p projects/<slug>
   ```

2. Write the generated PRD to `projects/<slug>/prd.md`

3. Do **NOT** move or delete the inbox file — the user manages their own inbox.

### Step 6: Report to User

Tell the user:

1. The PRD has been generated at `projects/<slug>/prd.md`
2. **Review is required** — this is a draft, not a final PRD
3. Search for these markers and resolve them:
   - `[CONFIRM]` — verify suggested values (especially Level and Platforms)
   - `[NEEDS INPUT]` — add missing information
   - `[NEEDS REVIEW]` — verify generated content is accurate
   - `[INFERRED]` — confirm inferred edge cases are valid
   - `[DEFINE]` — fill in missing definitions
4. Set Status from "Draft — Review Required" to "Ready for Engineering" when satisfied
5. Then run `/stage1-discovery <slug>` to start the pipeline

## What NOT To Do

- **Do not run Stage 1.** Stage 0 only generates the PRD. The human reviews it first.
- **Do not delete inbox files.** The user manages the inbox.
- **Do not skip sections.** Every template section must appear in the output, even if marked with placeholders.
- **Do not invent requirements.** Extract from the raw input or mark as `[NEEDS INPUT]`. Inferred edge cases are OK (marked `[INFERRED]`) but core requirements must come from the source material.
- **Do not set Status to "Ready for Engineering."** The PRD starts as "Draft — Review Required" — only the human promotes it.
