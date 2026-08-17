# Candidate AI Monetization Strategy

## Overview
This document explains how Talantz implements progressive monetization of AI features for job candidates without creating friction during onboarding.

---

## Architecture

### 1. **Database Schema** (`prisma/migrations/add_seeker_subscription.sql`)

#### User Subscription Fields
```sql
seeker_subscription_tier       -- 'free' | 'premium' | 'professional'
seeker_subscription_status     -- 'free' | 'trial' | 'active' | 'expired' | 'cancelled'
seeker_subscription_expires_at -- When subscription ends
```

#### Usage Tracking (`ai_feature_usage` table)
- Tracks per-user, per-feature usage counts
- Automatic reset based on reset period (weekly/monthly)
- Timestamps for last usage

#### Feature Limits (`feature_limits` table)
- Defines limit per feature per tier
- Reset periods (weekly, monthly, yearly)
- Value 999999 = unlimited

#### Subscription History (`seeker_subscription_history` table)
- Records all tier changes with payment info
- Tracks upgrade/downgrade flow
- Auto-renewal settings

---

## Feature Access Control

### File: `src/lib/features/access-control.ts`

Key functions:

#### `checkAIFeatureAccess(userId, feature)`
Returns access decision with:
- `allowed`: boolean - Can user use this?
- `remaining`: number - Uses left in period
- `limit`: number - Total limit for this period
- `shouldShowUpsell`: boolean - Show upgrade prompt?
- `message`: string - Reason if denied
- `nextResetDate`: Date - When counter resets

#### `recordAIFeatureUsage(userId, feature)`
- Increments usage counter
- Updates `lastUsedAt` timestamp
- Handles auto-reset logic

#### `upgradeCandidateSubscription(userId, tier, paymentId)`
- Updates user subscription tier
- Records in history for analytics
- Calculates expiry date

#### `getPlanDetails(tier)`
- Returns feature list and pricing for UI display

---

## Free vs Premium Limits

### FREE Tier
```
enhance_bullet:   3 uses/month
suggest_skills:   1 use/month
cover_letter:     1 use/week
interview_prep:   Not available
```

### PREMIUM Tier (LKR 999/month)
```
enhance_bullet:   Unlimited
suggest_skills:   Unlimited
cover_letter:     Unlimited
interview_prep:   5 sessions/month
```

### PROFESSIONAL Tier (LKR 2,499/month)
```
All features unlimited + career coaching
```

---

## Implementation in AI Endpoints

### Example: `/api/profile/ai-enhance`

```typescript
// 1. Check access
const access = await checkAIFeatureAccess(userId, 'enhance_bullet')

if (!access.allowed) {
  return {
    error: 'Limit reached',
    shouldShowUpsell: true,  // Show paywall
    remaining: 0,
    nextResetDate: ...
  }
}

// 2. Run AI
const result = await enhanceBulletPoint(...)

// 3. Record usage
await recordAIFeatureUsage(userId, 'enhance_bullet')

// 4. Return with remaining quota
return { data: result, remaining: access.remaining - 1 }
```

---

## UI Components

### `FeaturePaywall` Component
Soft upsell shown when limit reached:
- Non-blocking (user can dismiss)
- Shows remaining uses
- Links to pricing page
- Context-specific messaging

### `FeatureUsageCounter` Component
Visual progress bar showing:
- Uses remaining/total
- Color: green (safe) → amber (warning) → red (depleted)
- Reset date

### `PricingCard` Component
Reusable card for pricing pages:
- Highlights popular tier
- Shows benefits per tier
- CTA buttons

---

## Upsell Strategy (Psychological)

### Phase 1: FREE Registration (No Friction)
✅ Profile creation = 100% free
✅ Basic search/apply = Free
❌ No paywall during signup

### Phase 2: Free AI Intro (Get Hooked)
- First 3 bullet enhancements → FREE
- First skill suggestion → FREE
- Experience the value

### Phase 3: Soft Upsells (Smart Timing)
After free uses exhausted:
- "You've used 3 bullets! Unlock unlimited"
- Soft modal (not blocking)
- Can dismiss and continue
- Link to pricing

### Phase 4: Premium Features (Motivating)
- Interview prep coaching (new feature for premium)
- Career coaching (new feature for professional)
- Resume feedback AI

---

## Messaging Examples

### Enhance Bullets Upsell
> "You've enhanced 3 bullets! Unlock unlimited professional enhancements and polish your entire profile in minutes."

### Cover Letter Upsell
> "Candidates who use multiple cover letters get 60% more interview calls. Upgrade for unlimited letters."

### Interview Prep Upsell
> "Start preparing with AI interview coaching. Get 5 sessions/month with Premium, unlimited with Professional."

---

## Pricing Page (`src/app/(seeker)/pricing/page.tsx`)

Public page at `/pricing` showing:
- All tiers with features
- Comparison table
- FAQ section
- Value propositions
- Checkout links

---

## Payment Integration (Next Steps)

### Step 1: Stripe Integration
```typescript
// Create checkout session
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: 'price_premium_lkr', quantity: 1 }],
  success_url: '/profile?upgraded=true',
  cancel_url: '/pricing',
})
```

### Step 2: PayHere Integration (Local)
```typescript
// PayHere SDK for LKR payments
const payment = await payhere.createPayment({
  amount: 999,  // LKR
  currency: 'LKR',
  return_url: '/checkout/success',
})
```

### Step 3: Webhook Handling
```typescript
// POST /api/webhooks/payment
// Verify payment → upgradeCandidateSubscription()
```

---

## Analytics & Monitoring

### Key Metrics to Track
1. **Conversion Funnel**
   - Free users who see upsell
   - Users who click "See Plans"
   - Users who upgrade

2. **Feature Usage**
   - Enhance bullets: frequency, success rate
   - Interviews scheduled after prep
   - Applications after profile enhancement

3. **Churn**
   - When subscriptions expire
   - Who downgrades
   - Reactivation rate

### Queries
```sql
-- Conversion rate
SELECT COUNT(*) * 100 / (SELECT COUNT(*) FROM users WHERE role = 'job_seeker')
FROM seeker_subscription_history
WHERE to_tier != 'free'

-- Most used free features
SELECT feature_name, AVG(usage_count) as avg_uses
FROM ai_feature_usage
WHERE user_id IN (SELECT id FROM users WHERE seeker_subscription_tier = 'free')
GROUP BY feature_name
```

---

## Do's and Don'ts

### ✅ DO
- Show paywall AFTER free uses exhausted
- Make pricing clear and transparent
- Offer money-back guarantee
- Let users dismiss upsells
- Show progress bar and remaining uses
- Use context-specific messages

### ❌ DON'T
- Show paywall during signup
- Hide pricing or terms
- Make features mysteriously unavailable
- Auto-subscribe anyone
- Show aggressive ads on first visit
- Block profile creation

---

## Testing

### Test Free Tier Limits
```
1. Register new account
2. Enhance 3 bullets → should work
3. Enhance 4th bullet → should show paywall
4. Dismiss paywall → try again later
5. Next month (reset) → counter resets
```

### Test Premium Tier
```
1. Upgrade to Premium
2. Enhance 10 bullets → all work
3. Generate 5 interviews preps → work
4. 6th interview prep → works (unlimited)
```

### Test Expiry
```
1. Create premium account
2. Set expiry date to yesterday (dev only)
3. Try to use premium feature → downgraded to free
4. Check user.seekerSubscriptionStatus = 'expired'
```

---

## Future Enhancements

1. **A/B Testing**
   - Test different upsell messages
   - Track conversion per message type
   - Optimize over time

2. **Feature Bundles**
   - "Interview Prep Bundle": LKR 1500
   - "Profile Boost Bundle": LKR 799

3. **Time-Limited Trials**
   - "7-day free Premium trial"
   - Auto-downgrade after

4. **Annual Billing**
   - LKR 9,990/year for Premium (2 months free)
   - Higher conversion, more LTV

5. **Referral Program**
   - Upgrade friend → get month free
   - Viral growth loop

---

## Revenue Projections

### Conservative (10% free → premium)
```
100,000 users
10,000 convert to Premium @ LKR 999/month
Monthly revenue: LKR 10M
Annual revenue: LKR 120M
```

### Optimistic (20% free → premium + professional)
```
100,000 users
15,000 Premium @ LKR 999 = LKR 15M
5,000 Professional @ LKR 2,499 = LKR 12.5M
Monthly revenue: LKR 27.5M
Annual revenue: LKR 330M
```

---

## Support & Troubleshooting

### Common Issues

**"I upgraded but still see free limit"**
- Check `seeker_subscription_expires_at` is in future
- Run `upgradeCandidateSubscription()` again
- Check feature limits in DB

**"Counter never resets"**
- Check `reset_date` in `ai_feature_usage`
- Verify `resetPeriod` in `feature_limits`
- Check timezone handling

**"Upsell shows for unlimited tier"**
- Add check: `if (limit === 999999) return null`
- Test with premium account

---

## Contact
For questions about monetization strategy, contact the product team.
