import type { UserProfile } from '../types';

export type EditableProfileDraft = {
  displayName: string;
  bio: string;
  slogan: string;
  instagram: string;
  city: string;
  state: string;
  isProfilePublic: boolean;
  theme: 'light' | 'dark';
};

export function buildEditableProfileDraft(profile: Partial<UserProfile>): EditableProfileDraft {
  return {
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    slogan: profile.slogan || '',
    instagram: profile.instagram || '',
    city: profile.city || '',
    state: profile.state || '',
    isProfilePublic: profile.isProfilePublic ?? true,
    theme: profile.theme || 'dark',
  };
}
