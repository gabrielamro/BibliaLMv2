
/**
 * ============================================================
 * services/supabase.ts — Camada de dados ÚNICA (Supabase)
 * Substitui services/firebase.ts completamente.
 * Mantém os mesmos nomes de função para compatibilidade.
 * ============================================================
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    UserProfile, Church, ChurchRoleRequest, AdminChurchManager, ChurchGroup, Post, PrayerRequest, SavedStudy,
    CustomPlan, PlanTeam, CustomQuiz, GuidedPrayer, StudyEvaluation,
    StudyModule, Banner, SystemSettings, AppNotification, SupportTicket,
    ReportTicket, SystemLog, AIUsageStats, HomeConfig, LandingPageConfig, Track,
    SacredArtImage,
    PlanParticipant, PlanComment, PostComment, GroupAccessInvite, GroupAccessInviteSource,
    ManaEvent, ChurchGamificationSnapshot, ActionType
} from '../types';
import { generateSlug } from '../utils/textUtils';
import { mergeChurchSearchResults, type ChurchSearchResult } from '../utils/churchSearch';
import { formatSupabaseError, getMissingColumnNameFromError, isMissingColumnError } from '../utils/supabaseErrors';
import { buildPostInsertPayloads, dropPostInsertColumn } from '../utils/kingdomPostPayload';
import { shouldRetryFeedWithoutDestination } from '../utils/kingdomFeedFallback';
import { buildKingdomPersonalizedFeed, normalizePostVisibility } from '../utils/kingdomFeedRules';
import { parseStudyShareContent } from '../utils/studySharePost';
import { decodeMoodContent } from '../utils/socialPostMood';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';
const supabaseProjectRef = (() => {
    try {
        return new URL(supabaseUrl).hostname.split('.')[0] || 'local';
    } catch {
        return 'local';
    }
})();
const supabaseAuthStorageKey = `sb-${supabaseProjectRef}-auth-token`;
const runWithoutBrowserLock = async <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();
const supabaseFetchTimeoutMs = 25000;
const supabaseReadAttempts = 2;

const getRequestMethod = (input: RequestInfo | URL, init?: RequestInit) =>
    String(init?.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase();

const runSupabaseFetchAttempt = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const externalSignal = init?.signal;
    let didTimeout = false;
    const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
    const timeout = setTimeout(() => {
        didTimeout = true;
        controller.abort(new DOMException(`A consulta excedeu ${supabaseFetchTimeoutMs / 1000} segundos.`, 'TimeoutError'));
    }, supabaseFetchTimeoutMs);

    if (externalSignal) {
        if (externalSignal.aborted) abortFromExternalSignal();
        else externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true });
    }

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
        if (didTimeout) {
            throw Object.assign(new Error('A conexão com o Supabase demorou mais que o esperado.'), {
                name: 'SupabaseTimeoutError',
                cause: error,
            });
        }
        throw error;
    } finally {
        clearTimeout(timeout);
        externalSignal?.removeEventListener('abort', abortFromExternalSignal);
    }
};

const fetchWithTimeout: typeof fetch = async (input, init) => {
    const method = getRequestMethod(input, init);
    const maxAttempts = method === 'GET' || method === 'HEAD' ? supabaseReadAttempts : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await runSupabaseFetchAttempt(input, init);
        } catch (error) {
            const canRetry = attempt < maxAttempts && (error as Error)?.name === 'SupabaseTimeoutError' && !init?.signal?.aborted;
            if (!canRetry) throw error;
        }
    }

    throw new Error('Não foi possível concluir a requisição ao Supabase.');
};
const clearStaleAuthSessionInDev = () => {
    if (process.env.NODE_ENV !== 'development' || !isBrowser()) return;
    try {
        window.localStorage.removeItem(supabaseAuthStorageKey);
    } catch { /* ignore storage restrictions */ }
};

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Supabase credentials ausentes. O cliente usará URLs temporárias para evitar travamento da build. Verifique o .env.local na etapa de runtime.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storageKey: supabaseAuthStorageKey,
        lock: runWithoutBrowserLock,
    },
    global: {
        fetch: fetchWithTimeout,
    },
});

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

const normalizeStandaloneStudyType = (type: any) => {
    const value = String(type || '').toLowerCase();
    return ['article', 'devotional', 'series', 'study'].includes(value) ? value : 'article';
};

const isMissingBibleVersionColumnError = (error: any) =>
    error?.code === 'PGRST204' ||
    String(error?.message || error?.details || '').toLowerCase().includes('bible_version');

const isMissingProfileTypeColumnError = (error: any) =>
    isMissingColumnError(error, 'profile_type') ||
    getMissingColumnName(error) === 'profile_type' ||
    String(error?.message || error?.details || '').toLowerCase().includes('profile_type');

const isBrowser = () => typeof window !== 'undefined';

const toError = (message: string, error: any) =>
    error instanceof Error ? error : new Error(`${message}. ${formatSupabaseError(error)}`);

const getMissingColumnName = getMissingColumnNameFromError;
const isMissingTableError = (error: any, tableName: string) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    return (
        code === 'PGRST116' ||
        code === 'PGRST205' ||
        message.includes('not found') ||
        message.includes(`table '${tableName.toLowerCase()}'`) ||
        message.includes(tableName.toLowerCase())
    );
};

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeAuthEmail = (email: string) => {
    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
        throw Object.assign(new Error('Formato de e-mail inválido.'), { code: 'auth/invalid-email' });
    }
    return normalizedEmail;
};

export const loginWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeAuthEmail(email), password });
    if (error) throw error;
    return data;
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
    const normalizedEmail = normalizeAuthEmail(email);
    const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
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
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeAuthEmail(email), {
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
    let initialSessionResolved = false;
    const resolveInitialSession = (user: any | null) => {
        if (initialSessionResolved) return;
        initialSessionResolved = true;
        callback(user);
    };
    const initialSessionTimeout = window.setTimeout(() => {
        console.warn('[auth] Timeout ao recuperar sessao atual. Continuando como visitante.');
        clearStaleAuthSessionInDev();
        resolveInitialSession(null);
    }, 5000);

    supabase.auth.getSession()
        .then(({ data }) => {
            window.clearTimeout(initialSessionTimeout);
            resolveInitialSession(addUidAlias(data.session?.user ?? null));
        })
        .catch((error) => {
            window.clearTimeout(initialSessionTimeout);
            console.warn('[auth] Nao foi possivel recuperar a sessao atual. Continuando como visitante.', error);
            clearStaleAuthSessionInDev();
            resolveInitialSession(null);
        });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!initialSessionResolved) {
            window.clearTimeout(initialSessionTimeout);
            initialSessionResolved = true;
        }
        callback(addUidAlias(session?.user ?? null));
    });

    return () => {
        window.clearTimeout(initialSessionTimeout);
        subscription.unsubscribe();
    };
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
            profile_type: data.profileType ?? (data.subscriptionTier === 'pastor' ? 'pastor' : 'user'),
            subscription_status: data.subscriptionStatus ?? 'active',
            subscription_expires_at: data.subscriptionExpiresAt ?? null,
            theme: data.theme ?? 'light',
            bible_version: data.bibleVersion ?? 'ara',
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
        if (error) {
            if (isMissingProfileTypeColumnError(error)) {
                const { profile_type: _profileType, ...fallbackMapped } = mapped;
                const { error: fallbackError } = await supabase.from('profiles').upsert(fallbackMapped);
                if (fallbackError) throw new Error(`Erro ao salvar perfil. ${formatSupabaseError(fallbackError)}`);
                return;
            }
            if (isMissingBibleVersionColumnError(error)) {
                const { bible_version: _bibleVersion, ...fallbackMapped } = mapped;
                const { error: fallbackError } = await supabase.from('profiles').upsert(fallbackMapped);
                if (fallbackError) throw new Error(`Erro ao salvar perfil. ${formatSupabaseError(fallbackError)}`);
                return;
            }
            throw new Error(`Erro ao salvar perfil. ${formatSupabaseError(error)}`);
        }
    },

    updateUserProfile: async (uid: string, data: any): Promise<UserProfile | null> => {
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
            profileType: 'profile_type',
            subscriptionStatus: 'subscription_status',
            subscriptionExpiresAt: 'subscription_expires_at',
            theme: 'theme',
            bibleVersion: 'bible_version',
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
            const { data: updatedProfile, error } = await supabase
                .from('profiles')
                .update(mapped)
                .eq('id', uid)
                .select('*')
                .maybeSingle();
            if (error) {
                if (isMissingProfileTypeColumnError(error) && mapped.profile_type !== undefined) {
                    const { profile_type: _profileType, ...fallbackMapped } = mapped;
                    if (Object.keys(fallbackMapped).length === 0) return null;
                    const { data: fallbackUpdatedProfile, error: fallbackError } = await supabase
                        .from('profiles')
                        .update(fallbackMapped)
                        .eq('id', uid)
                        .select('*')
                        .maybeSingle();
                    if (fallbackError) throw new Error(`Erro ao atualizar perfil. ${formatSupabaseError(fallbackError)}`);
                    return fallbackUpdatedProfile ? mapProfileToUserProfile(fallbackUpdatedProfile) : null;
                }
                if (isMissingBibleVersionColumnError(error) && mapped.bible_version !== undefined) {
                    const { bible_version: _bibleVersion, ...fallbackMapped } = mapped;
                    if (Object.keys(fallbackMapped).length === 0) return null;
                    const { data: fallbackUpdatedProfile, error: fallbackError } = await supabase
                        .from('profiles')
                        .update(fallbackMapped)
                        .eq('id', uid)
                        .select('*')
                        .maybeSingle();
                    if (fallbackError) throw new Error(`Erro ao atualizar perfil. ${formatSupabaseError(fallbackError)}`);
                    return fallbackUpdatedProfile ? mapProfileToUserProfile(fallbackUpdatedProfile) : null;
                }
                throw new Error(`Erro ao atualizar perfil. ${formatSupabaseError(error)}`);
            }
            if (updatedProfile) return mapProfileToUserProfile(updatedProfile);

            const fallbackInsert = {
                id: uid,
                email: mapped.email ?? data.email ?? null,
                display_name: mapped.display_name ?? data.displayName ?? data.username ?? 'Membro',
                photo_url: mapped.photo_url ?? data.photoURL ?? null,
                username: mapped.username ?? data.username ?? `user_${uid.slice(0, 8)}`,
                city: mapped.city ?? data.city ?? null,
                state: mapped.state ?? data.state ?? null,
                phone_number: mapped.phone_number ?? data.phoneNumber ?? null,
                cpf: mapped.cpf ?? data.cpf ?? null,
                instagram: mapped.instagram ?? data.instagram ?? null,
                facebook: mapped.facebook ?? data.facebook ?? null,
                slogan: mapped.slogan ?? data.slogan ?? null,
                is_profile_public: mapped.is_profile_public ?? data.isProfilePublic ?? true,
                credits: mapped.credits ?? data.credits ?? 0,
                lifetime_xp: mapped.lifetime_xp ?? data.lifetimeXp ?? 0,
                badges: mapped.badges ?? data.badges ?? [],
                subscription_tier: mapped.subscription_tier ?? data.subscriptionTier ?? 'free',
                profile_type: mapped.profile_type ?? data.profileType ?? (data.subscriptionTier === 'pastor' ? 'pastor' : 'user'),
                subscription_status: mapped.subscription_status ?? data.subscriptionStatus ?? 'active',
                subscription_expires_at: mapped.subscription_expires_at ?? data.subscriptionExpiresAt ?? null,
                theme: mapped.theme ?? data.theme ?? 'light',
                bible_version: mapped.bible_version ?? data.bibleVersion ?? 'ara',
                activity_log: mapped.activity_log ?? data.activityLog ?? [],
                stats: mapped.stats ?? data.stats ?? {},
                last_reading_position: mapped.last_reading_position ?? data.lastReadingPosition ?? {},
                usage_today: mapped.usage_today ?? data.usageToday ?? {},
                reading_plan: mapped.reading_plan ?? data.readingPlan ?? {},
                progress: mapped.progress ?? data.progress ?? {},
                enrolled_plans: mapped.enrolled_plans ?? data.enrolledPlans ?? [],
                church_data: mapped.church_data ?? data.churchData ?? {},
                followers_count: mapped.followers_count ?? data.followersCount ?? 0,
                following_count: mapped.following_count ?? data.followingCount ?? 0,
                bio: mapped.bio ?? data.bio ?? null,
                created_at: now(),
            };

            const { data: insertedProfile, error: insertError } = await supabase
                .from('profiles')
                .upsert(fallbackInsert, { onConflict: 'id' })
                .select('*')
                .maybeSingle();

            if (insertError) {
                if (isMissingProfileTypeColumnError(insertError)) {
                    const { profile_type: _profileType, ...fallbackWithoutProfileType } = fallbackInsert;
                    const { data: fallbackProfile, error: fallbackError } = await supabase
                        .from('profiles')
                        .upsert(fallbackWithoutProfileType, { onConflict: 'id' })
                        .select('*')
                        .maybeSingle();
                    if (fallbackError) throw new Error(`Erro ao recriar perfil. ${formatSupabaseError(fallbackError)}`);
                    return fallbackProfile ? mapProfileToUserProfile(fallbackProfile) : null;
                }
                if (isMissingBibleVersionColumnError(insertError)) {
                    const { bible_version: _bibleVersion, ...fallbackWithoutBibleVersion } = fallbackInsert;
                    const { data: fallbackProfile, error: fallbackError } = await supabase
                        .from('profiles')
                        .upsert(fallbackWithoutBibleVersion, { onConflict: 'id' })
                        .select('*')
                        .maybeSingle();
                    if (fallbackError) throw new Error(`Erro ao recriar perfil. ${formatSupabaseError(fallbackError)}`);
                    return fallbackProfile ? mapProfileToUserProfile(fallbackProfile) : null;
                }
                throw new Error(`Erro ao recriar perfil. ${formatSupabaseError(insertError)}`);
            }

            return insertedProfile ? mapProfileToUserProfile(insertedProfile) : null;
        }
        return null;
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
        const term = username.replace('@', '').trim();
        if (!term) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
            .limit(10);
        if (error) throw toError('Erro ao buscar usuarios', error);
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
        const query = supabase.from('churches').select('*').order('created_at', { ascending: false });
        const { data } = term ? await query.ilike('name', `%${term}%`) : await query.limit(50);
        return (data ?? []).map(mapChurch);
    },
    searchChurches: async (
        term: string,
        city: string,
        state: string,
        options: { includeExternal?: boolean } = {}
    ): Promise<Church[]> => {
        const page = await dbService.searchChurchesPage(term, city, state, { includeExternal: options.includeExternal });
        return page.results;
    },
    searchChurchesPage: async (
        term: string,
        city: string,
        state: string,
        options: { includeExternal?: boolean; pageToken?: string | null; offset?: number; limit?: number } = {}
    ): Promise<{ results: Church[]; nextPageToken: string | null; nextOffset: number | null; provider?: string }> => {
        const limit = options.limit ?? 10;
        const offset = options.offset ?? 0;
        let query = supabase.from('churches').select('*');
        if (state) query = query.eq('location_state', state);
        if (city) query = query.ilike('location_city', `%${city}%`);
        if (term) query = query.ilike('name', `%${term}%`);
        query = query.range(offset, offset + limit - 1);

        const { data } = await query;
        const localResults = (data ?? []).map(mapChurch) as ChurchSearchResult[];

        if (!options.includeExternal || !isBrowser()) {
            return {
                results: localResults,
                nextPageToken: null,
                nextOffset: localResults.length === limit ? offset + limit : null
            };
        }

        try {
            const params = new URLSearchParams({ term: term || '', city: city || '', state: state || '' });
            if (options.pageToken) params.set('pageToken', options.pageToken);
            const response = await fetch(`/api/churches/search?${params.toString()}`);
            if (!response.ok) {
                return {
                    results: localResults,
                    nextPageToken: null,
                    nextOffset: localResults.length === limit ? offset + limit : null
                };
            }
            const payload = await response.json();
            const externalResults = Array.isArray(payload.results) ? payload.results : [];
            const merged = mergeChurchSearchResults(options.pageToken ? [] : localResults, externalResults);
            return {
                results: merged,
                nextPageToken: payload.nextPageToken || null,
                nextOffset: !options.pageToken && localResults.length === limit ? offset + limit : null,
                provider: payload.provider
            };
        } catch (error) {
            console.warn('Busca externa de igrejas indisponivel:', error);
            return {
                results: localResults,
                nextPageToken: null,
                nextOffset: localResults.length === limit ? offset + limit : null
            };
        }
    },
    createChurch: async (data: any): Promise<string> => {
        const minimalPayload = {
            name: data.name,
            slug: data.slug,
            created_at: now()
        };
        const legacyPayload = {
            ...minimalPayload,
            acronym: data.acronym ?? '',
            denomination: data.denomination ?? '',
            location_city: data.location?.city,
            location_state: data.location?.state,
            location_address: data.location?.address,
            logo_url: data.logoUrl ?? null,
            pastor_name: data.pastorName ?? null,
        };
        const fullPayload = {
            ...legacyPayload,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            external_provider: data.externalProvider ?? null,
            external_place_id: data.externalPlaceId ?? null,
            source_attribution: data.sourceAttribution ?? null,
            verification_status: data.verificationStatus ?? 'unclaimed',
            admins: data.admins ?? [],
            teams: data.teams ?? [],
            team_scores: data.teamScores ?? {},
            created_by: data.createdBy ?? null,
        };

        let { data: res, error } = await supabase.from('churches').insert(fullPayload).select().single();
        const missingSchema = error?.code === 'PGRST204' || /column|schema cache|external_provider|verification_status|created_by/i.test(formatSupabaseError(error));
        if (error && missingSchema) {
            const retry = await supabase.from('churches').insert(legacyPayload).select().single();
            res = retry.data;
            error = retry.error;
        }
        if (error && (error?.code === 'PGRST204' || /column|schema cache/i.test(formatSupabaseError(error)))) {
            const retry = await supabase.from('churches').insert(minimalPayload).select().single();
            res = retry.data;
            error = retry.error;
        }
        if (error) throw new Error(`Erro ao criar igreja. ${formatSupabaseError(error)}`);
        return res.id;
    },
    resolveChurchForMembership: async (uid: string, church: ChurchSearchResult): Promise<Church> => {
        if (!uid) throw new Error('Usuario autenticado sem id valido para vincular igreja.');
        if (!church.isExternal) return church;

        if (church.externalProvider && church.externalPlaceId) {
            const { data: existing, error } = await supabase
                .from('churches')
                .select('*')
                .eq('external_provider', church.externalProvider)
                .eq('external_place_id', church.externalPlaceId)
                .maybeSingle();
            if (error && !(error?.code === 'PGRST204' || /column|schema cache/i.test(formatSupabaseError(error)))) {
                throw toError('Erro ao verificar igreja existente', error);
            }
            if (existing) return mapChurch(existing);
        }

        const baseSlug = church.slug || generateSlug(`${church.name} ${church.location?.city || ''}`);
        let slug = baseSlug;
        let suffix = 2;
        while (true) {
            const { data: sameSlug, error } = await supabase.from('churches').select('id').eq('slug', slug).maybeSingle();
            if (error) throw toError('Erro ao verificar slug da igreja', error);
            if (!sameSlug) break;
            slug = `${baseSlug}-${suffix++}`;
        }

        const id = await dbService.createChurch({
            ...church,
            slug,
            verificationStatus: 'unclaimed',
            admins: [],
            createdBy: uid,
        });
        return { ...church, id, slug, isExternal: false, verificationStatus: 'unclaimed' };
    },
    joinChurch: async (
        uid: string,
        church: ChurchSearchResult,
        group?: ChurchGroup | null,
        teamColor?: string | null
    ): Promise<Church> => {
        if (!uid) throw new Error('Usuario autenticado sem id valido para vincular igreja.');
        const resolvedChurch = await dbService.resolveChurchForMembership(uid, church);
        let { error } = await supabase.from('memberships').upsert({
            user_id: uid,
            church_id: resolvedChurch.id,
            cell_id: group?.id ?? null,
            role: 'member',
            joined_at: now()
        });
        if (error && (error?.code === 'PGRST204' || /column|schema cache/i.test(formatSupabaseError(error)))) {
            const retry = await supabase.from('memberships').upsert({
                user_id: uid,
                church_id: resolvedChurch.id,
            });
            error = retry.error;
        }
        if (error) throw new Error(`Erro ao vincular igreja. ${formatSupabaseError(error)}`);
        await dbService.updateUserProfile(uid, {
            churchData: {
                churchId: resolvedChurch.id,
                churchName: resolvedChurch.name,
                churchSlug: resolvedChurch.slug,
                groupId: group?.id,
                groupName: group?.name,
                groupSlug: group?.slug,
                teamColor: teamColor ?? null,
                isAnonymous: false
            }
        });
        return resolvedChurch;
    },
    leaveChurch: async (uid: string, churchId: string): Promise<void> => {
        if (!uid) throw new Error('Usuario autenticado sem id valido para desvincular igreja.');
        const { error } = await supabase
            .from('memberships')
            .delete()
            .eq('user_id', uid)
            .eq('church_id', churchId);
        if (error) throw new Error(`Erro ao desvincular igreja. ${formatSupabaseError(error)}`);
        await dbService.updateUserProfile(uid, {
            churchData: null
        });
    },
    getChurchRoleRequest: async (uid: string, churchId: string, role: 'pastor' | 'admin' = 'pastor') => {
        const { data, error } = await supabase
            .from('church_role_requests')
            .select('status, requested_at')
            .eq('church_id', churchId)
            .eq('user_id', uid)
            .eq('requested_role', role)
            .maybeSingle();
        if (error) throw error;
        return data;
    },
    getApprovedChurchResponsibility: async (uid: string): Promise<Church | null> => {
        const { data: request, error } = await supabase
            .from('church_role_requests')
            .select('church_id, reviewed_at, requested_at')
            .eq('user_id', uid)
            .eq('status', 'approved')
            .order('reviewed_at', { ascending: false, nullsFirst: false })
            .order('requested_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw toError('Erro ao carregar aprovacao de gestao da igreja', error);
        if (!request?.church_id) return null;
        return dbService.getChurchById(request.church_id);
    },
    requestChurchResponsibility: async (uid: string, churchId: string, role: 'pastor' | 'admin' = 'pastor') => {
        const { error } = await supabase.from('church_role_requests').upsert(
            {
                church_id: churchId,
                user_id: uid,
                requested_role: role,
                status: 'pending',
                requested_at: now(),
            },
            { onConflict: 'church_id,user_id,requested_role' }
        );
        if (error) throw error;
    },
    getChurchRoleRequestsForAdmin: async (filter: 'pending' | 'all' = 'pending'): Promise<ChurchRoleRequest[]> => {
        let query = supabase
            .from('church_role_requests')
            .select('*')
            .order('requested_at', { ascending: false });
        if (filter === 'pending') query = query.eq('status', 'pending');
        const { data: requests, error } = await query;
        if (error) throw toError('Erro ao carregar solicitacoes de gestao de igreja', error);
        if (!requests?.length) return [];

        const churchIds = [...new Set(requests.map((row) => row.church_id))];
        const userIds = [...new Set(requests.map((row) => row.user_id))];
        const [{ data: churches }, { data: profiles }] = await Promise.all([
            supabase.from('churches').select('id, name, slug, location_city, location_state').in('id', churchIds),
            supabase.from('profiles').select('id, display_name, username, photo_url, subscription_tier').in('id', userIds),
        ]);

        const churchMap = new Map((churches ?? []).map((church) => [church.id, church]));
        const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

        return requests.map((row) => {
            const church = churchMap.get(row.church_id);
            const profile = profileMap.get(row.user_id);
            return {
                id: row.id,
                churchId: row.church_id,
                userId: row.user_id,
                requestedRole: row.requested_role,
                status: row.status,
                requestedAt: row.requested_at,
                reviewedAt: row.reviewed_at ?? null,
                churchName: church?.name ?? 'Igreja',
                churchSlug: church?.slug ?? undefined,
                churchLocation: [church?.location_city, church?.location_state].filter(Boolean).join(', ') || undefined,
                userDisplayName: profile?.display_name ?? 'Usuario',
                userUsername: profile?.username ?? undefined,
                userPhotoURL: profile?.photo_url ?? undefined,
                userTier: profile?.subscription_tier ?? undefined,
            } as ChurchRoleRequest;
        });
    },
    isUserChurchManager: async (uid: string, churchId: string): Promise<boolean> => {
        if (!uid || !churchId) return false;

        try {
            const { data: operationalRole, error: roleError } = await supabase
                .from('church_member_roles')
                .select('id, role')
                .eq('church_id', churchId)
                .eq('user_id', uid)
                .in('role', ['church_manager', 'pastor'])
                .eq('status', 'active')
                .limit(1);

            if (roleError && !(roleError?.code === 'PGRST205' || /church_member_roles|schema cache/i.test(formatSupabaseError(roleError)))) {
                throw roleError;
            }
            if (operationalRole?.length) return true;

            const { data: approvedRequest, error: requestError } = await supabase
                .from('church_role_requests')
                .select('id, requested_role')
                .eq('church_id', churchId)
                .eq('user_id', uid)
                .in('requested_role', ['admin', 'manager', 'pastor'])
                .eq('status', 'approved')
                .limit(1);

            if (requestError && !(requestError?.code === 'PGRST205' || /church_role_requests|schema cache/i.test(formatSupabaseError(requestError)))) {
                throw requestError;
            }
            if (approvedRequest?.length) return true;

            const { data: church, error: churchError } = await supabase
                .from('churches')
                .select('admins')
                .eq('id', churchId)
                .maybeSingle();

            if (churchError) throw churchError;
            return Array.isArray(church?.admins) && church.admins.includes(uid);
        } catch (error) {
            console.warn('Nao foi possivel verificar gestor da igreja.', error);
            return false;
        }
    },
    getChurchManagersForAdmin: async (): Promise<AdminChurchManager[]> => {
        const [{ data: approvedRequests, error: requestsError }, { data: operationalRoles, error: rolesError }, { data: churches, error: churchesError }] = await Promise.all([
            supabase
                .from('church_role_requests')
                .select('id, church_id, user_id, requested_role, status, requested_at, reviewed_at')
                .eq('status', 'approved')
                .eq('requested_role', 'admin')
                .order('reviewed_at', { ascending: false, nullsFirst: false }),
            supabase
                .from('church_member_roles')
                .select('id, church_id, user_id, role, status, granted_at')
                .eq('role', 'church_manager')
                .eq('status', 'active')
                .order('granted_at', { ascending: false }),
            supabase
                .from('churches')
                .select('id, name, slug, location_city, location_state, admins'),
        ]);
        if (requestsError) throw toError('Erro ao carregar gestores aprovados', requestsError);
        if (rolesError && !(rolesError?.code === 'PGRST205' || /church_member_roles|schema cache/i.test(formatSupabaseError(rolesError)))) {
            throw toError('Erro ao carregar roles operacionais de gestores', rolesError);
        }
        if (churchesError) throw toError('Erro ao carregar igrejas dos gestores', churchesError);

        const rows: Array<{
            id: string;
            church_id: string;
            user_id: string;
            role: 'church_manager' | 'admin';
            source: 'operational_role' | 'approved_request' | 'legacy_admin';
            status: 'active' | 'approved';
            granted_at?: string | null;
        }> = [];

        (operationalRoles ?? []).forEach((row: any) => rows.push({
            id: row.id,
            church_id: row.church_id,
            user_id: row.user_id,
            role: 'church_manager',
            source: 'operational_role',
            status: 'active',
            granted_at: row.granted_at,
        }));

        (approvedRequests ?? []).forEach((row: any) => rows.push({
            id: row.id,
            church_id: row.church_id,
            user_id: row.user_id,
            role: 'admin',
            source: 'approved_request',
            status: 'approved',
            granted_at: row.reviewed_at ?? row.requested_at,
        }));

        (churches ?? []).forEach((church: any) => {
            const admins = Array.isArray(church.admins) ? church.admins : [];
            admins.forEach((userId: string) => rows.push({
                id: `${church.id}:${userId}:legacy_admin`,
                church_id: church.id,
                user_id: userId,
                role: 'admin',
                source: 'legacy_admin',
                status: 'approved',
                granted_at: null,
            }));
        });

        const deduped = Array.from(new Map(rows.map((row) => [`${row.church_id}:${row.user_id}:${row.role}`, row])).values());
        if (!deduped.length) return [];

        const userIds = [...new Set(deduped.map((row) => row.user_id))];
        const churchIds = [...new Set(deduped.map((row) => row.church_id))];
        const [{ data: profiles }, { data: managerChurches }] = await Promise.all([
            supabase.from('profiles').select('id, display_name, username, photo_url, subscription_tier').in('id', userIds),
            supabase.from('churches').select('id, name, slug, location_city, location_state').in('id', churchIds),
        ]);
        const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
        const churchMap = new Map((managerChurches ?? churches ?? []).map((church: any) => [church.id, church]));

        return deduped.map((row) => {
            const profile: any = profileMap.get(row.user_id);
            const church: any = churchMap.get(row.church_id);
            return {
                id: row.id,
                userId: row.user_id,
                userDisplayName: profile?.display_name ?? 'Usuario',
                userUsername: profile?.username ?? undefined,
                userPhotoURL: profile?.photo_url ?? null,
                userTier: profile?.subscription_tier ?? undefined,
                churchId: row.church_id,
                churchName: church?.name ?? 'Igreja',
                churchSlug: church?.slug ?? undefined,
                churchLocation: [church?.location_city, church?.location_state].filter(Boolean).join(', ') || undefined,
                role: row.role,
                source: row.source,
                status: row.status,
                grantedAt: row.granted_at ?? null,
            };
        }).sort((a, b) => (b.grantedAt ?? '').localeCompare(a.grantedAt ?? ''));
    },
    reviewChurchRoleRequest: async (
        requestId: string,
        action: 'approved' | 'rejected',
        reviewerId: string
    ): Promise<void> => {
        const { data: request, error } = await supabase
            .from('church_role_requests')
            .select('*')
            .eq('id', requestId)
            .single();
        if (error || !request) throw toError('Solicitacao nao encontrada', error);

        const { error: updateError } = await supabase
            .from('church_role_requests')
            .update({
                status: action,
                reviewed_by: reviewerId,
                reviewed_at: now(),
            })
            .eq('id', requestId);
        if (updateError) throw toError('Erro ao atualizar solicitacao', updateError);

        if (action !== 'approved') return;

        const { data: church, error: churchError } = await supabase
            .from('churches')
            .select('id, name, slug, admins, verification_status')
            .eq('id', request.church_id)
            .single();
        if (churchError) throw toError('Erro ao carregar igreja da solicitacao', churchError);

        const currentAdmins = Array.isArray(church?.admins) ? church.admins : [];
        const nextAdmins = currentAdmins.includes(request.user_id)
            ? currentAdmins
            : [...currentAdmins, request.user_id];

        const { error: churchUpdateError } = await supabase
            .from('churches')
            .update({
                admins: nextAdmins,
                verification_status: church?.verification_status === 'unclaimed' ? 'claimed' : church?.verification_status,
                updated_at: now(),
            })
            .eq('id', request.church_id);
        if (churchUpdateError) throw toError('Erro ao promover responsavel na igreja', churchUpdateError);

        const { error: membershipError } = await supabase
            .from('memberships')
            .upsert({
                user_id: request.user_id,
                church_id: request.church_id,
                role: request.requested_role,
                joined_at: now(),
            });
        if (membershipError && !(membershipError?.code === 'PGRST204' || /column|schema cache/i.test(formatSupabaseError(membershipError)))) {
            throw toError('Erro ao atualizar vinculo do responsavel', membershipError);
        }

        await dbService.updateUserProfile(request.user_id, {
            churchData: {
                churchId: church.id,
                churchName: church.name,
                churchSlug: church.slug,
                isAnonymous: false,
            }
        });
    },
    getChurchBySlug: async (slug: string): Promise<Church | null> => {
        const { data, error } = await supabase.from('churches').select('*').eq('slug', slug).single();
        if (error) {
            if (error?.code === 'PGRST116') return null;
            throw toError('Erro ao carregar igreja', error);
        }
        return data ? mapChurch(data) : null;
    },
    getChurchById: async (id: string): Promise<Church | null> => {
        const { data, error } = await supabase.from('churches').select('*').eq('id', id).single();
        if (error) {
            if (error?.code === 'PGRST116') return null;
            throw toError('Erro ao carregar igreja', error);
        }
        return data ? mapChurch(data) : null;
    },
    getChurchRootGroups: async (churchId: string): Promise<ChurchGroup[]> => {
        const { data, error } = await supabase.from('cells').select('*').eq('church_id', churchId);
        if (error) throw toError('Erro ao carregar grupos da igreja', error);
        return (data ?? []).map(mapCell);
    },
    getUserGroups: async (uid: string, churchId?: string): Promise<ChurchGroup[]> => {
        let query = supabase
            .from('memberships')
            .select('cells(*)')
            .eq('user_id', uid)
            .not('cell_id', 'is', null);
        if (churchId) query = query.eq('church_id', churchId);

        const { data, error } = await query;
        if (error) throw toError('Erro ao carregar grupos do usuario', error);
        return (data ?? [])
            .map((row: any) => row.cells ? mapCell(row.cells) : null)
            .filter(Boolean) as ChurchGroup[];
    },
    createCell: async (data: any): Promise<string> => {
        const basePayload: Record<string, any> = {
            church_id: data.churchId,
            name: data.name,
            slug: data.slug ?? generateSlug(data.name),
            created_at: now()
        };
        const { data: existingGroup, error: existingError } = await supabase
            .from('cells')
            .select('id')
            .eq('slug', basePayload.slug)
            .maybeSingle();
        if (existingError && !isMissingColumnError(existingError, 'slug')) throw toError('Erro ao verificar grupo existente', existingError);
        if (existingGroup?.id) throw new Error('Ja existe um grupo com este nome nesta igreja.');

        const fullPayload: Record<string, any> = {
            ...basePayload,
            parent_group_id: data.parentGroupId ?? null,
            leader_id: data.leaderUid ?? null,
            leader_name: data.leaderName ?? null,
            created_by: data.createdBy ?? null,
            privacy: data.privacy ?? 'public',
        };
        let payload = { ...fullPayload };
        let res: any = null;
        let error: any = null;
        for (let attempt = 0; attempt < 8; attempt++) {
            const result = await supabase.from('cells').insert(payload).select().single();
            res = result.data;
            error = result.error;
            if (!error) break;
            const missingColumn = getMissingColumnName(error);
            if (error?.code !== 'PGRST204' || !missingColumn || !(missingColumn in payload)) break;
            delete payload[missingColumn];
        }
        if (error) throw toError('Erro ao criar grupo da igreja', error);
        return res.id;
    },
    joinCell: async (uid: string, cellId: string, data: any) => {
        const { error } = await supabase.from('memberships').upsert({
            user_id: uid,
            cell_id: cellId,
            church_id: data.churchId,
            role: 'member',
            joined_at: now()
        });
        if (error) throw toError('Erro ao participar do grupo', error);

        const profile = await dbService.getUserProfile(uid);
        await dbService.updateUserProfile(uid, {
            churchData: {
                ...(profile?.churchData ?? {}),
                churchId: data.churchId ?? profile?.churchData?.churchId,
                groupId: cellId,
                groupName: data.name,
                groupSlug: data.slug,
            }
        });
    },
    getChurchMembers: async (churchId: string): Promise<UserProfile[]> => {
        const { data, error } = await supabase.from('memberships').select('profiles(*)').eq('church_id', churchId);
        if (error) throw toError('Erro ao carregar fieis da igreja', error);
        return (data ?? []).map((d: any) => mapProfileToUserProfile(d.profiles)).filter(Boolean);
    },
    getChurchFollowers: async (churchId: string) => {
        const { data, error } = await supabase.from('church_followers').select('*').eq('church_id', churchId);
        if (error) throw toError('Erro ao carregar seguidores da igreja', error);
        return data ?? [];
    },
    isFollowingChurch: async (uid: string, churchId: string): Promise<boolean> => {
        if (!uid) return false;
        const { data, error } = await supabase
            .from('church_followers')
            .select('id')
            .eq('user_id', uid)
            .eq('church_id', churchId)
            .maybeSingle();
        if (error) throw toError('Erro ao verificar acompanhamento da igreja', error);
        return Boolean(data);
    },
    getChurchCommunityCounts: async (churchId: string): Promise<{ memberCount: number; followersCount: number }> => {
        const [members, followers] = await Promise.all([
            supabase.from('memberships').select('user_id', { count: 'exact', head: true }).eq('church_id', churchId),
            supabase.from('church_followers').select('id', { count: 'exact', head: true }).eq('church_id', churchId)
        ]);
        if (members.error) throw toError('Erro ao contar fieis da igreja', members.error);
        if (followers.error) throw toError('Erro ao contar seguidores da igreja', followers.error);
        return { memberCount: members.count ?? 0, followersCount: followers.count ?? 0 };
    },
    followChurch: async (uid: string, churchId: string, _userData: any, _churchData: any) => {
        const { error } = await supabase.from('church_followers').upsert({ user_id: uid, church_id: churchId, followed_at: now() });
        if (error) throw toError('Erro ao seguir igreja', error);
    },
    unfollowChurch: async (uid: string, churchId: string) => {
        const { error } = await supabase.from('church_followers').delete().eq('user_id', uid).eq('church_id', churchId);
        if (error) throw toError('Erro ao deixar de seguir igreja', error);
    },
    updateChurch: async (id: string, data: any) => {
        const fieldMap: Record<string, string> = {
            logoUrl: 'logo_url',
            pastorName: 'pastor_name',
            externalProvider: 'external_provider',
            externalPlaceId: 'external_place_id',
            sourceAttribution: 'source_attribution',
            verificationStatus: 'verification_status',
            teamScores: 'team_scores',
        };
        const mapped: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'location' && value && typeof value === 'object') {
                mapped.location_city = (value as any).city;
                mapped.location_state = (value as any).state;
                mapped.location_address = (value as any).address;
            } else {
                mapped[fieldMap[key] ?? key] = value;
            }
        }
        mapped.updated_at = now();
        await supabase.from('churches').update(clean(mapped)).eq('id', id);
    },

    // ── PEDIDOS DE ORAÇÃO ────────────────────────────────────────────────────
    addPrayerRequest: async (targetType: string, targetId: string, data: any): Promise<string> => {
        const basePayload: Record<string, any> = {
            user_id: data.userId,
            user_name: data.userName,
            user_photo_url: data.userPhotoURL ?? null,
            content: data.content,
            target_type: targetType,
            target_id: targetId,
            church_id: data.churchId ?? null,
            created_at: now()
        };
        const fullPayload: Record<string, any> = {
            ...basePayload,
            cell_name: data.cellName ?? null,
            intercessors_count: 0,
            intercessors: []
        };
        let payload = { ...fullPayload };
        let res: any = null;
        let error: any = null;

        for (let attempt = 0; attempt < 10; attempt++) {
            const result = await supabase.from('prayer_requests').insert(payload).select().single();
            res = result.data;
            error = result.error;
            if (!error) break;

            const missingColumn = getMissingColumnName(error);
            if (error?.code !== 'PGRST204' || !missingColumn || !(missingColumn in payload)) break;
            delete payload[missingColumn];
        }
        if (error) throw toError('Erro ao criar pedido de oracao', error);
        return res.id;
    },
    getPrayerRequests: async (targetType: string, targetId: string): Promise<PrayerRequest[]> => {
        const { data, error } = await supabase.from('prayer_requests').select('*')
            .eq('target_id', targetId).order('created_at', { ascending: false });
        if (error) throw toError('Erro ao carregar pedidos de oracao', error);
        return (data ?? []).map(mapPrayerRequest);
    },
    getUnifiedChurchMural: async (churchId: string): Promise<any[]> => {
        const [prayers, posts] = await Promise.all([
            dbService.getPrayerRequests('church', churchId),
            supabase.from('posts').select('*')
                .eq('church_id', churchId)
                .or('destination.eq.church,also_show_on_church.eq.true')
                .order('created_at', { ascending: false })
                .limit(40)
        ]);
        
        let enrichedPosts: any[] = [];
        if (posts.data) {
            const tempEnriched = await enrichPostRowsWithProfiles(posts.data);
            enrichedPosts = tempEnriched.map(mapPost);
        }

        const unified = [
            ...prayers.map(p => ({ ...p, muralType: 'prayer' })),
            ...enrichedPosts.map(p => ({ ...p, muralType: 'post' }))
        ];

        return unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    togglePrayerIntercession: async (prayerId: string, uid: string, isActive: boolean) => {
        const { data } = await supabase.from('prayer_requests').select('intercessors').eq('id', prayerId).single();
        if (!data) return;
        let intercessors: string[] = JSON.parse(data.intercessors ?? '[]');
        if (isActive) { if (!intercessors.includes(uid)) intercessors.push(uid); }
        else { intercessors = intercessors.filter(i => i !== uid); }
        const { error } = await supabase.from('prayer_requests').update({ intercessors, intercessors_count: intercessors.length }).eq('id', prayerId);
        if (error) throw toError('Erro ao atualizar intercessao', error);
    },
    updatePrayerRequest: async (id: string, content: string) => {
        await supabase.from('prayer_requests').update({ content }).eq('id', id);
    },
    deletePrayerRequest: async (id: string, moderation?: { churchId?: string; cellId?: string }) => {
        let query = supabase.from('prayer_requests').delete().eq('id', id);
        if (moderation?.churchId) query = query.eq('church_id', moderation.churchId);
        if (moderation?.cellId) query = query.eq('target_id', moderation.cellId);
        const { error } = await query;
        if (error) throw toError('Erro ao excluir postagem', error);
    },
    getLatestCommunityPrayer: async (churchId: string): Promise<PrayerRequest | null> => {
        const { data } = await supabase.from('prayer_requests').select('*')
            .eq('church_id', churchId).order('created_at', { ascending: false }).limit(1).single();
        return data ? mapPrayerRequest(data) : null;
    },

    // ── CÉLULAS ──────────────────────────────────────────────────────────────
    updateCell: async (id: string, data: any) => {
        const fieldMap: Record<string, string> = {
            parentGroupId: 'parent_group_id',
            leaderUid: 'leader_id',
            leaderName: 'leader_name',
            createdBy: 'created_by',
        };
        const mapped: any = {};
        for (const [key, value] of Object.entries(data)) {
            mapped[fieldMap[key] ?? key] = value;
        }
        const { error } = await supabase.from('cells').update(clean(mapped)).eq('id', id);
        if (error) throw toError('Erro ao atualizar grupo', error);
    },
    deleteCell: async (id: string) => {
        const { error } = await supabase.from('cells').delete().eq('id', id);
        if (error) throw toError('Erro ao excluir grupo', error);
    },
    getSubgroups: async (parentId: string): Promise<ChurchGroup[]> => {
        const { data } = await supabase.from('cells').select('*').eq('parent_group_id', parentId);
        return (data ?? []).map(mapCell);
    },
    getCellBySlug: async (slug: string): Promise<ChurchGroup | null> => {
        const idLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
        if (idLike) {
            return dbService.getCellById(slug);
        }

        const { data, error } = await supabase.from('cells').select('*').eq('slug', slug).maybeSingle();
        if (error && !isMissingColumnError(error, 'slug')) throw toError('Erro ao carregar grupo', error);
        return data ? mapCell(data) : null;
    },
    getCellById: async (id: string): Promise<ChurchGroup | null> => {
        const { data, error } = await supabase.from('cells').select('*').eq('id', id).maybeSingle();
        if (error) throw toError('Erro ao carregar grupo', error);
        return data ? mapCell(data) : null;
    },
    getCellMembers: async (cellId: string): Promise<UserProfile[]> => {
        const { data } = await supabase.from('memberships').select('profiles(*)').eq('cell_id', cellId);
        return (data ?? []).map((d: any) => mapProfileToUserProfile(d.profiles)).filter(Boolean);
    },

    // ── POSTS ────────────────────────────────────────────────────────────────
    getPendingGroupAccessInvite: async (inviteId: string, uid: string): Promise<GroupAccessInvite | null> => {
        const { data, error } = await supabase
            .from('group_access_invites')
            .select('*')
            .eq('id', inviteId)
            .eq('invited_user_id', uid)
            .eq('status', 'pending')
            .maybeSingle();
        if (error) throw toError('Erro ao carregar convite do grupo', error);
        return data ? mapGroupAccessInvite(data) : null;
    },
    createGroupAccessInvite: async (
        group: ChurchGroup,
        invitedUser: UserProfile,
        invitedBy: UserProfile,
        source: GroupAccessInviteSource = 'invite'
    ): Promise<GroupAccessInvite> => {
        const { data, error } = await supabase.rpc('create_private_group_invite', {
            p_group_id: group.id,
            p_group_slug: group.id,
            p_invited_user_id: invitedUser.uid,
            p_source: source,
            p_actor_name: invitedBy.displayName || 'Um membro'
        });
        if (error) throw toError('Erro ao criar convite do grupo', error);
        return mapGroupAccessInvite(data);
    },
    acceptGroupAccessInvite: async (inviteId: string, uid: string): Promise<ChurchGroup> => {
        const { data, error } = await supabase.rpc('accept_private_group_invite', {
            p_invite_id: inviteId
        });
        if (error) throw toError('Erro ao aceitar convite do grupo', error);
        const group = mapCell(data);
        await dbService.joinCell(uid, group.id, {
            churchId: group.churchId,
            name: group.name,
            slug: group.slug
        });
        return group;
    },
    createContentAccessInvite: async (params: {
        contentType: 'study' | 'room';
        contentId: string;
        invitedUserId: string;
        title: string;
        actorName?: string;
        churchId?: string;
        groupId?: string;
        source?: 'invite' | 'mention' | 'link';
    }): Promise<any> => {
        const { data, error } = await supabase.rpc('create_content_access_invite', {
            p_content_type: params.contentType,
            p_content_id: params.contentId,
            p_invited_user_id: params.invitedUserId,
            p_title: params.title,
            p_actor_name: params.actorName ?? 'Um membro',
            p_church_id: params.churchId ?? null,
            p_group_id: params.groupId ?? null,
            p_source: params.source ?? 'invite',
        });
        if (error) throw toError('Erro ao criar convite do conteúdo', error);
        return data;
    },
    acceptContentAccessInvite: async (inviteId: string): Promise<any> => {
        const { data, error } = await supabase.rpc('accept_content_access_invite', {
            p_invite_id: inviteId
        });
        if (error) throw toError('Erro ao aceitar convite do conteúdo', error);
        return data;
    },

    getGlobalFeed: async (limitCount = 50, viewerProfile?: UserProfile | null): Promise<Post[]> => {
        let { data, error } = await supabase.from('posts').select('*')
            .order('created_at', { ascending: false }).limit(Math.max(limitCount * 4, 120));
        if (error && shouldRetryFeedWithoutDestination(error)) {
            const retry = await supabase.from('posts').select('*')
                .order('created_at', { ascending: false }).limit(Math.max(limitCount * 4, 120));
            data = retry.data;
            error = retry.error;
        }
        if (error) throw toError('Erro ao carregar feed do Reino', error);
        const enrichedPosts = await enrichPostRowsWithProfiles(data ?? []);
        const [followingIds, groupIds] = await Promise.all([
            getFollowingIdsForFeed(viewerProfile?.uid),
            getViewerGroupIdsForFeed(viewerProfile),
        ]);
        return buildKingdomPersonalizedFeed(enrichedPosts.map(mapPost), {
            viewer: viewerProfile,
            followingIds,
            groupIds,
        }, limitCount);
    },
    getKingdomHomePosts: async (limitCount = 60, viewerProfile?: UserProfile | null): Promise<Post[]> => {
        const { data, error } = await supabase.from('posts').select('*')
            .order('created_at', { ascending: false }).limit(Math.max(limitCount * 4, 120));
        if (error) throw toError('Erro ao carregar posts da Home Reino', error);
        const enrichedPosts = await enrichPostRowsWithProfiles(data ?? []);
        const [followingIds, groupIds] = await Promise.all([
            getFollowingIdsForFeed(viewerProfile?.uid),
            getViewerGroupIdsForFeed(viewerProfile),
        ]);
        return buildKingdomPersonalizedFeed(enrichedPosts.map(mapPost), {
            viewer: viewerProfile,
            followingIds,
            groupIds,
        }, limitCount);
    },
    getUserFeedPosts: async (uid: string, limitCount = 50, viewerProfile?: UserProfile | null): Promise<Post[]> => {
        const { data, error } = await supabase.from('posts').select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(limitCount);
        if (error) throw toError('Erro ao carregar postagens do perfil', error);
        const enrichedPosts = await enrichPostRowsWithProfiles(data ?? []);
        const [followingIds, groupIds] = await Promise.all([
            getFollowingIdsForFeed(viewerProfile?.uid),
            getViewerGroupIdsForFeed(viewerProfile),
        ]);
        return buildKingdomPersonalizedFeed(enrichedPosts.map(mapPost), {
            viewer: viewerProfile,
            followingIds,
            groupIds,
        }, limitCount);
    },
    getServiceFeedPosts: async (serviceId: string, limitCount = 30): Promise<Post[]> => {
        const { data, error } = await supabase.from('posts').select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false })
            .limit(limitCount);
        if (error) throw toError('Erro ao carregar feed do culto', error);
        const enrichedPosts = await enrichPostRowsWithProfiles(data ?? []);
        return enrichedPosts.map(mapPost);
    },
    createPost: async (data: any) => {
        const [fullPayload, legacyPayload] = buildPostInsertPayloads(data, now());
        let payload = fullPayload;
        let { error } = await supabase.from('posts').insert(payload);

        for (let attempt = 0; error && attempt < 8; attempt++) {
            const missingColumn = getMissingColumnName(error);
            if (!isMissingColumnError(error) || !missingColumn || !(missingColumn in payload)) break;
            payload = dropPostInsertColumn(payload, missingColumn);
            const retry = await supabase.from('posts').insert(payload);
            error = retry.error;
        }

        if (error && (error?.code === 'PGRST204' || /column|schema cache|destination|visibility|cell_id|liked_by|user_username|user_photo_url|shares_count|mood/i.test(formatSupabaseError(error)))) {
            const retry = await supabase.from('posts').insert(legacyPayload);
            error = retry.error;
        }
        if (error) throw toError('Erro ao criar publicacao no Reino', error);
    },
    updatePost: async (id: string, data: any) => {
        await supabase.from('posts').update(clean(data)).eq('id', id);
    },
    deletePost: async (id: string) => {
        await supabase.from('posts').delete().eq('id', id);
    },
    getPost: async (id: string, viewerProfile?: UserProfile | null): Promise<Post | null> => {
        const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
        if (error) throw toError('Erro ao carregar publicacao do Reino', error);
        const [enrichedPost] = await enrichPostRowsWithProfiles(data ? [data] : []);
        if (!enrichedPost) return null;

        const [followingIds, groupIds] = await Promise.all([
            getFollowingIdsForFeed(viewerProfile?.uid),
            getViewerGroupIdsForFeed(viewerProfile),
        ]);
        return buildKingdomPersonalizedFeed([mapPost(enrichedPost)], {
            viewer: viewerProfile,
            followingIds,
            groupIds,
        }, 1)[0] || null;
    },
    togglePostLike: async (postId: string, uid: string, isLiked: boolean) => {
        // #region agent log
        await fetch('http://127.0.0.1:7257/ingest/855e5ae7-5028-483b-b858-50f697cefc39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'72a1fe'},body:JSON.stringify({sessionId:'72a1fe',runId:'pre-fix',hypothesisId:'H1',location:'services/supabase.ts:1095',message:'togglePostLike entry',data:{postId,uid,isLiked},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        const { data } = await supabase.from('posts').select('liked_by, likes_count').eq('id', postId).single();
        if (!data) return;
        // #region agent log
        await fetch('http://127.0.0.1:7257/ingest/855e5ae7-5028-483b-b858-50f697cefc39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'72a1fe'},body:JSON.stringify({sessionId:'72a1fe',runId:'pre-fix',hypothesisId:'H2',location:'services/supabase.ts:1097',message:'liked_by raw value before parse',data:{liked_by:data.liked_by,liked_by_type:typeof data.liked_by,likes_count:data.likes_count},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        let likedBy: string[];
        try {
            const parsedLikedBy = safeJson(data.liked_by, []);
            likedBy = Array.isArray(parsedLikedBy) ? parsedLikedBy.filter((item): item is string => typeof item === 'string') : [];
        } catch (error) {
            // #region agent log
            await fetch('http://127.0.0.1:7257/ingest/855e5ae7-5028-483b-b858-50f697cefc39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'72a1fe'},body:JSON.stringify({sessionId:'72a1fe',runId:'pre-fix',hypothesisId:'H3',location:'services/supabase.ts:1101',message:'JSON.parse failed for liked_by',data:{liked_by:data.liked_by,liked_by_type:typeof data.liked_by,error_message:error instanceof Error ? error.message : String(error)},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            likedBy = [];
        }
        if (isLiked) { if (!likedBy.includes(uid)) likedBy.push(uid); }
        else { likedBy = likedBy.filter(i => i !== uid); }
        // #region agent log
        await fetch('http://127.0.0.1:7257/ingest/855e5ae7-5028-483b-b858-50f697cefc39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'72a1fe'},body:JSON.stringify({sessionId:'72a1fe',runId:'post-fix',hypothesisId:'H4',location:'services/supabase.ts:1107',message:'liked_by after mutation',data:{isLiked,nextLikedBy:likedBy,nextCount:likedBy.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        await supabase.from('posts').update({ liked_by: JSON.stringify(likedBy), likes_count: likedBy.length }).eq('id', postId);
    },
    getTrendingPost: async (): Promise<Post | null> => {
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(1).single();
        const [enrichedPost] = await enrichPostRowsWithProfiles(data ? [data] : []);
        return enrichedPost ? mapPost(enrichedPost) : null;
    },
    getPostComments: async (postId: string): Promise<PostComment[]> => {
        const { data, error } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        if (error) {
            if (isMissingTableError(error, 'public.post_comments') || isMissingTableError(error, 'post_comments')) {
                console.warn("Tabela 'post_comments' ainda não foi criada no Supabase.");
                return [];
            }
            throw toError('Erro ao carregar comentarios do post', error);
        }
        return (data ?? []).map(mapPostComment);
    },
    addPostComment: async (comment: Partial<PostComment>) => {
        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: comment.postId,
                user_id: comment.userId,
                user_display_name: comment.userDisplayName,
                user_photo_url: comment.userPhotoURL ?? null,
                content: comment.content,
                created_at: now()
            })
            .select()
            .single();
        if (error) {
            throw toError('Erro ao enviar comentario', error);
        }
        await supabase.rpc('increment_post_comments_count', { post_id_input: comment.postId });
        return mapPostComment(data);
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
    getUserParticipatingPlans: async (uid: string): Promise<CustomPlan[]> => {
        const { data: participants } = await supabase
            .from('plan_participants')
            .select('plan_id')
            .eq('uid', uid)
            .or('status.is.null,status.neq.blocked')
            .limit(24);

        const planIds = Array.from(new Set((participants ?? []).map((participant) => participant.plan_id).filter(Boolean)));
        if (!planIds.length) return [];

        const { data } = await supabase.from('custom_plans').select('*').in('id', planIds);
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
        const { data: res, error } = await supabase.from('custom_plans').insert(mapPlanToDb({ viewsCount: 0, ...data })).select().single();
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
        const [{ count: users }, { count: churches }, { count: paid }, { count: pendingChurchRequests }] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('churches').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('subscription_tier', 'free'),
            supabase.from('church_role_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);
        return {
            users: users ?? 0,
            churches: churches ?? 0,
            paidUsers: paid ?? 0,
            pendingChurchRequests: pendingChurchRequests ?? 0,
        };
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
        await supabase.from('daily_devotionals').upsert(clean({
            date: dateId,
            title: data.title,
            verse_reference: data.verseReference ?? data.verse_reference ?? data.reference,
            verse_text: data.verseText ?? data.verse_text ?? data.verse,
            content: data.content ?? data.text,
            prayer: data.prayer,
        }));
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
    recordManaEvent: async (event: Omit<ManaEvent, 'id'>): Promise<ManaEvent | null> => {
        const payload = {
            user_id: event.userId,
            church_id: event.churchId ?? null,
            group_id: event.groupId ?? null,
            actor_role: event.actorRole,
            action_type: event.actionType,
            source_type: event.sourceType ?? null,
            source_id: event.sourceId ?? null,
            event_key: event.eventKey,
            xp_amount: event.xpAmount,
            occurred_at: event.occurredAt,
            period_key: event.periodKey,
            status: event.status,
            void_reason: event.voidReason ?? null,
            meta: event.meta ?? {},
        };
        const { data, error } = await supabase.from('mana_events').insert(payload).select('*').single();
        if (error) {
            if (isMissingTableError(error, 'mana_events') || error.code === '23505') return null;
            throw new Error(`Erro ao registrar evento de Mana. ${formatSupabaseError(error)}`);
        }
        return data ? mapManaEvent(data) : null;
    },
    getManaEvents: async (status: ManaEvent['status'] | 'all' = 'review', limit = 50): Promise<ManaEvent[]> => {
        let query = supabase
            .from('mana_events')
            .select('*')
            .order('occurred_at', { ascending: false })
            .limit(limit);
        if (status !== 'all') query = query.eq('status', status);
        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error, 'mana_events')) return [];
            throw new Error(`Erro ao carregar eventos de Mana. ${formatSupabaseError(error)}`);
        }
        return (data ?? []).map(mapManaEvent);
    },
    voidManaEvent: async (eventId: string, reason: string): Promise<void> => {
        const { error } = await supabase
            .from('mana_events')
            .update({ status: 'void', void_reason: reason || 'Anulado pelo admin' })
            .eq('id', eventId);
        if (error) {
            if (isMissingTableError(error, 'mana_events')) return;
            throw new Error(`Erro ao anular evento de Mana. ${formatSupabaseError(error)}`);
        }
    },
    getChurchGamificationRanking: async (periodKey?: string, mode: 'total' | 'normalized' = 'total', limit = 10): Promise<ChurchGamificationSnapshot[]> => {
        let query = supabase
            .from('church_gamification_snapshots')
            .select('*')
            .order(mode === 'normalized' ? 'xp_per_active_member' : 'total_xp', { ascending: false })
            .limit(limit);
        if (periodKey) query = query.eq('period_key', periodKey);
        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error, 'church_gamification_snapshots')) return [];
            throw new Error(`Erro ao carregar ranking de igrejas. ${formatSupabaseError(error)}`);
        }
        return (data ?? []).map(mapChurchGamificationSnapshot);
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
                type: normalizeStandaloneStudyType(data.type),
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
        const baseUpdateData = {
            title: data.meta?.title,
            description: data.meta?.description,
            blocks: typeof data.blocks === 'string' ? data.blocks : JSON.stringify(data.blocks || []),
            meta: typeof data.meta === 'string' ? data.meta : JSON.stringify(data.meta || {}),
            cover_image: data.meta?.coverImage || null,
            status: data.status,
            published_at: data.status === 'published' ? (data.published_at || now()) : null,
            updated_at: now()
        };
        const publicUpdateData = {
            ...baseUpdateData,
            type: normalizeStandaloneStudyType(data.type),
        };

        const { error: publicError, data: publicResult } = await supabase
            .from('public_studies')
            .update(publicUpdateData)
            .eq('id', id)
            .select();

        // Se falhar ou não encontrar na pública, tenta na privada
        if (publicError || !publicResult || publicResult.length === 0) {
            const { error: privateError } = await supabase
                .from('studies')
                .update(baseUpdateData)
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
    incrementMetric: async (tableName: string, id: string, field: string): Promise<number | null> => {
        const colMap: Record<string, string> = { views: 'views_count', shares: 'shares_count', completions: 'completions_count', likes: 'likes_count' };
        const col = colMap[field] ?? `${field}_count`;
        const { data, error } = await supabase.from(tableName).select(col).eq('id', id).single();
        if (error) {
            console.warn(`[dbService] Metrica indisponivel em ${tableName}.${col}:`, formatSupabaseError(error));
            return null;
        }
        if (data) {
            const nextValue = ((data as any)[col] || 0) + 1;
            const { error: updateError } = await supabase.from(tableName).update({ [col]: nextValue }).eq('id', id);
            if (updateError) {
                console.warn(`[dbService] Nao foi possivel atualizar ${tableName}.${col}:`, formatSupabaseError(updateError));
                return null;
            }
            return nextValue;
        }
        return null;
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
        profileType: d.profile_type ?? (d.subscription_tier === 'pastor' ? 'pastor' : 'user'),
        subscriptionStatus: d.subscription_status ?? 'active',
        subscriptionExpiresAt: d.subscription_expires_at ?? null,
        activityLog: safeJson(d.activity_log, []),
        stats: safeJson(d.stats, { totalChaptersRead: 0, daysStreak: 0, studiesCreated: 0, totalDevotionalsRead: 0, totalNotes: 0, totalShares: 0, totalImagesGenerated: 0, totalChatMessages: 0, totalSermonsCreated: 0, totalVersesMarked: 0, totalQuizzesCompleted: 0, perfectQuizzes: 0 }),
        lastReadingPosition: safeJson(d.last_reading_position),
        usageToday: safeJson(d.usage_today, { date: '', imagesCount: 0, podcastsCount: 0, analysisCount: 0, chatCount: 0 }),
        city: d.city ?? undefined,
        state: d.state ?? undefined,
        phoneNumber: d.phone_number ?? undefined,
        cpf: d.cpf ?? undefined,
        instagram: d.instagram ?? undefined,
        facebook: d.facebook ?? undefined,
        bio: d.bio ?? undefined,
        slogan: d.slogan ?? undefined,
        isProfilePublic: d.is_profile_public ?? true,
        churchData: safeJson(d.church_data),
        enrolledPlans: safeJson(d.enrolled_plans, []),
        readingPlan: safeJson(d.reading_plan),
        progress: safeJson(d.progress),
        theme: d.theme ?? 'light',
        bibleVersion: d.bible_version ?? 'ara',
        followersCount: d.followers_count ?? 0,
        followingCount: d.following_count ?? 0,
    };
}

function mapManaEvent(d: any): ManaEvent {
    return {
        id: d.id,
        userId: d.user_id,
        churchId: d.church_id ?? null,
        groupId: d.group_id ?? null,
        actorRole: d.actor_role ?? 'user',
        actionType: d.action_type as ActionType,
        sourceType: d.source_type ?? null,
        sourceId: d.source_id ?? null,
        eventKey: d.event_key,
        xpAmount: d.xp_amount ?? 0,
        occurredAt: d.occurred_at,
        periodKey: d.period_key,
        status: d.status ?? 'valid',
        voidReason: d.void_reason ?? null,
        meta: safeJson(d.meta, {}),
        userName: d.user_name ?? undefined,
        churchName: d.church_name ?? undefined,
    };
}

function mapChurchGamificationSnapshot(d: any): ChurchGamificationSnapshot {
    return {
        churchId: d.church_id,
        churchName: d.church_name ?? undefined,
        periodKey: d.period_key,
        totalXp: d.total_xp ?? 0,
        activeMembers: d.active_members ?? 0,
        xpPerActiveMember: Number(d.xp_per_active_member ?? 0),
        chaptersRead: d.chapters_read ?? 0,
        devotionalsCompleted: d.devotionals_completed ?? 0,
        prayersCount: d.prayers_count ?? 0,
        quizCompleted: d.quiz_completed ?? 0,
        rankGlobalTotal: d.rank_global_total ?? null,
        rankGlobalNormalized: d.rank_global_normalized ?? null,
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
        privacyLevel: d.privacy_level ?? d.privacy_type ?? 'public',
        allowedGroupIds: safeJson(d.allowed_group_ids, []),
        allowedUserIds: safeJson(d.allowed_user_ids, []),
        inviteRequired: d.invite_required ?? false,
        allowPdfDownload: d.allow_pdf_download ?? false,
        shareSlug: d.share_slug ?? undefined,
        lastSharedAt: d.last_shared_at ?? undefined,
        createdFromContext: d.created_from_context ?? undefined,
        isRanked: d.is_ranked ?? false,
        status: d.status ?? 'draft',
        churchId: d.church_id ?? undefined,
        groupId: d.group_id ?? undefined,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        subscribersCount: d.subscribers_count ?? 0,
        viewsCount: d.views_count ?? 0,
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
        isPublic: 'is_public', privacyType: 'privacy_type', privacyLevel: 'privacy_level',
        allowedGroupIds: 'allowed_group_ids', allowedUserIds: 'allowed_user_ids',
        inviteRequired: 'invite_required', allowPdfDownload: 'allow_pdf_download',
        shareSlug: 'share_slug', lastSharedAt: 'last_shared_at',
        createdFromContext: 'created_from_context', isRanked: 'is_ranked',
        churchId: 'church_id', groupId: 'group_id', createdAt: 'created_at', updatedAt: 'updated_at',
        subscribersCount: 'subscribers_count', planningFrequency: 'planning_frequency',
        hasEvaluation: 'has_evaluation', evaluationId: 'evaluation_id',
        teamScores: 'team_scores', startDate: 'start_date', endDate: 'end_date',
        viewsCount: 'views_count',
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

async function enrichPostRowsWithProfiles(rows: any[]): Promise<any[]> {
    const userIds = Array.from(new Set(rows.filter((row) => row.user_id).map((row) => row.user_id)));
    if (userIds.length === 0) return rows;

    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, photo_url, is_profile_public, church_data, city, state')
        .in('id', userIds);

    if (error) {
        console.warn('[dbService] Nao foi possivel enriquecer fotos do feed:', formatSupabaseError(error));
        return rows;
    }

    const profilesById = new Map((data ?? []).map((profile: any) => [profile.id, profile]));
    return rows.map((row) => ({
        ...row,
        __profile: profilesById.get(row.user_id),
    }));
}

async function getFollowingIdsForFeed(uid?: string | null): Promise<string[]> {
    if (!uid) return [];

    const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid);

    if (error) {
        console.warn('[dbService] Nao foi possivel carregar seguindo para o feed:', formatSupabaseError(error));
        return [];
    }

    return (data ?? []).map((row: any) => row.following_id).filter(Boolean);
}

async function getViewerGroupIdsForFeed(viewerProfile?: UserProfile | null): Promise<string[]> {
    const groupIds = new Set<string>();
    if (viewerProfile?.churchData?.groupId) groupIds.add(viewerProfile.churchData.groupId);

    if (!viewerProfile?.uid) return Array.from(groupIds);

    try {
        const groups = await dbService.getUserGroups(viewerProfile.uid, viewerProfile.churchData?.churchId);
        groups.forEach((group) => groupIds.add(group.id));
    } catch {
        // O feed principal nao deve quebrar quando grupos ainda nao estao configurados.
    }

    return Array.from(groupIds);
}

function mapPost(d: any): Post {
    const studyShare = d.type === 'study' || d.type === 'room' ? parseStudyShareContent(d.content) : null;
    const profile = d.__profile;
    const moodContent = d.type === 'feeling' ? decodeMoodContent(d.content ?? '', d.mood ?? null) : null;
    return {
        id: d.id,
        userId: d.user_id,
        userDisplayName: d.user_display_name ?? profile?.display_name ?? '',
        userUsername: d.user_username ?? profile?.username ?? '',
        userPhotoURL: d.user_photo_url ?? profile?.photo_url ?? undefined,
        type: d.type ?? 'reflection',
        content: studyShare?.description ?? moodContent?.content ?? d.content ?? '',
        likesCount: d.likes_count ?? 0,
        commentsCount: d.comments_count ?? 0,
        shares: d.shares_count ?? d.shares ?? 0,
        viewsCount: d.views_count ?? 0,
        likes: d.likes_count ?? 0,
        comments: d.comments_count ?? 0,
        saved: false,
        likedBy: safeJson(d.liked_by, []),
        createdAt: d.created_at,
        time: d.created_at,
        location: '',
        imageUrl: d.image_url ?? studyShare?.studyCoverUrl ?? undefined,
        image: d.image_url ?? studyShare?.studyCoverUrl ?? undefined,
        destination: d.destination ?? 'global',
        visibility: normalizePostVisibility({ visibility: d.visibility, destination: d.destination ?? 'global' }),
        feedReason: d.feed_reason ?? undefined,
        churchId: d.church_id ?? undefined,
        cellId: d.cell_id ?? undefined,
        mood: moodContent?.mood ?? d.mood ?? undefined,
        studyId: studyShare?.studyId,
        studyTitle: studyShare?.studyTitle,
        studyCoverUrl: studyShare?.studyCoverUrl ?? d.image_url ?? undefined,
        studyUrl: studyShare?.studyUrl,
        studySourceLabel: studyShare?.sourceLabel,
        alsoShowOnChurch: d.also_show_on_church ?? false,
        serviceId: d.service_id ?? undefined,
        serviceTitle: d.service_title ?? undefined,
        authorProfilePublic: d.__profile ? d.__profile.is_profile_public ?? true : false,
        authorChurchId: safeJson(d.__profile?.church_data)?.churchId ?? undefined,
        authorCity: d.__profile?.city ?? undefined,
        authorState: d.__profile?.state ?? undefined,
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
    const memberCount = d.member_count ?? d.stats?.memberCount ?? 0;
    return {
        id: d.id,
        name: d.name,
        acronym: d.acronym ?? '',
        slug: d.slug,
        denomination: d.denomination ?? '',
        location: { city: d.location_city ?? '', state: d.location_state ?? '', address: d.location_address ?? '' },
        stats: {
            memberCount,
            totalMana: d.total_mana ?? 0,
            totalChaptersRead: d.total_chapters_read ?? 0,
            totalStudiesCreated: d.total_studies_created ?? 0,
            followersCount: d.followers_count ?? 0
        },
        teams: safeJson(d.teams, []),
        teamScores: safeJson(d.team_scores, {}),
        admins: safeJson(d.admins, []),
        logoUrl: d.logo_url ?? undefined,
        pastorName: d.pastor_name ?? undefined,
        externalProvider: d.external_provider ?? undefined,
        externalPlaceId: d.external_place_id ?? undefined,
        sourceAttribution: d.source_attribution ?? undefined,
        verificationStatus: d.verification_status ?? 'unclaimed',
        lat: d.lat ?? null,
        lng: d.lng ?? null,
    };
}

function mapCell(d: any): ChurchGroup {
    return {
        id: d.id,
        churchId: d.church_id,
        parentGroupId: d.parent_group_id ?? undefined,
        name: d.name,
        slug: d.slug ?? d.name,
        privacy: d.privacy === 'private' ? 'private' : 'public',
        stats: { memberCount: 0, totalMana: 0 },
        leaderName: d.leader_name ?? undefined,
        leaderUid: d.leader_id ?? undefined,
        createdBy: d.created_by ?? '',
        createdAt: d.created_at,
    };
}

function mapGroupAccessInvite(d: any): GroupAccessInvite {
    return {
        id: d.id,
        groupId: d.group_id,
        churchId: d.church_id,
        invitedUserId: d.invited_user_id,
        invitedByUserId: d.invited_by_user_id,
        status: d.status ?? 'pending',
        source: d.source ?? 'invite',
        token: d.token ?? undefined,
        expiresAt: d.expires_at ?? undefined,
        acceptedAt: d.accepted_at ?? undefined,
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
        viewsCount: d.views_count ?? 0,
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

function mapPostComment(d: any): PostComment {
    return {
        id: d.id,
        postId: d.post_id,
        userId: d.user_id,
        userDisplayName: d.user_display_name ?? d.user_name ?? 'Usuário',
        userPhotoURL: d.user_photo_url ?? d.user_photo ?? null,
        content: d.content ?? '',
        createdAt: d.created_at ?? now(),
    };
}
