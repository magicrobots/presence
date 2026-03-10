-- api/src/db/migrations/0001_create_user_preferences.sql
CREATE TABLE IF NOT EXISTS user_preferences (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(255) NOT NULL UNIQUE,
    quality_preset VARCHAR(10)  NOT NULL DEFAULT 'normal'
                   CHECK (quality_preset IN ('high', 'normal', 'low')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_username
    ON user_preferences (username);
