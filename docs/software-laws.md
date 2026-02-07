# Software Laws and the Agent Pipeline

> **Purpose:** A reference of fundamental software principles — "physical laws" — and how each one specifically applies to the design and evolution of this pipeline. These aren't theoretical musings; each law has already surfaced in practice or directly constrains a roadmap decision.
>
> See also: [[design-priorities]] — synthesized design priorities derived from these laws.

---

## Gall's Law

> *"A complex system that works is invariably found to have evolved from a simple system that worked. A complex system designed from scratch never works."*

**How it applies:**

The pipeline's development history follows Gall's Law faithfully — and should continue to. The progression was: one product (OrangeQC) → one platform (Rails) → manual stage invocation → one project end-to-end → second product (Show Notes) → externalized config. Each step was a working system before the next step was attempted.

**Roadmap implications:**

- ROAD-11 (Ludicrous Speed) should not jump from "manual invocation with human checkpoints" to "auto-advance everything." The working intermediate steps are: manual → notifications tell you when to act (ROAD-02) → auto-advance for specific stages you trust → full ludicrous mode.
- ROAD-03 (Per-Milestone Gameplans) is a significant architectural change. It should be validated on a single project before becoming the default, and the old format should keep working during the transition.
- The orchestration layer (future phase) should automate what's already working manually, not redesign the pipeline to be automatable.

**The test:** Before adding complexity, ask: "Does the current simpler system work?" If yes, evolve it. If no, fix it before adding more.

---

## Goodhart's Law

> *"When a measure becomes a target, it ceases to be a good measure."*

**How it applies:**

This is the most dangerous law for agent pipelines. The pipeline's quality signals — test pass counts, lint results, CI green status, coverage percentages — are proxies for "this code is correct and well-crafted." The moment an agent optimizes for making those signals green rather than writing correct code, the signals become worthless.

**Where the risk is highest:**

1. **ROAD-17 (CI Auto-Fix)** — If the agent's goal is "make CI green," it might stub out a failing test instead of fixing the implementation, add `skip` to a test that reveals a real bug, or catch-and-swallow exceptions to make an error check pass.

2. **Stage 4 (Test Generation)** — If the pipeline measures "test count," agents write more tests. If it measures "test coverage %," agents write tests that touch lines without asserting meaningful behavior. The quality of tests matters more than the quantity, and quality is hard to measure automatically.

3. **Stage 5 (Implementation)** — "All tests pass" is the success signal. An agent that modifies a test to make it pass (rather than fixing the implementation) achieves the signal without the substance.

4. **ROAD-11 (Ludicrous Speed)** — Auto-advancing based on "no blocking open questions" incentivizes the agent to not surface hard questions. If raising a question means the pipeline stops, the agent is incentivized to guess rather than ask.

**Mitigations:**

- ROAD-09 (Code Review) acts as a Goodhart-resistant check — a stage whose job is to ask "is this code *actually correct*?" rather than "do the metrics say it's correct?"
- Human checkpoints are inherently Goodhart-resistant because humans evaluate intent, not metrics.
- ROAD-17's guardrails should include "no test modifications" and "no skips" — the agent fixes implementation code, not test code. (Unless the test itself has a genuine bug, which is a judgment call that deserves human review.)

**The test:** For every quality signal the pipeline uses, ask: "If an agent optimized purely for this signal, would the output still be good?" If not, pair it with a signal that's harder to game.

---

## Amdahl's Law

> *"The speedup of a program using multiple processors is limited by the fraction of the program that must run sequentially."*

**How it applies:**

For the pipeline, the sequential bottleneck is human checkpoints. No matter how fast agent stages get, the wall-clock time for a project is dominated by:

1. How long a human takes to review architecture (Checkpoint 1)
2. How long a human takes to review the gameplan (Checkpoint 2)
3. How long a human takes to perform QA (Stage 7 output)

These are inherently sequential — no amount of agent parallelization can make a human review faster.

**Roadmap implications:**

- Making agent stages faster (ROAD-11) yields diminishing returns unless human review time is also reduced.
- ROAD-06 (Document Linking) and ROAD-02 (Notifications) might deliver more wall-clock speedup than any agent optimization, because they reduce the friction of the sequential human steps. A reviewer who gets notified immediately and can click through to the artifact reviews faster than one who has to remember to check.
- The highest-leverage improvement might be: make the architecture proposal and gameplan *easier to review* — better formatting, executive summaries, clear diff-from-last-version. These aren't on the roadmap yet but attack the actual bottleneck.
- ROAD-11's auto-advance for low-risk stages (e.g., auto-advance from Stage 1 to Stage 2, since Stage 1 is read-only exploration) removes sequential steps that don't need human attention.

**The test:** Before optimizing a stage for speed, ask: "Is this stage on the critical path, or is a human checkpoint the bottleneck?" Optimize what's actually slow.

---

## Conway's Law

> *"Organizations which design systems are constrained to produce designs which are copies of the communication structures of those organizations."*

**How it applies:**

In this pipeline, the "organization" is the pipeline stages themselves. The boundaries between stages shape the boundaries in the generated code. Each stage has a specific worldview:

- Stage 2 (Architecture) thinks in data models, service objects, and API contracts
- Stage 3 (Gameplan) thinks in milestones, acceptance criteria, and sequencing
- Stage 5 (Implementation) thinks in controllers, views, and tests

When these stages communicate through artifacts (the architecture proposal, the gameplan), the fidelity of that communication determines the quality of the output. If Stage 2 proposes a service object interface that Stage 5 doesn't naturally use, you get architecture/implementation mismatch.

**Already observed:**

- Architecture proposals have specified service methods not needed by the implementation — the architecture "team" designed for an interface the implementation "team" didn't use.
- Stage 4 (Test Generation) writes tests before Stage 5 implements — if the test's mental model of how the code should work doesn't match Stage 5's implementation approach, you get tests that are technically passing but structurally awkward.

**Roadmap implications:**

- ROAD-03 (Per-Milestone Gameplans) tightens the communication structure between architecture and implementation. Smaller "teams" (per-milestone rather than per-project) with tighter communication produce more cohesive systems.
- ROAD-15 (Knowledge Extraction) can capture "Stage 5 didn't use the service method Stage 2 proposed" as a lesson that feeds back into Stage 2's templates — teaching the architecture "team" to speak the implementation "team's" language.
- ROAD-09 (Code Review) is a check on Conway's Law — it asks "does the implementation match the architecture's intent?" after the fact.

**The test:** When a stage produces output, ask: "Will the consuming stage naturally work with this, or are we creating an interface that sounds good but doesn't match how the next stage actually operates?"

---

## Chesterton's Fence

> *"Don't remove a fence until you understand why it was put there."*

**How it applies:**

Critical for agents modifying existing codebases. When Stage 5 implements a feature in a mature Rails app, it encounters existing validations, callbacks, guard clauses, and naming conventions. The agent might see a validation as "unnecessary" and work around it, when in fact it exists to prevent a data integrity issue that took months to discover.

**Already observed:**

- `SupervisoryZone` overlap validation — exists because of real business constraints around zone hierarchies
- `InspectionForm` requiring at least one `InspectionFormItem` — a data integrity invariant the app depends on
- `Rating` model validating `range_choices` — not arbitrary, tied to the scoring display system
- `User` login validation (only letters, numbers, underscores) — exists because logins appear in URLs and API keys

Each of these was discovered by the agent during implementation. In every case, the right response was to work *with* the validation, not around it. But the agent only knew to do this because Stage 1 (Discovery) had explored the codebase first.

**Roadmap implications:**

- Stage 1 (Discovery) is the primary defense against Chesterton's Fence violations. Its quality directly determines how well later stages respect existing constraints. Improvements to discovery depth pay dividends across all downstream stages.
- ROAD-15 (Knowledge Extraction) would codify these fences — "SupervisoryZone has overlap validation because..." — so future projects don't trip on the same constraints. The conventions file in the target repo becomes a catalog of fences and their reasons.
- ROAD-09 (Code Review) can explicitly check: "Did the implementation bypass any existing validations, callbacks, or guard clauses? If so, is there a documented reason?"

**The test:** When the agent encounters a constraint that makes implementation harder, the default should be "respect it and adapt" not "remove it and simplify." If removing it is truly necessary, it should be flagged for human review.

---

## Lehman's Laws of Software Evolution

> Specifically the law of increasing complexity: *"As a system evolves, its complexity increases unless work is done to maintain or reduce it."*

**How it applies:**

This applies to the pipeline itself, not just the code it produces. Every roadmap item adds complexity:

- ROAD-17 adds a feedback loop (new execution pattern)
- ROAD-03 restructures the artifact layout (new directory conventions)
- ROAD-08 adds an external integration (Linear API dependency)
- ROAD-11 adds conditional logic to checkpoint handling (auto-advance rules)
- ROAD-15 adds a cross-cutting concern to every stage (knowledge extraction steps)

Without deliberate simplification, the pipeline will become harder to understand, maintain, and onboard to.

**Already observed:**

The pipeline has already had simplification phases:
- ROAD-05 (externalize config) consolidated scattered hardcoded paths into two config files
- ROAD-14 (externalize work dirs) removed product-specific data from the pipeline repo
- The single-branch-per-project decision simplified what could have been a multi-branch strategy

These weren't "features" — they were complexity reductions that made the next set of features possible.

**Roadmap implications:**

- The roadmap should periodically include simplification items alongside feature items. After a burst of new capabilities (ROAD-09, ROAD-17, ROAD-08), schedule a consolidation pass.
- `PIPELINE.md` is already growing sections (REQUIRED and OPTIONAL help, but the format still expands). Monitor its size and complexity — if it becomes a barrier to onboarding, that's Lehman's Law winning.
- Each new stage or skill should be evaluated not just on its value but on its complexity cost. A feature that adds value but also adds a new config format, a new artifact type, and a new dependency is more expensive than it looks.

**The test:** After adding a capability, ask: "Is the pipeline still simple enough that a new person could understand the full flow in 30 minutes?" If not, simplify before adding more.

---

## Postel's Law (Robustness Principle)

> *"Be conservative in what you send, liberal in what you accept."*

**How it applies:**

Directly relevant to how stages consume each other's outputs. Stage 3 reads Stage 2's architecture proposal. Stage 5 reads Stage 3's gameplan. Stage 7 reads Stage 5's progress file. Each stage is a producer-consumer relationship where the contract is a markdown template.

If each stage is brittle about the exact format of its input — expecting specific heading names, table column counts, or section ordering — the pipeline breaks when any upstream stage changes its output. Templates define the contract, but agents don't produce pixel-perfect template output every time. Extra sections, slightly different wording, or reordered content shouldn't cause downstream failures.

**Roadmap implications:**

- ROAD-03 (Per-Milestone Gameplans) changes the artifact structure. Every downstream stage (Stage 4, Stage 5) needs to handle both old-format and new-format gameplans during the transition period. If the skills are brittle parsers, the transition will be painful.
- ROAD-15 (Knowledge Extraction) adds new sections to stage outputs. Stages that consume those outputs should ignore sections they don't recognize, not fail.
- Skills should parse their inputs by semantic content ("find the section about milestones") rather than by structural position ("read the third section"). This is more resilient to template evolution.

**Conservative in what you send:** Stage outputs should conform strictly to their templates. The agent should produce clean, well-structured artifacts that match the expected format precisely.

**Liberal in what you accept:** Stage inputs should tolerate variation. If the architecture proposal has an extra section the skill didn't expect, skip it. If a table has an extra column, ignore it. If a heading is slightly different ("Implementation Order" vs "Build Sequence"), still find it.

**The test:** For each stage, ask: "If the upstream stage added an extra section to its output, would this stage still work?" If not, the parsing is too brittle.

---

## How These Laws Interact

Several of these laws reinforce each other in ways that matter for the pipeline:

**Goodhart + Amdahl:** The fastest way to speed up the pipeline is to remove human checkpoints (Amdahl). But human checkpoints are the primary defense against Goodhart's Law (agents gaming metrics). Speed and quality are in tension, and the pipeline's two-checkpoint architecture is the current resolution of that tension.

**Conway + Postel:** Conway's Law says stage boundaries shape code boundaries. Postel's Law says stages should be tolerant of each other's output. Together: design stage boundaries carefully (Conway), but don't couple stages tightly to each other's exact output format (Postel).

**Gall + Lehman:** Gall's Law says evolve from working simple systems. Lehman's Law says complexity increases unless actively reduced. Together: add one capability at a time (Gall), and periodically simplify (Lehman). The roadmap should alternate between "add" and "simplify" phases.

**Chesterton + Conway:** Chesterton's Fence says understand existing constraints before changing them. Conway's Law says the pipeline's stage structure shapes what agents see. Together: Stage 1 (Discovery) must make existing constraints visible to all downstream stages. If Conway's Law hides a fence behind a stage boundary, Chesterton's Fence gets violated.
