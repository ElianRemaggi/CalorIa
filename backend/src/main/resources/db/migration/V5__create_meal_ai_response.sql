CREATE TABLE meal_ai_response (
    id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_entry_id         UUID  NOT NULL UNIQUE REFERENCES meal_entry(id) ON DELETE CASCADE,
    provider              VARCHAR(32) NOT NULL,
    prompt_text           TEXT NOT NULL,
    raw_response          TEXT NOT NULL,
    parsed_response_json  JSONB NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_meal_ai_response_provider ON meal_ai_response (provider);
CREATE INDEX ix_meal_ai_response_created_at ON meal_ai_response (created_at DESC);
