CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  category VARCHAR NOT NULL,
  emotional_state VARCHAR NOT NULL,
  triggered_by VARCHAR,
  note TEXT,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  anxiety_score INTEGER NOT NULL CHECK (anxiety_score BETWEEN 1 AND 10),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- soft delete: записи не удаляются физически
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- значения-перечисления и сумма защищены на уровне БД
-- (DO-блоки вместо ADD CONSTRAINT IF NOT EXISTS — Postgres такого синтаксиса не имеет)
DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_category_check
    CHECK (category IN ('food', 'clothes', 'entertainment', 'subscriptions', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_emotional_state_check
    CHECK (emotional_state IN ('calm', 'stressed', 'sad', 'bored', 'happy', 'anxious'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_triggered_by_check
    CHECK (triggered_by IS NULL OR triggered_by IN ('work', 'social', 'boredom', 'habit', 'need', 'unknown'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_amount_check
    CHECK (amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- списки всегда читаются как WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_created ON checkins (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
