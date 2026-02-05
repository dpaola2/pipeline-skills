# Stage 6: Review

> **Principle:** Every code review comment must be either addressed or resolved by updating conventions.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Code reviewer |
| **Input** | PR diff + AGENTS.md + Spec |
| **Output** | Review feedback (approve / request changes) |
| **Repos Accessed** | Platform-specific (read access to diff) |
| **Human Review** | Escalation path for architectural concerns |
| **Linear** | Updates milestone ticket status |

---

## What This Stage Does

The review agent examines each PR from Stage 5 against documented conventions, security requirements, the approved spec, and cross-platform consistency.

### Review Dimensions

#### 1. Convention Compliance
- Does the code follow `AGENTS.md` patterns?
- Naming conventions (models, controllers, methods, variables)
- File organization (where things live)
- Architecture patterns (service objects, concerns, etc.)
- Code style (formatting, structure)

#### 2. Security
- All DB queries scoped to account/user (multi-tenant)
- Controller authorization in place before data access
- Feature permissions respected
- Area-based access enforced (if applicable)
- API endpoints require authentication
- No XSS, SQL injection, or other injection vulnerabilities
- No secrets or credentials in code

#### 3. Spec Compliance
- Implementation matches the approved gameplan
- API endpoints match the architecture proposal (paths, methods, payloads)
- Data model matches the architecture proposal (tables, columns, types)
- Acceptance criteria are satisfied (cross-reference with tests)
- No features added that aren't in the spec
- No features missing that are in the spec

#### 4. Cross-Platform Consistency
- API payloads match across platform implementations
- Data model assumptions are consistent
- Error handling is consistent
- Feature behavior is equivalent (platform-appropriate, not identical)

#### 5. Code Quality
- No dead code
- No debugging artifacts (puts, print, console.log, breakpoints)
- No TODO comments (these should be spec items or Linear tickets)
- No unnecessary complexity
- Test quality (tests actually test the right things)
- No obvious performance issues (N+1 queries, missing indexes)

#### 6. Test Coverage
- All acceptance criteria have corresponding tests
- Security behaviors are tested
- Edge cases are tested
- Tests are meaningful (not just "it doesn't crash")

---

## Agent Behavior

### Review Process

1. **Read the spec** for the relevant milestone
2. **Read AGENTS.md** for the repo
3. **Read the PR diff** completely
4. **Check each review dimension** systematically
5. **Produce review with findings** categorized by severity

### Finding Severity

| Severity | Meaning | Action |
|----------|---------|--------|
| **Blocker** | Security vulnerability, data leak, spec violation | Must fix before merge |
| **Major** | Convention violation, missing test coverage, quality issue | Should fix before merge |
| **Minor** | Style nit, naming suggestion, minor improvement | Fix or acknowledge |
| **Note** | Observation, question, or suggestion | No action required |

### Auto-Fix vs Escalate

| Issue Type | Response |
|-----------|----------|
| Convention/style violations | Auto-fix (return to Stage 5 with specific instructions) |
| Missing test coverage | Auto-fix (return to Stage 4 for additional tests) |
| Security issues | Auto-fix if pattern is clear; escalate if judgment needed |
| Spec deviations | **Escalate to human** - don't auto-fix architecture |
| Cross-platform inconsistencies | **Escalate to human** - needs coordination |
| Performance concerns | Flag for human; don't auto-optimize |

### Review Loop

```
Stage 5 (Implementation) → Stage 6 (Review) → Approved? → Stage 7
                                ↓ No
                          Request changes
                                ↓
                          Stage 5 (fixes)
                                ↓
                          Stage 6 (re-review)
```

Maximum loop iterations before human escalation: **3**

If a PR goes through 3 review cycles without approval, escalate to human reviewer. This usually indicates a spec problem, not a code problem.

---

## Output: Review Feedback

### Approval

```markdown
## Review: APPROVED

**Milestone:** M1 - Section Management
**Platform:** Rails
**PR:** #123

### Summary
All review criteria pass. Code follows conventions, security scoping is correct,
implementation matches spec.

### Notes
- Nice use of existing `Positionable` concern for ordering
- Consider adding an index on `sections.position` if query patterns warrant it (not blocking)
```

### Request Changes

```markdown
## Review: CHANGES REQUESTED

**Milestone:** M1 - Section Management
**Platform:** Rails
**PR:** #123

### Blockers (must fix)
1. **[Security]** `SectionsController#create` - checklist lookup not scoped to account:
   - Current: `Checklist.find(params[:checklist_id])`
   - Required: `current_account.checklists.find(params[:checklist_id])`
   - File: `app/controllers/api/v1/sections_controller.rb:15`

### Major (should fix)
2. **[Convention]** Serializer uses integer enum values instead of string:
   - Current: `"status": 0`
   - Required: `"status": "active"` (per AGENTS.md: human-readable formats)
   - File: `app/blueprints/section_blueprint.rb:8`

### Minor
3. **[Style]** Method `reorder_positions` could use the existing `reposition!` pattern
   - See: `app/models/concerns/positionable.rb`
```

---

## Cross-Platform Consistency Check

When reviewing mobile PRs, the agent should verify against the Rails implementation:

- API request format matches what Rails expects
- API response parsing matches what Rails sends
- Error handling matches Rails error response format
- Authentication flow is consistent

This check requires access to both the mobile PR diff AND the Rails implementation (or the architecture proposal as reference).

---

## Success Criteria

- [ ] All blockers caught before merge
- [ ] Security issues identified (scoping, auth, injection)
- [ ] Spec compliance verified
- [ ] Convention compliance checked against AGENTS.md
- [ ] Cross-platform consistency validated
- [ ] Review feedback is specific and actionable
- [ ] Auto-fixable issues are fixed automatically (within 3 loops)
- [ ] Architectural concerns escalated (not auto-fixed)

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Review misses security issue | QA or human review catches later | Update AGENTS.md security section, add to review checklist |
| False positive (flags correct code) | Implementation agent can't fix non-issue | Human override, update review rules |
| Review loop > 3 iterations | Loop counter | Escalate to human |
| Cross-platform check finds inconsistency | PR comparison | Return to architecture proposal for clarification |

---

## Convention Evolution

When review consistently catches the same pattern:

1. **Document it in AGENTS.md** → agents follow it automatically
2. **Update review rules** → this check becomes standard
3. **Same comment never needed again**

This is the feedback loop that makes the pipeline smarter over time:
```
Review comment → Fix code OR update AGENTS.md →
AI/humans follow updated conventions → Same comment never needed again
```

---

## Dependencies

- **Requires:** PRs from Stage 5
- **Requires:** AGENTS.md in each repo
- **Requires:** Approved spec from Stage 3
- **Requires:** Architecture proposal from Stage 2
- **Produces:** Approved PRs for Stage 7 validation
