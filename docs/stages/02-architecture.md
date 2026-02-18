# Stage 2: Architecture

> **Principle:** Align on data model and API payloads BEFORE splitting work across platforms.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Technical designer |
| **Input** | PRD + Discovery Report |
| **Output** | Architecture Proposal |
| **Repos Accessed** | Primary repo, additional platform repos (reference) |
| **Human Review** | **Required** — Architecture Review checkpoint (before Stage 3) |
| **Linear** | Creates architecture review issue |

---

## What This Stage Does

The architecture agent proposes the technical design for the feature. This is the shared contract that all platforms build against.

### Specific Tasks

1. **Data Model Design:**
   - New tables, columns, indexes
   - Modifications to existing tables
   - Associations and relationships
   - Primary key format per PIPELINE.md conventions
   - Data types and constraints
   - Default values and nullability

2. **Migration Planning:**
   - DDL statements needed
   - Concurrent index operations (if supported by framework/database)
   - Backfill strategy (if migrating existing data)
   - Rollback plan
   - Expected data volumes and growth

3. **API Endpoint Design:**
   - New or modified endpoints (method, path, purpose)
   - Full example request JSON (with all fields)
   - Full example response JSON (with all fields)
   - Serializer design (per PIPELINE.md Framework & Stack)
   - Pagination requirements
   - Error response format
   - Human-readable formats (ISO 8601, string enums, readable numbers)

4. **Backwards Compatibility Analysis:**
   - Compatibility matrix (what each app version sees)
   - API versioning approach (if needed)
   - Migration strategy for old clients
   - What breaks vs what continues to work

5. **Security Design:**
   - Query scoping approach (account/user/area)
   - Authorization model (who can do what)
   - Permission requirements
   - New attack surface analysis

6. **Export Impact:**
   - How new data appears in existing exports
   - New export requirements
   - Export format backwards compatibility

---

## Agent Behavior

### Design Approach

The agent should:

1. **Start from the discovery report** - Build on what exists, don't reinvent
2. **Follow existing patterns** - If the codebase uses service objects, use service objects. If it uses concerns, use concerns.
3. **Be explicit about everything** - No "TBD" or "we'll figure it out." If a decision can't be made, flag it as an open question.
4. **Design for approval** - The output must be reviewable and complete. A human will approve this before the gameplan is generated. No "TBD" allowed.

### Convention Adherence

The architecture proposal must follow conventions from the conventions file (path from PIPELINE.md):
- Naming conventions (table names, column names, endpoint paths)
- Serialization patterns (per PIPELINE.md Framework & Stack)
- Migration patterns (how the project handles schema changes)
- API response structure (envelope format, meta fields, pagination format)

### What Requires Human Input

The agent should flag (not decide) when:
- Multiple valid architectural approaches exist (propose options with trade-offs)
- The change conflicts with an existing pattern
- Backwards compatibility requires breaking changes
- Performance implications are uncertain
- The PRD requirements are ambiguous

---

## Output: Architecture Proposal

Template is embedded in the `/architecture` skill (`.claude/skills/architecture/SKILL.md`).

Key sections:
1. **Data Model Changes** - New/modified tables with full schema
2. **Migrations** - Migration code per framework conventions
3. **API Endpoints** - Full request/response examples
4. **Backwards Compatibility** - Compatibility matrix
5. **Security** - Scoping and authorization design
6. **Export Impact** - Changes to export behavior
7. **Open Questions** - Decisions that need human input
8. **Alternatives Considered** - Other approaches and why they were rejected

---

## Example: API Endpoint Design

For each endpoint, the proposal should include:

```
### POST /api/v1/resources/:resource_id/items

**Purpose:** Create a new item within a resource

**Request:**
```json
{
  "item": {
    "name": "Example Item",
    "position": 2
  }
}
```

**Response (201 Created):**
```json
{
  "item": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "name": "Example Item",
    "position": 2,
    "resource_id": "fedcba98-7654-3210-fedc-ba9876543210",
    "items_count": 0,
    "created_at": "2026-02-05T14:30:00Z",
    "updated_at": "2026-02-05T14:30:00Z"
  }
}
```

**Authorization:** User must have edit access to the resource's account.
**Scoping:** [Per PIPELINE.md Multi-Tenant Security scoping chain, if applicable]
```

---

## Human Checkpoint: Architecture Review

This stage produces a checkpoint artifact. The architecture proposal must be **reviewed and approved** before Stage 3 (Gameplan) begins.

### Why This Is a Separate Checkpoint

The data model and API contract are the foundation everything builds on. Mistakes here propagate through the gameplan, tests, and implementation. Catching issues early (before the full gameplan is generated) is dramatically cheaper than catching them after implementation has started.

### What the Reviewer Checks

See `docs/pipeline-architecture.md` → "Human Checkpoint: Architecture Review" for the full checklist.

Key questions:
- Is the data model correct? (Tables, columns, relationships, constraints)
- Is the API design consistent with existing patterns?
- Is backwards compatibility handled?
- Is security scoping correct?
- Is the migration strategy safe?
- Are the open questions answerable?

### Approval Outcomes
1. **Approved** → Stage 3 (Gameplan) begins with the approved architecture as input
2. **Approved with modifications** → Agent incorporates feedback, re-generates affected sections
3. **Rejected** → Returns to Stage 2 (design issues) or Stage 1 (fundamental misunderstanding)

---

## Success Criteria

- [ ] Data model is complete (no "TBD" fields)
- [ ] Every API endpoint has full request AND response JSON examples
- [ ] Backwards compatibility matrix is filled out
- [ ] Migrations are specified (not just "we'll need a migration")
- [ ] Security scoping is explicit for every new data access path
- [ ] Proposal follows existing codebase patterns (from discovery report)
- [ ] Open questions are specific and actionable
- [ ] An engineer on another platform could read the API section and know exactly what to build against
- [ ] The proposal is self-contained enough for a human to review without running code

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Data model conflicts with existing schema | Review catches constraint violations | Revise with schema awareness |
| API design inconsistent with existing endpoints | Review compares to existing patterns | Align with established patterns |
| Missing backwards compatibility analysis | Checklist review | Add compatibility matrix |
| Over-engineering (too many abstractions) | Human review flags complexity | Simplify to minimum viable design |
| Under-specifying (vague endpoint descriptions) | Other platform engineers can't build from it | Add explicit examples |
