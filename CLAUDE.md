# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains **specification documents** for a mobile-first Calorie & Macro Tracking SaaS app. All documentation is written in Spanish. There is no source code here — only specs that define the system to be built.

## Tech Stack (to be implemented)

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo, TypeScript, Expo Router |
| State | Zustand (local/session) + TanStack Query (server cache) |
| Forms | React Hook Form + Zod |
| Backend | Spring Boot 3.x, Java 21 |
| Database | Supabase PostgreSQL, Flyway migrations |
| Auth | Google OAuth2 + custom JWT |
| AI | OpenAI, Google Gemini, Anthropic Claude (client-side, keys never sent to backend) |

## Specification Files (`md/`)

| File | Content |
|------|---------|
| `00-README.md` | Project overview, MVP scope, key architectural decisions |
| `01-producto-y-alcance.md` | Product vision, included/excluded features, success metrics |
| `02-frontend.md` | Module structure, UI flows, state management, security |
| `03-backend.md` | Modular monolith package structure, domain rules, error handling |
| `04-base-de-datos.md` | Full SQL schema, Flyway migration structure, indexes |
| `05-auth-google.md` | OAuth2 flow, JWT strategy, security requirements |
| `06-ia-y-procesamiento.md` | AI provider integration, prompt patterns, JSON normalization |
| `07-api-contratos.md` | Complete REST API contracts (endpoints, payloads, error formats) |
| `08-notificaciones-y-configuracion.md` | Notification strategy, settings storage |
| `09-devops-entornos.md` | Docker setup, environment variables, CI/CD, deployment targets |
| `10-roadmap-y-criterios.md` | Implementation phases A–H, definition of done, risks |

## Architecture Decisions

- **Backend is a modular monolith**, not microservices — packages organized by feature: `auth`, `user`, `profile`, `meal`, `dashboard`, `history`, `notification`, `analytics`
- **AI keys are stored client-side only** (Expo SecureStore) — never transmitted to the backend
- **No photo storage in MVP** — images are processed by AI and discarded, reducing complexity and privacy risk
- **Database-first** — all schema changes via explicit Flyway SQL migrations (no auto-DDL)
- **UUID primary keys** with `timestamptz` columns across all tables
- **Google OAuth is the only auth method** in MVP — no email/password flow
- **Meal data** separates `estimated_*` fields (from AI) from `final_*` fields (after user correction)

## Implementation Phases

Phases A→H defined in `10-roadmap-y-criterios.md`:
- **A**: Base scaffolding (Expo, Spring Boot, Postgres, Flyway)
- **B**: Google OAuth + JWT auth
- **C**: Onboarding & nutritional profile
- **D**: Dashboard & history views
- **E**: Manual meal logging
- **F**: Photo-based meals with AI analysis
- **G**: Notifications
- **H**: Hardening, tests, production deploy

## Key Guidance from Specs

- Start with backend contracts and database schema before frontend
- Respect modular separation — do not mix feature packages
- Use explicit DTOs for all request/response bodies
- Frontend TypeScript types must stay consistent with API contracts
- Write explicit SQL for all Flyway migrations
- Integration tests should use Testcontainers against a real PostgreSQL instance

## Workflow Rules

### 1. Planning Mode by Default

Enter planning mode for **any non-trivial task** (more than 3 steps or architectural decisions).

- If something goes wrong, **STOP and replan immediately** — do not keep forcing it
- Use planning mode for verification, not just for building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

Use subagents frequently to keep the main context window clean.

- Delegate research, exploration, and parallel analysis to subagents
- For complex problems, dedicate more compute via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

After any user correction, **update `tasks/lessons.md`** with the pattern.

- Write rules for yourself that prevent the same mistake
- Iterate relentlessly on these lessons until error rate decreases
- Review lessons at session start for the corresponding project

### 4. Verify Before Finalizing

Never mark a task as complete without demonstrating it works.

- Compare behavior diff between main branch and your changes when relevant
- Ask: *"Would a Staff Engineer approve this?"*
- Run tests, check logs, and demonstrate code correctness

### 5. Demand Elegance (Balanced)

For non-trivial changes: pause and ask *"is there a more elegant way?"*

- If a fix feels hacky: **knowing everything I know now, implement the elegant solution**
- Skip this for simple, obvious fixes; do not over-engineer
- Question your own work before presenting it

### 6. Autonomous Error Correction

When receiving a bug report: just fix it. Do not ask for hand-holding.

- Identify logs, errors, or failing tests and then resolve them
- Zero need for context switching from the user
- Go fix failing CI tests without being told how

### Task Management

1. **Plan First**: Write the plan in `tasks/todo.md` with verifiable items
2. **Verify Plan**: Confirm before starting implementation
3. **Track Progress**: Mark items as completed as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add a review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

### Core Principles

- **Simplicity First**: Make each change as simple as possible. Affect the minimum necessary code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what is necessary. Avoid introducing bugs.
