# Stage 5: Implementation

> **Principle:** Make the failing tests pass. Follow the spec. Don't deviate without updating.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Code builder (one per platform) |
| **Input** | Approved Spec + Failing Tests (per milestone) |
| **Output** | Implementation code + Passing tests |
| **Repos Accessed** | Platform-specific (write access) |
| **Human Review** | Via Stage 6 (Review) |
| **Linear** | Updates milestone ticket to "In Progress" then "In Review" |

---

## What This Stage Does

The implementation agent writes code to make the failing tests from Stage 4 pass. It works milestone-by-milestone, platform-by-platform, following the approved spec.

### Execution Order

```
For each milestone (M1, M2, M3, ...):
  1. Rails API (backend)
     - Migrations
     - Models
     - Controllers + endpoints
     - Serializers
     - Background jobs (if any)
     → Deploy to staging

  2. iOS (can start after Rails staging deploy)
     - Models
     - API clients
     - View models
     - Views/UI

  3. Android (can parallel with iOS after Rails staging deploy)
     - Models
     - API clients
     - View models
     - Views/UI

  4. Rails Admin UI (can parallel with mobile)
     - Views
     - JavaScript/Stimulus
```

### Why This Order

- Mobile depends on API. Building mobile against a spec is fragile; building against a real staging API catches integration issues early.
- Rails API has no dependencies on mobile. It can be built and deployed first.
- iOS and Android are independent of each other and can be built in parallel.
- Admin UI (Rails views) is independent of mobile.

---

## Agent Behavior

### Per-Milestone Workflow

For each milestone:

1. **Read the milestone spec** - Goals, acceptance criteria, platform tasks
2. **Read the failing tests** - These define the contract
3. **Read AGENTS.md** - Follow conventions
4. **Implement to make tests pass** - Minimum viable code that satisfies tests
5. **Run the test suite** - Verify all milestone tests pass AND no existing tests break
6. **Create a PR** - One PR per milestone per platform

### Code Quality Standards

- Follow existing patterns from the codebase (discovery report identified these)
- Follow `AGENTS.md` conventions explicitly
- No dead code, no TODO comments, no debugging artifacts
- Security: scoped queries, authorization checks, input validation
- Performance: avoid N+1 queries, use appropriate indexes
- Human-readable: clear naming, consistent style, minimal complexity

### What the Agent Should NOT Do

- Don't refactor unrelated code
- Don't add features not in the spec
- Don't optimize prematurely
- Don't skip tests ("I'll add tests later")
- Don't deviate from the spec without flagging it
- Don't deploy to production (guardrails)

### When the Spec Has Gaps

If the agent discovers the spec is incomplete or incorrect during implementation:

1. **Stop** - Don't guess or improvise
2. **Document the gap** - What's missing, what decision is needed
3. **Flag for human review** - This may need to go back to Stage 3
4. **Continue with other milestones** if the gap is isolated

---

## PR Standards

### PR Size
- One PR per milestone per platform
- If a milestone touches multiple areas, it's still one PR (vertical slice)
- PRs should be reviewable in one sitting

### PR Description Template

```markdown
## Milestone: [M1: Section Management]

**Spec:** [link to gameplan]
**Linear:** [link to milestone ticket]

## What This PR Does
[Brief description]

## Acceptance Criteria
- [x] SEC-001: Admin can create sections
- [x] SEC-002: Admin can reorder sections
- [ ] SEC-003: [If not in this PR, note which PR]

## Test Coverage
- [X] All milestone tests passing
- [X] No existing tests broken
- [X] Security tests included

## API Changes
[List new/modified endpoints]

## Migration
[List any schema changes]

## Screenshots/Evidence
[If UI changes]
```

### Branch Naming

```
pipeline/[project-id]/m[milestone]-[platform]-[brief-description]
Example: pipeline/sections/m1-rails-core-model
Example: pipeline/sections/m2-ios-section-ui
```

### Commit Messages

```
[M1][Rails] Add Section model with associations and validations

- Creates sections table with UUIDv7 PK
- Adds belongs_to :checklist, has_many :line_items
- Validates presence of name
- Scopes to account via checklist

Pipeline: sections | Stage: implementation | Milestone: M1
```

---

## Staging Deployment

### Rails
After Rails PR is merged for a milestone:
- Deploy to staging environment
- Verify API endpoints respond correctly
- Mobile agents can now build against real API

### Mobile
After mobile PRs are merged:
- Build and distribute via TestFlight (iOS) / internal track (Android)
- Available for QA on real devices

### What Agents Can Deploy To
| Environment | Agent Can Deploy? |
|-------------|-------------------|
| Local/dev | Yes |
| Staging | Yes (with human trigger) |
| Production | **Never** |

---

## Success Criteria

- [ ] All milestone tests pass
- [ ] No existing tests broken (regression-free)
- [ ] Code follows `AGENTS.md` conventions
- [ ] PR is properly formatted with description, links, evidence
- [ ] Migrations run cleanly
- [ ] API endpoints match the architecture proposal exactly
- [ ] Security scoping is in place (all queries account-scoped)
- [ ] No dead code, TODOs, or debugging artifacts

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Tests won't pass after 3 attempts | Attempt counter | Escalate to human - likely spec or test issue |
| Existing tests break | CI regression detection | Fix regression or flag spec conflict |
| Agent deviates from spec | Review (Stage 6) catches deviation | Revert, implement per spec |
| Migration fails | CI or staging deploy fails | Fix migration, ensure rollback works |
| Performance regression | Staging smoke test (if available) | Optimize or flag for human review |

---

## Parallelization

Within a single milestone, platform implementations are partially parallelizable:

```
Rails API ──────────────────→ Deploy to staging ─┐
                                                  ├→ iOS ───────→
                                                  └→ Android ───→
Rails Admin UI ─────────────────────────────────→
```

Across milestones, there IS a dependency: M2 may depend on M1's data model. The gameplan's dependency graph governs this.

---

## Dependencies

- **Requires:** Approved spec from Stage 3
- **Requires:** Failing tests from Stage 4
- **Requires:** `AGENTS.md` in each repo
- **Requires:** CI pipeline that runs tests
- **Produces:** PRs with passing tests for Stage 6 review
