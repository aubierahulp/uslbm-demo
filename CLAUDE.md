# Field Vault

Expo SDK 58 demo app for the US LBM mobile work. Plan and daily updates: docs/day-wise-plan.md.

@AGENTS.md

## Architecture: Clean Architecture (NON-NEGOTIABLE)

All code in `src/` MUST follow the rules below. They override any other convention, template default or habit. If a request would break them, say so and propose a compliant design instead; do not write non-compliant code.

- Never add `eslint-disable` for `no-restricted-imports`. Changing a rule means editing docs/clean-architecture.md and eslint.config.js together, and only when the user asks.
- A task is done only when `npm run lint`, `npm run typecheck` and `npm test` all pass. Lint enforces the layer boundaries.

@docs/clean-architecture.md

## Ponytail (required by the client)

The Ponytail plugin is enabled for this project in `.claude/settings.json`. Use it on every coding task: the smallest solution that works, no speculative features, Expo or platform built-ins before new dependencies.

**Precedence.** Ponytail works inside the rules above and never overrides them. These are explicit project requirements, not over-engineering:

- Clean Architecture structure: a domain port with a single data implementation, use-case factories, the `src/di` composition root, and the layer folders. Do not collapse layers or inline ports to save code.
- Unit tests for every domain, data and presentation module, as defined in docs/clean-architecture.md §6. Ponytail's "one runnable check" rule does not apply here.
- Security measures: encryption, key handling, authentication and input validation.

Within those limits, Ponytail applies in full:

- No abstractions beyond what the architecture requires.
- No unused options, no scaffolding for later.
- Shortest diff that works.
- Mark deliberate shortcuts with a `ponytail:` comment naming the limit and the upgrade path.

**Checkpoints.** Run `/ponytail-review` on each day's changes and `/ponytail-audit` before the demo. Use `/ponytail-debt` to list the known limitations.
