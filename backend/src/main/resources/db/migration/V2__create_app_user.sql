CREATE TABLE app_user (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id    VARCHAR(128) UNIQUE NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    avatar_url   TEXT,
    auth_provider VARCHAR(32) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_app_user_google_id ON app_user (google_id);
CREATE UNIQUE INDEX ux_app_user_email ON app_user (email);
