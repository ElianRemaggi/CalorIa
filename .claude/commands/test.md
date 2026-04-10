---
description: Run tests and fix failures. Backend (Maven) and/or frontend (Jest). Diagnoses root cause before fixing.
argument-hint: backend | frontend | all (default: all)
---

# Run & Fix Tests

Target: **$ARGUMENTS** (default: all)

## Backend Tests

```bash
cd backend && ./mvnw test
```

If failures occur:
1. Read the full stack trace — identify the exact assertion or exception
2. Read the failing test file and the class under test
3. Diagnose: is the test wrong or the implementation wrong?
4. Use **test-writer** agent only if new tests need to be written
5. Fix the root cause — no skipping or commenting out tests
6. Re-run to confirm green

## Frontend Tests

```bash
cd mobile && npx jest --watchAll=false
```

If failures occur:
1. Read the failure output carefully
2. Read the failing test and the component/hook it tests
3. Diagnose the mismatch between expected and actual behavior
4. Fix implementation or test as appropriate
5. Re-run to confirm green

## Rules

- Never skip tests with `@Disabled` or `test.skip` without explicit user approval
- If a test reveals a real bug, fix the bug — don't fix the test to pass
- After fixing, run the full suite (not just the failing test) to check for regressions
- Update `tasks/lessons.md` with any patterns discovered
