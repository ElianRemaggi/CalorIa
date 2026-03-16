CREATE TABLE notification_settings (
    id                          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID    NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    enabled                     BOOLEAN NOT NULL DEFAULT FALSE,
    breakfast_reminder_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    lunch_reminder_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    dinner_reminder_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    snack_reminder_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    max_notifications_per_day   INTEGER NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_notification_settings_user_id ON notification_settings (user_id);
