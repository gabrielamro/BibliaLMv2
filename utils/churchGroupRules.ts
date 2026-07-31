import type { ChurchGroupCapabilities, ChurchMemberRole } from '../types';

interface ChurchGroupCapabilityInput {
  churchId?: string | null;
  groupId?: string | null;
  parentGroupId?: string | null;
  roles: ChurchMemberRole[];
}

const isActiveRoleForChurch = (role: ChurchMemberRole, churchId: string) =>
  role.churchId === churchId && role.status === 'active';

/**
 * Resolve as capacidades de grupo a partir de papéis operacionais atuais.
 * Membership, assinatura, perfil geral e autoria histórica não participam
 * desta decisão; o banco repete a mesma regra em RLS.
 */
export function getChurchGroupCapabilities({
  churchId,
  groupId,
  parentGroupId,
  roles,
}: ChurchGroupCapabilityInput): ChurchGroupCapabilities {
  if (!churchId) return emptyCapabilities();

  const activeRoles = roles.filter((role) => isActiveRoleForChurch(role, churchId));
  const isPastor = activeRoles.some((role) => role.role === 'pastor');
  const isChurchLeader = activeRoles.some(
    (role) => role.role === 'leader' && role.scopeType === 'church',
  );
  const isScopedGroupLeader = activeRoles.some(
    (role) =>
      role.role === 'leader' &&
      role.scopeType === 'group' &&
      Boolean(role.scopeId) &&
      (role.scopeId === groupId || role.scopeId === parentGroupId),
  );

  const canManageCurrentGroup = isPastor || isChurchLeader || isScopedGroupLeader;

  return {
    canCreateRootGroup: isPastor || isChurchLeader,
    canCreateSubgroup: isPastor || isChurchLeader || Boolean(groupId && isScopedGroupLeader),
    canEditGroup: canManageCurrentGroup,
    canInviteMembers: canManageCurrentGroup,
    canModerateGroup: canManageCurrentGroup,
    canArchiveGroup: canManageCurrentGroup,
  };
}

export function hasActiveChurchRole(
  roles: ChurchMemberRole[],
  churchId: string | null | undefined,
  allowedRoles: ChurchMemberRole['role'][],
  scopeTypes?: ChurchMemberRole['scopeType'][],
): boolean {
  if (!churchId) return false;
  return roles.some(
    (role) =>
      isActiveRoleForChurch(role, churchId) &&
      allowedRoles.includes(role.role) &&
      (!scopeTypes || scopeTypes.includes(role.scopeType)),
  );
}

function emptyCapabilities(): ChurchGroupCapabilities {
  return {
    canCreateRootGroup: false,
    canCreateSubgroup: false,
    canEditGroup: false,
    canInviteMembers: false,
    canModerateGroup: false,
    canArchiveGroup: false,
  };
}
