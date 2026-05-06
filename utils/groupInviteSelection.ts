import type { UserProfile } from '../types';

export const addGroupInviteParticipant = (
  selected: UserProfile[],
  user: UserProfile,
): UserProfile[] => {
  if (selected.some(item => item.uid === user.uid)) return selected;
  return [...selected, user];
};

export const removeGroupInviteParticipant = (
  selected: UserProfile[],
  uid: string,
): UserProfile[] => selected.filter(item => item.uid !== uid);
