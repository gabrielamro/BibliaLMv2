import type { ContentPrivacyLevel, CustomPlan, UserProfile } from '../types';
import { PUBLIC_APP_ORIGIN } from '../constants';

const DEFAULT_DOMAIN = PUBLIC_APP_ORIGIN;

type MinimalPlan = Pick<CustomPlan, 'id' | 'authorId' | 'title' | 'description' | 'privacyType'> & Partial<CustomPlan>;
type MinimalProfile = Pick<UserProfile, 'uid' | 'churchData'> | null | undefined;

export type PlanPrivacyInput = {
  visibility: ContentPrivacyLevel;
  allowPdfDownload?: boolean;
  selectedGroupIds?: string[];
  selectedUserIds?: string[];
};

const toLegacyPlanPrivacyType = (
  visibility: ContentPrivacyLevel,
): 'public' | 'followers' | 'church' | 'group' => {
  if (visibility === 'public') return 'public';
  if (visibility === 'church') return 'church';
  if (visibility === 'group' || visibility === 'church_groups') return 'group';
  return 'followers';
};

const resolveGroupVisibilitySelection = (
  visibility: ContentPrivacyLevel,
  selectedGroupIds: string[],
) => {
  const uniqueGroupIds = Array.from(new Set(selectedGroupIds.filter(Boolean)));
  if (visibility === 'group') {
    const groupId = uniqueGroupIds[0];
    return {
      groupId,
      allowedGroupIds: groupId ? [groupId] : [],
    };
  }

  if (visibility === 'church_groups') {
    return {
      groupId: uniqueGroupIds[0],
      allowedGroupIds: uniqueGroupIds,
    };
  }

  return {
    groupId: undefined,
    allowedGroupIds: [],
  };
};

export const getPlanShareUrl = (planId: string, shareSlug?: string, domain = DEFAULT_DOMAIN) => {
  return `${domain.replace(/\/$/, '')}${getPlanSharePath(planId, shareSlug)}`;
};

export const getPlanSharePath = (planId: string, shareSlug?: string) => {
  const identifier = encodeURIComponent(shareSlug || planId);
  return `/jornada/${identifier}`;
};

export const canUserAccessPlan = (
  plan: MinimalPlan,
  profile?: MinimalProfile,
  currentUserId?: string | null,
) => {
  if (currentUserId && plan.authorId === currentUserId) return true;

  const visibility = plan.privacyLevel || plan.privacyType || 'public';
  if (visibility === 'public' || plan.privacyType === 'public') return true;

  if (!currentUserId) return false;

  if (visibility === 'invite_only' || visibility === 'private' || plan.inviteRequired) {
    return Boolean(plan.allowedUserIds?.includes(currentUserId));
  }

  if (visibility === 'church' || plan.privacyType === 'church') {
    return Boolean(profile?.churchData?.churchId && profile.churchData.churchId === plan.churchId);
  }

  if (visibility === 'group' || visibility === 'church_groups' || plan.privacyType === 'group') {
    const userGroupId = profile?.churchData?.groupId;
    const allowedGroups = plan.allowedGroupIds?.length ? plan.allowedGroupIds : plan.groupId ? [plan.groupId] : [];
    return Boolean(userGroupId && allowedGroups.includes(userGroupId));
  }

  return false;
};

export const normalizePlanPrivacy = (input: PlanPrivacyInput) => {
  const selectedUserIds = Array.from(new Set(input.selectedUserIds?.filter(Boolean) || []));
  const { groupId, allowedGroupIds } = resolveGroupVisibilitySelection(
    input.visibility,
    input.selectedGroupIds || [],
  );
  const isPublic = input.visibility === 'public';

  return {
    privacyType: toLegacyPlanPrivacyType(input.visibility),
    privacyLevel: input.visibility,
    isPublic,
    inviteRequired: !isPublic,
    allowPdfDownload: Boolean(input.allowPdfDownload),
    allowedUserIds: selectedUserIds,
    allowedGroupIds,
    groupId,
  };
};

export const buildPlanSharePostContent = (
  plan: MinimalPlan,
  shareUrl: string,
  description = '',
) => {
  const baseDescription = `Compartilhou uma sala no Reino: ${plan.title || 'Sala sem titulo'}.`;
  return JSON.stringify({
    kind: 'room_share',
    studyId: plan.id,
    studyTitle: plan.title || 'Sala sem titulo',
    studyCoverUrl: plan.coverUrl || '',
    studyUrl: shareUrl,
    description: description ? `${baseDescription} ${description}` : baseDescription,
    sourceLabel: 'Sala do Reino',
  });
};
