
export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'pastor' | 'admin';
export type GeneralProfileType = 'user' | 'pastor' | 'manager';
export type AppHelpModule = 'inicio' | 'biblia' | 'reino' | 'culto-plus' | 'historico' | 'planos' | 'perfil' | 'ia';

export interface AppHelpArticle {
  id: string;
  title: string;
  intentKeywords: string[];
  module: AppHelpModule;
  audience?: SubscriptionTier[];
  route?: string;
  steps: string[];
  relatedQuestions: string[];
  unavailableFallback?: string;
  updatedAt: string;
}

export type MoodType = 'feliz' | 'grato' | 'paz' | 'cansado' | 'ansioso' | 'triste' | 'blessed' | 'thoughtful' | 'help' | 'fire';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ContentType = 'study' | 'quiz' | 'plan' | 'room' | 'article' | 'track' | 'note';
export type BibleCategory = 'Pentateuco' | 'Históricos' | 'Poéticos' | 'Proféticos' | 'Evangelhos' | 'Epístolas' | 'Revelação' | 'Geral';
export type StudySource = 'leitura' | 'devocional' | 'chat' | 'podcast' | 'sermon' | 'geral' | 'plano' | 'modulo' | 'trilha';
export type ActionType = 'reading_chapter' | 'daily_goal' | 'reading_presence' | 'devotional' | 'deep_study' | 'create_image' | 'share_content' | 'mark_verse' | 'create_sermon' | 'use_chat' | 'quiz_completion' | 'social_follow' | 'prayer_wall' | 'create_note' | 'social_like' | 'social_post' | 'start_module' | 'create_study' | 'join_plan' | 'create_evaluation' | 'finish_track' | 'collect_artifact' | 'social_interaction' | 'invite_sent' | 'invite_accepted' | 'social_comment' | 'social_mention' | 'group_comment' | 'church_comment' | 'content_share' | 'plan_comment' | 'culto_checkin';
export type PostVisibility = 'public' | 'followers' | 'church' | 'group' | 'private';
export type PostFeedReason = 'own_post' | 'following' | 'same_church' | 'same_group' | 'public_discovery' | 'global_public';
export type PlanScope = 'all' | 'new_testament' | 'old_testament';
export type PlanDuration = '7' | '30' | '90' | '180' | '365' | string;
export type PlanningFrequency = 'daily' | 'weekly' | 'monthly';

// --- NEW MODULES ---

export interface ReadingTrack {
  id: string;
  title: string;
  description: string;
  authorId: string; // 'system-ai' ou UID do pastor
  authorName: string;
  churchId?: string; // Se for conteúdo local
  scope: 'global' | 'church' | 'personal';
  tags: string[];
  steps: TrackStep[];
  createdAt: string;
  completions?: number;
}

export interface TrackStep {
  id: string;
  bookId: string;
  chapter: number;
  verses?: string; // ex: "1-10"
  comment?: string; // Comentário pastoral ou da IA sobre este passo
  devotionalHtml?: string;
  commentAuthor?: 'pastor' | 'ai';
  videoUrl?: string; // Phase 3: Vídeos curtos do púlpito
  isCompleted?: boolean; // Estado local visual (não salvo no banco por enquanto para simplificar)
}

export interface GuidedPrayer {
  id: string;
  title: string;
  content: string; // HTML ou texto rico
  category: 'morning' | 'night' | 'anxiety' | 'warfare' | 'gratitude' | 'family' | 'general';
  authorId: string;
  authorName: string;
  generatedBy?: 'pastor' | 'ai'; // Adicionado para autoria
  churchId?: string;
  audioUrl?: string; // URL do Storage ou gerado via TTS
  isTemplate: boolean; // Se true, pode ser usado como base para gerar outros
  createdAt: string;
  likes?: number;
  shares?: number; // Adicionado para compartilhamentos
}

// --- METRICS ---
export interface ContentMetrics {
  views: number;
  shares: number;
  completions?: number;
  likes?: number;
}

// --- LANDING PAGE CMS ---
export interface LandingPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  featureSectionTitle: string;
  featureSectionDesc: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaButtonText: string;
}

// --- HOME DASHBOARD CMS (SANTUÁRIO) ---
export interface HomeConfig {
  hero: {
    type: 'verse_of_day' | 'custom';
    customTitle?: string;
    customSubtitle?: string;
    customImageUrl?: string;
    customLink?: string; // Route path
  };
  shortcuts: {
    devotional: { label: string; active: boolean };
    readingPlan: { label: string; active: boolean };
    activeJourneys: { label: string; active: boolean };
  };
  sections: {
    discovery: { active: boolean; title: string };
    profileWidget: { active: boolean };
    quickAccess: { active: boolean };
    prayerWidget: { active: boolean };
  };
  promoBanners: Banner[];
}

// --- WISDOM STREAM TYPES ---
export type FeedItemType = 'hero_reading' | 'devotional' | 'ranking_duel' | 'flash_quiz' | 'social_echo' | 'journey_continue' | 'creative_challenge' | 'plan_goal';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  priority: number;
  data: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'badge' | 'social';
  timestamp: string;
  read: boolean;
  link?: string;
  icon?: string;
}

export type GroupPrivacy = 'public' | 'private';
export type ContentPrivacyLevel = 'public' | 'private' | 'invite_only' | 'church' | 'group' | 'church_groups';
export type ContentCreationScope = 'user' | 'church' | 'group';
export type GroupAccessInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type GroupAccessInviteSource = 'invite' | 'mention';

export type StudyBlockType =
  | 'free-text'
  | 'hero'
  | 'authority'
  | 'biblical'
  | 'video'
  | 'footer'
  | 'study-content'
  | 'slide'
  | 'hero-split'
  | 'study-outline'
  | 'related-verses'
  | 'reflection-question'
  | 'references-chain'
  | 'cta'
  | 'rich-text'
  | 'spacer';

export type StudyLegacyLayoutWidth = '1/1' | '2/3' | '1/2' | '1/3';
export type StudyLayoutSpan = 12 | 8 | 6 | 4;

export interface StudyEditorBlock<TData extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: StudyBlockType;
  data: TData;
  layoutWidth?: StudyLegacyLayoutWidth;
  layout?: {
    span: StudyLayoutSpan;
  };
}

export interface StudyDocumentV2 {
  schemaVersion: 2;
  id?: string;
  revision: number;
  context: 'standalone' | 'roomLesson';
  title: string;
  description: string;
  category: string;
  tags: string[];
  bibleReference?: {
    reference: string;
    text?: string;
    version?: string;
  };
  blocks: StudyEditorBlock[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface StudyPersistenceState {
  revision: number;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'conflict' | 'error';
}

export type StudyStudioMode = 'standalone' | 'roomLesson';

export interface StudyStudioCapabilities {
  canConfigureAudience: boolean;
  canExportPdf: boolean;
  canPublishStandalone: boolean;
  canShareToKingdom: boolean;
  canUseAI: boolean;
  finalActionLabel: 'Pré-visualizar' | 'Concluir aula';
}

export interface StudyStudioConfig {
  mode: StudyStudioMode;
  draftId: string;
  capabilities: StudyStudioCapabilities;
}

export interface GroupAccessInvite {
  id: string;
  groupId: string;
  churchId: string;
  invitedUserId: string;
  invitedByUserId: string;
  status: GroupAccessInviteStatus;
  source: GroupAccessInviteSource;
  token?: string;
  expiresAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface ContentVisibilityContext {
  scope: ContentCreationScope;
  visibility: ContentPrivacyLevel;
  churchId?: string;
  churchName?: string;
  groupId?: string;
  groupName?: string;
  contextLabel?: string;
}

// --- CMS TYPES ---
export interface Banner {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  active: boolean;
  priority: number;
  type: 'hero' | 'alert';
  createdAt?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: 'serif' | 'sans';
  lineHeight: 'normal' | 'relaxed';
  smartReadingMode?: boolean;
  bibleVersion?: string; // versao ativa na leitura atual
  defaultBibleVersion?: string; // versao padrao persistida do usuario
}

// --- WORKSPACE & CONTENT TYPES (GENESIS PROJECT) ---

export interface UserContent {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  description?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPublic: boolean;
  coverUrl?: string;
  viewsCount?: number;
}

export interface SacredArtImage {
  id: string;
  userId: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  category: string;
  style: string;
  verseText: string;
  verseReference: string;
  createdAt: string;
  metadata?: any;
}

// --- STUDIOS / ARTICLES (Esboços) ---
export interface SavedStudy extends UserContent {
  userId?: string; // Deprecated: use authorId
  userName?: string; // Deprecated: use authorName
  userUsername?: string;
  userPhoto?: string;
  sourceText: string;
  analysis: string;
  userThoughts?: string;
  audioScript?: string;
  source: StudySource;
  publishedAt?: string;
  category?: string;
  serviceSchedule?: any[];
  metrics?: ContentMetrics;

  // Novos campos para o Púlpito 2.0
  presentationDate?: string; // ISO String para data do culto
  estimatedDuration?: number; // em minutos
  occasion?: string; // ex: "Culto de Jovens", "Santa Ceia"

  // Novos campos para o Estúdio Pastoral / Academia
  frequency?: 'daily' | 'weekly' | 'monthly';
  visibility?: 'public' | 'private_invite' | 'private';
  privacyLevel?: ContentPrivacyLevel;
  churchId?: string;
  groupId?: string;
  allowedGroupIds?: string[];
  allowedUserIds?: string[];
  inviteRequired?: boolean;
  createdFromContext?: ContentCreationScope | 'profile' | 'workspace';

  // Seguimento (Acompanhar)
  isFollowed?: boolean;
  refDayId?: string; // ID da aula/dia associado
  planId?: string; // ID do plano original
  coverImage?: string; // Capa do estudo (da coluna cover_image ou meta)
}

export interface PlanComment {
  id?: string;
  planId: string;
  dayId: string; // ID da aula/dia
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Note extends UserContent {
  bookId: string;
  chapter: number;
  verse?: number;
  verses?: number[];
  content: string;
  sourceText?: string;
  userThoughts?: string;
  sourceStudyId?: string;
  sourceStudyTitle?: string;
}

// --- PLANS & ROOMS ---
export interface CustomPlan extends UserContent {
  revision?: number;
  schemaVersion?: number;
  category: string;
  weeks: PlanWeek[];
  privacyType: 'public' | 'followers' | 'church' | 'group';
  privacyLevel?: ContentPrivacyLevel;
  allowedGroupIds?: string[];
  allowedUserIds?: string[];
  inviteRequired?: boolean;
  allowPdfDownload?: boolean;
  shareSlug?: string;
  lastSharedAt?: string;
  createdFromContext?: ContentCreationScope | 'profile' | 'workspace';
  isRanked: boolean;
  churchId?: string;
  groupId?: string;
  subscribersCount: number;
  viewsCount?: number;
  planningFrequency: PlanningFrequency;
  hasEvaluation?: boolean;
  evaluationId?: string;
  metrics?: ContentMetrics;

  // Novo sistema de Times
  teams: PlanTeam[];
  teamScores?: Record<string, number>;

  // Datas
  startDate?: string;
  endDate?: string;
  authorPhoto?: string;
}

export interface StudyModule {
  id: string;
  title: string;
  description: string;
  theme: string;
  durationDays: number;
  icon: string;
  days: StudyModuleDay[];
  currentDay: number;
  createdAt: string;
  status: StudyStatus;
}

export type StudyStatus = 'draft' | 'in_progress' | 'completed' | 'published' | 'archived';

export interface StudyModuleDay {
  day: number;
  title: string;
  shortDescription: string;
  baseVerses: string[];
  fullContent?: string;
  isCompleted?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userUsername: string;
  userPhotoURL?: string;
  type: 'image' | 'prayer' | 'reflection' | 'devotional' | 'quiz' | 'feeling' | 'checkin' | 'cell_meeting' | 'podcast' | 'study' | 'room';
  content: string;
  likesCount: number;
  commentsCount: number;
  shares: number;
  viewsCount?: number;
  likes: number;
  comments: number;
  saved: boolean;
  likedBy: string[];
  createdAt: string;
  time: string;
  location: string;
  imageUrl?: string;
  image?: string;
  title?: string;
  urgency?: 'low' | 'medium' | 'high';
  mood?: MoodType;
  destination?: 'global' | 'cell' | 'church';
  visibility?: PostVisibility;
  feedReason?: PostFeedReason;
  cellId?: string;
  cellName?: string;
  churchId?: string;
  isRepost?: boolean;
  originalPost?: { userUsername: string; };
  studyId?: string;
  studyTitle?: string;
  studyCoverUrl?: string;
  studyUrl?: string;
  studySourceLabel?: string;
  devotionalId?: string;
  devotionalTitle?: string;
  devotionalVerse?: string;
  devotionalReference?: string;
  devotionalUrl?: string;
  devotionalDate?: string;
  alsoShowOnChurch?: boolean;
  serviceId?: string;
  serviceTitle?: string;
  sourceType?: string;
  sourceId?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
  authorProfilePublic?: boolean;
  authorChurchId?: string;
  authorCity?: string;
  authorState?: string;
}

export type DevotionalJourneyStep = 1 | 2 | 3 | 4 | 5;

export interface DevotionalJourneyState {
  devotionalId: string;
  completedSteps: DevotionalJourneyStep[];
  reflectionDraft: string;
  practicalAction: string;
  practicalActionCompleted: boolean;
  completedAt: string | null;
  feedSharedAt: string | null;
  updatedAt: string;
}

export interface PostComment { id: string; postId: string; userId: string; userDisplayName: string; userPhotoURL?: string | null; content: string; createdAt: string; }
export type PostReportReason = 'spam' | 'abuse' | 'misinformation' | 'privacy' | 'other';
export interface PostInteractionState { likesCount: number; likedBy: string[]; saved: boolean; hidden: boolean; }
export interface PrayerRequest { id: string; userId: string; userName: string; userPhotoURL?: string; content: string; createdAt: string; intercessorsCount: number; intercessors: string[]; targetType: 'church' | 'cell' | 'global'; targetId: string; churchId: string; cellName?: string; }

export type ChurchServiceType =
  | 'sunday'
  | 'youth'
  | 'women'
  | 'cell'
  | 'conference'
  | 'vigil'
  | 'communion'
  | 'other';

export type ChurchServiceStatus = 'draft' | 'published' | 'checkin_open' | 'live' | 'in_progress' | 'finished' | 'archived';

export type ServiceStreamStatus = 'not_configured' | 'upcoming' | 'live' | 'ended' | 'unavailable';

export type ServiceLiturgyMomentStatus = 'pending' | 'current' | 'completed' | 'skipped';

export type ServiceLiturgyKind =
  | 'entrance'
  | 'opening'
  | 'worship'
  | 'word'
  | 'offering'
  | 'prayer'
  | 'response'
  | 'closing'
  | 'other';

export interface ServiceLiturgyItem {
  id: string;
  serviceId?: string;
  kind: ServiceLiturgyKind;
  title: string;
  startsAt: string;
  endsAt?: string;
  responsible?: string;
  notes?: string;
  verseRef?: string;
  verseText?: string;
  songList?: string;
  songLyrics?: string;
  songTexts?: Record<string, string>;
  songLeaders?: Record<string, string>;
  pixKeyType?: 'cpf' | 'phone' | 'email' | 'random';
  pixKey?: string;
  sortOrder: number;
}

export interface ChurchService {
  id: string;
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
  status: ChurchServiceStatus;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  liturgyItems: ServiceLiturgyItem[];
  checkinsCount?: number;
  postsCount?: number;
}

export interface ServiceCheckin {
  id: string;
  serviceId: string;
  churchId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string | null;
  createdAt: string;
}

export interface ServiceNote {
  id: string;
  serviceId: string;
  userId: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
}

export type ServiceReactionType = 'amen' | 'glory' | 'hallelujah';

export interface ServiceReactionSummary {
  amen: number;
  glory: number;
  hallelujah: number;
}

export interface ServiceReactionActor {
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
}

export interface ServiceReactionBurst extends ServiceReactionActor {
  id: string;
  reactionType: ServiceReactionType;
  createdAt: string;
}

export interface ServicePrayerRequest {
  id: string;
  serviceId: string;
  churchId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  content: string;
  isPrivate: boolean;
  intercessorsCount: number;
  intercessedByMe?: boolean;
  createdAt: string;
}

export interface ServicePrayerTimelineEvent {
  prayerId: string;
  serviceId: string;
  churchId: string;
  userName: string;
  userPhotoURL?: string | null;
  isPrivate: boolean;
  contentPreview?: string | null;
  createdAt: string;
}

export interface ServiceLiturgyComment {
  id: string;
  serviceId: string;
  churchId: string;
  liturgyItemId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePersonalReflection {
  id: string;
  serviceId: string;
  churchId: string;
  userId: string;
  prayers: PersonalServicePrayer[];
  feelings: PersonalServiceFeeling[];
  decisions: PersonalServiceDecision[];
  updatedAt: string;
  createdAt: string;
}

export interface ServiceMinistry {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface ServiceMinistryMember {
  id: string;
  ministryId: string;
  churchId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string | null;
  role?: string;
  createdAt: string;
}

export type ServiceScheduleStatus = 'pending' | 'confirmed' | 'declined' | 'replaced';

export type ServicePublicInviteStatus = 'created' | 'opened' | 'accepted' | 'cancelled';

export interface ServicePublicInvite {
  id: string;
  serviceId: string;
  churchId: string;
  invitedByUserId?: string | null;
  invitedByName?: string | null;
  invitedUserId?: string | null;
  invitedName?: string | null;
  token: string;
  status: ServicePublicInviteStatus;
  source: 'copy' | 'share' | 'qr' | 'manual';
  openedAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ServiceScheduleAssignment {
  id: string;
  serviceId: string;
  churchId: string;
  ministryId: string;
  ministryName: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string | null;
  role?: string;
  status: ServiceScheduleStatus;
  reminderSentAt?: string | null;
  replacementUserId?: string | null;
  replacementUserDisplayName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceLiveState {
  serviceId: string;
  churchId: string;
  currentItemId?: string | null;
  currentTitle?: string | null;
  currentVerseRef?: string | null;
  currentVerseText?: string | null;
  currentExplanation?: string | null;
  operatorId?: string | null;
  updatedAt: string;
}

export type ServiceAiContentKind =
  | 'member_summary'
  | 'member_devotional'
  | 'member_prayer'
  | 'member_weekly_plan'
  | 'member_reflection_questions'
  | 'pastor_structure'
  | 'pastor_liturgy'
  | 'pastor_verses'
  | 'pastor_duration'
  | 'pastor_post_summary';

export interface ServiceAiContent {
  id: string;
  serviceId: string;
  userId: string;
  kind: ServiceAiContentKind;
  content: string;
  createdAt: string;
}

export interface ServicePremiumMatrix {
  tier: SubscriptionTier;
  label: string;
  monthlyServiceLimit: number | null;
  dashboard: boolean;
  ai: boolean;
  schedules: boolean;
  advancedQr: boolean;
  branding: boolean;
  exports: boolean;
  advancedAnalytics: boolean;
}

export interface ServiceAdvancedAnalytics {
  visitorsCount: number;
  checkinsCount: number;
  postsCount: number;
  notesCount: number;
  prayersCount: number;
  verseSavesCount: number;
  reactionsCount: number;
  schedulesCount: number;
  pendingSchedulesCount: number;
  engagementRate: number;
}

export interface PersonalServiceSong {
  id: string;
  title: string;
  moment?: 'opening' | 'worship' | 'response' | 'closing' | 'other';
  reflection?: string;
  sortOrder: number;
}

export interface PersonalServiceVerse {
  id: string;
  reference: string;
  text?: string;
  note?: string;
  source?: 'pastor' | 'church' | 'remembered' | 'message_base';
  createdAt: string;
}

export interface PersonalServicePrayer {
  id: string;
  content: string;
  reason?: string;
  people?: string;
  remindMe: boolean;
  answer?: string;
  createdAt: string;
}

export interface PersonalServiceFeeling {
  id: string;
  label: string;
  intensity: number;
  reason?: string;
  response?: string;
  createdAt: string;
}

export interface PersonalServiceDecision {
  id: string;
  content: string;
  action?: string;
  personToPrayFor?: string;
  memoryVerse?: string;
  createdAt: string;
}

export interface PersonalServiceJournal {
  id: string;
  userId: string;
  churchId?: string | null;
  churchName: string;
  linkedServiceId?: string | null;
  title: string;
  theme?: string;
  preacherName?: string;
  serviceType?: ChurchServiceType;
  serviceDate: string;
  startsAt?: string | null;
  endsAt?: string | null;
  songs: PersonalServiceSong[];
  verses: PersonalServiceVerse[];
  messageNotes: string;
  prayers: PersonalServicePrayer[];
  feelings: PersonalServiceFeeling[];
  decisions: PersonalServiceDecision[];
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface UserProfile {
  uid: string; email: string; displayName: string; photoURL: string | null; username: string;
  lifetimeXp: number; credits: number; badges: string[]; subscriptionTier: SubscriptionTier;
  profileType?: GeneralProfileType;
  subscriptionStatus: 'active' | 'inactive'; subscriptionExpiresAt?: string | null;
  activityLog: UserActivity[]; stats: UserStats; lastReadingPosition?: ReadingPosition;
  usageToday?: UserUsage; city?: string; state?: string; phoneNumber?: string;
  cpf?: string; instagram?: string; facebook?: string; bio?: string;
  isProfilePublic?: boolean; slogan?: string; readingPlan?: PlanProgress;
  theme?: 'light' | 'dark';
  bibleVersion?: string;
  progress?: GlobalProgress;
  enrolledPlans?: string[]; // IDs dos planos que o usuário participa
  churchData?: {
    churchId: string;
    churchName: string;
    churchSlug: string;
    groupId?: string;
    groupName?: string;
    groupSlug?: string;
    parentGroupName?: string;
    teamColor?: string | null;
    isAnonymous?: boolean;
  };
  followersCount?: number; followingCount?: number;
}
export interface UserStats { totalChaptersRead: number; daysStreak: number; studiesCreated: number; totalDevotionalsRead: number; totalNotes: number; totalShares: number; totalImagesGenerated: number; totalChatMessages: number; totalSermonsCreated: number; totalVersesMarked: number; totalQuizzesCompleted: number; perfectQuizzes: number; rankedHighScore?: number; }
export interface UserActivity { id: string; type: ActionType; description: string; timestamp: string; meta?: any; }
export interface ReadingPosition { bookId: string; chapter: number; verse: number; }
export interface UserUsage { date: string; imagesCount: number; podcastsCount: number; analysisCount: number; chatCount: number; }
export interface ReadingPlanTimeEntry { activeSeconds: number; awardedPresenceMana?: boolean; sessions?: number; lastTrackedAt: string; }
export interface PlanProgress { isActive: boolean; planType: PlanDuration; planScope: PlanScope; completedDays: number[]; completedSections: { [key: number]: number[] }; lastChapterInSection: { [key: number]: { [key: number]: number } }; lastReadingDate: string; streak: number; startDate: string; notificationsEnabled: boolean; notificationTime: string; studyRoutine?: StudyTask[]; dailyRoutines?: { [key: number]: StudyTask[] }; reflectionLog?: { [key: number]: { mood?: MoodType | null; note?: string; updatedAt: string } }; timeLog?: { [key: number]: ReadingPlanTimeEntry }; }
export interface StudyTask { id: string; label: string; isCompleted: boolean; }
export interface GlobalProgress { readChapters: Record<string, number[]>; lastActiveBookId?: string; lastActiveChapter?: number; }

export interface PlanTeamMember {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  username: string;
}

export interface PlanTeam {
  id: string;
  name: string;
  color: string; // Hex ou classe Tailwind
  members: PlanTeamMember[]; // Lista de membros definidos pelo pastor
}

// --- PLANS & ROOMS ---
// --- SUBSCRIPTIONS ---
export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description?: string;
  price: number;
  priceAnnual: number;
  limits: { images: number; podcasts: number; analysis: number; chat: number; };
  benefits: string[];
  credits?: number;
  active?: boolean;
  recommended?: boolean;
}

export interface PlanWeek { id: string; title: string; days: PlanDayContent[]; }
export interface PlanDayContent {
  id: string;
  title: string;
  description?: string;
  htmlContent: string;
  isCompleted?: boolean;
  startDate?: string;
  endDate?: string;
  refData?: {
    bookId: string;
    chapter: number;
    startVerse: number;
    endVerse?: number;
    formatted: string;
  };
  blocksConfig?: StudyEditorBlock<Record<string, any>>[];
  tags?: string[];
  category?: string;
}

export interface PlanParticipant {
  uid: string;
  displayName: string;
  photoURL?: string;
  username: string;
  points: number;
  completedSteps: string[];
  joinedAt: string;
  lastActivityAt: string;
  team?: string; // ID do time (agora obrigatório se o plano for rankeado)
  status: 'active' | 'blocked' | 'banned';
}

// --- TRACKS (TRILHAS) ---
export interface Track {
  id: string;
  title: string;
  description: string;
  authorId: string;
  generatedBy?: 'pastor' | 'ai'; // Adicionado para autoria
  coverUrl?: string;
  tags: string[];
  items: TrackItem[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  metrics?: ContentMetrics; // Usar likes e shares de ContentMetrics
}

export interface TrackItem {
  id: string;
  refId?: string; // ID do objeto referenciado (study, plan, post)
  type: 'study' | 'plan' | 'post' | 'reading';
  title: string;
  subtitle?: string;
  contentPreview?: string; // Texto curto para uso em IA
  devotionalHtml?: string;
  commentAuthor?: 'pastor' | 'ai';
  videoUrl?: string;
  bookId?: string;
  chapter?: number;
  verses?: string;
}

// --- LMS / EVALUATION TYPES ---
export interface StudyEvaluation {
  id?: string;
  planId: string;
  authorId: string;
  title: string;
  description?: string;
  timeLimitMinutes: number; // 0 = sem limite
  passingScore?: number; // 0-100
  questions: StudyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
}

// --- CUSTOM QUIZ (JOGOS) ---
export interface CustomQuiz {
  id: string;
  authorId: string;
  title: string;
  description: string;
  type: 'ai_generated' | 'manual';
  gameMode: 'classic' | 'infinite';

  // AI Config
  aiConfig?: {
    theme: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number; // 0 = infinito (se gameMode = infinite)
  };

  // Manual Config
  questions?: QuizQuestion[];

  isActive: boolean;
  createdAt: string;
}

export interface Badge { id: string; name: string; description: string; icon: string; category: 'level' | 'achievement' | 'streak' | 'supporter' | 'event'; requirement?: number; requirementStat?: keyof UserStats; color: string; }
export interface Verse { number: number; text: string; }
export interface Chapter { number: number; verses: Verse[]; }
export interface Book { id: string; name: string; testament: 'old' | 'new' | 'apocryphal'; chapters: Chapter[]; }
export interface Devotional { date: string; title: string; verseReference: string; verseText: string; content: string; prayer: string; }
export interface QuizQuestion { id: number; question: string; options: string[]; correctIndex: number; explanation: string; reference: string; }
export interface ChatMessage { id: string; role: 'user' | 'model'; content: string; }

export interface SEOSettings {
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string;
  ogImage?: string;
  twitterHandle?: string;
}

export interface SystemSettings {
  general: { maintenanceMode: boolean; welcomeMessage: string; aiKillSwitch?: boolean };
  seo?: SEOSettings;
  gamification: {
    xpReadingChapter: number;
    xpDailyGoal: number;
    xpReadingPresence?: number;
    xpDevotional: number;
    xpCreateStudy: number;
    xpShare: number;
    xpMarkVerse: number;
    xpCreateImage: number;
    xpUseChat: number;
    xpCreateSermon: number;
    xpDeepStudy?: number;
    xpQuizCompletion?: number;
    xpSocialFollow?: number;
    xpPrayerWall?: number;
    xpCreateNote?: number;
    xpSocialLike?: number;
    xpSocialPost?: number;
    xpStartModule?: number;
    xpJoinPlan?: number;
    xpCreateEvaluation?: number;
    xpFinishTrack?: number;
    xpCollectArtifact?: number;
    xpSocialInteraction?: number;
    xpInviteSent?: number;
    xpInviteAccepted?: number;
    xpSocialComment?: number;
    xpSocialMention?: number;
    xpGroupComment?: number;
    xpChurchComment?: number;
    xpContentShare?: number;
    xpPlanComment?: number;
    xpCultoCheckin?: number;
  };
  links: { pixKey: string; supportUrl: string };
  costs: { imageGen: number; podcastGen: number; deepAnalysis: number; captionGen: number; sermonGen: number };
  limits: { freeImages: number; freePodcasts: number; dailyFreeChat: number };
  subscription: {
    prices: { bronzeMonthly: number; bronzeAnnual: number; silverMonthly: number; silverAnnual: number; goldMonthly: number; goldAnnual: number; };
    promo: { active: boolean; title: string; description: string; color: string };
    plans?: SubscriptionPlan[];
  };
  gamificationCampaigns?: GamificationCampaign[];
  featuresMatrix?: Record<SubscriptionTier, PlanFeatures>;
  featureFlags?: FeatureFlag[];
}
export interface GamificationCampaign {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  rewardLabel: string;
  targetActions: ActionType[];
  isActive: boolean;
}
export interface FeatureFlag { id: string; key: string; label: string; description: string; isEnabled: boolean; rolloutPercentage: number; }
export interface PlanFeatures { aiChatAccess: boolean; aiImageGen: boolean; aiPodcastGen: boolean; aiDeepAnalysis: boolean; aiSermonBuilder: boolean; aiNoteImprovement: boolean; aiSocialCaptions: boolean; churchFoundation: boolean; churchAdminPanel: boolean; cellCreation: boolean; muralPosting: boolean; teamCompetition: boolean; socialFeedRead: boolean; socialFeedPost: boolean; globalHighlight: boolean; followingSystem: boolean; profileCustomization: boolean; readingPlans: boolean; audioNarration: boolean; unlimitedNotes: boolean; achievementBadges: boolean; advancedSearch: boolean; focusMode: boolean; customThemes: boolean; noAds: boolean; }
export interface Church { id: string; name: string; acronym: string; slug: string; denomination: string; location: { city: string; state: string; address: string }; stats: { memberCount: number; totalMana: number; totalChaptersRead: number; totalStudiesCreated: number; followersCount?: number }; teams: string[]; teamScores: Record<string, number>; admins: string[]; logoUrl?: string; pastorName?: string; churchSlug?: string; externalProvider?: string; externalPlaceId?: string; sourceAttribution?: string; verificationStatus?: 'external' | 'unclaimed' | 'claimed' | 'verified'; lat?: number | null; lng?: number | null; isExternal?: boolean; }
export type ChurchOperationalRole = 'church_manager' | 'pastor' | 'leader' | 'volunteer';
export type ChurchRoleScopeType = 'church' | 'team' | 'group' | 'service' | 'event';
export type ChurchManagementStatus = 'active' | 'paused' | 'archived';
export type ChurchAssignmentStatus = 'draft' | 'pending' | 'accepted' | 'declined' | 'paused' | 'expired' | 'removed';
export type ChurchQrFormType = 'prayer' | 'volunteer' | 'visitor' | 'pastor_care' | 'group' | 'custom';
export type ChurchQrFormStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived';
export type ChurchSubmissionStatus = 'received' | 'assigned' | 'in_progress' | 'waiting_member' | 'answered' | 'closed' | 'archived';
export type ChurchSubmissionPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ChurchNotificationSeverity = 'info' | 'action' | 'urgent';
export type ChurchNotificationChannel = 'dashboard' | 'member' | 'both';

export interface ChurchMemberRole {
  id: string;
  churchId: string;
  userId: string;
  role: ChurchOperationalRole;
  scopeType: ChurchRoleScopeType;
  scopeId?: string | null;
  status: 'active' | 'paused' | 'revoked';
  grantedBy?: string | null;
  grantedAt: string;
  revokedAt?: string | null;
  meta?: any;
}

export interface ChurchServiceTeam {
  id: string;
  churchId: string;
  name: string;
  slug: string;
  area: string;
  description: string;
  leaderId?: string | null;
  status: ChurchManagementStatus;
  capacity?: number | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchAssignment {
  id: string;
  churchId: string;
  teamId?: string | null;
  title: string;
  description: string;
  assigneeUserId?: string | null;
  leaderUserId?: string | null;
  scopeType: ChurchRoleScopeType;
  scopeId?: string | null;
  status: ChurchAssignmentStatus;
  requiresAcceptance: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  publicFeedback: string;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChurchTeamFunctionStatus = 'active' | 'paused' | 'archived';
export type ChurchScaleSlotStatus = 'open' | 'filled' | 'cancelled';
export type ChurchServiceInviteStatus = 'not_sent' | 'pending' | 'confirmed' | 'declined' | 'expired' | 'cancelled' | 'conflict';
export type ChurchParticipationStatus = 'participated' | 'missed' | 'justified_absence' | 'replaced' | 'cancelled';

export interface ChurchTeamFunction {
  id: string;
  churchId: string;
  teamId: string;
  name: string;
  description: string;
  requiredCount: number;
  profileHint: string;
  status: ChurchTeamFunctionStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchServiceScaleSlot {
  id: string;
  churchId: string;
  serviceId: string;
  teamId: string;
  functionId?: string | null;
  functionName: string;
  requiredCount: number;
  assignedCount: number;
  status: ChurchScaleSlotStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchServiceInvite {
  id: string;
  churchId: string;
  serviceId: string;
  teamId?: string | null;
  slotId?: string | null;
  assignmentId?: string | null;
  userId: string;
  role: string;
  status: ChurchServiceInviteStatus;
  responseNote: string;
  sentAt?: string | null;
  respondedAt?: string | null;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchParticipationLog {
  id: string;
  churchId: string;
  serviceId?: string | null;
  teamId?: string | null;
  assignmentId?: string | null;
  inviteId?: string | null;
  userId: string;
  status: ChurchParticipationStatus;
  role: string;
  notes: string;
  recordedBy?: string | null;
  recordedAt: string;
  createdAt: string;
}

export interface ChurchQrFormField {
  label: string;
  type: 'text' | 'tel' | 'email' | 'textarea' | 'select';
  required?: boolean;
  options?: string[];
}

export interface ChurchQrForm {
  id: string;
  churchId: string;
  token: string;
  title: string;
  formType: ChurchQrFormType;
  description: string;
  fields: ChurchQrFormField[];
  destination: string;
  scopeType: ChurchRoleScopeType;
  scopeId?: string | null;
  privacyText: string;
  confirmationText: string;
  allowAnonymous: boolean;
  status: ChurchQrFormStatus;
  scansCount: number;
  submissionsCount: number;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchFormSubmission {
  id: string;
  churchId: string;
  formId?: string | null;
  formType: ChurchQrFormType | string;
  submitterUserId?: string | null;
  submitterName?: string | null;
  submitterContact?: string | null;
  payload: Record<string, any>;
  status: ChurchSubmissionStatus;
  publicStatus: string;
  priority: ChurchSubmissionPriority;
  assignedTo?: string | null;
  isSensitive: boolean;
  publicFeedback: string;
  internalSummary: string;
  nextAction: string;
  sourceType?: string | null;
  sourceId?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchManagementNotification {
  id: string;
  churchId: string;
  userId?: string | null;
  audienceRole?: string | null;
  title: string;
  message: string;
  eventType: string;
  severity: ChurchNotificationSeverity;
  channel: ChurchNotificationChannel;
  link?: string | null;
  dedupeKey?: string | null;
  readAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
}

export type ChurchManagerAlertKind = 'approval' | 'volunteer' | 'service_configuration' | 'notification';

export interface ChurchManagerAlert {
  id: string;
  kind: ChurchManagerAlertKind;
  title: string;
  message: string;
  severity: ChurchNotificationSeverity;
  link: string;
  createdAt: string;
  dueAt?: string | null;
}

export interface ChurchVolunteerBadge {
  id: string;
  churchId: string;
  userId: string;
  badgeKey: string;
  title: string;
  description: string;
  manaAmount: number;
  visibility: 'private' | 'team' | 'church';
  sourceType: string;
  sourceId?: string | null;
  awardedBy?: string | null;
  awardedAt: string;
  meta?: any;
}

export interface ChurchManagementSettings {
  churchId: string;
  qrDefaultValidityDays: number;
  defaultPrivacyText: string;
  defaultConfirmationText: string;
  notifyPastorsOnSensitiveRequests: boolean;
  notifyLeadersOnVolunteerRequests: boolean;
  memberFeedbackEnabled: boolean;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface ChurchManagementSummary {
  openSubmissions: number;
  pendingAssignments: number;
  activeTeams: number;
  activeQrForms: number;
  unreadNotifications: number;
  badgesAwarded: number;
}
export interface ChurchRoleRequest {
  id: string;
  churchId: string;
  userId: string;
  requestedRole: 'pastor' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string | null;
  churchName: string;
  churchSlug?: string;
  churchLocation?: string;
  userDisplayName: string;
  userUsername?: string;
  userPhotoURL?: string;
  userTier?: SubscriptionTier;
}
export interface AdminChurchManager {
  id: string;
  userId: string;
  userDisplayName: string;
  userUsername?: string;
  userPhotoURL?: string | null;
  userTier?: SubscriptionTier;
  churchId: string;
  churchName: string;
  churchSlug?: string;
  churchLocation?: string;
  role: 'church_manager' | 'admin';
  source: 'operational_role' | 'approved_request' | 'legacy_admin';
  status: 'active' | 'approved';
  grantedAt?: string | null;
}
export interface ChurchGroup { id: string; churchId: string; parentGroupId?: string; name: string; slug: string; privacy?: GroupPrivacy; stats: { memberCount: number; totalMana: number }; leaderName?: string; leaderUid?: string; createdBy: string; createdAt: string; }
export interface ChurchGroupCapabilities {
  canCreateRootGroup: boolean;
  canCreateSubgroup: boolean;
  canEditGroup: boolean;
  canInviteMembers: boolean;
  canModerateGroup: boolean;
  canArchiveGroup: boolean;
}
export interface ChurchGroupCreateInput {
  churchId: string;
  name: string;
  slug: string;
  privacy: GroupPrivacy;
  createdBy: string;
  parentGroupId?: string | null;
  leaderUid?: string | null;
  leaderName?: string | null;
}
export interface DailyReading { day: number; dateDisplay: string; readings: ReadingSection[]; }
export interface ReadingSection { section: string; bookId: string; name: string; ref: string; startChapter: number; endChapter: number; }
export interface SystemLog { id: string; type: 'error' | 'user_report' | 'admin_action'; message?: string; description?: string; stack?: string; timestamp: string; url: string; userAgent: string; userId?: string; severity?: 'low' | 'medium' | 'high'; action?: string; target?: string; details?: string; }
export interface SupportTicket { id: string; userId: string; userEmail: string; userName: string; subject: string; message: string; status: 'open' | 'closed' | 'pending'; createdAt: string; response?: string; }
export interface ReportTicket { id: string; type: 'post' | 'comment' | 'user'; targetId: string; reporterId: string; reason: string; status: 'pending' | 'resolved' | 'dismissed'; createdAt: string; contentSnapshot?: string; }
export interface ManaEvent {
  id: string;
  userId: string;
  churchId?: string | null;
  groupId?: string | null;
  actorRole: 'user' | 'pastor' | 'admin' | 'church';
  actionType: ActionType;
  sourceType?: string | null;
  sourceId?: string | null;
  eventKey: string;
  xpAmount: number;
  occurredAt: string;
  periodKey: string;
  status: 'valid' | 'review' | 'void';
  voidReason?: string | null;
  meta?: any;
  userName?: string;
  churchName?: string;
}
export interface ChurchGamificationSnapshot {
  churchId: string;
  churchName?: string;
  periodKey: string;
  totalXp: number;
  activeMembers: number;
  xpPerActiveMember: number;
  chaptersRead: number;
  devotionalsCompleted: number;
  prayersCount: number;
  quizCompleted: number;
  rankGlobalTotal?: number | null;
  rankGlobalNormalized?: number | null;
}
export interface AIUsageStats { date: string; totalTokens: number; costEstimate: number; requests: { chat: number; images: number; podcasts: number; analysis: number; }; }
export interface AnalyticsMetric { label: string; value: number; change: number; trend: 'up' | 'down' | 'neutral'; }
export interface FunnelStep { step: string; count: number; dropOff: number; }
