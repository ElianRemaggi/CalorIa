# Base de Datos - Supabase Postgres

## 1. Objetivo
Definir el modelo relacional del MVP para soportar autenticación de aplicación, perfil nutricional, meals, historial y preferencias.

## 2. Convenciones
- nombres de tablas y columnas en snake_case
- claves primarias UUID
- timestamps en UTC
- soft delete solo si realmente se necesita
- índices según patrones de consulta del MVP
- migraciones gestionadas con Flyway

## 3. Extensiones sugeridas
- pgcrypto para `gen_random_uuid()`

## 4. Tablas principales

### app_user
```sql
create table app_user (
  id uuid primary key default gen_random_uuid(),
  google_id varchar(128) unique not null,
  email varchar(255) unique not null,
  full_name varchar(255) not null,
  avatar_url text,
  auth_provider varchar(32) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Índices:
```sql
create unique index ux_app_user_google_id on app_user (google_id);
create unique index ux_app_user_email on app_user (email);
```

### user_profile
```sql
create table user_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_user(id) on delete cascade,
  gender varchar(32) not null,
  age integer not null,
  height_cm numeric(5,2) not null,
  weight_kg numeric(5,2) not null,
  goal_type varchar(32) not null,
  target_calories integer not null,
  target_protein_g integer not null,
  target_carbs_g integer not null,
  target_fat_g integer not null,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Índices:
```sql
create unique index ux_user_profile_user_id on user_profile (user_id);
```

### meal_entry
```sql
create table meal_entry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  source_type varchar(16) not null,
  title varchar(255) not null,
  description text,
  meal_datetime timestamptz not null,
  estimated_calories integer,
  estimated_protein_g integer,
  estimated_carbs_g integer,
  estimated_fat_g integer,
  final_calories integer not null,
  final_protein_g integer not null,
  final_carbs_g integer not null,
  final_fat_g integer not null,
  ai_provider varchar(32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Índices:
```sql
create index ix_meal_entry_user_id_meal_datetime on meal_entry (user_id, meal_datetime desc);
create index ix_meal_entry_user_id_created_at on meal_entry (user_id, created_at desc);
create index ix_meal_entry_source_type on meal_entry (source_type);
```

### meal_ai_response
```sql
create table meal_ai_response (
  id uuid primary key default gen_random_uuid(),
  meal_entry_id uuid not null unique references meal_entry(id) on delete cascade,
  provider varchar(32) not null,
  prompt_text text not null,
  raw_response text not null,
  parsed_response_json jsonb not null,
  created_at timestamptz not null default now()
);
```

Índices:
```sql
create index ix_meal_ai_response_provider on meal_ai_response (provider);
create index ix_meal_ai_response_created_at on meal_ai_response (created_at desc);
```

### weight_log
```sql
create table weight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  weight_kg numeric(5,2) not null,
  logged_at date not null,
  created_at timestamptz not null default now()
);
```

Índices:
```sql
create index ix_weight_log_user_id_logged_at on weight_log (user_id, logged_at desc);
```

### notification_settings
```sql
create table notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_user(id) on delete cascade,
  enabled boolean not null default false,
  breakfast_reminder_enabled boolean not null default false,
  lunch_reminder_enabled boolean not null default false,
  dinner_reminder_enabled boolean not null default false,
  snack_reminder_enabled boolean not null default false,
  max_notifications_per_day integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Índices:
```sql
create unique index ux_notification_settings_user_id on notification_settings (user_id);
```

## 5. Observaciones de diseño
- no existe tabla de imágenes en el MVP
- `meal_ai_response` se separa para no inflar `meal_entry`
- `parsed_response_json` facilita auditoría/debug
- `meal_datetime` soporta agregación diaria, semanal y mensual

## 6. Consultas frecuentes previstas
- meals del usuario por fecha
- resumen diario
- historial semanal
- historial mensual
- perfil por usuario
- settings por usuario

## 7. SQL de ejemplo para resumen diario
```sql
select
  date(meal_datetime at time zone 'UTC') as meal_day,
  sum(final_calories) as calories_consumed,
  sum(final_protein_g) as protein_consumed,
  sum(final_carbs_g) as carbs_consumed,
  sum(final_fat_g) as fat_consumed
from meal_entry
where user_id = :userId
  and meal_datetime >= :dayStart
  and meal_datetime < :dayEnd
group by meal_day;
```

## 8. Flyway
Estructura sugerida:
```text
src/main/resources/db/migration/
  V1__init_extensions.sql
  V2__create_app_user.sql
  V3__create_user_profile.sql
  V4__create_meal_entry.sql
  V5__create_meal_ai_response.sql
  V6__create_weight_log.sql
  V7__create_notification_settings.sql
```

## 9. Reglas de integridad
- email y google_id únicos
- un user_profile por usuario
- un notification_settings por usuario
- una respuesta IA por meal photo, si existe
- `source_type` restringido a `manual` o `photo`
- `goal_type` restringido a `lose`, `maintain`, `gain`

## 10. Futuro
Posibles tablas de fase 2:
- meal_photo
- subscription
- ai_usage
- user_device
- favorite_meal
