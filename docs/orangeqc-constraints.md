# OrangeQC-Specific Constraints

> **Purpose:** Documents the constraints unique to OrangeQC that the agent pipeline must respect. These are not generic best practices - they're hard-won lessons from building a multi-platform product with old clients in the field.

---

## Platform Architecture

### The Stack

| Platform | Language | Framework | Deploy Target |
|----------|----------|-----------|---------------|
| Web/API | Ruby | Rails | Heroku |
| iOS | Swift | UIKit/SwiftUI | App Store (via TestFlight) |
| Android | Kotlin | Android SDK | Play Store (via internal track) |

### API-First Architecture

Rails serves as both the web admin interface AND the API backend for mobile clients.

```
Web Admin (Rails views) ──┐
                          ├── Rails Backend ── PostgreSQL
iOS App ──── API ─────────┤
Android App ── API ───────┘
```

**Implication for the pipeline:** Rails API must be built and deployed to staging BEFORE mobile implementations begin. Mobile clients build against real API responses, not mocked ones.

### Build Order

```
1. Rails: migrations + models + API endpoints + serializers → deploy to staging
2. iOS: build against staging API
3. Android: build against staging API (can parallel with iOS)
4. Rails: admin UI (can parallel with mobile)
```

---

## Backwards Compatibility

### The Problem

~75% of users are on older versions of the mobile apps. We cannot force-update them. New API changes must not break old clients.

### Requirements

1. **API versioning** - New endpoints or changed payloads must consider old clients
2. **Compatibility matrices** - Every feature must document what each app version sees
3. **Graceful degradation** - Old apps should continue to function, even if they don't see new features
4. **Migration strategy** - How existing data transitions to new schema

### Compatibility Matrix Template

| Feature | Web (current) | iOS (current) | iOS (old) | Android (current) | Android (old) |
|---------|:---:|:---:|:---:|:---:|:---:|
| [Feature X] | Full | Full | [Degraded/Hidden/N/A] | Full | [Degraded/Hidden/N/A] |

**The pipeline must generate this matrix in Stage 2 (Architecture) and validate it in Stage 7 (Validation).**

---

## Multi-Tenant Security

OrangeQC is multi-tenant. All data access must be scoped.

### Non-Negotiable Rules

1. **All DB queries scoped to account** - No query should ever return data from another customer's account
2. **Controller authorization** - Access checks before data access, every time
3. **Feature permissions** - Feature availability respects user/account permission levels
4. **Area-based access** - Queries respect user's allowed areas (facility access control)
5. **API authentication** - All endpoints require authentication, authorization checked per-request

### What This Means for the Pipeline

- **Stage 2 (Architecture):** Security scoping must be part of the data model proposal
- **Stage 4 (Test Generation):** Tests must include authorization/scoping test cases
- **Stage 5 (Implementation):** All queries must use scoped access patterns
- **Stage 6 (Review):** Security review is a first-class concern, not optional

---

## Export/Reporting

Customers rely heavily on exports for compliance and reporting.

### Export Formats
- PDF reports
- Excel/CSV downloads
- Email-formatted reports

### Constraints
- Existing export formats cannot change without customer communication
- New features that add data must consider how that data appears in exports
- Export backwards compatibility is as important as API backwards compatibility

### Pipeline Impact
- **Stage 3 (Gameplan):** Export requirements must be explicit milestones
- **Stage 4 (Test Generation):** Export tests must validate format and content

---

## Agentic Development Guardrails

### Production Access

| Environment | Agent Access |
|-------------|-------------|
| Local development | Full access |
| Staging/beta | Can deploy (with human trigger) |
| Production | No direct access, ever |

### Platform-Specific Guardrails

**Rails/Heroku:**
- No Heroku git remote configured in development or CI environments
- Production deploys through separate, intentional process only
- `git remote -v` must not show Heroku remotes where agents operate

**iOS:**
- No production App Store credentials in agent environments
- TestFlight/beta distribution is acceptable for automation
- Production App Store submission requires explicit human action

**Android:**
- No production Play Store credentials in agent environments
- Internal testing / beta tracks acceptable for automation
- Production track submission requires explicit human action

### CI Checks
- All CI checks must pass before deploy - no exceptions
- No bypassing failed checks
- CI failures block the pipeline intentionally

### Code Review Comments
Every code review comment must be either:
1. **Addressed** - Fix the code as suggested
2. **Codified** - Update conventions/AGENTS.md so the same feedback doesn't recur

Invalid responses: "I'll fix it next time," ignoring the comment, marking resolved without action.

The feedback loop:
```
Review comment → Fix code OR update conventions →
AI/humans follow updated conventions → Same comment never needed again
```

---

## Team Context

### Current Team

| Person | Role | Platforms | AI Adoption | Notes |
|--------|------|-----------|-------------|-------|
| Dave | CTO | Rails (primary), all (oversight) | Advanced | Pipeline architect, only full-time Rails dev |
| Chris | Senior iOS | iOS | Adopted (was resistant) | Best engineer, craft-oriented |
| Shanitha | Senior Android | Android | Eagerly adopting | Growing quickly with AI |
| Stepwyz (Dan) | Agency | Rails | Using AI (limited hours) | ~7 hrs/week, limited responsiveness |

### Test Infrastructure Status

| Platform | Status | Pipeline-Ready? |
|----------|--------|:---------------:|
| Rails | RSpec suite in CI, coverage expanding | Yes |
| iOS | Developing rapidly | Not yet |
| Android | Developing rapidly | Not yet |

### Implications for Pipeline

- **Rails capacity is the bottleneck** - Dave is effectively the only full-time Rails developer
- **Pipeline must maximize Rails throughput** - Automating Rails implementation has highest leverage
- **Pipeline starts with Rails-only projects** - Rails test infrastructure is ready; iOS/Android will be added when their test suites mature
- **Mobile engineers will use pipeline output differently** - Chris may prefer reviewing agent output more carefully; Shanitha may run agents more autonomously
- **The pipeline should produce artifacts that work for different adoption levels** - Detailed specs work for manual builders AND agents

---

## Velocity Expectations

### The Target
20-day projects should become 1-week projects with AI/agent tooling.

### The Reality
- Implementation time compresses with agents
- Coordination time (alignment, decisions, reviews) does not compress
- The bottleneck shifts from "can we build it fast enough?" to "do we know what to build?"

### What This Means for the Pipeline
- PRD quality becomes the rate limiter
- Decision speed (human checkpoint approvals) is on the critical path
- The pipeline should minimize time-in-queue, not just time-in-execution
- Every stage should produce output that makes the NEXT decision faster

---

## Post-Ship Changes

Even "minor" tweaks after a feature ships need mini-PRDs:
- Document what's changing and why
- Identify which platforms are affected
- Call out edge cases or compatibility concerns
- Get alignment before implementation

The pipeline can be used for post-ship changes too - just with a smaller PRD as input. The same stages apply at reduced scale.

---

## Reference Materials for Pipeline Agents

Pipeline agents need access to these resources. Each serves a different purpose.

### Rails AGENTS.md (path in `pipeline.md` Target Repositories)

**What it contains:** Codebase conventions for agents writing Rails code.
- Code style, architecture patterns (services, presenters, strategies)
- Multi-tenancy scoping (`current_account`, `accessible_to(user)`)
- Permissions and access control (roles, supervisory zones)
- Testing conventions (RSpec `describe`/`context`/`subject` pattern, custom matchers like `is_anticipated`, FactoryBot, default_contexts)
- Database conventions (table tiers, concurrent indexes, backfill guidance, UUIDv7 via `DistributedEntity`)
- Serialization (Blueprinter for new, ActiveModel::Serializers for legacy)
- API versioning (date-based versioning: `/api/v20260201/`, plus legacy `/api/v4/`)
- Frontend conventions (Stimulus, Tailwind migration, ViewComponent)
- Production database snapshot with table sizes and access patterns

**Pipeline stages that use it:** Discovery (Stage 1), Architecture (Stage 2), Implementation (Stage 5), Review (Stage 6)

### API Documentation (path in `pipeline.md` Target Repositories)

**What it contains:** Complete API endpoint documentation for mobile clients.
- Endpoint specs with full request/response JSON examples
- Authentication mechanism (POST `/api/v4/authenticate` → `single_access_token` → `user_credentials` query param)
- Error response format (see below)
- Pagination patterns (legacy page-based and modern cursor-based)
- Sync patterns (tombstone sync, optimistic locking, PUT upsert with client-generated UUIDs)
- Download and upload endpoint conventions
- Postman collection and staging environment config

**Pipeline stages that use it:** Architecture (Stage 2), Test Generation (Stage 4), Review (Stage 6), Validation (Stage 7)

### Key API Conventions

These conventions are documented in the apiv4 repo but are critical enough to call out here since they differ from Rails defaults.

**Response envelope:** Resource-keyed, not a generic wrapper.
- Collections: `{ "tickets": [...] }`
- Single resources: `{ "ticket": {...} }`

**Error responses:** Flat format, not field-level.
```json
{
  "error": "Unprocessable Entity",
  "message": "Name can't be blank"
}
```
The `error` field is one of: `Unauthorized`, `Forbidden`, `Unprocessable Entity`. The `message` is a human-readable string. This is NOT the Rails default `{ "errors": { "field": ["msg"] } }` format.

**Two API generations exist side by side:**

| Convention | Legacy (v4) | Modern (date-versioned) |
|---|---|---|
| IDs | Integer | UUIDv7 |
| Pagination | `page` param, empty response = done | Cursor-based, `meta.next_cursor` |
| Idempotency | `guid` / `submission_token` field | PUT with client-generated UUID in path |
| Deletion | `DELETE` endpoint, soft delete | PUT with `deleted_at` field (tombstone) |
| Timestamps | ISO 8601 | ISO 8601 with milliseconds |

**New features should follow the modern conventions** (date-versioned endpoints, UUIDv7, cursor pagination, PUT upsert, tombstone sync) unless there's a specific reason not to. The apiv4 docs contain examples of both patterns.

### Swagger / API Docs in Rails Repo

The Rails repo also contains Swagger API documentation (`swagger/` directory, `/api-docs` endpoint) and architectural decision records (`doc/adrs/`). These are supplementary to the apiv4 docs.
