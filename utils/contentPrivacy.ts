import type { ContentCreationScope, ContentPrivacyLevel, ContentVisibilityContext } from '../types';

const encode = (value: string) => encodeURIComponent(value);

export const getContentDefaultsFromSearchParams = (params: URLSearchParams): ContentVisibilityContext => {
  const scope = (params.get('scope') || 'user') as ContentCreationScope;
  const churchId = params.get('churchId') || undefined;
  const churchName = params.get('churchName') || undefined;
  const groupId = params.get('groupId') || undefined;
  const groupName = params.get('groupName') || undefined;

  if (scope === 'group' && groupId) {
    return {
      scope: 'group',
      visibility: 'group',
      churchId,
      churchName,
      groupId,
      groupName,
      contextLabel: groupName || 'Grupo',
    };
  }

  if (scope === 'church' && churchId) {
    return {
      scope: 'church',
      visibility: 'church',
      churchId,
      churchName,
      contextLabel: churchName || 'Igreja',
    };
  }

  return {
    scope: 'user',
    visibility: 'private',
    contextLabel: 'Privado',
  };
};

export const toLegacyPlanPrivacyType = (
  visibility: ContentPrivacyLevel,
): 'public' | 'followers' | 'church' | 'group' => {
  if (visibility === 'public') return 'public';
  if (visibility === 'church') return 'church';
  if (visibility === 'group' || visibility === 'church_groups') return 'group';
  return 'followers';
};

export const toLegacyStudyVisibility = (
  visibility: ContentPrivacyLevel,
): 'public' | 'private_invite' | 'private' => {
  if (visibility === 'public') return 'public';
  if (visibility === 'private') return 'private';
  return 'private_invite';
};

export const buildCreateContentShortcutUrl = (
  path: string,
  context: {
    scope: ContentCreationScope;
    churchId?: string;
    churchName?: string;
    groupId?: string;
    groupName?: string;
  },
) => {
  const params = new URLSearchParams();
  params.set('scope', context.scope);
  if (context.churchId) params.set('churchId', context.churchId);
  if (context.churchName) params.set('churchName', context.churchName);
  if (context.groupId) params.set('groupId', context.groupId);
  if (context.groupName) params.set('groupName', context.groupName);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

export const buildContentNotificationLink = (
  contentType: 'study' | 'room',
  contentId: string,
) => contentType === 'room' ? `/jornada/${encode(contentId)}` : `/v/${encode(contentId)}`;

export const resolveGroupVisibilitySelection = (
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
