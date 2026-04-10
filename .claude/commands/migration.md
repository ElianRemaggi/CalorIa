---
description: Create a new Flyway SQL migration for the CalorIa database
argument-hint: <describe the schema change needed>
---

# New Database Migration

Schema change requested: **$ARGUMENTS**

Use the **db-migration** agent to:

1. Read all existing migrations in `backend/src/main/resources/db/migration/` to determine the next version number
2. Read `md/04-base-de-datos.md` to cross-check against the spec
3. Create the migration file `V{N}__{description}.sql` following project conventions
4. After creating the migration, check if any JPA entity in `backend/src/main/java/com/caloria/` needs to be updated to match

Report:
- Migration file path and version number
- SQL executed
- Any entities that need updating
