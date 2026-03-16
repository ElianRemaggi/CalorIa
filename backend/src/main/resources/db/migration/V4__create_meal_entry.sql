CREATE TABLE meal_entry (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    source_type          VARCHAR(16)  NOT NULL CHECK (source_type IN ('manual', 'photo')),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    meal_datetime        TIMESTAMPTZ  NOT NULL,
    estimated_calories   INTEGER,
    estimated_protein_g  INTEGER,
    estimated_carbs_g    INTEGER,
    estimated_fat_g      INTEGER,
    final_calories       INTEGER      NOT NULL,
    final_protein_g      INTEGER      NOT NULL,
    final_carbs_g        INTEGER      NOT NULL,
    final_fat_g          INTEGER      NOT NULL,
    ai_provider          VARCHAR(32),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_meal_entry_user_id_meal_datetime ON meal_entry (user_id, meal_datetime DESC);
CREATE INDEX ix_meal_entry_user_id_created_at ON meal_entry (user_id, created_at DESC);
CREATE INDEX ix_meal_entry_source_type ON meal_entry (source_type);
