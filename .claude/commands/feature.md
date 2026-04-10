---
description: Implement a new feature end-to-end following the CalorIa workflow (plan → explore → clarify → implement → test → review)
argument-hint: <feature description>
---

# Feature Development — CalorIa

Implement the following feature: **$ARGUMENTS**

Follow the workflow rules from CLAUDE.md strictly. Use subagents aggressively to keep the main context clean.

---

## Phase 1: Understand

1. Create a task list covering all phases
2. Read `md/07-api-contratos.md` and `md/04-base-de-datos.md` for relevant contracts
3. If the feature is unclear, ask the user:
   - What phase (A–H) does this belong to?
   - Which layers are affected: DB / backend / frontend / all?
   - Any constraints or edge cases?

---

## Phase 2: Explore

Launch 2–3 **code-explorer** agents in parallel, each targeting a different layer:

- Agent 1: "Explore the backend package most relevant to [feature]. Trace Controller → Service → Repository. Return key files."
- Agent 2: "Explore the frontend screens and hooks most relevant to [feature]. Trace API call → store update → render. Return key files."
- Agent 3 (if DB involved): "Find existing Flyway migrations and the JPA entities for [feature area]. Return key files."

After agents return, **read all identified key files** before proceeding.

---

## Phase 3: Clarify

Review findings and ask the user all unresolved questions. Cover:
- Edge cases and validation rules
- Error states (what if resource not found, unauthorized, conflict?)
- Do new DB columns/tables need a migration?
- Are new API endpoints needed or are existing ones extended?

**Wait for answers before designing.**

---

## Phase 4: Design

Launch **backend-dev** and **frontend-dev** agents in parallel with a design-focused prompt:

- backend-dev: "Design the implementation for [feature] in the CalorIa backend. Identify files to create/modify, DTOs, service methods, and the migration needed if any."
- frontend-dev: "Design the implementation for [feature] in the CalorIa mobile app. Identify screens, hooks, API functions, and store changes needed."

Present the plan to the user. **Get approval before implementing.**

---

## Phase 5: Implement

In order:
1. **DB migration** (if needed) — use **db-migration** agent
2. **Backend** — use **backend-dev** agent
3. **Validate contracts** — use **api-validator** agent to confirm TS↔Java alignment
4. **Frontend** — use **frontend-dev** agent
5. Mark tasks complete as you go

---

## Phase 6: Tests

Use **test-writer** agent to write:
- Backend unit tests for new Service methods
- Backend integration test for new endpoints
- Frontend component/hook tests for new UI

Run tests and confirm they pass.

---

## Phase 7: Review

Launch 2 **code-reviewer** agents in parallel:
- "Review backend changes in [files] for bugs, security issues, and CalorIa conventions"
- "Review frontend changes in [files] for bugs, TypeScript correctness, and CalorIa conventions"

Present findings. Fix anything critical before finishing.

---

## Phase 8: Summary

- Mark all tasks complete
- List files created/modified
- Note any follow-up items for `tasks/lessons.md`
