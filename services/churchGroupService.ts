import { supabase } from './supabase';
import type {
  ChurchGroup,
  ChurchGroupCreateInput,
  ChurchMemberRole,
} from '../types';
import { formatSupabaseError } from '../utils/supabaseErrors';

const ROLE_COLUMNS = 'id, church_id, user_id, role, scope_type, scope_id, status, granted_by, granted_at, revoked_at, meta';

export const churchGroupService = {
  getUserRoles: async (churchId: string, userId: string): Promise<ChurchMemberRole[]> => {
    if (!churchId || !userId) return [];
    const { data, error } = await supabase
      .from('church_member_roles')
      .select(ROLE_COLUMNS)
      .eq('church_id', churchId)
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });
    if (error) throw new Error(`Não foi possível verificar seu papel nesta igreja. ${formatSupabaseError(error)}`);
    return (data ?? []).map(mapChurchRole);
  },

  getVisibleEligibleLeaderRoles: async (churchId: string): Promise<ChurchMemberRole[]> => {
    const { data, error } = await supabase
      .from('church_member_roles')
      .select(ROLE_COLUMNS)
      .eq('church_id', churchId)
      .eq('status', 'active')
      .in('role', ['pastor', 'leader'])
      .order('granted_at', { ascending: false });
    if (error) throw new Error(`Não foi possível carregar líderes elegíveis. ${formatSupabaseError(error)}`);
    return (data ?? []).map(mapChurchRole);
  },

  createGroup: async (input: ChurchGroupCreateInput): Promise<ChurchGroup> => {
    const { data, error } = await supabase
      .from('cells')
      .insert({
        church_id: input.churchId,
        parent_group_id: input.parentGroupId ?? null,
        name: input.name.trim(),
        slug: input.slug,
        privacy: input.privacy,
        leader_id: input.leaderUid ?? null,
        leader_name: input.leaderName?.trim() || null,
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Já existe um grupo com este nome nesta igreja.');
      if (error.code === '42501') throw new Error('Somente pastor ou líder autorizado desta igreja pode criar este grupo.');
      throw new Error(`Não foi possível criar o grupo. ${formatSupabaseError(error)}`);
    }

    return mapChurchGroup(data);
  },
};

function mapChurchRole(row: any): ChurchMemberRole {
  return {
    id: row.id,
    churchId: row.church_id,
    userId: row.user_id,
    role: row.role,
    scopeType: row.scope_type,
    scopeId: row.scope_id ?? null,
    status: row.status,
    grantedBy: row.granted_by ?? null,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at ?? null,
    meta: row.meta ?? {},
  };
}

function mapChurchGroup(row: any): ChurchGroup {
  return {
    id: row.id,
    churchId: row.church_id,
    parentGroupId: row.parent_group_id ?? undefined,
    name: row.name,
    slug: row.slug,
    privacy: row.privacy ?? 'public',
    stats: { memberCount: Number(row.member_count ?? 0), totalMana: Number(row.total_mana ?? 0) },
    leaderName: row.leader_name ?? undefined,
    leaderUid: row.leader_id ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
