# Stage 7: Validation

> **Principle:** If we can't reason about it safely, it isn't finished.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Quality validator |
| **Input** | All reviewed & merged PRs for the feature |
| **Output** | QA Plan |
| **Repos Accessed** | All (read access) + CI |
| **Human Review** | Report is delivered to QA team / human tester |
| **Linear** | Transitions tickets to "Ready for QA" |

---

## What This Stage Does

The validation agent runs after all milestone PRs are reviewed and merged. It performs a final quality sweep and produces a QA plan that tells a human tester exactly what's been built, what's been tested automatically, and what needs manual exploration.

### Specific Tasks

1. **Run full test suite** across all platforms
   - All new tests pass
   - All existing tests still pass (no regressions)
   - Test run is clean (no flaky tests, no skipped tests)

2. **Acceptance criteria coverage audit**
   - Cross-reference spec acceptance criteria with test coverage matrix
   - Identify any acceptance criteria NOT covered by automated tests
   - Flag gaps for manual QA focus

3. **Backwards compatibility verification**
   - Verify old API versions still work (if API versioning is in play)
   - Check compatibility matrix from architecture proposal
   - Identify what old app versions will see

4. **Feature flag verification**
   - Feature flag exists and is configured correctly
   - Feature is OFF by default (unless spec says otherwise)
   - Feature can be toggled per account (beta flag)

5. **Cross-platform consistency final check**
   - API payloads match across all platform implementations
   - Feature behavior is equivalent across platforms
   - Data flows correctly: create on iOS → visible on Android → visible on web (and all permutations)

6. **Observability check**
   - Logging is in place for key operations
   - Metrics/analytics tracking configured (if specified in spec)
   - Debug paths exist (can diagnose failures from logs alone)

7. **Produce QA Plan**
   - Comprehensive summary for human QA

---

## QA Plan

**Skill:** `/stage7-qa-plan <project-slug>` (see `.claude/skills/stage7-qa-plan/SKILL.md`)

Uses template: `templates/qa-plan.md`

### Report Sections

#### 1. Feature Summary
What was built, which milestones are included, overall scope.

#### 2. What's Tested Automatically
- Count of new tests per platform
- Types of tests (unit, integration, E2E)
- All acceptance criteria covered by automated tests (with test file references)

#### 3. What Needs Manual Testing
- Acceptance criteria NOT covered by automated tests
- UI/UX verification (look and feel, responsiveness, accessibility)
- Cross-platform behavioral consistency
- Edge cases that are hard to automate
- Performance under realistic conditions

#### 4. Backwards Compatibility
- Compatibility matrix (filled out)
- Specific scenarios to verify with old app versions
- API versioning status

#### 5. Feature Flags
- Flag name and configuration
- How to enable for testing
- Which accounts should get beta access

#### 6. Known Limitations
- Anything deferred to future work
- Known issues or trade-offs
- Out-of-scope items from the PRD

#### 7. Test Data Setup
- Instructions for running the QA Test Data milestone's rake task (`pipeline:seed_<slug>`)
- What scenarios are seeded (accounts, permissions, data volumes, edge cases)
- Credentials and URLs produced by the seed task
- If no seed task exists (older project), describe what data must be set up manually

#### 8. Rollback Plan
- How to disable if issues found (feature flag off)
- Any migrations that need reverting
- Impact of rollback on data created while feature was on

---

## Linear Integration

Upon producing the QA Plan:

1. **Transition all milestone tickets** to "Ready for QA"
2. **Create a QA ticket** with the QA plan as description
3. **Link QA ticket** to all milestone tickets
4. **Assign QA ticket** to the designated tester (or unassigned for team pickup)
5. **Add comment** to parent project with summary

---

## Success Criteria

- [ ] Full test suite passes on all platforms (zero failures)
- [ ] No regressions (existing tests still pass)
- [ ] Every acceptance criterion either has automated tests or is flagged for manual QA
- [ ] Backwards compatibility matrix is verified
- [ ] Feature flag is configured and documented
- [ ] QA plan is complete and actionable
- [ ] A QA tester could pick up the report and start testing without asking questions
- [ ] Linear tickets are updated to correct status

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Tests fail | Test suite run | Return to Stage 5 for fixes |
| Regression detected | Existing test fails | Investigate and fix (may be Stage 5 or spec issue) |
| Acceptance criteria gap | Coverage audit | Return to Stage 4 for additional tests, or flag for manual QA |
| Feature flag misconfigured | Flag check | Fix configuration |
| Cross-platform inconsistency | Consistency check | Return to Stage 6 for review, may need Stage 5 fixes |

---

## What Happens After This Stage

The pipeline's job is done. The output is:

1. **Merged code** across all three platforms
2. **Passing test suite** with comprehensive coverage
3. **QA Plan** for manual/exploratory testing

What follows is human-driven:
- **Manual QA** (exploratory testing, UX review, real-device testing)
- **Stakeholder review** (demo, approval)
- **Production deployment** (human-triggered, guardrails enforced)
- **Monitoring** (post-deploy observability)

The pipeline does NOT:
- Deploy to production
- Replace manual/exploratory QA
- Make ship/no-ship decisions
- Handle post-ship issues

---

## Dependencies

- **Requires:** All milestone PRs reviewed and merged (Stages 5-6 complete)
- **Requires:** CI pipeline that runs full test suite
- **Requires:** Feature flag infrastructure
- **Produces:** QA Plan (final pipeline output)
