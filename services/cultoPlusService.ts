import { dbService, supabase } from './supabase';
import {
  ChurchService,
  ChurchServiceStatus,
  ChurchServiceType,
  ServiceAdvancedAnalytics,
  ServiceAiContent,
  ServiceAiContentKind,
  ServiceCheckin,
  ServiceLiveState,
  ServiceLiturgyItem,
  ServiceMinistry,
  ServiceMinistryMember,
  ServiceNote,
  ServicePrayerRequest,
  ServiceReactionSummary,
  ServiceReactionType,
  ServiceScheduleAssignment,
  ServiceScheduleStatus,
  SubscriptionTier,
  Post,
  UserProfile,
} from '../types';
import { generateSlug } from '../utils/textUtils';
import { formatSupabaseError, getMissingColumnNameFromError, isMissingColumnError } from '../utils/supabaseErrors';
import { generateChurchServicePlanning, generateSermonOutline, generateSpecificPrayer } from './pastorAgent';

type CreateChurchServiceInput = {
  churchId: string;
  churchName: string;
  churchSlug?: string;
  title: string;
  theme: string;
  preacherName: string;
  serviceType: ChurchServiceType;
  startsAt: string;
  endsAt: string;
  keyVerseRef?: string;
  keyVerseText?: string;
  bannerUrl?: string;
  liveUrl?: string;
  status?: ChurchServiceStatus;
  createdBy: string;
  liturgyItems: ServiceLiturgyItem[];
};

type ServicePostInput = {
  service: ChurchService;
  user: any;
  profile: UserProfile;
  content: string;
};

type UpdateChurchServiceInput = Partial<Omit<CreateChurchServiceInput, 'churchId' | 'churchName' | 'createdBy'>> & {
  status?: ChurchServiceStatus;
};

type ChurchServiceRangeOptions = {
  startDate: string;
  endDate: string;
  includeDrafts?: boolean;
  status?: ChurchServiceStatus[];
  serviceTypes?: ChurchServiceType[];
  limit?: number;
};

export type CultoPlusPlanningSuggestion = {
  title?: string;
  theme?: string;
  serviceType?: ChurchServiceType;
  pastoralFocus?: string;
  liturgyItems?: Array<Partial<ServiceLiturgyItem>>;
};

type GenerateServicePlanningInput = {
  verseReference: string;
  verseText: string;
  userPrompt: string;
};

export type ChurchServiceStats = {
  visitorsCount: number;
  checkinsCount: number;
  postsCount: number;
  notesCount: number;
  prayersCount: number;
  verseSavesCount: number;
};

export type UserCheckedInService = {
  service: ChurchService;
  checkedInAt: string;
};

const SERVICE_STORAGE_KEY = 'biblialm.cultoPlus.services';
const CHECKIN_STORAGE_KEY = 'biblialm.cultoPlus.checkins';
const NOTE_STORAGE_KEY = 'biblialm.cultoPlus.notes';
const REACTION_STORAGE_KEY = 'biblialm.cultoPlus.reactions';
const PRAYER_STORAGE_KEY = 'biblialm.cultoPlus.prayers';
const PRAYER_INTERCESSION_STORAGE_KEY = 'biblialm.cultoPlus.prayerIntercessions';
const VERSE_SAVE_STORAGE_KEY = 'biblialm.cultoPlus.verseSaves';
const VISIT_STORAGE_KEY = 'biblialm.cultoPlus.visits';
const VISIT_SESSION_STORAGE_KEY = 'biblialm.cultoPlus.visitSessionId';
const MINISTRY_STORAGE_KEY = 'biblialm.cultoPlus.ministries';
const MINISTRY_MEMBER_STORAGE_KEY = 'biblialm.cultoPlus.ministryMembers';
const SCHEDULE_STORAGE_KEY = 'biblialm.cultoPlus.schedules';
const LIVE_STATE_STORAGE_KEY = 'biblialm.cultoPlus.liveStates';
const AI_CONTENT_STORAGE_KEY = 'biblialm.cultoPlus.aiContent';

export const CULTO_PLUS_PLAN_MATRIX = {
  free: { tier: 'free', label: 'Gratuito', monthlyServiceLimit: 4, dashboard: true, ai: false, schedules: false, advancedQr: false, branding: false, exports: false, advancedAnalytics: false },
  bronze: { tier: 'bronze', label: 'Bronze', monthlyServiceLimit: 8, dashboard: true, ai: false, schedules: true, advancedQr: true, branding: false, exports: false, advancedAnalytics: false },
  silver: { tier: 'silver', label: 'Silver', monthlyServiceLimit: 20, dashboard: true, ai: true, schedules: true, advancedQr: true, branding: true, exports: true, advancedAnalytics: false },
  gold: { tier: 'gold', label: 'Gold', monthlyServiceLimit: null, dashboard: true, ai: true, schedules: true, advancedQr: true, branding: true, exports: true, advancedAnalytics: true },
  pastor: { tier: 'pastor', label: 'Pastor', monthlyServiceLimit: null, dashboard: true, ai: true, schedules: true, advancedQr: true, branding: true, exports: true, advancedAnalytics: true },
  admin: { tier: 'admin', label: 'Admin', monthlyServiceLimit: null, dashboard: true, ai: true, schedules: true, advancedQr: true, branding: true, exports: true, advancedAnalytics: true },
} as const;

const now = () => new Date().toISOString();

const isBrowser = () => typeof window !== 'undefined';

const isMissingServiceSchema = (error: any) => {
  const message = formatSupabaseError(error).toLowerCase();
  return (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes('church_services') ||
    message.includes('service_checkins') ||
    message.includes('service_notes') ||
    message.includes('schema cache')
  );
};

const readStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = <T>(key: string, value: T) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getVisitSessionId = () => {
  if (!isBrowser()) return makeId('session');
  const current = window.localStorage.getItem(VISIT_SESSION_STORAGE_KEY);
  if (current) return current;
  const next = makeId('session');
  window.localStorage.setItem(VISIT_SESSION_STORAGE_KEY, next);
  return next;
};

const emptyStats = (): ChurchServiceStats => ({
  visitorsCount: 0,
  checkinsCount: 0,
  postsCount: 0,
  notesCount: 0,
  prayersCount: 0,
  verseSavesCount: 0,
});

const ensureItems = (items: ServiceLiturgyItem[], serviceId?: string): ServiceLiturgyItem[] =>
  items.map((item, index) => ({
    ...item,
    id: item.id || makeId('lit'),
    serviceId,
    sortOrder: item.sortOrder ?? index,
  }));

const mapService = (row: any): ChurchService => ({
  id: row.id,
  churchId: row.church_id,
  churchName: row.church_name ?? '',
  churchSlug: row.church_slug ?? undefined,
  title: row.title ?? '',
  theme: row.theme ?? '',
  preacherName: row.preacher_name ?? '',
  serviceType: row.service_type ?? 'sunday',
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  keyVerseRef: row.key_verse_ref ?? undefined,
  keyVerseText: row.key_verse_text ?? undefined,
  bannerUrl: row.banner_url ?? undefined,
  liveUrl: row.live_url ?? undefined,
  status: row.status ?? 'draft',
  slug: row.slug,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
  liturgyItems: ensureItems(row.liturgy_items ?? [], row.id),
  checkinsCount: row.checkins_count ?? 0,
  postsCount: row.posts_count ?? 0,
});

const toServicePayload = (input: CreateChurchServiceInput, id: string, slug: string) => ({
  id,
  church_id: input.churchId,
  church_name: input.churchName,
  church_slug: input.churchSlug ?? null,
  title: input.title,
  theme: input.theme,
  preacher_name: input.preacherName,
  service_type: input.serviceType,
  starts_at: input.startsAt,
  ends_at: input.endsAt,
  key_verse_ref: input.keyVerseRef ?? null,
  key_verse_text: input.keyVerseText ?? null,
  banner_url: input.bannerUrl ?? null,
  live_url: input.liveUrl ?? null,
  status: input.status ?? 'published',
  slug,
  created_by: input.createdBy,
  created_at: now(),
  updated_at: now(),
  liturgy_items: ensureItems(input.liturgyItems, id),
});

const saveLocalService = (service: ChurchService) => {
  const services = readStorage<ChurchService[]>(SERVICE_STORAGE_KEY, []);
  const next = [service, ...services.filter((item) => item.id !== service.id)];
  writeStorage(SERVICE_STORAGE_KEY, next);
};

const getLocalServices = (churchId?: string) => {
  const services = readStorage<ChurchService[]>(SERVICE_STORAGE_KEY, []);
  return services
    .filter((service) => !churchId || service.churchId === churchId)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
};

const mapServiceNote = (data: any): ServiceNote => ({
  id: data.id,
  serviceId: data.service_id,
  userId: data.user_id,
  content: data.content ?? '',
  tags: data.tags ?? [],
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const getLocalServiceNotes = (serviceId: string, userId: string) =>
  readStorage<ServiceNote[]>(NOTE_STORAGE_KEY, [])
    .filter((note) => note.serviceId === serviceId && note.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const emptyReactionSummary = (): ServiceReactionSummary => ({ amen: 0, glory: 0, hallelujah: 0 });

const mapMinistry = (row: any): ServiceMinistry => ({
  id: row.id,
  churchId: row.church_id,
  name: row.name ?? '',
  description: row.description ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

const mapMinistryMember = (row: any): ServiceMinistryMember => ({
  id: row.id,
  ministryId: row.ministry_id,
  churchId: row.church_id,
  userId: row.user_id,
  userDisplayName: row.user_display_name ?? 'Membro',
  userPhotoURL: row.user_photo_url ?? null,
  role: row.role ?? undefined,
  createdAt: row.created_at,
});

const mapScheduleAssignment = (row: any): ServiceScheduleAssignment => ({
  id: row.id,
  serviceId: row.service_id,
  churchId: row.church_id,
  ministryId: row.ministry_id,
  ministryName: row.ministry_name ?? 'Ministerio',
  userId: row.user_id,
  userDisplayName: row.user_display_name ?? 'Membro',
  userPhotoURL: row.user_photo_url ?? null,
  role: row.role ?? undefined,
  status: row.status ?? 'pending',
  reminderSentAt: row.reminder_sent_at ?? null,
  replacementUserId: row.replacement_user_id ?? null,
  replacementUserDisplayName: row.replacement_user_display_name ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
});

const mapLiveState = (row: any): ServiceLiveState => ({
  serviceId: row.service_id,
  churchId: row.church_id,
  currentItemId: row.current_item_id ?? null,
  currentTitle: row.current_title ?? null,
  currentVerseRef: row.current_verse_ref ?? null,
  currentVerseText: row.current_verse_text ?? null,
  currentExplanation: row.current_explanation ?? null,
  operatorId: row.operator_id ?? null,
  updatedAt: row.updated_at,
});

const buildServiceContext = (service: ChurchService, notes = '') =>
  [
    `Culto: ${service.title}`,
    `Igreja: ${service.churchName}`,
    `Tema: ${service.theme}`,
    `Pregador: ${service.preacherName}`,
    service.keyVerseRef ? `Versiculo-chave: ${service.keyVerseRef} ${service.keyVerseText ?? ''}` : '',
    `Timeline: ${service.liturgyItems.map((item) => [
      `${item.startsAt} ${item.title}`,
      item.songList ? `musicas: ${item.songList.replace(/\n/g, ', ')}` : '',
      item.verseRef ? `texto: ${item.verseRef} ${item.verseText ?? ''}` : '',
      item.notes ? `notas: ${item.notes}` : '',
    ].filter(Boolean).join(' - ')).join(' | ')}`,
    notes ? `Anotacoes/sermao: ${notes}` : '',
  ].filter(Boolean).join('\n');

const SERVICE_TYPE_VALUES: ChurchServiceType[] = ['sunday', 'youth', 'women', 'cell', 'conference', 'vigil', 'communion', 'other'];
const LITURGY_KIND_VALUES = ['entrance', 'opening', 'worship', 'word', 'offering', 'prayer', 'response', 'closing', 'other'] as const;
const PIX_KEY_TYPE_VALUES = ['cpf', 'phone', 'email', 'random'] as const;

const normalizePlanningSuggestion = (raw: any): CultoPlusPlanningSuggestion => {
  const serviceType = SERVICE_TYPE_VALUES.includes(raw?.serviceType) ? raw.serviceType : 'sunday';
  const liturgyItems = Array.isArray(raw?.liturgyItems)
    ? raw.liturgyItems
        .filter((item: any) => LITURGY_KIND_VALUES.includes(item?.kind))
        .map((item: any, index: number) => ({
          id: `ai_${item.kind}_${index}`,
          kind: item.kind,
          title: String(item.title || '').slice(0, 80),
          startsAt: String(item.startsAt || '').match(/^\d{2}:\d{2}$/) ? item.startsAt : undefined,
          responsible: String(item.responsible || '').slice(0, 80),
          notes: String(item.notes || '').slice(0, 800),
          verseRef: String(item.verseRef || '').slice(0, 40),
          verseText: String(item.verseText || '').slice(0, 600),
          songList: Array.isArray(item.songs)
            ? item.songs.map((song: any) => String(song || '').slice(0, 120)).filter(Boolean).join('\n')
            : String(item.songList || '').slice(0, 600),
          pixKeyType: PIX_KEY_TYPE_VALUES.includes(item?.pixKeyType) ? item.pixKeyType : undefined,
          pixKey: String(item.pixKey || '').slice(0, 160),
          sortOrder: index,
        }))
    : [];

  return {
    title: String(raw?.title || '').slice(0, 80),
    theme: String(raw?.theme || '').slice(0, 120),
    serviceType,
    pastoralFocus: String(raw?.pastoralFocus || '').slice(0, 500),
    liturgyItems,
  };
};

const fallbackAiContent = (kind: ServiceAiContentKind, service: ChurchService) => {
  const verse = service.keyVerseRef || 'texto biblico do culto';
  const title = service.title;
  const theme = service.theme;
  const map: Record<ServiceAiContentKind, string> = {
    member_summary: `Resumo pastoral de apoio: o culto "${title}" trabalhou o tema "${theme}", convidando a igreja a responder a Palavra com fe, obediencia e comunhao. Use este resumo como apoio pessoal, preservando a direcao pastoral recebida no culto.`,
    member_devotional: `Devocional da mensagem\n\nTexto base: ${verse}\n\nMedite em como "${theme}" toca sua rotina nesta semana. Observe uma atitude concreta de obediencia, ore com sinceridade e procure praticar a Palavra em um relacionamento, decisao ou responsabilidade diaria.`,
    member_prayer: `Senhor, ajuda-me a guardar a Palavra ministrada no culto "${title}". Que o tema "${theme}" produza arrependimento, fe e obediencia concreta. Conduz minha semana com sabedoria e amor. Amem.`,
    member_weekly_plan: `Plano semanal\nDia 1: releia ${verse}.\nDia 2: escreva uma aplicacao pratica.\nDia 3: ore por alguem da igreja.\nDia 4: compartilhe uma verdade aprendida.\nDia 5: revise suas anotacoes.\nDia 6: pratique um ato de servico.\nDia 7: agradeca e testemunhe o que Deus fez.`,
    member_reflection_questions: `Perguntas para reflexao\n1. O que a Palavra revelou sobre Deus?\n2. O que preciso obedecer?\n3. Que habito precisa mudar?\n4. Quem posso encorajar com esta mensagem?\n5. Como vou praticar isso nos proximos sete dias?`,
    pastor_structure: `Estrutura sugerida\n1. Abertura conectando a igreja ao tema "${theme}".\n2. Leitura e explicacao de ${verse}.\n3. Desenvolvimento com aplicacoes pastorais.\n4. Resposta em oracao e compromisso.\n5. Encerramento com proximos passos.`,
    pastor_liturgy: `Liturgia sugerida\nEntrada: acolhimento e oracao.\nAbertura: leitura biblica.\nLouvor: cancoes alinhadas ao tema.\nPalavra: exposicao e aplicacao.\nResposta: dizimos, ofertas e intercessao.\nEncerramento: envio pastoral.`,
    pastor_verses: `Versiculos sugeridos\n${verse}\nRomanos 12:1-2\nSalmo 119:105\nTiago 1:22\nColossenses 3:16`,
    pastor_duration: `Estimativa de duracao\nAbertura: 10 min\nLouvor: 25 min\nPalavra: 35 min\nResposta: 10 min\nEncerramento: 10 min\nTotal aproximado: 90 min`,
    pastor_post_summary: `Resumo pos-culto\nTema ministrado: ${theme}.\nResposta esperada: guardar a Palavra, praticar a fe e caminhar em comunhao durante a semana. Diferencie este texto como resumo de apoio, nao como transcricao oficial.`,
  };
  return map[kind];
};

export const cultoPlusService = {
  createService: async (input: CreateChurchServiceInput): Promise<ChurchService> => {
    const id = makeId('svc');
    const slugBase = generateSlug(`${input.churchSlug ?? input.churchName}-${input.title}-${input.startsAt.slice(0, 10)}`);
    const slug = `${slugBase}-${id.slice(-6)}`;
    const payload = toServicePayload(input, id, slug);
    const service = mapService(payload);

    try {
      let insertPayload: Record<string, any> = { ...payload };
      let { error } = await supabase.from('church_services').insert(insertPayload);

      for (let attempt = 0; error && attempt < 8; attempt++) {
        const missingColumn = getMissingColumnNameFromError(error);
        if (!isMissingColumnError(error) || !missingColumn || !(missingColumn in insertPayload)) break;
        delete insertPayload[missingColumn];
        const retry = await supabase.from('church_services').insert(insertPayload);
        error = retry.error;
      }

      if (error) {
        if (!isMissingServiceSchema(error)) throw new Error(`Erro ao criar culto. ${formatSupabaseError(error)}`);
        saveLocalService(service);
      }
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw error;
      saveLocalService(service);
    }

    return service;
  },

  getServicesByChurch: async (churchId: string, options?: { includeDrafts?: boolean; limit?: number }): Promise<ChurchService[]> => {
    try {
      let query = supabase
        .from('church_services')
        .select('*')
        .eq('church_id', churchId)
        .order('starts_at', { ascending: false })
        .limit(options?.limit ?? 12);

      if (!options?.includeDrafts) query = query.neq('status', 'draft').neq('status', 'archived');

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapService);
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw new Error(`Erro ao carregar cultos. ${formatSupabaseError(error)}`);
      const local = getLocalServices(churchId);
      return options?.limit ? local.slice(0, options.limit) : local;
    }
  },

  getServicesByChurchRange: async (churchId: string, options: ChurchServiceRangeOptions): Promise<ChurchService[]> => {
    const applyLocalFilters = (items: ChurchService[]) => {
      const startTime = new Date(options.startDate).getTime();
      const endTime = new Date(options.endDate).getTime();

      return items
        .filter((service) => {
          const serviceTime = new Date(service.startsAt).getTime();
          const statusAllowed = options.status?.length
            ? options.status.includes(service.status)
            : options.includeDrafts
              ? service.status !== 'archived'
              : service.status !== 'draft' && service.status !== 'archived';
          const typeAllowed = options.serviceTypes?.length ? options.serviceTypes.includes(service.serviceType) : true;
          return serviceTime >= startTime && serviceTime <= endTime && statusAllowed && typeAllowed;
        })
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .slice(0, options.limit ?? Number.POSITIVE_INFINITY);
    };

    try {
      let query = supabase
        .from('church_services')
        .select('*')
        .eq('church_id', churchId)
        .gte('starts_at', options.startDate)
        .lte('starts_at', options.endDate)
        .order('starts_at', { ascending: true });

      if (options.status?.length) {
        query = query.in('status', options.status);
      } else if (!options.includeDrafts) {
        query = query.neq('status', 'draft').neq('status', 'archived');
      } else {
        query = query.neq('status', 'archived');
      }

      if (options.serviceTypes?.length) query = query.in('service_type', options.serviceTypes);
      if (options.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapService);
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw new Error(`Erro ao carregar calendario de cultos. ${formatSupabaseError(error)}`);
      return applyLocalFilters(getLocalServices(churchId));
    }
  },

  getServiceBySlug: async (slug: string): Promise<ChurchService | null> => {
    try {
      const { data, error } = await supabase.from('church_services').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data ? mapService(data) : null;
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw new Error(`Erro ao carregar culto. ${formatSupabaseError(error)}`);
      return getLocalServices().find((service) => service.slug === slug) ?? null;
    }
  },

  updateService: async (serviceId: string, updates: UpdateChurchServiceInput): Promise<void> => {
    const payload: Record<string, any> = {
      title: updates.title,
      theme: updates.theme,
      preacher_name: updates.preacherName,
      service_type: updates.serviceType,
      starts_at: updates.startsAt,
      ends_at: updates.endsAt,
      key_verse_ref: updates.keyVerseRef,
      key_verse_text: updates.keyVerseText,
      banner_url: updates.bannerUrl,
      live_url: updates.liveUrl,
      status: updates.status,
      liturgy_items: updates.liturgyItems,
      updated_at: now(),
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    try {
      const { error } = await supabase.from('church_services').update(cleaned).eq('id', serviceId);
      if (error) throw error;
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw new Error(`Erro ao atualizar culto. ${formatSupabaseError(error)}`);
      const services = readStorage<ChurchService[]>(SERVICE_STORAGE_KEY, []);
      writeStorage(SERVICE_STORAGE_KEY, services.map((service) => service.id === serviceId ? {
        ...service,
        title: updates.title ?? service.title,
        theme: updates.theme ?? service.theme,
        preacherName: updates.preacherName ?? service.preacherName,
        serviceType: updates.serviceType ?? service.serviceType,
        startsAt: updates.startsAt ?? service.startsAt,
        endsAt: updates.endsAt ?? service.endsAt,
        keyVerseRef: updates.keyVerseRef ?? service.keyVerseRef,
        keyVerseText: updates.keyVerseText ?? service.keyVerseText,
        bannerUrl: updates.bannerUrl ?? service.bannerUrl,
        liveUrl: updates.liveUrl ?? service.liveUrl,
        status: updates.status ?? service.status,
        liturgyItems: updates.liturgyItems ?? service.liturgyItems,
        updatedAt: now(),
      } : service));
    }
  },

  archiveService: async (serviceId: string): Promise<void> => {
    await cultoPlusService.updateService(serviceId, { status: 'archived' });
  },

  getCheckinCount: async (serviceId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('service_checkins')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', serviceId);
      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      if (!isMissingServiceSchema(error)) return 0;
      return readStorage<ServiceCheckin[]>(CHECKIN_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length;
    }
  },

  getServiceStats: async (serviceId: string): Promise<ChurchServiceStats> => {
    try {
      const [visitors, checkins, posts, notes, prayers, verseSaves] = await Promise.all([
        supabase.from('service_visits').select('id', { count: 'exact', head: true }).eq('service_id', serviceId),
        supabase.from('service_checkins').select('id', { count: 'exact', head: true }).eq('service_id', serviceId),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('service_id', serviceId),
        supabase.from('service_notes').select('id', { count: 'exact', head: true }).eq('service_id', serviceId),
        supabase.from('service_prayer_requests').select('id', { count: 'exact', head: true }).eq('service_id', serviceId),
        supabase.from('service_verse_saves').select('id', { count: 'exact', head: true }).eq('service_id', serviceId),
      ]);
      if (visitors.error) throw visitors.error;
      if (checkins.error) throw checkins.error;
      if (posts.error) throw posts.error;
      if (notes.error) throw notes.error;
      if (prayers.error) throw prayers.error;
      if (verseSaves.error) throw verseSaves.error;
      return {
        visitorsCount: visitors.count ?? 0,
        checkinsCount: checkins.count ?? 0,
        postsCount: posts.count ?? 0,
        notesCount: notes.count ?? 0,
        prayersCount: prayers.count ?? 0,
        verseSavesCount: verseSaves.count ?? 0,
      };
    } catch (error) {
      const errorMessage = formatSupabaseError(error).toLowerCase();
      if (!isMissingServiceSchema(error) && !errorMessage.includes('service_prayer_requests') && !errorMessage.includes('service_verse_saves') && !errorMessage.includes('service_visits')) {
        return emptyStats();
      }
      return {
        visitorsCount: readStorage<Array<{ serviceId: string }>>(VISIT_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length,
        checkinsCount: readStorage<ServiceCheckin[]>(CHECKIN_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length,
        postsCount: 0,
        notesCount: readStorage<ServiceNote[]>(NOTE_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length,
        prayersCount: readStorage<ServicePrayerRequest[]>(PRAYER_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length,
        verseSavesCount: readStorage<Array<{ serviceId: string }>>(VERSE_SAVE_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length,
      };
    }
  },

  recordVisit: async (service: ChurchService, user?: any): Promise<number> => {
    const sessionId = getVisitSessionId();
    const localVisits = readStorage<Array<{ id: string; serviceId: string; churchId: string; sessionId: string; userId?: string; createdAt: string }>>(VISIT_STORAGE_KEY, []);
    const alreadyTracked = localVisits.some((item) => item.serviceId === service.id && item.sessionId === sessionId);
    const userId = user?.uid ?? user?.id ?? null;

    if (!alreadyTracked) {
      writeStorage(VISIT_STORAGE_KEY, [
        ...localVisits,
        {
          id: makeId('visit'),
          serviceId: service.id,
          churchId: service.churchId,
          sessionId,
          userId: userId ?? undefined,
          createdAt: now(),
        },
      ]);
    }

    try {
      const { error } = await supabase
        .from('service_visits')
        .upsert({
          service_id: service.id,
          church_id: service.churchId,
          user_id: userId,
          session_id: sessionId,
        }, { onConflict: 'service_id,session_id', ignoreDuplicates: true });
      if (error) throw error;
      return readStorage<Array<{ serviceId: string }>>(VISIT_STORAGE_KEY, []).filter((item) => item.serviceId === service.id).length;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_visits')) return 0;
      return readStorage<Array<{ serviceId: string }>>(VISIT_STORAGE_KEY, []).filter((item) => item.serviceId === service.id).length;
    }
  },

  getServiceCheckins: async (serviceId: string): Promise<ServiceCheckin[]> => {
    try {
      const { data, error } = await supabase
        .from('service_checkins')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((item: any) => ({
        id: item.id,
        serviceId: item.service_id,
        churchId: item.church_id,
        userId: item.user_id,
        userDisplayName: item.user_display_name ?? 'Membro',
        userPhotoURL: item.user_photo_url ?? null,
        createdAt: item.created_at,
      }));
    } catch (error) {
      if (!isMissingServiceSchema(error)) return [];
      return readStorage<ServiceCheckin[]>(CHECKIN_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId);
    }
  },

  getMinistriesByChurch: async (churchId: string): Promise<ServiceMinistry[]> => {
    try {
      const { data, error } = await supabase
        .from('service_ministries')
        .select('*')
        .eq('church_id', churchId)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapMinistry);
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_ministries')) return [];
      return readStorage<ServiceMinistry[]>(MINISTRY_STORAGE_KEY, [])
        .filter((item) => item.churchId === churchId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  createMinistry: async (churchId: string, userId: string, name: string, description = ''): Promise<ServiceMinistry> => {
    const ministry: ServiceMinistry = {
      id: makeId('min'),
      churchId,
      name,
      description: description || undefined,
      createdBy: userId,
      createdAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_ministries')
        .insert({
          id: ministry.id,
          church_id: churchId,
          name,
          description: description || null,
          created_by: userId,
          created_at: ministry.createdAt,
        })
        .select()
        .single();
      if (error) throw error;
      return data ? mapMinistry(data) : ministry;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_ministries')) {
        throw new Error(`Erro ao criar ministerio. ${formatSupabaseError(error)}`);
      }
      const ministries = readStorage<ServiceMinistry[]>(MINISTRY_STORAGE_KEY, []);
      writeStorage(MINISTRY_STORAGE_KEY, [ministry, ...ministries]);
      return ministry;
    }
  },

  getMinistryMembers: async (churchId: string, ministryId?: string): Promise<ServiceMinistryMember[]> => {
    try {
      let query = supabase
        .from('service_ministry_members')
        .select('*')
        .eq('church_id', churchId)
        .order('user_display_name', { ascending: true });
      if (ministryId) query = query.eq('ministry_id', ministryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapMinistryMember);
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_ministry_members')) return [];
      return readStorage<ServiceMinistryMember[]>(MINISTRY_MEMBER_STORAGE_KEY, [])
        .filter((item) => item.churchId === churchId && (!ministryId || item.ministryId === ministryId))
        .sort((a, b) => a.userDisplayName.localeCompare(b.userDisplayName));
    }
  },

  addMinistryMember: async (ministry: ServiceMinistry, member: UserProfile, role = ''): Promise<ServiceMinistryMember> => {
    const entry: ServiceMinistryMember = {
      id: makeId('minmem'),
      ministryId: ministry.id,
      churchId: ministry.churchId,
      userId: member.uid,
      userDisplayName: member.displayName,
      userPhotoURL: member.photoURL,
      role: role || undefined,
      createdAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_ministry_members')
        .upsert({
          id: entry.id,
          ministry_id: ministry.id,
          church_id: ministry.churchId,
          user_id: member.uid,
          user_display_name: member.displayName,
          user_photo_url: member.photoURL ?? null,
          role: role || null,
          created_at: entry.createdAt,
        }, { onConflict: 'ministry_id,user_id' })
        .select()
        .single();
      if (error) throw error;
      return data ? mapMinistryMember(data) : entry;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_ministry_members')) {
        throw new Error(`Erro ao vincular membro. ${formatSupabaseError(error)}`);
      }
      const members = readStorage<ServiceMinistryMember[]>(MINISTRY_MEMBER_STORAGE_KEY, []);
      const next = [entry, ...members.filter((item) => !(item.ministryId === ministry.id && item.userId === member.uid))];
      writeStorage(MINISTRY_MEMBER_STORAGE_KEY, next);
      return entry;
    }
  },

  getScheduleAssignments: async (serviceId: string): Promise<ServiceScheduleAssignment[]> => {
    try {
      const { data, error } = await supabase
        .from('service_schedule_assignments')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapScheduleAssignment);
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_schedule_assignments')) return [];
      return readStorage<ServiceScheduleAssignment[]>(SCHEDULE_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId);
    }
  },

  createScheduleAssignment: async (service: ChurchService, ministry: ServiceMinistry, member: UserProfile, role = ''): Promise<ServiceScheduleAssignment> => {
    const assignment: ServiceScheduleAssignment = {
      id: makeId('sched'),
      serviceId: service.id,
      churchId: service.churchId,
      ministryId: ministry.id,
      ministryName: ministry.name,
      userId: member.uid,
      userDisplayName: member.displayName,
      userPhotoURL: member.photoURL,
      role: role || undefined,
      status: 'pending',
      reminderSentAt: null,
      createdAt: now(),
      updatedAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_schedule_assignments')
        .upsert({
          id: assignment.id,
          service_id: service.id,
          church_id: service.churchId,
          ministry_id: ministry.id,
          ministry_name: ministry.name,
          user_id: member.uid,
          user_display_name: member.displayName,
          user_photo_url: member.photoURL ?? null,
          role: role || null,
          status: 'pending',
          created_at: assignment.createdAt,
          updated_at: assignment.updatedAt,
        }, { onConflict: 'service_id,ministry_id,user_id' })
        .select()
        .single();
      if (error) throw error;
      return data ? mapScheduleAssignment(data) : assignment;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_schedule_assignments')) {
        throw new Error(`Erro ao criar escala. ${formatSupabaseError(error)}`);
      }
      const assignments = readStorage<ServiceScheduleAssignment[]>(SCHEDULE_STORAGE_KEY, []);
      const next = [assignment, ...assignments.filter((item) => !(item.serviceId === service.id && item.ministryId === ministry.id && item.userId === member.uid))];
      writeStorage(SCHEDULE_STORAGE_KEY, next);
      return assignment;
    }
  },

  updateScheduleAssignmentStatus: async (assignmentId: string, status: ServiceScheduleStatus): Promise<void> => {
    try {
      const { error } = await supabase
        .from('service_schedule_assignments')
        .update({ status, updated_at: now() })
        .eq('id', assignmentId);
      if (error) throw error;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_schedule_assignments')) {
        throw new Error(`Erro ao atualizar escala. ${formatSupabaseError(error)}`);
      }
      const assignments = readStorage<ServiceScheduleAssignment[]>(SCHEDULE_STORAGE_KEY, []);
      writeStorage(SCHEDULE_STORAGE_KEY, assignments.map((item) => item.id === assignmentId ? { ...item, status, updatedAt: now() } : item));
    }
  },

  markScheduleReminderSent: async (assignmentId: string): Promise<void> => {
    const reminderSentAt = now();
    try {
      const { error } = await supabase
        .from('service_schedule_assignments')
        .update({ reminder_sent_at: reminderSentAt, updated_at: reminderSentAt })
        .eq('id', assignmentId);
      if (error) throw error;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_schedule_assignments')) {
        throw new Error(`Erro ao registrar lembrete. ${formatSupabaseError(error)}`);
      }
      const assignments = readStorage<ServiceScheduleAssignment[]>(SCHEDULE_STORAGE_KEY, []);
      writeStorage(SCHEDULE_STORAGE_KEY, assignments.map((item) => item.id === assignmentId ? { ...item, reminderSentAt, updatedAt: reminderSentAt } : item));
    }
  },

  replaceScheduleAssignment: async (assignmentId: string, replacement: UserProfile): Promise<void> => {
    try {
      const { error } = await supabase
        .from('service_schedule_assignments')
        .update({
          status: 'replaced',
          replacement_user_id: replacement.uid,
          replacement_user_display_name: replacement.displayName,
          updated_at: now(),
        })
        .eq('id', assignmentId);
      if (error) throw error;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_schedule_assignments')) {
        throw new Error(`Erro ao substituir escala. ${formatSupabaseError(error)}`);
      }
      const assignments = readStorage<ServiceScheduleAssignment[]>(SCHEDULE_STORAGE_KEY, []);
      writeStorage(SCHEDULE_STORAGE_KEY, assignments.map((item) => item.id === assignmentId ? {
        ...item,
        status: 'replaced',
        replacementUserId: replacement.uid,
        replacementUserDisplayName: replacement.displayName,
        updatedAt: now(),
      } : item));
    }
  },

  getPlanMatrix: (tier: SubscriptionTier) => CULTO_PLUS_PLAN_MATRIX[tier] ?? CULTO_PLUS_PLAN_MATRIX.free,

  canCreateServiceForChurch: async (churchId: string, tier: SubscriptionTier): Promise<{ allowed: boolean; used: number; limit: number | null }> => {
    const plan = CULTO_PLUS_PLAN_MATRIX[tier] ?? CULTO_PLUS_PLAN_MATRIX.free;
    const limit = plan.monthlyServiceLimit;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let used = 0;
    try {
      const { count, error } = await supabase
        .from('church_services')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .gte('created_at', monthStart.toISOString());
      if (error) throw error;
      used = count ?? 0;
    } catch (error) {
      const services = readStorage<ChurchService[]>(SERVICE_STORAGE_KEY, []);
      used = services.filter((service) => service.churchId === churchId && new Date(service.createdAt).getTime() >= monthStart.getTime()).length;
    }

    return { allowed: limit === null || used < limit, used, limit };
  },

  getLiveState: async (serviceId: string): Promise<ServiceLiveState | null> => {
    try {
      const { data, error } = await supabase
        .from('service_live_states')
        .select('*')
        .eq('service_id', serviceId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapLiveState(data) : null;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_live_states')) return null;
      return readStorage<ServiceLiveState[]>(LIVE_STATE_STORAGE_KEY, []).find((item) => item.serviceId === serviceId) ?? null;
    }
  },

  updateLiveState: async (service: ChurchService, operatorId: string, updates: Partial<ServiceLiveState>): Promise<ServiceLiveState> => {
    const state: ServiceLiveState = {
      serviceId: service.id,
      churchId: service.churchId,
      currentItemId: updates.currentItemId ?? null,
      currentTitle: updates.currentTitle ?? null,
      currentVerseRef: updates.currentVerseRef ?? null,
      currentVerseText: updates.currentVerseText ?? null,
      currentExplanation: updates.currentExplanation ?? null,
      operatorId,
      updatedAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_live_states')
        .upsert({
          service_id: service.id,
          church_id: service.churchId,
          current_item_id: state.currentItemId,
          current_title: state.currentTitle,
          current_verse_ref: state.currentVerseRef,
          current_verse_text: state.currentVerseText,
          current_explanation: state.currentExplanation,
          operator_id: operatorId,
          updated_at: state.updatedAt,
        }, { onConflict: 'service_id' })
        .select()
        .single();
      if (error) throw error;
      return data ? mapLiveState(data) : state;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_live_states')) {
        throw new Error(`Erro ao atualizar culto ao vivo. ${formatSupabaseError(error)}`);
      }
      const states = readStorage<ServiceLiveState[]>(LIVE_STATE_STORAGE_KEY, []);
      writeStorage(LIVE_STATE_STORAGE_KEY, [state, ...states.filter((item) => item.serviceId !== service.id)]);
      return state;
    }
  },

  generateServicePlanning: async (input: GenerateServicePlanningInput): Promise<CultoPlusPlanningSuggestion> => {
    const raw = await generateChurchServicePlanning(input.verseReference, input.verseText, input.userPrompt);
    if (!raw) {
      throw new Error('Nao foi possivel gerar o planejamento do culto.');
    }
    return normalizePlanningSuggestion(raw);
  },

  generateAiContent: async (kind: ServiceAiContentKind, service: ChurchService, userId: string, notes = ''): Promise<ServiceAiContent> => {
    let content = '';
    const context = buildServiceContext(service, notes);
    try {
      if (kind === 'member_prayer') {
        const prayer = await generateSpecificPrayer(`${service.theme}\n${context}`, 'culto');
        content = prayer?.content || '';
      } else {
        content = await generateSermonOutline(context, service.theme, kind.startsWith('pastor') ? 'pastor e lideranca' : 'membros da igreja', service.title);
      }
    } catch {
      content = '';
    }

    const aiContent: ServiceAiContent = {
      id: makeId('svcai'),
      serviceId: service.id,
      userId,
      kind,
      content: content?.trim() || fallbackAiContent(kind, service),
      createdAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_ai_contents')
        .insert({
          id: aiContent.id,
          service_id: service.id,
          user_id: userId,
          kind,
          content: aiContent.content,
          created_at: aiContent.createdAt,
        })
        .select()
        .single();
      if (error) throw error;
      return data ? {
        id: data.id,
        serviceId: data.service_id,
        userId: data.user_id,
        kind: data.kind,
        content: data.content,
        createdAt: data.created_at,
      } : aiContent;
    } catch (error) {
      const items = readStorage<ServiceAiContent[]>(AI_CONTENT_STORAGE_KEY, []);
      writeStorage(AI_CONTENT_STORAGE_KEY, [aiContent, ...items]);
      return aiContent;
    }
  },

  getAdvancedAnalytics: async (serviceId: string): Promise<ServiceAdvancedAnalytics> => {
    const [stats, reactions, schedules] = await Promise.all([
      cultoPlusService.getServiceStats(serviceId),
      cultoPlusService.getReactionSummary(serviceId),
      cultoPlusService.getScheduleAssignments(serviceId),
    ]);
    const reactionsCount = reactions.amen + reactions.glory + reactions.hallelujah;
    const engagementActions = stats.checkinsCount + stats.postsCount + stats.notesCount + stats.prayersCount + stats.verseSavesCount + reactionsCount;
    const engagementRate = stats.visitorsCount > 0 ? Math.round((engagementActions / stats.visitorsCount) * 100) : 0;
    return {
      ...stats,
      reactionsCount,
      schedulesCount: schedules.length,
      pendingSchedulesCount: schedules.filter((item) => item.status === 'pending').length,
      engagementRate,
    };
  },

  exportServiceReport: async (service: ChurchService): Promise<string> => {
    const [stats, reactions, schedules] = await Promise.all([
      cultoPlusService.getServiceStats(service.id),
      cultoPlusService.getReactionSummary(service.id),
      cultoPlusService.getScheduleAssignments(service.id),
    ]);
    const reactionsCount = reactions.amen + reactions.glory + reactions.hallelujah;
    const engagementActions = stats.checkinsCount + stats.postsCount + stats.notesCount + stats.prayersCount + stats.verseSavesCount + reactionsCount;
    const analytics = {
      ...stats,
      reactionsCount,
      schedulesCount: schedules.length,
      pendingSchedulesCount: schedules.filter((item) => item.status === 'pending').length,
      engagementRate: stats.visitorsCount > 0 ? Math.round((engagementActions / stats.visitorsCount) * 100) : 0,
    };
    const rows = [
      ['Culto', service.title],
      ['Igreja', service.churchName],
      ['Tema', service.theme],
      ['Inicio', service.startsAt],
      ['Visitantes', analytics.visitorsCount],
      ['Check-ins', analytics.checkinsCount],
      ['Posts', analytics.postsCount],
      ['Anotacoes', analytics.notesCount],
      ['Pedidos de oracao', analytics.prayersCount],
      ['Versiculos salvos', analytics.verseSavesCount],
      ['Reacoes', analytics.reactionsCount],
      ['Amen', reactions.amen],
      ['Gloria', reactions.glory],
      ['Aleluia', reactions.hallelujah],
      ['Escalados', schedules.length],
      ['Escalas pendentes', analytics.pendingSchedulesCount],
      ['Engajamento percentual', `${analytics.engagementRate}%`],
    ];
    return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  },

  getReactionSummary: async (serviceId: string): Promise<ServiceReactionSummary> => {
    try {
      const { data, error } = await supabase
        .from('service_reactions')
        .select('reaction_type')
        .eq('service_id', serviceId);
      if (error) throw error;
      return (data ?? []).reduce((summary: ServiceReactionSummary, row: any) => {
        const type = row.reaction_type as ServiceReactionType;
        if (type in summary) summary[type] += 1;
        return summary;
      }, emptyReactionSummary());
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_reactions')) return emptyReactionSummary();
      return readStorage<Array<{ serviceId: string; reactionType: ServiceReactionType }>>(REACTION_STORAGE_KEY, [])
        .filter((item) => item.serviceId === serviceId)
        .reduce((summary, item) => {
          summary[item.reactionType] += 1;
          return summary;
        }, emptyReactionSummary());
    }
  },

  reactToService: async (serviceId: string, userId: string, reactionType: ServiceReactionType): Promise<ServiceReactionSummary> => {
    try {
      const { error } = await supabase.from('service_reactions').upsert({
        service_id: serviceId,
        user_id: userId,
        reaction_type: reactionType,
        created_at: now(),
      }, { onConflict: 'service_id,user_id,reaction_type' });
      if (error) throw error;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_reactions')) {
        throw new Error(`Erro ao registrar reacao. ${formatSupabaseError(error)}`);
      }
      const reactions = readStorage<Array<{ serviceId: string; userId: string; reactionType: ServiceReactionType }>>(REACTION_STORAGE_KEY, []);
      const exists = reactions.some((item) => item.serviceId === serviceId && item.userId === userId && item.reactionType === reactionType);
      if (!exists) writeStorage(REACTION_STORAGE_KEY, [{ serviceId, userId, reactionType }, ...reactions]);
    }
    return cultoPlusService.getReactionSummary(serviceId);
  },

  createPrayerRequest: async (service: ChurchService, user: any, profile: UserProfile, content: string, isPrivate: boolean): Promise<ServicePrayerRequest> => {
    const userId = user.uid ?? user.id;
    const prayer: ServicePrayerRequest = {
      id: makeId('spr'),
      serviceId: service.id,
      churchId: service.churchId,
      userId,
      userName: profile.displayName,
      userPhotoURL: profile.photoURL,
      content,
      isPrivate,
      intercessorsCount: 0,
      createdAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_prayer_requests')
        .insert({
          id: prayer.id,
          service_id: service.id,
          church_id: service.churchId,
          user_id: userId,
          user_name: profile.displayName,
          user_photo_url: profile.photoURL ?? null,
          content,
          is_private: isPrivate,
          intercessors_count: 0,
          created_at: prayer.createdAt,
        })
        .select()
        .single();
      if (error) throw error;
      return data ? { ...prayer, id: data.id, createdAt: data.created_at } : prayer;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_prayer_requests')) {
        throw new Error(`Erro ao criar pedido de oracao. ${formatSupabaseError(error)}`);
      }
      const prayers = readStorage<ServicePrayerRequest[]>(PRAYER_STORAGE_KEY, []);
      writeStorage(PRAYER_STORAGE_KEY, [prayer, ...prayers]);
      return prayer;
    }
  },

  getPublicPrayerRequests: async (serviceId: string): Promise<ServicePrayerRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('service_prayer_requests')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        serviceId: row.service_id,
        churchId: row.church_id,
        userId: row.user_id,
        userName: row.user_name ?? 'Membro',
        userPhotoURL: row.user_photo_url ?? null,
        content: row.content ?? '',
        isPrivate: row.is_private ?? false,
        intercessorsCount: row.intercessors_count ?? 0,
        createdAt: row.created_at,
      }));
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_prayer_requests')) return [];
      return readStorage<ServicePrayerRequest[]>(PRAYER_STORAGE_KEY, [])
        .filter((item) => item.serviceId === serviceId && !item.isPrivate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);
    }
  },

  intercedePrayerRequest: async (prayerId: string, serviceId: string, userId: string): Promise<number> => {
    try {
      const { error } = await supabase.from('service_prayer_intercessions').upsert({
        prayer_id: prayerId,
        service_id: serviceId,
        user_id: userId,
        created_at: now(),
      }, { onConflict: 'prayer_id,user_id' });
      if (error) throw error;
      const { count } = await supabase
        .from('service_prayer_intercessions')
        .select('id', { count: 'exact', head: true })
        .eq('prayer_id', prayerId);
      return count ?? 0;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_prayer_intercessions')) {
        throw new Error(`Erro ao registrar intercessao. ${formatSupabaseError(error)}`);
      }
      const intercessions = readStorage<Array<{ prayerId: string; serviceId: string; userId: string }>>(PRAYER_INTERCESSION_STORAGE_KEY, []);
      const exists = intercessions.some((item) => item.prayerId === prayerId && item.userId === userId);
      const next = exists ? intercessions : [{ prayerId, serviceId, userId }, ...intercessions];
      writeStorage(PRAYER_INTERCESSION_STORAGE_KEY, next);
      return next.filter((item) => item.prayerId === prayerId).length;
    }
  },

  saveKeyVerse: async (service: ChurchService, userId: string): Promise<number> => {
    try {
      const { error } = await supabase.from('service_verse_saves').upsert({
        service_id: service.id,
        church_id: service.churchId,
        user_id: userId,
        verse_ref: service.keyVerseRef ?? null,
        verse_text: service.keyVerseText ?? null,
        created_at: now(),
      }, { onConflict: 'service_id,user_id' });
      if (error) throw error;
      const { count } = await supabase
        .from('service_verse_saves')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', service.id);
      return count ?? 0;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_verse_saves')) {
        throw new Error(`Erro ao salvar versiculo. ${formatSupabaseError(error)}`);
      }
      const saves = readStorage<Array<{ serviceId: string; userId: string }>>(VERSE_SAVE_STORAGE_KEY, []);
      const exists = saves.some((item) => item.serviceId === service.id && item.userId === userId);
      const next = exists ? saves : [{ serviceId: service.id, userId }, ...saves];
      writeStorage(VERSE_SAVE_STORAGE_KEY, next);
      return next.filter((item) => item.serviceId === service.id).length;
    }
  },

  getKeyVerseSaveCount: async (serviceId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('service_verse_saves')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', serviceId);
      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      if (!isMissingServiceSchema(error) && !formatSupabaseError(error).toLowerCase().includes('service_verse_saves')) return 0;
      return readStorage<Array<{ serviceId: string }>>(VERSE_SAVE_STORAGE_KEY, []).filter((item) => item.serviceId === serviceId).length;
    }
  },

  hasCheckedIn: async (serviceId: string, userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('service_checkins')
        .select('id')
        .eq('service_id', serviceId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data?.id);
    } catch (error) {
      if (!isMissingServiceSchema(error)) return false;
      return readStorage<ServiceCheckin[]>(CHECKIN_STORAGE_KEY, []).some((item) => item.serviceId === serviceId && item.userId === userId);
    }
  },

  getUserCheckedInServices: async (userId: string, limit = 24): Promise<UserCheckedInService[]> => {
    try {
      const { data: checkins, error } = await supabase
        .from('service_checkins')
        .select('service_id,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      const serviceIds = [...new Set((checkins ?? []).map((item: any) => item.service_id).filter(Boolean))];
      if (serviceIds.length === 0) return [];

      const { data: services, error: servicesError } = await supabase
        .from('church_services')
        .select('*')
        .in('id', serviceIds);
      if (servicesError) throw servicesError;

      const servicesById = new Map((services ?? []).map((row: any) => [row.id, mapService(row)]));
      return (checkins ?? [])
        .map((checkin: any) => {
          const service = servicesById.get(checkin.service_id);
          return service ? { service, checkedInAt: checkin.created_at } : null;
        })
        .filter(Boolean) as UserCheckedInService[];
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw new Error(`Erro ao carregar seus cultos. ${formatSupabaseError(error)}`);
      const localCheckins = readStorage<ServiceCheckin[]>(CHECKIN_STORAGE_KEY, [])
        .filter((item) => item.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      const servicesById = new Map(getLocalServices().map((service) => [service.id, service]));
      return localCheckins
        .map((checkin) => {
          const service = servicesById.get(checkin.serviceId);
          return service ? { service, checkedInAt: checkin.createdAt } : null;
        })
        .filter(Boolean) as UserCheckedInService[];
    }
  },

  checkIn: async (service: ChurchService, user: any, profile: UserProfile): Promise<void> => {
    const userId = user.uid ?? user.id;
    const payload = {
      id: makeId('chk'),
      service_id: service.id,
      church_id: service.churchId,
      user_id: userId,
      user_display_name: profile.displayName,
      user_photo_url: profile.photoURL ?? null,
      created_at: now(),
    };

    try {
      const { error } = await supabase.from('service_checkins').upsert(payload, { onConflict: 'service_id,user_id' });
      if (error) throw error;
    } catch (error) {
      if (!isMissingServiceSchema(error)) throw new Error(`Erro ao fazer check-in. ${formatSupabaseError(error)}`);
      const checkins = readStorage<ServiceCheckin[]>(CHECKIN_STORAGE_KEY, []);
      const exists = checkins.some((item) => item.serviceId === service.id && item.userId === userId);
      if (!exists) {
        writeStorage(CHECKIN_STORAGE_KEY, [{
          id: payload.id,
          serviceId: service.id,
          churchId: service.churchId,
          userId,
          userDisplayName: profile.displayName,
          userPhotoURL: profile.photoURL,
          createdAt: payload.created_at,
        }, ...checkins]);
      }
    }
  },

  getMyNote: async (serviceId: string, userId: string): Promise<ServiceNote | null> => {
    try {
      const { data, error } = await supabase
        .from('service_notes')
        .select('*')
        .eq('service_id', serviceId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapServiceNote(data);
    } catch (error) {
      if (!isMissingServiceSchema(error)) return null;
      return getLocalServiceNotes(serviceId, userId)[0] ?? null;
    }
  },

  getMyNotes: async (serviceId: string, userId: string): Promise<ServiceNote[]> => {
    try {
      const { data, error } = await supabase
        .from('service_notes')
        .select('*')
        .eq('service_id', serviceId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const remoteNotes = (data ?? []).map(mapServiceNote);
      const localOnlyNotes = getLocalServiceNotes(serviceId, userId)
        .filter((localNote) => !remoteNotes.some((remoteNote) => remoteNote.id === localNote.id));
      return [...localOnlyNotes, ...remoteNotes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      if (!isMissingServiceSchema(error)) return [];
      return getLocalServiceNotes(serviceId, userId);
    }
  },

  saveNote: async (serviceId: string, userId: string, content: string, tags: string[] = []): Promise<ServiceNote> => {
    const note: ServiceNote = {
      id: makeId('note'),
      serviceId,
      userId,
      content,
      tags,
      createdAt: now(),
      updatedAt: now(),
    };

    try {
      const { data, error } = await supabase
        .from('service_notes')
        .insert({
          service_id: serviceId,
          user_id: userId,
          content,
          tags,
          updated_at: note.updatedAt,
          created_at: note.createdAt,
        })
        .select()
        .single();
      if (error) throw error;
      return data ? mapServiceNote(data) : note;
    } catch (error) {
      const formattedError = formatSupabaseError(error);
      const canUseLocalFallback = isMissingServiceSchema(error) || formattedError.includes('23505') || formattedError.includes('service_notes_service_id_user_id_key');
      if (!canUseLocalFallback) throw new Error(`Erro ao salvar anotacao. ${formattedError}`);
      const notes = readStorage<ServiceNote[]>(NOTE_STORAGE_KEY, []);
      writeStorage(NOTE_STORAGE_KEY, [note, ...notes]);
      return note;
    }
  },

  createServicePost: async ({ service, user, profile, content }: ServicePostInput): Promise<void> => {
    await dbService.createPost({
      userId: user.uid ?? user.id,
      userDisplayName: profile.displayName,
      userUsername: profile.username,
      userPhotoURL: profile.photoURL,
      type: 'reflection',
      content,
      destination: 'church',
      churchId: service.churchId,
      alsoShowOnChurch: true,
      serviceId: service.id,
      serviceTitle: service.title,
      location: service.churchName,
      createdAt: now(),
      likesCount: 0,
      commentsCount: 0,
      shares: 0,
      likes: 0,
      comments: 0,
      saved: false,
      likedBy: [],
      time: 'Agora',
    });
  },

  getServicePosts: async (serviceId: string): Promise<Post[]> => {
    try {
      return await dbService.getServiceFeedPosts(serviceId);
    } catch {
      return [];
    }
  },
};
