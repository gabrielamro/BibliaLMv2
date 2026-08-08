export const AI_FEATURE_KEYS = [
  'aiChatAccess',
  'aiImageGen',
  'aiPodcastGen',
  'aiDeepAnalysis',
  'aiSermonBuilder',
  'aiNoteImprovement',
  'aiSocialCaptions',
] as const;

export type AiFeatureKey = typeof AI_FEATURE_KEYS[number];
export type AiFeaturesMatrix = Record<string, Partial<Record<AiFeatureKey, boolean>>>;

export interface AiFeatureAccessInput {
  subscriptionTier?: string | null;
  profileType?: string | null;
  feature: AiFeatureKey;
  featuresMatrix?: AiFeaturesMatrix | null;
}

const PRIVILEGED_TIERS = new Set(['gold', 'pastor', 'admin']);
const PASTORAL_PROFILES = new Set(['pastor', 'manager', 'admin']);
const IMAGE_GENERATION_TIERS = new Set(['free', 'bronze', 'silver', 'gold', 'pastor', 'admin']);

export const isAiFeatureKey = (value: unknown): value is AiFeatureKey => (
  AI_FEATURE_KEYS.includes(value as AiFeatureKey)
);

export const canAccessAiFeature = ({
  subscriptionTier,
  profileType,
  feature,
  featuresMatrix,
}: AiFeatureAccessInput) => {
  const tier = String(subscriptionTier ?? 'free').toLowerCase();
  const profile = String(profileType ?? 'user').toLowerCase();
  const configured = featuresMatrix?.[tier]?.[feature];
  if (typeof configured === 'boolean') return configured;
  if (PRIVILEGED_TIERS.has(tier)) return true;
  if (feature === 'aiSermonBuilder' && PASTORAL_PROFILES.has(profile)) return true;
  if (feature === 'aiImageGen' && IMAGE_GENERATION_TIERS.has(tier)) return true;
  return feature === 'aiChatAccess' && tier === 'free';
};
