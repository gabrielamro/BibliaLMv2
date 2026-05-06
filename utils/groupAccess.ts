import type { AppNotification, ChurchGroup, GroupAccessInvite, UserProfile } from '../types';

export interface PrivateGroupAccessNotificationInput {
  group: ChurchGroup;
  invite: Pick<GroupAccessInvite, 'id' | 'source'>;
  actorName: string;
}

export const isGroupMember = (group: ChurchGroup | null, profile: UserProfile | null | undefined): boolean => {
  if (!group || !profile?.churchData) return false;
  return profile.churchData.groupId === group.id;
};

export const canViewGroupFeed = (
  group: ChurchGroup,
  profile: UserProfile | null | undefined,
  invite?: Pick<GroupAccessInvite, 'status'> | null,
): boolean => {
  if (group.privacy !== 'private') return true;
  return isGroupMember(group, profile) || invite?.status === 'pending';
};

export const canPostInGroupFeed = (
  group: ChurchGroup,
  profile: UserProfile | null | undefined,
): boolean => isGroupMember(group, profile);

export const buildPrivateGroupAccessNotification = ({
  group,
  invite,
  actorName,
}: PrivateGroupAccessNotificationInput): Omit<AppNotification, 'id' | 'timestamp' | 'read'> => {
  const action = invite.source === 'mention' ? 'marcou voce para acessar' : 'convidou voce para participar de';
  return {
    title: 'Convite para grupo privado',
    message: `${actorName} ${action} ${group.name}.`,
    type: 'social',
    link: `/grupo/${group.id}?invite=${invite.id}`,
    icon: 'users',
  };
};
