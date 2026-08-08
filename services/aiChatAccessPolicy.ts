export interface AiChatAccessInput {
  subscriptionTier: string;
  featuresMatrix?: Record<string, { aiChatAccess?: boolean }>;
}

export const canAccessAiChat = ({ subscriptionTier, featuresMatrix }: AiChatAccessInput) => {
  const configured = featuresMatrix?.[subscriptionTier]?.aiChatAccess;
  if (typeof configured === 'boolean') return configured;
  return ['free', 'gold', 'pastor', 'admin'].includes(subscriptionTier);
};
