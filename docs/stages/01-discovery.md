# Stage 1: Discovery

> **Principle:** Understand TODAY before designing TOMORROW.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Codebase explorer |
| **Input** | PRD (structured markdown) |
| **Output** | Discovery Report |
| **Repos Accessed** | Rails, iOS, Android (read-only) |
| **Human Review** | Optional (recommended for complex features) |
| **Linear** | Updates project with discovery findings |

---

## What This Stage Does

The discovery agent explores the existing codebase across all three platforms to build a comprehensive picture of the current state before any design work begins.

This is the automated version of the M0 Discovery checklist item: *"Understand how things work TODAY on each platform."*

### Specific Tasks

1. **Parse the PRD** to extract:
   - Feature areas / functional domains
   - Entities mentioned (models, tables, concepts)
   - API endpoints referenced
   - Platforms affected

2. **Explore the Rails codebase** for:
   - Related models (schema, associations, validations, scopes)
   - Related controllers (actions, filters, authorization)
   - Related serializers/blueprints (what's currently exposed via API)
   - Related tests (existing test coverage)
   - Related migrations (schema history, previous changes)
   - Related background jobs
   - Related views (admin UI if applicable)

3. **Explore the iOS codebase** for:
   - Related models/entities
   - Related view controllers / views
   - Related API clients / networking code
   - Related tests
   - Patterns used for similar features

4. **Explore the Android codebase** for:
   - Related models/entities
   - Related activities / fragments / composables
   - Related API clients / networking code
   - Related tests
   - Patterns used for similar features

5. **Identify cross-platform patterns:**
   - How does data flow from Rails → API → iOS/Android?
   - What serialization format is used?
   - What API versioning exists?
   - How are similar features structured across platforms?

6. **Flag technical risks:**
   - Code that would need significant refactoring
   - Missing test coverage in areas that will change
   - Performance concerns (N+1 queries, missing indexes)
   - Security concerns (unscoped queries, missing auth checks)
   - Backwards compatibility risks

7. **Document open questions:**
   - Ambiguities in the PRD that code exploration doesn't resolve
   - Decisions that need human input
   - Assumptions that need validation

---

## Agent Behavior

### Search Strategy

The agent should search broadly first, then deep-dive into relevant areas:

1. **Keyword search** - Search for entity names, feature keywords from the PRD
2. **File pattern search** - Look for files matching model/controller/serializer patterns
3. **Dependency tracing** - From found files, trace associations and references
4. **Test search** - Find existing tests for related code

### What to Include

- File paths with line numbers for key findings
- Relevant code snippets (not entire files)
- Current schema for related tables
- Current API response format for related endpoints
- Existing test patterns that should be followed

### What NOT to Include

- Unrelated code (even if interesting)
- Suggestions for how to build the new feature (that's Stage 2)
- Opinions on existing code quality (unless it's a risk)

---

## Output: Discovery Report

Uses template: `templates/discovery-report.md`

Key sections:
1. **PRD Summary** - What the agent understood from the PRD
2. **Current State by Platform** - What exists today
3. **Data Model (Current)** - Schema for related tables
4. **API Endpoints (Current)** - Existing endpoints and their payloads
5. **Code Patterns** - How similar features are built
6. **Test Coverage** - What's tested today
7. **Technical Risks** - What could go wrong
8. **Open Questions** - What needs human input

---

## Success Criteria

- [ ] All entities mentioned in the PRD are traced to existing code (or flagged as new)
- [ ] Current data model is documented for affected tables
- [ ] Current API payloads are documented for affected endpoints
- [ ] Existing code patterns are identified (the new feature should follow them)
- [ ] Technical risks are flagged with severity
- [ ] Open questions are specific and actionable
- [ ] Report is useful enough that a human could skip reading the codebase

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Agent misidentifies related code | Human review of discovery report | Correct and re-run discovery |
| Agent misses related code | Gap surfaces in later stages | Add to discovery, update architecture |
| PRD too vague to search effectively | Agent reports "unable to identify entities" | PRD needs refinement (return to Shaping) |
| Codebase too large for thorough search | Agent times out or produces shallow results | Scope discovery to specific platforms/areas |

---

## Configuration

The discovery agent needs:
- Read access to all three repos (Rails, iOS, Android)
- PRD file path as input
- Output path for discovery report
- (Optional) Hints about which areas to focus on
