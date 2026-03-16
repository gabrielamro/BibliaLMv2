import { supabase } from './supabase';
import { UserContent, ContentType, ContentStatus } from '../types';

export const workspaceService = {
    async listContent(userId: string, type?: ContentType, status?: ContentStatus): Promise<UserContent[]> {
        const tableMap: Record<string, string> = { plan: 'custom_plans', note: 'notes', study: 'studies' };
        const tableName = type ? tableMap[type] : 'studies';

        let q = supabase
            .from(tableName)
            .select('*')
            .eq(tableName === 'custom_plans' ? 'author_id' : 'user_id', userId)
            .order('created_at', { ascending: false });

        if (status) q = q.eq('status', status);

        const { data, error } = await q;
        if (error) throw error;

        return (data ?? []).map((d: any) => ({
            id: d.id,
            authorId: d.author_id ?? d.user_id,
            title: d.title,
            status: d.status,
            isPublic: d.is_public ?? false,
            createdAt: d.created_at,
            updatedAt: d.updated_at ?? d.created_at,
            type: type ?? 'study',
        } as unknown as UserContent));
    },

    async deleteContent(userId: string, contentId: string, type: ContentType): Promise<void> {
        const tableMap: Record<string, string> = { plan: 'custom_plans', note: 'notes', study: 'studies' };
        const tableName = tableMap[type];
        const userCol = tableName === 'custom_plans' ? 'author_id' : 'user_id';

        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', contentId)
            .eq(userCol, userId);
        if (error) throw error;
    },

    async updateStatus(userId: string, contentId: string, type: ContentType, status: ContentStatus): Promise<void> {
        const tableMap: Record<string, string> = { plan: 'custom_plans', note: 'notes', study: 'studies' };
        const tableName = tableMap[type];
        const userCol = tableName === 'custom_plans' ? 'author_id' : 'user_id';

        const { error } = await supabase
            .from(tableName)
            .update({ status })
            .eq('id', contentId)
            .eq(userCol, userId);
        if (error) throw error;
    },

    async getRecentActivity(userId: string, limitCount = 5): Promise<UserContent[]> {
        const [studies, plans] = await Promise.all([
            this.listContent(userId, 'study'),
            this.listContent(userId, 'plan')
        ]);
        const all = [...studies, ...plans].sort((a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        return all.slice(0, limitCount);
    }
};
