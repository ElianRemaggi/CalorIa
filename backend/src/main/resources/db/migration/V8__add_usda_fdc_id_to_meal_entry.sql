-- V8__add_usda_fdc_id_to_meal_entry.sql
-- Adds the USDA FoodData Central FDC ID to meal_entry.
-- Nullable — only populated when the user selects a USDA food item
-- instead of relying on AI-generated macro estimates.

ALTER TABLE meal_entry
    ADD COLUMN IF NOT EXISTS usda_fdc_id VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_meal_entry_usda_fdc_id ON meal_entry (usda_fdc_id);
