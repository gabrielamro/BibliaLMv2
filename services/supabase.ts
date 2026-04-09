
/**
 * ============================================================
 * services/supabase.ts — Camada de dados ÚNICA (Supabase)
 * Substitui services/firebase.ts completamente.
 * Mantém os mesmos nomes de função para compatibilidade.
 * ============================================================
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    UserProfile, Church, ChurchGroup, Post, PrayerRequest, SavedStudy,
    CustomPlan, PlanTeam, CustomQuiz, GuidedPrayer, StudyEvaluation,
    StudyModule, Banner, SystemSettings, AppNotification, SupportTicket,
    ReportTicket, SystemLog, AIUsageStats, HomeConfig, LandingPageConfig, Track,
    SacredArtImage,
    PlanParticipant, PlanComment
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Supabase credentials ausentes. O cliente usará URLs temporárias para evitar travamento da build. Verifique o .env.local na etapa de runtime.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// ─── aliases de compatibilidade ────────────────────────────────────────────
/** Alias para quem importava `auth` diretamente */
export const auth = supabase.auth;
/** Alias para quem importava `storage` diretamente */
export const storage = supabase.storage;
/** db não é mais necessário, mas exportamos supabase como db para compatibilidade */
export const db = supabase;

// ─── helpers internos ───────────────────────────────────────────────────────
const now = () => new Date().toISOString();

/** Remove propriedades undefined para evitar erros de inserção */
const clean = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

// ─── AUTH functions (mesmos nomes do firebase.ts) ───────────────────────────

export const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) throw error;
    return data;
};

export const loginWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) throw error;
    return data;
};

export const loginWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name, displayName: name } }
    });
    if (error) throw error;
    // Retorna objeto compatível com Firebase cred
    return { user: data.user };
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const resetPasswordEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
    });
    if (error) throw error;
};

/**
 * Monitora o estado de autenticação — equivalente ao onAuthStateChanged
 * Retorna uma função de unsubscribe.
 */
export const monitorAuthState = (callback: (user: any | null) => void) => {
    // Adiciona alias .uid ao user do Supabase para compatibilidade com código legado
    const addUidAlias = (user: any) => {
        if (!user) return null;
        return new Proxy(user, {
            get(target, prop) {
                if (prop === 'uid') return target.id;
                const val = target[prop as string];
                return typeof val === 'function' ? val.bind(target) : val;
            }
        });
    };

    // Dispara com a sessão atual imediatamente
    supabase.auth.getSession().then(({ data }) => {
        callback(addUidAlias(data.session?.user ?? null));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(addUidAlias(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
};

// ─── STORAGE ────────────────────────────────────────────────────────────────

export const uploadBlob = async (blob: Blob, path: string): Promise<string> => {
    const { error } = await supabase.storage.from('uploads').upload(path, blob, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return data.publicUrl;
};

export const uploadProfileImage = async (file: File, uid: string): Promise<string> => {
    return uploadBlob(file, `profiles/${uid}/${Date.now()}`);
};

// ─── dbService ──────────────────────────────────────────────────────────────

export const dbService = {

    // ── BÍBLIA & CONTENT ────────────────────────────────────────────────────
    getBibleChapter: async (bookId: string, chapter: number) => {
        const { data, error } = await supabase
            .from('bible_verses')
            .select('verse, text')
            .eq('book_id', bookId)
            .eq('chapter', chapter)
            .order('verse', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) return null;

        // Evita versículos duplicados caso o banco de dados possua múltiplas cópias do mesmo versículo.
        const uniqueVerses = Array.from(new Map(data.map(v => [v.verse, { number: v.verse, text: v.text }])).values());
        return { verses: uniqueVerses.sort((a, b) => a.number - b.number) };
    },
    saveBibleChapter: async (_bookId: string, _chapter: number, _data: any) => {
        // Bible data é somente-leitura; inserção feita via scripts de seed
        console.warn('saveBibleChapter: operação ignorada no Supabase (dado imutável).');
    },
    getNotesByChapter: async (uid: string, bookId: string, chapter: number) => {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', uid)
            .eq('book_id', bookId)
            .eq('chapter', chapter);
        if (error) throw error;
        return data ?? [];
    },

    /** Mapeia camelCase para snake_case para o Supabase */
    _toSnake: (obj: any) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const result: any = {};
        for (const key in obj) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = obj[key];
        }
        return result;
    },

    // ── CRUD GENÉRICO (subcoleções do Firebase → tabelas flat) ───────────────
    getAll: async (uid: string, tableName: string) => {
        const userColumn = ['custom_plans', 'reading_tracks', 'guided_prayers', 'custom_quizzes', 'evaluations'].includes(tableName)
            ? 'author_id'
            : 'user_id';

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq(userColumn, uid)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((d: any) => ({ ...d, id: d.id, createdAt: d.created_at, updatedAt: d.updated_at }));
    },
    add: async (uid: string, tableName: string, data: any) => {
        const userColumn = ['custom_plans', 'reading_tracks', 'guided_prayers', 'custom_quizzes', 'evaluations'].includes(tableName)
            ? 'author_id'
            : 'user_id';

        const cleanedData = dbService._toSnake(clean(data));

        const { data: result, error } = await supabase
            .from(tableName)
            .insert({ ...cleanedData, [userColumn]: uid })
            .select()
            .single();
        if (error) {
            console.error(`[dbService] Erro em ${tableName}:`, error);
            throw error;
        }
        return { id: result.id, ...result };
    },
    delete: async (uid: string, tableName: string, id: string) => {
        const userColumn = ['custom_plans', 'reading_tracks', 'guided_prayers', 'custom_quizzes', 'evaluations'].includes(tableName)
            ? 'author_id'
            : 'user_id';

        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id)
            .eq(userColumn, uid);
        if (error) throw error;
    },
    update: async (uid: string, tableName: string, id: string, data: any) => {
        const userColumn = ['custom_plans', 'reading_tracks', 'guided_prayers', 'custom_quizzes', 'evaluations'].includes(tableName)
            ? 'author_id'
            : 'user_id';

        const { error } = await supabase
            .from(tableName)
            .update(clean(data))
            .eq('id', id)
            .eq(userColumn, uid);
        if (error) throw error;
    },

    // ── NOTIFICAÇÕES ────────────────────────────────────────────────────────
    sendUserNotification: async (uid: string, title: string, message: string, type: string, link?: string) => {
        const { error } = await supabase.from('notifications').insert({
            user_id: uid, title, message, type, link,
            timestamp: now(), read: false
        });
        if (error) throw error;
    },

    // ── PERFIL DE USUÁRIO ────────────────────────────────────────────────────
    createUserProfile: async (uid: string, data: any) => {
        const mapped = {
            id: uid,
            email: data.email ?? null,
            display_name: data.displayName,
            photo_url: data.photoURL ?? null,
            username: data.username,
            city: data.city ?? null,
            state: data.state ?? null,
            phone_number: data.phoneNumber ?? null,
            cpf: data.cpf ?? null,
            instagram: data.instagram ?? null,
            facebook: data.facebook ?? null,
            slogan: data.slogan ?? null,
            is_profile_public: data.isProfilePublic ?? true,
            credits: data.credits ?? 0,
            lifetime_xp: data.lifetimeXp ?? 0,
            badges: data.badges ?? [],
            subscription_tier: data.subscriptionTier ?? 'free',
            subscription_status: data.subscriptionStatus ?? 'active',
            subscription_expires_at: data.subscriptionExpiresAt ?? null,
            theme: data.theme ?? 'light',
            activity_log: data.activityLog ?? [],
            stats: data.stats ?? {},
            last_reading_position: data.lastReadingPosition ?? {},
            usage_today: data.usageToday ?? {},
            reading_plan: data.readingPlan ?? {},
            progress: data.progress ?? {},
            enrolled_plans: data.enrolledPlans ?? [],
            church_data: data.churchData ?? {},
            followers_count: data.followersCount ?? 0,
            following_count: data.followingCount ?? 0,
            bio: data.bio ?? null,
            created_at: now(),
        };
        const { error } = await supabase.from('profiles').upsert(mapped);
        if (error) throw error;
    },

    updateUserProfile: async (uid: string, data: any) => {
        // Mapeia nomes camelCase → snake_case do Supabase
        const mapped: any = {};
        const fieldMap: Record<string, string> = {
            displayName: 'display_name',
            photoURL: 'photo_url',
            username: 'username',
            email: 'email',
            city: 'city',
            state: 'state',
            phoneNumber: 'phone_number',
            cpf: 'cpf',
            instagram: 'instagram',
            facebook: 'facebook',
            slogan: 'slogan',
            isProfilePublic: 'is_profile_public',
            credits: 'credits',
            lifetimeXp: 'lifetime_xp',
            badges: 'badges',
            subscriptionTier: 'subscription_tier',
            subscriptionStatus: 'subscription_status',
            subscriptionExpiresAt: 'subscription_expires_at',
            theme: 'theme',
            activityLog: 'activity_log',
            stats: 'stats',
            lastReadingPosition: 'last_reading_position',
            usageToday: 'usage_today',
            readingPlan: 'reading_plan',
            progress: 'progress',
            enrolledPlans: 'enrolled_plans',
            churchData: 'church_data',
            followersCount: 'followers_count',
            followingCount: 'following_count',
            bio: 'bio'
        };

        for (const [tsKey, sqlKey] of Object.entries(fieldMap)) {
            if (data[tsKey] !== undefined) {
                mapped[sqlKey] = data[tsKey];
            }
        }

        if (Object.keys(mapped).length > 0) {
            const { error } = await supabase.from('profiles').update(mapped).eq('id', uid);
            if (error) throw error;
        }
    },

    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();
        if (error || !data) return null;
        return mapProfileToUserProfile(data);
    },

    getAllUsers: async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return (data ?? []).map(mapProfileToUserProfile);
    },

    getEmailByUsername: async (username: string): Promise<string | null> => {
        const { data } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', username)
            .single();
        return data?.email ?? null;
    },

    getUserByUsername: async (username: string): Promise<UserProfile | null> => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
        return data ? mapProfileToUserProfile(data) : null;
    },

    searchUsersByName: async (name: string): Promise<UserProfile[]> => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('display_name', `%${name}%`)
            .limit(10);
        return (data ?? []).map(mapProfileToUserProfile);
    },
    searchUsersByUsername: async (username: string): Promise<UserProfile[]> => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${username.replace('@', '')}%`)
            .limit(10);
        return (data ?? []).map(mapProfileToUserProfile);
    },
    searchUsersGlobal: async (term: string): Promise<UserProfile[]> => {
        const [byName, byUser] = await Promise.all([
            dbService.searchUsersByName(term),
            dbService.searchUsersByUsername(term)
        ]);
        const combined = [...byName, ...byUser];
        return Array.from(new Map(combined.map(u => [u.uid, u])).values()).slice(0, 15);
    },
    isUsernameAvailable: async (username: string): Promise<boolean> => {
        const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('username', username);
        return (count ?? 1) === 0;
    },

    // ── SYSTEM ───────────────────────────────────────────────────────────────
    getSystemSettings: async (): Promise<SystemSettings | null> => {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'global')
            .single();
        return data?.value ? JSON.parse(data.value) : null;
    },
    saveSystemSettings: async (settings: any) => {
        await supabase.from('settings').upsert({ key: 'global', value: JSON.stringify(settings) });
    },
    wipeAllUserData: async () => {
        console.warn('wipeAllUserData: operação disponível apenas via painel Supabase.');
    },

    // ── ORAÇÕES GUIADAS & TRILHAS ────────────────────────────────────────────
    getGuidedPrayers: async (churchId?: string): Promise<GuidedPrayer[]> => {
        let q = supabase.from('guided_prayers').select('*');
        if (churchId) q = q.or(`church_id.is.null,church_id.eq.${churchId}`);
        else q = q.is('church_id', null);
        const { data } = await q;
        return (data ?? []).map(d => ({ ...d, id: d.id, churchId: d.church_id, authorId: d.author_id, authorName: d.author_name, isTemplate: d.is_template, createdAt: d.created_at }));
    },
    getPastorPrayers: async (uid: string): Promise<GuidedPrayer[]> => {
        const { data } = await supabase.from('guided_prayers').select('*').eq('author_id', uid);
        return (data ?? []).map(d => ({ ...d, id: d.id, churchId: d.church_id, authorId: d.author_id, authorName: d.author_name, isTemplate: d.is_template, createdAt: d.created_at }));
    },
    createGuidedPrayer: async (data: any) => {
        const { data: res, error } = await supabase
            .from('guided_prayers')
            .insert({ title: data.title, content: data.content, category: data.category, author_id: data.authorId, author_name: data.authorName, church_id: data.churchId ?? null, is_template: data.isTemplate ?? false, generated_by: data.generatedBy ?? 'pastor', created_at: now() })
            .select().single();
        if (error) throw error;
        return { id: res.id };
    },
    updateGuidedPrayer: async (id: string, data: any) => {
        const { error } = await supabase.from('guided_prayers').update(clean(data)).eq('id', id);
        if (error) throw error;
    },
    deleteGuidedPrayer: async (id: string) => {
        await supabase.from('guided_prayers').delete().eq('id', id);
    },

/*
    getTracks: async (uid: string): Promise<Track[]> => {
        const { data } = await supabase.from('reading_tracks').select('*').eq('author_id', uid);
        return (data ?? []).map(mapTrack);
    },
    getPublicTracks: async (limitCount = 20): Promise<Track[]> => {
        const { data } = await supabase.from('reading_tracks').select('*').in('scope', ['global', 'church']).limit(limitCount);
        return (data ?? []).map(mapTrack);
    },
    getTrackById: async (id: string): Promise<Track | null> => {
        const { data } = await supabase.from('reading_tracks').select('*').eq('id', id).single();
        return data ? mapTrack(data) : null;
    },
    createTrack: async (data: any) => {
        const { data: res, error } = await supabase
            .from('reading_tracks')
            .insert({ title: data.title, description: data.description, author_id: data.authorId, generated_by: data.generatedBy, scope: data.isPublic ? 'global' : 'personal', tags: JSON.stringify(data.tags ?? []), steps: JSON.stringify(data.items ?? []), created_at: now(), updated_at: now() })
            .select().single();
        if (error) throw error;
        return { id: res.id };
    },
    updateTrack: async (id: string, data: any) => {
        await supabase.from('reading_tracks').update(clean(data)).eq('id', id);
    },
    deleteTrack: async (id: string) => {
        await supabase.from('reading_tracks').delete().eq('id', id);
    },
*/

    // ── IGREJAS & SOCIAL ────────────────────────────────────────────────────
    searchGlobalChurches: async (term: string): Promise<Church[]> => {
        const { data } = await supabase.from('churches').select('*').ilike('name', `%${term}%`);
        return (data ?? []).map(mapChurch);
    },
    searchChurches: async (term: string, city: string, state: string): Promise<Church[]> => {
        const { data } = await supabase.from('churches').select('*')
            .eq('location_state', state).eq('location_city', city).ilike('name', `%${term}%`);
        return (data ?? []).map(mapChurch);
    },
    createChurch: async (data: any): Promise<string> => {
        const { data: res, error } = await supabase.from('churches')
            .insert({ name: data.name, slug: data.slug, acronym: data.acronym ?? '', denomination: data.denomination ?? '', location_city: data.location?.city, location_state: data.location?.state, location_address: data.location?.address, logo_url: data.logoUrl ?? null, pastor_name: data.pastorName ?? null, created_at: now() })
            .select().single();
        if (error) throw error;
        return res.id;
    },
    getChurchBySlug: async (slug: string): Promise<Church | null> => {
        const { data } = await supabase.from('churches').select('*').eq('slug', slug).single();
        return data ? mapChurch(data) : null;
    },
    getChurchById: async (id: string): Promise<Church | null> => {
        const { data } = await supabase.from('churches').select('*').eq('id', id).single();
        return data ? mapChurch(data) : null;
    },
    getChurchRootGroups: async (churchId: string): Promise<ChurchGroup[]> => {
        const { data } = await supabase.from('cells').select('*').eq('church_id', churchId);
        return (data ?? []).map(mapCell);
    },
    createCell: async (data: any): Promise<string> => {
        const { data: res, error } = await supabase.from('cells')
            .insert({ church_id: data.churchId, name: data.name, slug: data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-'), leader_id: data.leaderUid ?? null, created_by: data.createdBy, created_at: now() })
            .select().single();
        if (error) throw error;
        return res.id;
    },
    joinCell: async (uid: string, cellId: string, data: any) => {
        await supabase.from('memberships').upsert({ user_id: uid, cell_id: cellId, church_id: data.churchId });
        await dbService.updateUserProfile(uid, { 'churchData.groupId': cellId, 'churchData.groupName': data.name });
    },
    getChurchMembers: async (churchId: string): Promise<UserProfile[]> => {
        const { data } = await supabase.from('memberships').select('profiles(*)').eq('church_id', churchId);
        return (data ?? []).map((d: any) => mapProfileToUserProfile(d.profiles)).filter(Boolean);
    },
    getChurchFollowers: async (churchId: string) => {
        const { data } = await supabase.from('church_followers').select('*').eq('church_id', churchId);
        return data ?? [];
    },
    followChurch: async (uid: string, churchId: string, _userData: any, _churchData: any) => {
        await supabase.from('church_followers').upsert({ user_id: uid, church_id: churchId, followed_at: now() });
    },
    unfollowChurch: async (uid: string, churchId: string) => {
        await supabase.from('church_followers').delete().eq('user_id', uid).eq('church_id', churchId);
    },
    updateChurch: async (id: string, data: any) => {
        await supabase.from('churches').update(clean(data)).eq('id', id);
    },

    // ── PEDIDOS DE ORAÇÃO ────────────────────────────────────────────────────
    addPrayerRequest: async (targetType: string, targetId: string, data: any): Promise<string> => {
        const { data: res, error } = await supabase.from('prayer_requests')
            .insert({ user_id: data.userId, user_name: data.userName, user_photo_url: data.userPhotoURL ?? null, content: data.content, target_type: targetType, target_id: targetId, church_id: data.churchId ?? null, cell_name: data.cellName ?? null, intercessors_count: 0, intercessors: '[]', created_at: now() })
            .select().single();
        if (error) throw error;
        return res.id;
    },
    getPrayerRequests: async (targetType: string, targetId: string): Promise<PrayerRequest[]> => {
        const { data } = await supabase.from('prayer_requests').select('*')
            .eq('target_id', targetId).order('created_at', { ascending: false });
        return (data ?? []).map(mapPrayerRequest);
    },
    getUnifiedChurchMural: async (churchId: string): Promise<PrayerRequest[]> => {
        return dbService.getPrayerRequests('church', churchId);
    },
    togglePrayerIntercession: async (prayerId: string, uid: string, isActive: boolean) => {
        const { data } = await supabase.from('prayer_requests').select('intercessors').eq('id', prayerId).single();
        if (!data) return;
        let intercessors: string[] = JSON.parse(data.intercessors ?? '[]');
        if (isActive) { if (!intercessors.includes(uid)) intercessors.push(uid); }
        else { intercessors = intercessors.filter(i => i !== uid); }
        await supabase.from('prayer_requests').update({ intercessors: JSON.stringify(intercessors), intercessors_count: intercessors.length }).eq('id', prayerId);
    },
    updatePrayerRequest: async (id: string, content: string) => {
        await supabase.from('prayer_requests').update({ content }).eq('id', id);
    },
    deletePrayerRequest: async (id: string) => {
        await supabase.from('prayer_requests').delete().eq('id', id);
    },
    getLatestCommunityPrayer: async (churchId: string): Promise<PrayerRequest | null> => {
        const { data } = await supabase.from('prayer_requests').select('*')
            .eq('church_id', churchId).order('created_at', { ascending: false }).limit(1).single();
        return data ? mapPrayerRequest(data) : null;
    },

    // ── CÉLULAS ──────────────────────────────────────────────────────────────
    updateCell: async (id: string, data: any) => {
        await supabase.from('cells').update(clean(data)).eq('id', id);
    },
    deleteCell: async (id: string) => {
        await supabase.from('cells').delete().eq('id', id);
    },
    getSubgroups: async (parentId: string): Promise<ChurchGroup[]> => {
        const { data } = await supabase.from('cells').select('*').eq('parent_group_id', parentId);
        return (data ?? []).map(mapCell);
    },
    getCellBySlug: async (slug: string): Promise<ChurchGroup | null> => {
        const { data } = await supabase.from('cells').select('*').eq('slug', slug).single();
        return data ? mapCell(data) : null;
    },
    getCellMembers: async (cellId: string): Promise<UserProfile[]> => {
        const { data } = await supabase.from('memberships').select('profiles(*)').eq('cell_id', cellId);
        return (data ?? []).map((d: any) => mapProfileToUserProfile(d.profiles)).filter(Boolean);
    },

    // ── POSTS ────────────────────────────────────────────────────────────────
    getGlobalFeed: async (limitCount = 50): Promise<Post[]> => {
        const { data } = await supabase.from('posts').select('*')
            .eq('destination', 'global').order('created_at', { ascending: false }).limit(limitCount);
        return (data ?? []).map(mapPost);
    },
    createPost: async (data: any) => {
        const { error } = await supabase.from('posts').insert({
            user_id: data.userId, 
            user_display_name: data.userDisplayName, 
            user_username: data.userUsername, 
            user_photo_url: data.userPhotoURL ?? null,
            content: data.content, 
            type: data.type ?? 'reflection', 
            destination: data.destination ?? 'global',
            church_id: data.churchId ?? null, 
            cell_id: data.cellId ?? null, 
            image_url: data.imageUrl || data.image || null,
            likes_count: 0, 
            comments_count: 0, 
            liked_by: '[]', 
            created_at: now()
        });
        if (error) throw error;
    },
    updatePost: async (id: string, data: any) => {
        await supabase.from('posts').update(clean(data)).eq('id', id);
    },
    deletePost: async (id: string) => {
        await supabase.from('posts').delete().eq('id', id);
    },
    togglePostLike: async (postId: string, uid: string, isLiked: boolean) => {
        const { data } = await supabase.from('posts').select('liked_by, likes_count').eq('id', postId).single();
        if (!data) return;
        let likedBy: string[] = JSON.parse(data.liked_by ?? '[]');
        if (isLiked) { if (!likedBy.includes(uid)) likedBy.push(uid); }
        else { likedBy = likedBy.filter(i => i !== uid); }
        await supabase.from('posts').update({ liked_by: JSON.stringify(likedBy), likes_count: likedBy.length }).eq('id', postId);
    },
    getTrendingPost: async (): Promise<Post | null> => {
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(1).single();
        return data ? mapPost(data) : null;
    },

    // ── COMENTÁRIOS DE PLANOS (FÓRUM) ────────────────────────────────────────
    getPlanComments: async (planId: string, dayId: string): Promise<PlanComment[]> => {
        const { data, error } = await supabase
            .from('plan_comments')
            .select('*')
            .eq('plan_id', planId)
            .eq('day_id', dayId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return (data ?? []).map(mapPlanComment);
    },
    addPlanComment: async (comment: Partial<PlanComment>) => {
        const { data, error } = await supabase
            .from('plan_comments')
            .insert({
                plan_id: comment.planId,
                day_id: comment.dayId,
                user_id: comment.userId,
                user_name: comment.userName,
                user_photo: comment.userPhoto ?? null,
                content: comment.content,
                created_at: now()
            })
            .select()
            .single();
        if (error) throw error;
        return mapPlanComment(data);
    },
    deletePlanComment: async (commentId: string, uid: string) => {
        const { error } = await supabase
            .from('plan_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', uid);
        if (error) throw error;
    },


    // ── SEGUINDO ─────────────────────────────────────────────────────────────
    checkIsFollowing: async (uid: string, targetUid: string): Promise<boolean> => {
        const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true })
            .eq('follower_id', uid).eq('following_id', targetUid);
        return (count ?? 0) > 0;
    },
    followUser: async (uid: string, targetUid: string, _myData: any, _targetData: any) => {
        await supabase.from('follows').upsert({ follower_id: uid, following_id: targetUid, created_at: now() });
    },
    unfollowUser: async (uid: string, targetUid: string) => {
        await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', targetUid);
    },

    // ── PLANOS (JORNADAS) ────────────────────────────────────────────────────
    getUserCustomPlans: async (uid: string): Promise<CustomPlan[]> => {
        const { data } = await supabase.from('custom_plans').select('*').eq('author_id', uid);
        return (data ?? []).map(mapPlan);
    },
    getPublicUserPlans: async (uid: string): Promise<CustomPlan[]> => {
        const { data } = await supabase.from('custom_plans').select('*').eq('author_id', uid).eq('is_public', true);
        return (data ?? []).map(mapPlan);
    },
    getCustomPlan: async (id: string): Promise<CustomPlan | null> => {
        const { data } = await supabase.from('custom_plans').select('*').eq('id', id).single();
        return data ? mapPlan(data) : null;
    },
    getPublicPlans: async (): Promise<CustomPlan[]> => {
        const { data } = await supabase.from('custom_plans').select('*').eq('is_public', true).limit(20);
        return (data ?? []).map(mapPlan);
    },
    getPublicTracks: async (limitCount = 20): Promise<Track[]> => {
        const { data } = await supabase.from('reading_tracks').select('*').in('scope', ['global', 'church']).limit(limitCount);
        return (data ?? []).map(mapTrack);
    },
    createCustomPlan: async (data: any) => {
        const { data: res, error } = await supabase.from('custom_plans').insert(mapPlanToDb(data)).select().single();
        if (error) throw error;
        return { id: res.id };
    },
    updateCustomPlan: async (id: string, data: any) => {
        const { error } = await supabase.from('custom_plans').update(mapPlanToDb(data)).eq('id', id);
        if (error) throw error;
    },
    getPlanParticipant: async (planId: string, uid: string) => {
        const { data } = await supabase.from('plan_participants').select('*').eq('plan_id', planId).eq('uid', uid).single();
        return data ? mapParticipant(data) : null;
    },
    updateParticipantPresence: async (planId: string, uid: string) => {
        await supabase.from('plan_participants').update({ last_activity_at: now() }).eq('plan_id', planId).eq('uid', uid);
    },
    subscribeToPlanParticipants: (planId: string, callback: (participants: PlanParticipant[]) => void) => {
        // Busca inicial
        supabase.from('plan_participants').select('*').eq('plan_id', planId).then(({ data }) => {
            callback((data ?? []).map(mapParticipant));
        });
        // Realtime subscription
        const channel = supabase.channel(`plan_${planId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_participants', filter: `plan_id=eq.${planId}` },
                async () => {
                    const { data } = await supabase.from('plan_participants').select('*').eq('plan_id', planId);
                    callback((data ?? []).map(mapParticipant));
                })
            .subscribe();
        return () => supabase.removeChannel(channel);
    },
    joinPlan: async (planId: string, user: any, teamId?: string) => {
        const participantData: any = {
            plan_id: planId, uid: user.uid, display_name: user.displayName || 'Anônimo',
            username: user.username || 'user', photo_url: user.photoURL ?? null,
            points: 0, completed_steps: '[]', joined_at: now(), last_activity_at: now(), status: 'active'
        };
        if (teamId) participantData.team = teamId;
        const { error: pError } = await supabase.from('plan_participants').upsert(participantData);
        if (pError) throw pError;

        // Update profile.enrolled_plans
        const enrolledPlans = user.enrolledPlans || [];
        if (!enrolledPlans.includes(planId)) {
            await supabase.from('profiles').update({
                enrolled_plans: [...enrolledPlans, planId]
            }).eq('id', user.uid);
        }
    },
    inviteUserToPlan: async (planId: string, user: UserProfile, teamId?: string) => {
        const session = await supabase.auth.getSession();
        const participantData: any = {
            plan_id: planId, uid: user.uid, display_name: user.displayName,
            username: user.username, photo_url: user.photoURL ?? null,
            points: 0, completed_steps: '[]', joined_at: now(), last_activity_at: now(), status: 'active',
            invited_by: session.data.session?.user?.id ?? null
        };
        if (teamId) participantData.team = teamId;
        await supabase.from('plan_participants').upsert(participantData);
        const { data: planData } = await supabase.from('custom_plans').select('title').eq('id', planId).single();
        await dbService.sendUserNotification(user.uid, 'Convite para Sala', `Você foi adicionado à "${planData?.title ?? 'Sala de Estudos'}".`, 'info', `/jornada/${planId}`);
    },
    updatePlanProgress: async (planId: string, uid: string, stepId: string, points: number) => {
        const { data } = await supabase.from('plan_participants').select('completed_steps, points').eq('plan_id', planId).eq('uid', uid).single();
        if (!data) return;
        const completed: string[] = JSON.parse(data.completed_steps ?? '[]');
        if (!completed.includes(stepId)) {
            await supabase.from('plan_participants').update({ completed_steps: JSON.stringify([...completed, stepId]), points: (data.points || 0) + points, last_activity_at: now() }).eq('plan_id', planId).eq('uid', uid);
        }
    },
    getPlanRanking: async (planId: string) => {
        const { data } = await supabase.from('plan_participants').select('*').eq('plan_id', planId).order('points', { ascending: false }).limit(50);
        return (data ?? []).map(mapParticipant);
    },
    getAllPlanParticipants: async (planId: string) => {
        const { data } = await supabase.from('plan_participants').select('*').eq('plan_id', planId);
        return (data ?? []).map(mapParticipant);
    },
    getRecentPlanParticipants: async (planId: string, limitCount = 5): Promise<PlanParticipant[]> => {
        const { data } = await supabase.from('plan_participants').select('*').eq('plan_id', planId).order('last_activity_at', { ascending: false }).limit(limitCount);
        return (data ?? []).map(mapParticipant);
    },
    manageParticipant: async (planId: string, uid: string, action: string) => {
        if (action === 'remove') { await supabase.from('plan_participants').delete().eq('plan_id', planId).eq('uid', uid); }
        else { await supabase.from('plan_participants').update({ status: action === 'block' ? 'blocked' : 'active' }).eq('plan_id', planId).eq('uid', uid); }
    },

    // ── TIMES ────────────────────────────────────────────────────────────────
    getGlobalTeams: async (uid: string): Promise<PlanTeam[]> => {
        const { data } = await supabase.from('user_teams').select('*').eq('user_id', uid);
        return (data ?? []).map(d => ({ id: d.id, name: d.name, color: d.color, members: JSON.parse(d.members ?? '[]') }));
    },
    createTeam: async (uid: string, data: any) => {
        const { data: res, error } = await supabase.from('user_teams').insert({ user_id: uid, name: data.name, color: data.color, members: JSON.stringify(data.members ?? []) }).select().single();
        if (error) throw error;
        return { id: res.id };
    },
    deleteTeam: async (uid: string, id: string) => {
        await supabase.from('user_teams').delete().eq('id', id).eq('user_id', uid);
    },
    updateTeam: async (uid: string, id: string, data: any) => {
        await supabase.from('user_teams').update(clean(data)).eq('id', id).eq('user_id', uid);
    },
    
    // ── GALERIA DE ARTES SACRAS ─────────────────────────────────────────────
    saveSacredArtImage: async (uid: string, data: Partial<SacredArtImage>) => {
        // Mapeia camelCase para snake_case manualmente para esta tabela específica
        const mapped = {
            user_id: uid,
            url: data.url,
            thumbnail_url: data.thumbnailUrl,
            prompt: data.prompt,
            category: data.category,
            style: data.style,
            verse_text: data.verseText,
            verse_reference: data.verseReference,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            created_at: now()
        };
        const { data: res, error } = await supabase
            .from('sacred_art_gallery')
            .insert(mapped)
            .select().single();
        if (error) throw error;
        return res;
    },
    getSacredArtGallery: async (uid: string, category?: string): Promise<SacredArtImage[]> => {
        let q = supabase.from('sacred_art_gallery').select('*').eq('user_id', uid);
        if (category && category !== 'Todas') {
            q = q.eq('category', category);
        }
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map(d => ({
            id: d.id,
            userId: d.user_id,
            url: d.url,
            thumbnailUrl: d.thumbnail_url,
            prompt: d.prompt,
            category: d.category,
            style: d.style,
            verseText: d.verse_text,
            verseReference: d.verse_reference,
            createdAt: d.created_at,
            metadata: d.metadata ? JSON.parse(d.metadata) : undefined
        }));
    },
    deleteSacredArtImage: async (uid: string, id: string) => {
        const { error } = await supabase.from('sacred_art_gallery').delete().eq('id', id).eq('user_id', uid);
        if (error) throw error;
    },
    autoEnrollTeamMembers: async (_planId: string, _teams: any[]) => { /* implementar se necessário */ },
    getEnrolledPlans: async (ids: string[]): Promise<CustomPlan[]> => {
        if (!ids.length) return [];
        const { data } = await supabase.from('custom_plans').select('*').in('id', ids.slice(0, 10));
        return (data ?? []).map(mapPlan);
    },

    // ── QUIZ & AVALIAÇÃO ─────────────────────────────────────────────────────
    getCustomQuizzes: async (uid: string): Promise<CustomQuiz[]> => {
        const { data } = await supabase.from('custom_quizzes').select('*').eq('author_id', uid);
        return (data ?? []).map(d => ({ ...d, id: d.id, authorId: d.author_id, gameMode: d.game_mode, isActive: d.is_active, createdAt: d.created_at, aiConfig: d.ai_config ? JSON.parse(d.ai_config) : undefined, questions: d.questions ? JSON.parse(d.questions) : undefined }));
    },
    getCustomQuiz: async (id: string): Promise<CustomQuiz | null> => {
        const { data } = await supabase.from('custom_quizzes').select('*').eq('id', id).single();
        if (!data) return null;
        return { ...data, id: data.id, authorId: data.author_id, gameMode: data.game_mode, isActive: data.is_active, createdAt: data.created_at };
    },
    createEvaluation: async (data: any) => {
        const { data: res, error } = await supabase.from('evaluations')
            .insert({ plan_id: data.planId, author_id: data.authorId, title: data.title, description: data.description ?? null, time_limit_minutes: data.timeLimitMinutes ?? 0, passing_score: data.passingScore ?? 70, questions: JSON.stringify(data.questions ?? []), created_at: data.createdAt ?? now(), updated_at: now() })
            .select().single();
        if (error) throw error;
        return { id: res.id };
    },
    getEvaluation: async (id: string): Promise<StudyEvaluation | null> => {
        const { data } = await supabase.from('evaluations').select('*').eq('id', id).single();
        if (!data) return null;
        return { ...data, id: data.id, planId: data.plan_id, authorId: data.author_id, timeLimitMinutes: data.time_limit_minutes, passingScore: data.passing_score, questions: JSON.parse(data.questions ?? '[]'), createdAt: data.created_at, updatedAt: data.updated_at };
    },

    // ── ADMIN / ANALYTICS ────────────────────────────────────────────────────
    getAdminStats: async () => {
        const [{ count: users }, { count: churches }, { count: paid }] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('churches').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('subscription_tier', 'free'),
        ]);
        return { users: users ?? 0, churches: churches ?? 0, paidUsers: paid ?? 0 };
    },
    getReportTickets: async () => {
        const { data } = await supabase.from('report_tickets').select('*').order('created_at', { ascending: false });
        return data ?? [];
    },
    getSupportTickets: async () => {
        const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        return data ?? [];
    },
    createSupportTicket: async (uid: string, email: string, name: string, subject: string, msg: string) => {
        await supabase.from('support_tickets').insert({ user_id: uid, user_email: email, user_name: name, subject, message: msg, status: 'open', created_at: now() });
    },
    submitBugReport: async (desc: string, severity: string) => {
        await supabase.from('report_tickets').insert({ type: 'bug', reason: desc, severity, created_at: now() });
        return true;
    },
    getAIUsageStats: async () => {
        // Agrega dados de uso de IA a partir dos logs do sistema
        const { data } = await supabase
            .from('system_logs')
            .select('type, message')
            .gte('timestamp', new Date(Date.now() - 86400000).toISOString())
            .limit(1000);
        const logs = data ?? [];
        const chat = logs.filter(l => l.type === 'use_chat' || l.message?.includes('chat')).length;
        const images = logs.filter(l => l.type === 'create_image' || l.message?.includes('image')).length;
        const podcasts = logs.filter(l => l.type === 'podcast' || l.message?.includes('podcast')).length;
        const analysis = logs.filter(l => l.type === 'deep_study' || l.message?.includes('analysis')).length;
        const totalRequests = chat + images + podcasts + analysis;
        return {
            date: new Date().toISOString(),
            totalTokens: totalRequests * 1200, // média estimada por requisiçao
            costEstimate: totalRequests * 0.0008, // $0.0008 por req média
            requests: { chat, images, podcasts, analysis }
        };
    },
    getSystemLogs: async () => {
        const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
        return data ?? [];
    },

    // ── CMS ──────────────────────────────────────────────────────────────────
    getAdminDevotional: async (date: string) => {
        const { data } = await supabase.from('daily_devotionals').select('*').eq('date', date.replace(/\//g, '-')).single();
        return data ?? null;
    },
    saveAdminDevotional: async (data: any) => {
        const dateId = data.date.replace(/\//g, '-');
        await supabase.from('daily_devotionals').upsert({ date: dateId, ...clean(data) });
    },
    getLandingPageConfig: async (): Promise<LandingPageConfig | null> => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'landing').single();
        return data?.value ? JSON.parse(data.value) : null;
    },
    saveLandingPageConfig: async (config: any) => {
        await supabase.from('settings').upsert({ key: 'landing', value: JSON.stringify(config) });
    },
    getHomeConfig: async (): Promise<HomeConfig | null> => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'home').single();
        return data?.value ? JSON.parse(data.value) : null;
    },
    saveHomeConfig: async (config: any) => {
        await supabase.from('settings').upsert({ key: 'home', value: JSON.stringify(config) });
    },
    getUserScopedSetting: async (key: string) => {
        const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
        return data?.value ? JSON.parse(data.value) : null;
    },
    saveUserScopedSetting: async (key: string, value: any) => {
        await supabase.from('settings').upsert({ key, value: JSON.stringify(value) });
    },
    getBanners: async (_activeOnly: boolean): Promise<Banner[]> => {
        const { data } = await supabase.from('banners').select('*').order('priority', { ascending: true });
        return data ?? [];
    },
    saveBanner: async (data: any) => {
        await supabase.from('banners').upsert(clean(data));
    },
    deleteBanner: async (id: string) => {
        await supabase.from('banners').delete().eq('id', id);
    },
    sendGlobalNotification: async (title: string, msg: string, type: string, link: string) => {
        await supabase.from('system_notifications').insert({ title, message: msg, type, link, created_at: now() });
    },

    // ── ESTUDOS / ARTIGOS ────────────────────────────────────────────────────
    getCommunityArticles: async (filter: string): Promise<SavedStudy[]> => {
        const col = filter === 'popular' ? 'views_count' : 'created_at';
        const { data } = await supabase.from('public_studies').select('*').order(col, { ascending: false }).limit(20);
        return (data ?? []).map(mapStudy);
    },
    getGlobalRanking: async (): Promise<UserProfile[]> => {
        const { data } = await supabase.from('profiles').select('*').order('lifetime_xp', { ascending: false }).limit(10);
        return (data ?? []).map(mapProfileToUserProfile);
    },
    getPublicStudy: async (id: string): Promise<SavedStudy | null> => {
        const { data } = await supabase.from('public_studies').select('*').eq('id', id).single();
        return data ? mapStudy(data) : null;
    },
    publishStudy: async (uid: string, id: string, profile: any, data: any) => {
        await supabase.from('public_studies').upsert({
            id, 
            user_id: uid, 
            user_name: profile.displayName, 
            user_photo: profile.photoURL,
            cover_image: data.meta?.coverImage || data.coverImage || data.coverUrl || null,
            ...clean(data), 
            published_at: now(), 
            views_count: 0, 
            shares_count: 0
        });
        await supabase.from('studies').update({ status: 'published' }).eq('id', id).eq('user_id', uid);
    },
    unpublishStudy: async (uid: string, id: string) => {
        await supabase.from('public_studies').delete().eq('id', id);
        await supabase.from('studies').update({ status: 'draft' }).eq('id', id).eq('user_id', uid);
    },
    // Landing Page Creator
    getPublicStudyById: async (id: string): Promise<any | null> => {
        const { data } = await supabase.from('public_studies').select('*').eq('id', id).single();
        return data || null;
    },
    createPublicStudy: async (data: any): Promise<{ id: string }> => {
        const slug = data.slug || `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
        const { data: result, error } = await supabase
            .from('public_studies')
            .insert({
                user_id: data.authorId,
                user_name: data.authorName,
                user_photo: data.authorPhoto,
                title: data.meta?.title || 'Novo Conteúdo',
                description: data.meta?.description || '',
                type: data.type || 'article',
                slug,
                blocks: JSON.stringify(data.blocks || []),
                meta: JSON.stringify(data.meta || {}),
                cover_image: data.meta?.coverImage || null,
                status: data.status || 'draft',
                published_at: data.status === 'published' ? now() : null,
                views_count: 0,
                shares_count: 0,
                created_at: now(),
                updated_at: now()
            })
            .select('id')
            .single();
        if (error) throw error;
        return { id: result.id };
    },
    updatePublicStudy: async (id: string, data: any): Promise<void> => {
        // Tenta atualizar na tabela pública
        const updateData = {
            title: data.meta?.title,
            description: data.meta?.description,
            blocks: typeof data.blocks === 'string' ? data.blocks : JSON.stringify(data.blocks || []),
            meta: typeof data.meta === 'string' ? data.meta : JSON.stringify(data.meta || {}),
            cover_image: data.meta?.coverImage || null,
            status: data.status,
            published_at: data.status === 'published' ? (data.published_at || now()) : null,
            updated_at: now()
        };

        const { error: publicError, data: publicResult } = await supabase
            .from('public_studies')
            .update(updateData)
            .eq('id', id)
            .select();

        // Se falhar ou não encontrar na pública, tenta na privada
        if (publicError || !publicResult || publicResult.length === 0) {
            const { error: privateError } = await supabase
                .from('studies')
                .update(updateData)
                .eq('id', id);
            
            if (privateError && !publicError) throw privateError;
        }

        if (publicError) throw publicError;
    },
    publishPublicStudy: async (id: string, slug: string): Promise<void> => {
        const { error } = await supabase
            .from('public_studies')
            .update({
                status: 'published',
                slug,
                published_at: now(),
                updated_at: now()
            })
            .eq('id', id);
        if (error) throw error;
    },
    incrementMetric: async (tableName: string, id: string, field: string) => {
        const colMap: Record<string, string> = { views: 'views_count', shares: 'shares_count', completions: 'completions_count', likes: 'likes_count' };
        const col = colMap[field] ?? `${field}_count`;
        const { data } = await supabase.from(tableName).select(col).eq('id', id).single();
        if (data) {
            await supabase.from(tableName).update({ [col]: ((data as any)[col] || 0) + 1 }).eq('id', id);
        }
    },
    resolveReport: async (id: string, action: 'banned' | 'dismissed') => {
        // Busca o report para obter o reportedUserId
        const { data: report } = await supabase.from('report_tickets').select('reported_user_id').eq('id', id).single();

        if (action === 'banned' && report?.reported_user_id) {
            // Suspende a conta do usuário denunciado
            await supabase.from('profiles').update({ subscription_status: 'suspended' }).eq('id', report.reported_user_id);
        }

        // Registra a resolução e remove o ticket
        await supabase.from('report_tickets').update({ resolved: true, resolution: action, resolved_at: new Date().toISOString() }).eq('id', id);
    },
    updateTicketStatus: async (id: string, status: string) => {
        await supabase.from('support_tickets').update({ status }).eq('id', id);
    },

    // ── ANALYTICS & LOGS ─────────────────────────────────────────────────────
    logStudyAccess: async (studyId: string, user: any | null) => {
        // Incrementa o contador geral (views_count)
        const { data: study } = await supabase.from('public_studies').select('views_count').eq('id', studyId).single();
        if (study) {
            await supabase.from('public_studies').update({ views_count: (study.views_count || 0) + 1 }).eq('id', studyId);
        }

        // Registra o log individual
        await supabase.from('public_study_logs').insert({
            study_id: studyId,
            user_id: user?.uid || null,
            user_name: user?.displayName || 'Visitante Anônimo',
            user_photo: user?.photoURL || null,
            accessed_at: now()
        });
    },

    getStudyAccessLogs: async (studyId: string) => {
        const { data, error } = await supabase
            .from('public_study_logs')
            .select('*')
            .eq('study_id', studyId)
            .order('accessed_at', { ascending: false });
        if (error) console.error(error);
        return data || [];
    },

    // ── DEVOTIONALS ──────────────────────────────────────────────────────────
    getDailyDevotional: async (_forceNew = false) => {
        const todayId = new Date().toISOString().split('T')[0];
        // maybeSingle() retorna null ao invés de erro 406 quando não encontra
        const { data } = await supabase
            .from('daily_devotionals')
            .select('*')
            .eq('date', todayId)
            .maybeSingle();

        if (data) return data;

        // Fallback para o último disponível se hoje não tiver
        const { data: latest } = await supabase
            .from('daily_devotionals')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

        return latest ?? null;
    },
    getRecentDailyDevotionals: async (limitCount = 240) => {
        const { data } = await supabase
            .from('daily_devotionals')
            .select('*')
            .order('date', { ascending: false })
            .limit(limitCount);
        return data ?? [];
    },
    getDailyDevotionalsByContentIds: async (contentIds: string[]) => {
        const uniqueIds = Array.from(new Set(contentIds.filter(Boolean)));
        if (uniqueIds.length === 0) return [];

        const dateIds = uniqueIds
            .map(id => {
                const dailyMatch = id.match(/^daily:(\d{4}-\d{2}-\d{2})$/);
                if (dailyMatch) return dailyMatch[1];
                if (/^\d{4}-\d{2}-\d{2}$/.test(id)) return id;
                return null;
            })
            .filter((id): id is string => Boolean(id));

        const rawIds = uniqueIds.filter(id => !dateIds.includes(id));
        const collected: any[] = [];

        if (dateIds.length > 0) {
            const { data } = await supabase.from('daily_devotionals').select('*').in('date', dateIds);
            if (data) collected.push(...data);
        }

        const uuidLikeIds = rawIds.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
        if (uuidLikeIds.length > 0) {
            const { data } = await supabase.from('daily_devotionals').select('*').in('id', uuidLikeIds);
            if (data) collected.push(...data);
        }

        return collected;
    },
    getUserDevotionalHistory: async (uid: string, limitCount = 10) => {
        try {
            const { data, error } = await supabase
                .from('user_devotionals')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })
                .limit(limitCount);
            if (error) return []; // Tabela inexistente ou sem permissão
            return (data ?? []).map(d => ({ ...d, content_id: d.content_id, date: d.created_at?.split('T')[0] }));
        } catch {
            return [];
        }
    },
    saveUserDevotionalAction: async (uid: string, contentId: string, type: 'amen' | 'reflection' | 'view', value?: string) => {
        try {
            const { data: existing } = await supabase
                .from('user_devotionals')
                .select('*')
                .eq('user_id', uid)
                .eq('content_id', contentId)
                .maybeSingle();

            if (existing) {
                const updates: any = {};
                if (type === 'amen') updates.is_amen = true;
                if (type === 'reflection') updates.reflection = value;
                await supabase.from('user_devotionals').update(updates).eq('id', existing.id);
            } else {
                const insertData: any = {
                    user_id: uid,
                    content_id: contentId,
                    created_at: new Date().toISOString()
                };
                if (type === 'amen') insertData.is_amen = true;
                if (type === 'reflection') insertData.reflection = value;
                await supabase.from('user_devotionals').insert(insertData);
            }
        } catch {
            // Tabela user_devotionals pode não existir ainda — ignora silenciosamente
            console.warn('user_devotionals: tabela não encontrada ou erro ao salvar.');
        }
    },

    // ── BANCO DE IMAGENS / GALERIA IA ───────────────────────────────────────
    saveToImageBank: async (data: { 
        imageUrl: string; 
        prompt: string; 
        style?: string; 
        reference?: string; 
        label?: string; 
        category?: string;
        userId?: string;
    }) => {
        try {
            await supabase.from('image_bank').insert({
                image_url: data.imageUrl,
                prompt: data.prompt,
                style: data.style || 'default',
                reference: data.reference || '',
                label: data.label || 'Arte IA',
                category: data.category || 'IA',
                is_ai: true,
                user_id: data.userId || null,
                created_at: now()
            });
        } catch (e) {
            console.error('Erro ao salvar no banco de imagens:', e);
        }
    },
    getImageBank: async (limitCount = 50) => {
        try {
            const { data, error } = await supabase
                .from('image_bank')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limitCount);
            
            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
                    console.warn('image_bank table not found. Please create it in Supabase.');
                    return [];
                }
                throw error;
            }
            return data ?? [];
        } catch (e) { 
            return []; 
        }
    },
};

// ─── mappers: Supabase row → Tipo TS ────────────────────────────────────────

function safeJson(value: any, fallback: any = null) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch { return fallback; }
}

function mapProfileToUserProfile(d: any): UserProfile {
    return {
        uid: d.id,
        email: d.email ?? '',
        displayName: d.display_name ?? '',
        photoURL: d.photo_url ?? null,
        username: d.username ?? '',
        lifetimeXp: d.lifetime_xp ?? 0,
        credits: d.credits ?? 0,
        badges: safeJson(d.badges, []),
        subscriptionTier: d.subscription_tier ?? 'free',
        subscriptionStatus: d.subscription_status ?? 'active',
        subscriptionExpiresAt: d.subscription_expires_at ?? null,
        activityLog: safeJson(d.activity_log, []),
        stats: safeJson(d.stats, { totalChaptersRead: 0, daysStreak: 0, studiesCreated: 0, totalDevotionalsRead: 0, totalNotes: 0, totalShares: 0, totalImagesGenerated: 0, totalChatMessages: 0, totalSermonsCreated: 0, totalVersesMarked: 0, totalQuizzesCompleted: 0, perfectQuizzes: 0 }),
        lastReadingPosition: safeJson(d.last_reading_position),
        usageToday: safeJson(d.usage_today, { date: '', imagesCount: 0, podcastsCount: 0, analysisCount: 0, chatCount: 0 }),
        city: d.city ?? undefined,
        state: d.state ?? undefined,
        bio: d.bio ?? undefined,
        slogan: d.slogan ?? undefined,
        isProfilePublic: d.is_profile_public ?? true,
        churchData: safeJson(d.church_data),
        enrolledPlans: safeJson(d.enrolled_plans, []),
        readingPlan: safeJson(d.reading_plan),
        progress: safeJson(d.progress),
        theme: d.theme ?? 'light',
        followersCount: d.followers_count ?? 0,
        followingCount: d.following_count ?? 0,
    };
}

function mapPlan(d: any): CustomPlan {
    return {
        id: d.id,
        authorId: d.author_id,
        authorName: d.author_name,
        title: d.title,
        description: d.description ?? '',
        category: d.category ?? 'Geral',
        coverUrl: d.cover_url ?? undefined,
        weeks: safeJson(d.weeks, []),
        isPublic: d.is_public ?? false,
        privacyType: d.privacy_type ?? 'public',
        isRanked: d.is_ranked ?? false,
        status: d.status ?? 'draft',
        churchId: d.church_id ?? undefined,
        groupId: d.group_id ?? undefined,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        subscribersCount: d.subscribers_count ?? 0,
        planningFrequency: d.planning_frequency ?? 'weekly',
        hasEvaluation: d.has_evaluation ?? false,
        evaluationId: d.evaluation_id ?? undefined,
        teams: safeJson(d.teams, []),
        teamScores: safeJson(d.team_scores, {}),
        startDate: d.start_date ?? undefined,
        endDate: d.end_date ?? undefined,
        metrics: d.metrics ? safeJson(d.metrics) : undefined,
        tags: safeJson(d.tags, []),
        authorPhoto: d.author_photo ?? undefined,
    };
}

function mapPlanToDb(data: any): any {
    const mapped: any = {};
    const fieldMap: Record<string, string> = {
        authorId: 'author_id', authorName: 'author_name', coverUrl: 'cover_url',
        isPublic: 'is_public', privacyType: 'privacy_type', isRanked: 'is_ranked',
        churchId: 'church_id', groupId: 'group_id', createdAt: 'created_at', updatedAt: 'updated_at',
        subscribersCount: 'subscribers_count', planningFrequency: 'planning_frequency',
        hasEvaluation: 'has_evaluation', evaluationId: 'evaluation_id',
        teamScores: 'team_scores', startDate: 'start_date', endDate: 'end_date',
    };
    for (const [ts, sql] of Object.entries(fieldMap)) {
        if (data[ts] !== undefined) mapped[sql] = data[ts];
    }
    ['title', 'description', 'category', 'status', 'tags', 'metrics'].forEach(f => {
        if (data[f] !== undefined) mapped[f] = data[f];
    });
    if (data.weeks !== undefined) mapped.weeks = JSON.stringify(data.weeks);
    if (data.teams !== undefined) mapped.teams = JSON.stringify(data.teams);
    if (data.teamScores !== undefined) mapped.team_scores = JSON.stringify(data.teamScores);
    return clean(mapped);
}

function mapParticipant(d: any): PlanParticipant {
    return {
        uid: d.uid,
        displayName: d.display_name,
        photoURL: d.photo_url ?? undefined,
        username: d.username,
        points: d.points ?? 0,
        completedSteps: safeJson(d.completed_steps, []),
        joinedAt: d.joined_at,
        lastActivityAt: d.last_activity_at,
        team: d.team ?? undefined,
        status: d.status ?? 'active',
    };
}

function mapPost(d: any): Post {
    return {
        id: d.id,
        userId: d.user_id,
        userDisplayName: d.user_display_name ?? '',
        userUsername: d.user_username ?? '',
        userPhotoURL: d.user_photo_url ?? undefined,
        type: d.type ?? 'reflection',
        content: d.content ?? '',
        likesCount: d.likes_count ?? 0,
        commentsCount: d.comments_count ?? 0,
        shares: d.shares ?? 0,
        likes: d.likes_count ?? 0,
        comments: d.comments_count ?? 0,
        saved: false,
        likedBy: safeJson(d.liked_by, []),
        createdAt: d.created_at,
        time: d.created_at,
        location: '',
        imageUrl: d.image_url ?? undefined,
        destination: d.destination ?? 'global',
        churchId: d.church_id ?? undefined,
        cellId: d.cell_id ?? undefined,
    };
}

function mapPrayerRequest(d: any): PrayerRequest {
    return {
        id: d.id,
        userId: d.user_id,
        userName: d.user_name ?? '',
        userPhotoURL: d.user_photo_url ?? undefined,
        content: d.content,
        createdAt: d.created_at,
        intercessorsCount: d.intercessors_count ?? 0,
        intercessors: safeJson(d.intercessors, []),
        targetType: d.target_type,
        targetId: d.target_id,
        churchId: d.church_id ?? '',
        cellName: d.cell_name ?? undefined,
    };
}

function mapChurch(d: any): Church {
    return {
        id: d.id,
        name: d.name,
        acronym: d.acronym ?? '',
        slug: d.slug,
        denomination: d.denomination ?? '',
        location: { city: d.location_city ?? '', state: d.location_state ?? '', address: d.location_address ?? '' },
        stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
        teams: [],
        teamScores: {},
        admins: [],
        logoUrl: d.logo_url ?? undefined,
        pastorName: d.pastor_name ?? undefined,
    };
}

function mapCell(d: any): ChurchGroup {
    return {
        id: d.id,
        churchId: d.church_id,
        parentGroupId: d.parent_group_id ?? undefined,
        name: d.name,
        slug: d.slug ?? d.name,
        stats: { memberCount: 0, totalMana: 0 },
        leaderName: d.leader_name ?? undefined,
        leaderUid: d.leader_id ?? undefined,
        createdBy: d.created_by ?? '',
        createdAt: d.created_at,
    };
}

function mapTrack(d: any): Track {
    return {
        id: d.id,
        title: d.title,
        description: d.description,
        authorId: d.author_id,
        generatedBy: d.generated_by ?? 'pastor',
        tags: safeJson(d.tags, []),
        items: safeJson(d.steps, []),
        isPublic: d.scope === 'global' || d.scope === 'church',
        createdAt: d.created_at,
        updatedAt: d.updated_at ?? d.created_at,
    };
}

function mapStudy(d: any): SavedStudy {
    return {
        id: d.id,
        authorId: d.user_id ?? d.author_id ?? '',
        title: d.title ?? '',
        description: d.description ?? undefined,
        coverImage: d.cover_image || safeJson(d.meta)?.coverImage || undefined,
        status: d.status ?? 'draft',
        createdAt: d.created_at,
        updatedAt: d.updated_at ?? d.created_at,
        isPublic: d.is_public ?? false,
        sourceText: d.source_text ?? '',
        analysis: d.analysis ?? '',
        source: d.source ?? 'geral',
        category: d.category ?? undefined,
        metrics: d.metrics ? safeJson(d.metrics) : undefined,
        tags: safeJson(d.tags, []),
        isFollowed: d.is_followed ?? false,
        refDayId: d.ref_day_id ?? undefined,
        planId: d.plan_id ?? undefined,
    };
}

function mapPlanComment(d: any): PlanComment {
    return {
        id: d.id,
        planId: d.plan_id,
        dayId: d.day_id,
        userId: d.user_id,
        userName: d.user_name,
        userPhoto: d.user_photo ?? undefined,
        content: d.content,
        createdAt: d.created_at,
    };
}
