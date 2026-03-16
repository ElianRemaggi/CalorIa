CREATE TABLE user_profile (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    gender                VARCHAR(32)  NOT NULL,
    age                   INTEGER      NOT NULL,
    height_cm             NUMERIC(5,2) NOT NULL,
    weight_kg             NUMERIC(5,2) NOT NULL,
    goal_type             VARCHAR(32)  NOT NULL CHECK (goal_type IN ('lose', 'maintain', 'gain')),
    target_calories       INTEGER      NOT NULL,
    target_protein_g      INTEGER      NOT NULL,
    target_carbs_g        INTEGER      NOT NULL,
    target_fat_g          INTEGER      NOT NULL,
    onboarding_completed  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_user_profile_user_id ON user_profile (user_id);
