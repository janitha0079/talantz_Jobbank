-- Add seeker subscription fields to User table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "seeker_subscription_tier" TEXT DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "seeker_subscription_status" TEXT DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "seeker_subscription_expires_at" TIMESTAMPTZ;

-- Create AI Feature Usage Tracking
CREATE TABLE IF NOT EXISTS "ai_feature_usage" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature_name" TEXT NOT NULL,
  "usage_count" INTEGER DEFAULT 0,
  "last_used_at" TIMESTAMPTZ,
  "reset_date" TIMESTAMPTZ DEFAULT now(),
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_ai_feature_usage_user_id" ON "ai_feature_usage"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_feature_usage_user_feature" ON "ai_feature_usage"("user_id", "feature_name");

-- Create Candidate Subscription Plans
CREATE TABLE IF NOT EXISTS "candidate_subscription_plans" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tier" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "price_lkr" INTEGER NOT NULL,
  "billing_period" TEXT NOT NULL DEFAULT 'monthly',
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Create Feature Limits per Tier
CREATE TABLE IF NOT EXISTS "feature_limits" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tier" TEXT NOT NULL REFERENCES "candidate_subscription_plans"("tier") ON DELETE CASCADE,
  "feature_name" TEXT NOT NULL,
  "limit_value" INTEGER,
  "reset_period" TEXT DEFAULT 'monthly',
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_feature_limits_tier" ON "feature_limits"("tier");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_feature_limits_tier_feature" ON "feature_limits"("tier", "feature_name");

-- Create Subscription History
CREATE TABLE IF NOT EXISTS "seeker_subscription_history" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "from_tier" TEXT DEFAULT 'free',
  "to_tier" TEXT NOT NULL,
  "payment_id" TEXT,
  "status" TEXT DEFAULT 'active',
  "started_at" TIMESTAMPTZ DEFAULT now(),
  "expires_at" TIMESTAMPTZ,
  "auto_renew" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_seeker_subscription_history_user_id" ON "seeker_subscription_history"("user_id");
