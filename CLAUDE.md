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
