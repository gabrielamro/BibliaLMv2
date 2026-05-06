import type { ContentPrivacyLevel } from '../types';

const DEFAULT_DOMAIN = 'https://biblialm.com.br';

export type ContentShareSettingsInput = {
  visibility: ContentPrivacyLevel;
  allowPdfDownload?: boolean;
  selectedUserIds?: string[];
  selectedGroupIds?: string[];
};

export type ShareableContentSummary = {
  id?: string;
  slug?: string;
  title?: string;
  coverImage?: string;
};

const uniqueIds = (values?: string[]) => Array.from(new Set((values || []).filter(Boolean)));

const resolveGroups = (visibility: ContentPrivacyLevel, selectedGroupIds?: string[]) => {
  const groups = uniqueIds(selectedGroupIds);
  if (visibility === 'group') {
    const groupId = groups[0];
    return { groupId, allowedGroupIds: groupId ? [groupId] : [] };
  }
  if (visibility === 'church_groups') {
    return { groupId: groups[0], allowedGroupIds: groups };
  }
  return { groupId: undefined, allowedGroupIds: [] };
};

export const getContentShareUrl = (
  content: Pick<ShareableContentSummary, 'id' | 'slug'>,
  domain = DEFAULT_DOMAIN,
) => {
  const base = domain.replace(/\/$/, '');
  if (content.slug) return `${base}/l/${encodeURIComponent(content.slug)}`;
  return `${base}/v/${encodeURIComponent(content.id || '')}`;
};

export const normalizeContentShareSettings = (input: ContentShareSettingsInput) => {
  const { groupId, allowedGroupIds } = resolveGroups(input.visibility, input.selectedGroupIds);
  return {
    visibility: input.visibility,
    allowPdfDownload: Boolean(input.allowPdfDownload),
    inviteRequired: input.visibility !== 'public',
    allowedUserIds: uniqueIds(input.selectedUserIds),
    allowedGroupIds,
    groupId,
  };
};

export const buildContentSharePostContent = (
  content: ShareableContentSummary,
  shareUrl: string,
  description = '',
) =>
  JSON.stringify({
    kind: 'study_share',
    studyId: content.id || content.slug || shareUrl,
    studyTitle: content.title || 'Conteudo sem titulo',
    studyCoverUrl: content.coverImage || '',
    studyUrl: shareUrl,
    description: description || `Compartilhou um estudo no Reino: ${content.title || 'Conteudo sem titulo'}.`,
    sourceLabel: 'Estudo',
  });
