---
description: Validate that frontend TypeScript types match backend Java DTOs across all API endpoints
argument-hint: Optional — specific feature or endpoint to check (default: all)
---

# API Contract Validation

Scope: **$ARGUMENTS** (default: all endpoints)

Use the **api-validator** agent to do a full sweep:

1. Read `md/07-api-contratos.md` as the authoritative contract spec
2. For each endpoint in scope:
   - Find the backend Controller + DTO in `backend/src/main/java/com/caloria/`
   - Find the corresponding API function in `mobile/src/api/`
   - Find the TypeScript type in `mobile/src/types/`
   - Compare field names, types, optional/required, nesting
3. Report all mismatches in the standard format
4. Report confirmed matches

After the agent returns, summarize:
- Total endpoints checked
- Mismatches found (with fix instructions)
- Any endpoints in the spec (`07-api-contratos.md`) that have no frontend implementation yet
