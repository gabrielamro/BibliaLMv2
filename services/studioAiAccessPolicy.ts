export interface StudioAiAccessInput {
  subscriptionTier?: string | null;
  profileType?: string | null;
  featuresMatrix?: Record<string, { aiSermonBuilder?: boolean }> | null;
}

const PRIVILEGED_PROFILE_TYPES = new Set(['pastor', 'manager', 'admin']);
const DEFAULT_ALLOWED_TIERS = new Set(['gold', 'pastor', 'admin']);

export const canAccessStudioAi = ({
  subscriptionTier,
  profileType,
  featuresMatrix,
}: StudioAiAccessInput) => {
  if (PRIVILEGED_PROFILE_TYPES.has(String(profileType ?? '').toLowerCase())) return true;

  const tier = String(subscriptionTier ?? 'free').toLowerCase();
  const configuredAccess = featuresMatrix?.[tier]?.aiSermonBuilder;
  if (typeof configuredAccess === 'boolean') return configuredAccess;

  return DEFAULT_ALLOWED_TIERS.has(tier);
};
