import type { GeneralProfileType, UserProfile } from '../types';

type ProfileAccessInput = Pick<UserProfile, 'profileType' | 'subscriptionTier'> | null | undefined;

const validGeneralProfileTypes: GeneralProfileType[] = ['user', 'pastor', 'manager'];

export const normalizeGeneralProfileType = (value: unknown): GeneralProfileType | null => {
  return validGeneralProfileTypes.includes(value as GeneralProfileType) ? value as GeneralProfileType : null;
};

export const getGeneralProfileType = (profile: ProfileAccessInput): GeneralProfileType => {
  const profileType = normalizeGeneralProfileType(profile?.profileType);
  if (profileType) return profileType;
  if (profile?.subscriptionTier === 'pastor') return 'pastor';
  return 'user';
};

export const isAdminProfile = (profile: ProfileAccessInput): boolean => {
  return profile?.subscriptionTier === 'admin';
};

export const isGeneralPastor = (profile: ProfileAccessInput): boolean => {
  return isAdminProfile(profile) || getGeneralProfileType(profile) === 'pastor';
};

export const isGeneralManager = (profile: ProfileAccessInput): boolean => {
  return isAdminProfile(profile) || getGeneralProfileType(profile) === 'manager';
};

export const canAccessPastoralWorkspace = (profile: ProfileAccessInput): boolean => {
  const profileType = getGeneralProfileType(profile);
  return isAdminProfile(profile) || profileType === 'pastor' || profileType === 'manager';
};

export const toManaActorRole = (profile: ProfileAccessInput): 'user' | 'pastor' | 'admin' => {
  if (isAdminProfile(profile)) return 'admin';
  if (getGeneralProfileType(profile) === 'pastor') return 'pastor';
  return 'user';
};

export type ChurchManagementAccessDecision =
  | 'loading'
  | 'login_required'
  | 'needs_church_link'
  | 'management_intent_needs_church'
  | 'operational_role_required'
  | 'management_intent_waiting_authorization'
  | 'granted';

export const getChurchManagementAccessDecision = (params: {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveChurch: boolean;
  hasAllowedRole: boolean;
  profile: ProfileAccessInput;
}): ChurchManagementAccessDecision => {
  if (params.isLoading) return 'loading';
  if (!params.isAuthenticated) return 'login_required';

  const hasManagementIntent = isGeneralPastor(params.profile) || isGeneralManager(params.profile);
  if (!params.hasActiveChurch) {
    return hasManagementIntent ? 'management_intent_needs_church' : 'needs_church_link';
  }

  if (!params.hasAllowedRole) {
    return hasManagementIntent ? 'management_intent_waiting_authorization' : 'operational_role_required';
  }

  return 'granted';
};
