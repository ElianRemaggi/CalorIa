# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CalorIA is a mobile-first Calorie & Macro Tracking SaaS app. The codebase is fully implemented across two sub-projects:

- `backend/` — Spring Boot 3.3 / Java 21 REST API
- `mobile/` — React Native + Expo 51 / TypeScript mobile app

Specification documents live in `md/` (written in Spanish).

## Commands

### Backend

Java and Maven are **not installed on the host**. All backend operations run through Docker.

```bash
# Start full stack (Postgres + backend) — builds image if needed
cd backend && docker compose up --build -d

# View logs
docker compose -f backend/docker-compose.yml logs -f backend

# Stop stack
cd backend && docker compose down

# Run tests (Testcontainers spins up its own Postgres — no running DB needed)
# Uses the 'test' service (builder stage with Maven — runtime image has no Maven)
docker compose -f backend/docker-compose.yml run --rm test

# Run a single test class
docker compose -f backend/docker-compose.yml run --rm test \
  -Dtest=MealControllerIntegrationTest

# Health check (backend must be running)
curl http://localhost:8081/actuator/health

# Swagger UI (when running)
open http://localhost:8081/swagger-ui.html
```

Backend runs on **port 8081** externally (8080 inside container).

### Mobile

```bash
cd mobile

# Install dependencies (already done — node_modules present)
npm install

# Start dev server
npm start

# Run on Android emulator
npm run android

# Run tests (all)
npm test

# Run a single test file
npx jest src/hooks/__tests__/useDashboard.test.ts

# Test with coverage
npm run test:coverage

# Lint
npm run lint
```

API base URL defaults to `http://10.0.2.2:8080/api/v1` (Android emulator → host). Override with `EXPO_PUBLIC_API_URL` in a `.env` file at `mobile/`.

## Architecture

### Backend — Modular Monolith

Packages under `com.caloria` are organized by feature. Each feature owns its controller, service, repository, domain entity, and DTOs:

```
auth/         Google OAuth2 verification → JWT issuance
user/         AppUser entity, /users/me endpoint
profile/      UserProfile, onboarding, NutritionCalculator (Mifflin-St Jeor BMR)
meal/         MealEntry (manual + photo), MealAiResponse (AI debug log)
dashboard/    Daily macro/calorie summary aggregation
history/      DailySummary list for date ranges
weight/       WeightLog entries
notification/ NotificationSettings per user
security/     JwtAuthFilter, JwtService, UserPrincipal
config/       SecurityConfig, JwtConfig, AppConfig, OpenApiConfig
common/       GlobalExceptionHandler, ErrorResponse, SecurityUtils, typed exceptions
```

`SecurityUtils.getCurrentUserId()` extracts the authenticated user's UUID from the `SecurityContext` — all controllers use this instead of accepting a userId parameter.

**Dev mode**: when `GOOGLE_CLIENT_ID` is the placeholder value, `AuthService` skips Google token verification and accepts any JWT-shaped token (3 dot-separated parts). `BaseIntegrationTest.buildDevToken()` generates these for tests.

### Frontend — Expo Router

File-based routing under `mobile/app/`:

```
index.tsx              Auth gate — redirects to login or tabs based on auth state
(auth)/login.tsx       Google Sign-In screen
(onboarding)/index.tsx Profile setup form (runs once after first login)
(tabs)/
  dashboard.tsx        Daily macro summary + meal list
  meals.tsx            Log meals (manual or photo + AI)
  history.tsx          Weekly/monthly history
  settings.tsx         AI provider config, notifications, weight
profile.tsx            Edit nutritional profile
weight.tsx             Weight log history
```

State management:
- **Zustand** (`src/store/`) — `authStore` (JWT + user session), `settingsStore` (AI provider, preferences). Both persist to `expo-secure-store`.
- **TanStack Query** — all server state. QueryClient is configured in `app/_layout.tsx` with `staleTime: 30s`.

API layer (`src/api/`): Axios client auto-attaches `Authorization: Bearer <token>` from SecureStore. On 401, clears the token.

### AI Integration

AI processing is entirely client-side. Keys are stored in SecureStore and never sent to the backend.

`src/services/ai/` contains adapters for OpenAI, Gemini, and Claude. `analyzeImage(base64, provider)` in `src/services/ai/index.ts` dispatches to the correct adapter. The result (`AIAnalysisResult`) is then sent to `POST /api/v1/meals/photo` as the confirmed meal entry — the backend stores the raw AI response in `meal_ai_response` for debugging.

### Database

Flyway migrations in `backend/src/main/resources/db/migration/` (V1–V7):

| Migration | Table |
|-----------|-------|
| V1 | pgcrypto extension |
| V2 | `app_user` |
| V3 | `user_profile` |
| V4 | `meal_entry` |
| V5 | `meal_ai_response` |
| V6 | `weight_log` |
| V7 | `notification_settings` |

`ddl-auto: validate` — Hibernate validates against the schema but never modifies it. All schema changes must go through a new Flyway migration file.

### Auth Flow

1. Mobile: Google Sign-In → receive `idToken`
2. Mobile: `POST /api/v1/auth/google` with `{ idToken }`
3. Backend: verifies token with Google, upserts `AppUser`, checks profile existence
4. Backend: returns `{ accessToken, tokenType, expiresIn, user: { id, email, fullName, onboardingCompleted } }`
5. Mobile: stores JWT in SecureStore, sets auth state

JWT subject = `userId` (UUID). All protected endpoints authenticate via `JwtAuthFilter`.

## Testing Patterns

### Backend

All integration tests extend `BaseIntegrationTest`, which:
- Spins up a real Postgres via Testcontainers (`postgres:15-alpine`)
- Runs `@Sql("/truncate.sql")` before each test to reset state
- Provides `authenticateAndGetToken(googleId, email)` for seeding an authenticated user

Unit tests (e.g. `NutritionCalculatorTest`, `JwtServiceTest`, `DashboardServiceTest`) use Mockito and do not require a DB.

### Frontend

Tests use Jest + jest-expo + React Native Testing Library. Hooks are tested by wrapping with a `QueryClient` provider. Stores are reset between tests via `useXxxStore.setState({...})`.

Module alias `@/` maps to `mobile/src/`.

## Key Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth2 client ID (placeholder enables dev mode) |
| `JWT_SECRET` | Backend | HS256 signing key (≥ 256-bit string) |
| `JWT_EXPIRATION_MS` | Backend | Token TTL in ms (default 3600000) |
| `DATABASE_URL` | Backend | JDBC URL for Postgres |
| `EXPO_PUBLIC_API_URL` | Mobile | Backend base URL (default: `http://10.0.2.2:8080/api/v1`) |

## Workflow Rules

### Planning Mode by Default

Enter planning mode for any non-trivial task (more than 3 steps or architectural decisions).

- If something goes wrong, STOP and replan — do not keep forcing it
- Use planning mode for verification, not just for building

### Subagent Strategy

Use subagents to keep the main context window clean.

- Delegate research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution

### Self-Improvement Loop

After any user correction, update `tasks/lessons.md` with the pattern.

### Verify Before Finalizing

Never mark a task as complete without demonstrating it works. Run tests, check logs, demonstrate correctness.

### Task Management

1. Write the plan in `tasks/todo.md` with verifiable items
2. Confirm before starting implementation
3. Mark items completed as you go
4. Update `tasks/lessons.md` after corrections

### Core Principles

- **Simplicity First**: Affect the minimum necessary code.
- **No Laziness**: Find root causes. No temporary fixes.
- **Minimal Impact**: Changes should only touch what is necessary.
