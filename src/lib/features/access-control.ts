import { db } from '@/lib/db'

export type SubscriptionTier = 'free' | 'premium' | 'professional'
export type AIFeature = 'enhance_bullet' | 'suggest_skills' | 'cover_letter' | 'interview_prep'

interface FeatureAccess {
  allowed: boolean
  remaining: number
  limit: number
  resetPeriod: string
  shouldShowUpsell: boolean
  message?: string
  nextResetDate?: Date
}

/**
 * Check if a candidate can use an AI feature based on their subscription
 */
export async function checkAIFeatureAccess(
  userId: string,
  feature: AIFeature,
): Promise<FeatureAccess> {
  try {
    // Get user's subscription tier
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        seekerSubscriptionTier: true,
        seekerSubscriptionExpiresAt: true,
      },
    })

    if (!user) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        resetPeriod: 'monthly',
        shouldShowUpsell: true,
        message: 'User not found',
      }
    }

    const tier = (user.seekerSubscriptionTier ?? 'free') as SubscriptionTier

    // Check if subscription is still valid
    if (user.seekerSubscriptionExpiresAt && new Date() > user.seekerSubscriptionExpiresAt) {
      // Subscription expired, downgrade to free
      await db.user.update({
        where: { id: userId },
        data: {
          seekerSubscriptionTier: 'free',
          seekerSubscriptionStatus: 'expired',
        },
      })

      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        resetPeriod: 'monthly',
        shouldShowUpsell: true,
        message: 'Subscription expired. Upgrade to continue.',
      }
    }

    // Get feature limit for this tier
    const featureLimit = await db.featureLimit.findUnique({
      where: {
        tier_feature_name: {
          tier,
          featureName: feature,
        },
      },
    })

    if (!featureLimit) {
      // Feature not available for this tier
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        resetPeriod: 'monthly',
        shouldShowUpsell: true,
        message: `${feature} is not available on ${tier} plan`,
      }
    }

    // If limit is 999999, treat as unlimited
    if (featureLimit.limitValue === 999999) {
      return {
        allowed: true,
        remaining: 999999,
        limit: 999999,
        resetPeriod: featureLimit.resetPeriod ?? 'monthly',
        shouldShowUpsell: false,
      }
    }

    // Get current usage
    const usage = await db.aiFeatureUsage.findUnique({
      where: {
        user_id_feature_name: {
          userId,
          featureName: feature,
        },
      },
    })

    const now = new Date()
    let resetDate = usage?.resetDate ?? new Date()
    let usageCount = usage?.usageCount ?? 0

    // Check if we need to reset based on reset period
    if (usage && featureLimit.resetPeriod) {
      const periodInMs = getPeriodInMs(featureLimit.resetPeriod)
      const timeSinceReset = now.getTime() - resetDate.getTime()

      if (timeSinceReset > periodInMs) {
        // Reset the counter
        usageCount = 0
        resetDate = now
        await db.aiFeatureUsage.update({
          where: {
            user_id_feature_name: { userId, featureName: feature },
          },
          data: {
            usageCount: 0,
            resetDate: now,
          },
        })
      }
    }

    const remaining = Math.max(0, (featureLimit.limitValue ?? 0) - usageCount)
    const allowed = remaining > 0

    return {
      allowed,
      remaining,
      limit: featureLimit.limitValue ?? 0,
      resetPeriod: featureLimit.resetPeriod ?? 'monthly',
      shouldShowUpsell: !allowed && tier === 'free',
      message: allowed
        ? undefined
        : `You've used ${usageCount} of ${featureLimit.limitValue} ${feature}s this ${featureLimit.resetPeriod ?? 'month'}`,
      nextResetDate: new Date(resetDate.getTime() + getPeriodInMs(featureLimit.resetPeriod ?? 'monthly')),
    }
  } catch (error) {
    console.error('[checkAIFeatureAccess]', error)
    // Fail open - allow the feature if there's an error
    return {
      allowed: true,
      remaining: 999999,
      limit: 999999,
      resetPeriod: 'monthly',
      shouldShowUpsell: false,
    }
  }
}

/**
 * Record that a candidate used an AI feature
 */
export async function recordAIFeatureUsage(userId: string, feature: AIFeature): Promise<void> {
  await db.aiFeatureUsage.upsert({
    where: {
      user_id_feature_name: { userId, featureName: feature },
    },
    update: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
    create: {
      userId,
      featureName: feature,
      usageCount: 1,
      resetDate: new Date(),
    },
  }).catch(() => {})
}

/**
 * Get remaining quota for a feature
 */
export async function getFeatureQuota(userId: string, feature: AIFeature): Promise<number> {
  const access = await checkAIFeatureAccess(userId, feature)
  return access.remaining
}

/**
 * Upgrade candidate subscription
 */
export async function upgradeCandidateSubscription(
  userId: string,
  tier: SubscriptionTier,
  paymentId?: string,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { seekerSubscriptionTier: true },
  })

  const fromTier = (user?.seekerSubscriptionTier ?? 'free') as SubscriptionTier

  // Calculate expiry date based on tier
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  // Update user subscription
  await db.user.update({
    where: { id: userId },
    data: {
      seekerSubscriptionTier: tier,
      seekerSubscriptionStatus: 'active',
      seekerSubscriptionExpiresAt: expiresAt,
    },
  })

  // Record in history
  await db.seekerSubscriptionHistory.create({
    data: {
      userId,
      fromTier,
      toTier: tier,
      paymentId,
      status: 'active',
      expiresAt,
      autoRenew: true,
    },
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getPeriodInMs(period: string): number {
  const ms = {
    'weekly': 7 * 24 * 60 * 60 * 1000,
    'monthly': 30 * 24 * 60 * 60 * 1000,
    'yearly': 365 * 24 * 60 * 60 * 1000,
  }
  return ms[period as keyof typeof ms] ?? ms.monthly
}

export function getPlanDetails(tier: SubscriptionTier) {
  const plans = {
    free: {
      name: 'Free',
      price: 0,
      billing: 'free',
      features: [
        '3 enhanced bullets/month',
        '1 skill suggestion/month',
        '1 cover letter/week',
        'Basic job search',
      ],
    },
    premium: {
      name: 'Premium',
      price: 999,
      billing: 'monthly',
      features: [
        'Unlimited bullet enhancements',
        'Unlimited skill suggestions',
        'Unlimited cover letters',
        '5 interview prep sessions/month',
        'Resume review AI feedback',
      ],
    },
    professional: {
      name: 'Professional',
      price: 2499,
      billing: 'monthly',
      features: [
        'Everything in Premium',
        'Unlimited interview prep',
        '1 career coaching session/month',
        'Salary benchmarking',
        'Priority job matching',
      ],
    },
  }
  return plans[tier]
}
