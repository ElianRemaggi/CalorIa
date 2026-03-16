CREATE TABLE weight_log (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    weight_kg  NUMERIC(5,2) NOT NULL,
    logged_at  DATE         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_weight_log_user_id_logged_at ON weight_log (user_id, logged_at DESC);
