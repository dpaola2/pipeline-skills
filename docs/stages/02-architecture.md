# Stage 2: Architecture

> **Principle:** Align on data model and API payloads BEFORE splitting work across platforms.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Technical designer |
| **Input** | PRD + Discovery Report |
| **Output** | Architecture Proposal |
| **Repos Accessed** | Rails (primary), iOS/Android (reference) |
| **Human Review** | Included in Stage 3 checkpoint |
| **Linear** | Creates architecture review issue |

---

## What This Stage Does

The architecture agent proposes the technical design for the feature. This is the shared contract that all platforms build against.

### Specific Tasks

1. **Data Model Design:**
   - New tables, columns, indexes
   - Modifications to existing tables
   - Associations and relationships
   - UUIDv7 primary keys (OrangeQC convention)
   - Data types and constraints
   - Default values and nullability

2. **Migration Planning:**
   - DDL statements needed
   - `disable_ddl_transaction!` for concurrent index operations
   - Backfill strategy (if migrating existing data)
   - Rollback plan
   - Expected data volumes and growth

3. **API Endpoint Design:**
   - New or modified endpoints (method, path, purpose)
   - Full example request JSON (with all fields)
   - Full example response JSON (with all fields)
   - Serializer/blueprint design
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
4. **Design for the spec checklist** - The output should make the gameplan agent's job easy

### Convention Adherence

The architecture proposal must follow conventions from `AGENTS.md`:
- Naming conventions (table names, column names, endpoint paths)
- Serialization patterns (Blueprinter, jbuilder, or whatever the project uses)
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

Uses template: `templates/architecture-proposal.md`

Key sections:
1. **Data Model Changes** - New/modified tables with full schema
2. **Migrations** - SQL/Rails migration code
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
### POST /api/v1/checklists/:checklist_id/sections

**Purpose:** Create a new section within a checklist

**Request:**
```json
{
  "section": {
    "name": "Bathroom Fixtures",
    "position": 2
  }
}
```

**Response (201 Created):**
```json
{
  "section": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "name": "Bathroom Fixtures",
    "position": 2,
    "checklist_id": "fedcba98-7654-3210-fedc-ba9876543210",
    "line_items_count": 0,
    "created_at": "2026-02-05T14:30:00Z",
    "updated_at": "2026-02-05T14:30:00Z"
  }
}
```

**Authorization:** User must have edit access to the checklist's account.
**Scoping:** Checklist looked up via `current_account.checklists.find(params[:checklist_id])`
```

---

## Success Criteria

- [ ] Data model is complete (no "TBD" fields)
- [ ] Every API endpoint has full request AND response JSON examples
- [ ] Backwards compatibility matrix is filled out
- [ ] Migrations are specified (not just "we'll need a migration")
- [ ] Security scoping is explicit for every new data access path
- [ ] Proposal follows existing codebase patterns (from discovery report)
- [ ] Open questions are specific and actionable
- [ ] A mobile engineer could read the API section and know exactly what to build against

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Data model conflicts with existing schema | Review catches constraint violations | Revise with schema awareness |
| API design inconsistent with existing endpoints | Review compares to existing patterns | Align with established patterns |
| Missing backwards compatibility analysis | Checklist review | Add compatibility matrix |
| Over-engineering (too many abstractions) | Human review flags complexity | Simplify to minimum viable design |
| Under-specifying (vague endpoint descriptions) | Mobile engineers can't build from it | Add explicit examples |
