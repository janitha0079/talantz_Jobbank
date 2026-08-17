-- Add seeker subscription fields to User table
ALTER TABLE "users" ADD COLUMN "seeker_subscription_tier" TEXT DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN "seeker_subscription_status" TEXT DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN "seeker_subscription_expires_at" TIMESTAMPTZ;

-- Create AI Feature Usage Tracking
CREATE TABLE "ai_feature_usage" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature_name" TEXT NOT NULL,
  "usage_count" INTEGER DEFAULT 0,
  "last_used_at" TIMESTAMPTZ,
  "reset_date" TIMESTAMPTZ DEFAULT now(),
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX "idx_ai_feature_usage_user_id" ON "ai_feature_usage"("user_id");
CREATE UNIQUE INDEX "idx_ai_feature_usage_user_feature" ON "ai_feature_usage"("user_id", "feature_name");

-- Create Candidate Subscription Plans
CREATE TABLE "candidate_subscription_plans" (
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
CREATE TABLE "feature_limits" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tier" TEXT NOT NULL REFERENCES "candidate_subscription_plans"("tier"),
  "feature_name" TEXT NOT NULL,
  "limit_value" INTEGER,
  "reset_period" TEXT DEFAULT 'monthly',
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX "idx_feature_limits_tier" ON "feature_limits"("tier");
CREATE UNIQUE INDEX "idx_feature_limits_tier_feature" ON "feature_limits"("tier", "feature_name");

-- Create Subscription History
CREATE TABLE "seeker_subscription_history" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "from_tier" TEXT NOT NULL DEFAULT 'free',
  "to_tier" TEXT NOT NULL,
  "payment_id" TEXT,
  "status" TEXT DEFAULT 'active',
  "started_at" TIMESTAMPTZ DEFAULT now(),
  "expires_at" TIMESTAMPTZ,
  "auto_renew" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX "idx_seeker_subscription_history_user_id" ON "seeker_subscription_history"("user_id");

-- Insert default plans
INSERT INTO "candidate_subscription_plans" ("tier", "name", "price_lkr", "billing_period", "description") VALUES
('free', 'Free', 0, 'free', 'Basic profile and job search'),
('premium', 'Premium', 999, 'monthly', 'Unlimited AI features + interview prep'),
('professional', 'Professional', 2499, 'monthly', 'Everything + career coaching');

-- Insert feature limits
INSERT INTO "feature_limits" ("tier", "feature_name", "limit_value", "reset_period") VALUES
('free', 'enhance_bullet', 3, 'monthly'),
('free', 'suggest_skills', 1, 'monthly'),
('free', 'cover_letter', 1, 'weekly'),
('free', 'interview_prep', 0, 'monthly'),
('premium', 'enhance_bullet', 999999, 'monthly'),
('premium', 'suggest_skills', 999999, 'monthly'),
('premium', 'cover_letter', 999999, 'monthly'),
('premium', 'interview_prep', 5, 'monthly'),
('professional', 'enhance_bullet', 999999, 'monthly'),
('professional', 'suggest_skills', 999999, 'monthly'),
('professional', 'cover_letter', 999999, 'monthly'),
('professional', 'interview_prep', 999999, 'monthly');
